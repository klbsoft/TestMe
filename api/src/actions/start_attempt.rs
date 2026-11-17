use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Deserialize;

use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{
    AssigmentAttempt, AssigmentAttemptResource, RawAssigment, ResourceAccess, Session, UserInfo,
};

const ATTEMPT_WINDOW_MINUTES: u32 = 20;

pub async fn start_attempt(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[START_ATTEMPT] ── INCOMING REQUEST ───────────────────────");

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[START_ATTEMPT] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[START_ATTEMPT] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[START_ATTEMPT] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[START_ATTEMPT] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[START_ATTEMPT] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[START_ATTEMPT] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[START_ATTEMPT] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A STUDENT ─────────────────────────────────────────
    println!("[START_ATTEMPT] STEP 3 ── verifying student = {:?}", session.user);
    let student: UserInfo = match db()
        .users()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(u)) => {
            println!(
                "[START_ATTEMPT] STEP 3 ✅ student found, teacher = {:?}",
                u.teacher
            );
            u
        }
        Ok(None) => {
            println!("[START_ATTEMPT] STEP 3 ❌ not a student");
            return "FAIL:Only students can start attempts".to_string();
        }
        Err(e) => {
            println!("[START_ATTEMPT] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) RESOLVE THE STUDENT'S TEACHER ID ─────────────────────────
    let teacher_id: String = {
        let by_id = db()
            .teachers()
            .find_one(doc! { "id": &student.teacher })
            .await
            .ok()
            .flatten();

        if let Some(t) = by_id {
            t.id
        } else {
            let by_name = db()
                .teachers()
                .find_one(doc! { "name": &student.teacher })
                .await
                .ok()
                .flatten();
            match by_name {
                Some(t) => t.id,
                None => {
                    println!(
                        "[START_ATTEMPT] STEP 4 ❌ student's teacher {:?} not found",
                        student.teacher
                    );
                    return "FAIL:Teacher not found".to_string();
                }
            }
        }
    };
    println!("[START_ATTEMPT] STEP 4 ✅ teacher resolved = {:?}", teacher_id);

    // ── 5) FIND THE ASSIGNMENT ──────────────────────────────────────
    println!("[START_ATTEMPT] STEP 5 ── fetching assignment for teacher = {:?}", teacher_id);
    let assignment: RawAssigment = match db()
        .raw_assigments()
        .find_one(doc! { "teacher": &teacher_id })
        .await
    {
        Ok(Some(a)) => {
            println!(
                "[START_ATTEMPT] STEP 5 ✅ assignment id = {:?}, label = {:?}, type = {:?}",
                a.id, a.label, a.assigment_type
            );
            a
        }
        Ok(None) => {
            println!("[START_ATTEMPT] STEP 5 ❌ no assignment for this teacher");
            return "FAIL:No assignment found".to_string();
        }
        Err(e) => {
            println!("[START_ATTEMPT] STEP 5 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 6) DETERMINE NEXT ATTEMPT NUMBER ────────────────────────────
    println!(
        "[START_ATTEMPT] STEP 6 ── counting previous attempts by user = {:?} for assignment = {:?}",
        session.user, assignment.id
    );
    let previous_count = match db()
        .attempts()
        .count_documents(doc! {
            "user":         &session.user,
            "assigment_id": &assignment.id,
        })
        .await
    {
        Ok(c) => {
            println!("[START_ATTEMPT] STEP 6   previous attempts = {}", c);
            c as u32
        }
        Err(e) => {
            println!("[START_ATTEMPT] STEP 6 ❌ count error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let next_attempt = previous_count + 1;
    println!("[START_ATTEMPT] STEP 6 ✅ this attempt = {}", next_attempt);

    // ── 7) ENFORCE max_attempts ─────────────────────────────────────
    if next_attempt > assignment.max_attempts {
        println!(
            "[START_ATTEMPT] STEP 7 ❌ max attempts reached ({}/{})",
            previous_count, assignment.max_attempts
        );
        return format!(
            "FAIL:Maximum attempts reached ({}/{})",
            previous_count, assignment.max_attempts
        );
    }
    println!(
        "[START_ATTEMPT] STEP 7 ✅ attempt {} of {}",
        next_attempt, assignment.max_attempts
    );

    // ── 8) CREATE THE ATTEMPT RECORD ────────────────────────────────
    // Snapshot the assignment's identity (id, label, type) onto the
    // attempt itself so the log survives the assignment being wiped
    // by a future update_assigment call.
    println!("[START_ATTEMPT] STEP 8 ── creating attempt record");
    let attempt_id = CryptoService::random_string(32);
    let attempt = AssigmentAttempt {
        id: attempt_id.clone(),
        user: session.user.clone(),
        attempt: next_attempt,
        assigment_id: assignment.id.clone(),
        assigment_label: assignment.label.clone(),
        assigment_type: assignment.assigment_type.clone(),
        max_attempts: assignment.max_attempts,
        grade: String::new(),
        window: ATTEMPT_WINDOW_MINUTES,
        json: String::new(),
    };

    if let Err(e) = db().attempts().insert_one(&attempt).await {
        println!("[START_ATTEMPT] STEP 8 ❌ insert error: {}", e);
        return "FAIL:Database error".to_string();
    }
    println!(
        "[START_ATTEMPT] STEP 8 ✅ attempt id = {:?} (label = {:?}, type = {:?})",
        attempt_id, attempt.assigment_label, attempt.assigment_type
    );

    // ── 9) ISSUE A SHORT-LIVED "attempt" SESSION ────────────────────
    println!("[START_ATTEMPT] STEP 9 ── issuing attempt session");
    let attempt_token = CryptoService::random_string(32);
    let attempt_session = Session {
        id: attempt_id.clone(),
        token: attempt_token.clone(),
        user: session.user,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
        ends_at: (now + chrono::Duration::minutes(ATTEMPT_WINDOW_MINUTES as i64))
            .to_rfc3339(),
    };

    sessions::insert(attempt_session);
    println!(
        "[START_ATTEMPT] STEP 9 ✅ attempt session issued (expires in {} min)",
        ATTEMPT_WINDOW_MINUTES
    );

    // ── 10) RETURN JSON + TOKEN ─────────────────────────────────────
    let response = AssigmentAttemptResource {
        json: assignment.json,
        token: attempt_token,
    };

    match serde_json::to_string(&response) {
        Ok(json) => {
            println!("[START_ATTEMPT] STEP 10 ✅ ── DONE ── {} bytes", json.len());
            println!("════════════════════════════════════════════════════════════");
            format!("OK:{}", json)
        }
        Err(e) => {
            println!("[START_ATTEMPT] STEP 10 ❌ serialize error: {}", e);
            println!("════════════════════════════════════════════════════════════");
            "FAIL:Failed to serialize result".to_string()
        }
    }
}