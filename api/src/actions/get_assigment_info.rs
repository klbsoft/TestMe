use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{
    AssigmentInfo, RawAssigment, ResourceAccess, Session,
};

pub async fn get_assigment_info(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[ASSIGMENT_INFO] ── INCOMING REQUEST ──────────────────────");

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[ASSIGMENT_INFO] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[ASSIGMENT_INFO] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[ASSIGMENT_INFO] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[ASSIGMENT_INFO] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[ASSIGMENT_INFO] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[ASSIGMENT_INFO] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[ASSIGMENT_INFO] STEP 2 ✅ session not expired");

    // ── 3) DETERMINE ROLE FROM session.user ─────────────────────────
    println!("[ASSIGMENT_INFO] STEP 3 ── checking if user is a student or teacher");

    let student = db()
        .users()
        .find_one(doc! { "id": &session.user })
        .await
        .ok()
        .flatten();

    let teacher_id: String = if let Some(student_doc) = student {
        // ── STUDENT PATH ─────────────────────────────────────────────
        println!("[ASSIGMENT_INFO] STEP 3 ✅ user is a student");
        println!(
            "[ASSIGMENT_INFO] STEP 3   student's `teacher` field = {:?}",
            student_doc.teacher
        );

        // Resolve the teacher's id from the student's `teacher` field.
        // The field may hold either the teacher's id or the teacher's name
        // (legacy data). Try id first, fall back to name.
        let by_id = db()
            .teachers()
            .find_one(doc! { "id": &student_doc.teacher })
            .await
            .ok()
            .flatten();

        if let Some(t) = by_id {
            println!("[ASSIGMENT_INFO] STEP 3 ✅ teacher resolved by id = {:?}", t.id);
            t.id
        } else {
            let by_name = db()
                .teachers()
                .find_one(doc! { "name": &student_doc.teacher })
                .await
                .ok()
                .flatten();

            match by_name {
                Some(t) => {
                    println!(
                        "[ASSIGMENT_INFO] STEP 3 ✅ teacher resolved by name = {:?} → id = {:?}",
                        t.name, t.id
                    );
                    t.id
                }
                None => {
                    println!(
                        "[ASSIGMENT_INFO] STEP 3 ❌ student's teacher {:?} matches no teacher",
                        student_doc.teacher
                    );
                    return "FAIL:Teacher not found".to_string();
                }
            }
        }
    } else {
        // ── TEACHER PATH ─────────────────────────────────────────────
        let is_teacher = matches!(
            db().teachers().find_one(doc! { "id": &session.user }).await,
            Ok(Some(_))
        );
        if !is_teacher {
            println!("[ASSIGMENT_INFO] STEP 3 ❌ user is neither student nor teacher");
            return "FAIL:User not found".to_string();
        }
        println!("[ASSIGMENT_INFO] STEP 3 ✅ user is a teacher");
        session.user.clone()
    };

    // ── 4) FIND THE ASSIGNMENT ──────────────────────────────────────
    println!(
        "[ASSIGMENT_INFO] STEP 4 ── fetching assignment for teacher = {:?}",
        teacher_id
    );
    let assignment: RawAssigment = match db()
        .raw_assigments()
        .find_one(doc! { "teacher": &teacher_id })
        .await
    {
        Ok(Some(a)) => {
            println!(
                "[ASSIGMENT_INFO] STEP 4 ✅ found assignment id = {:?}, label = {:?}",
                a.id, a.label
            );
            a
        }
        Ok(None) => {
            println!("[ASSIGMENT_INFO] STEP 4 ❌ no assignment for this teacher");
            return "FAIL:No assignment found".to_string();
        }
        Err(e) => {
            println!("[ASSIGMENT_INFO] STEP 4 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 5) LOOK FOR THIS STUDENT'S GRADED ATTEMPT ───────────────────
    let mut grade = String::new();

    if session.user != teacher_id {
        // caller is a student
        println!(
            "[ASSIGMENT_INFO] STEP 5 ── looking for graded attempt by student = {:?} for assignment = {:?}",
            session.user, assignment.id
        );
        match db()
            .attempts()
            .find_one(doc! {
                "user":         &session.user,
                "assigment_id": &assignment.id,
                "grade":        { "$ne": "" },
            })
            .sort(doc! { "attempt": -1 })
            .await
        {
            Ok(Some(a)) => {
                println!("[ASSIGMENT_INFO] STEP 5 ✅ grade = {:?}", a.grade);
                grade = a.grade;
            }
            Ok(None) => {
                println!("[ASSIGMENT_INFO] STEP 5   no graded attempt yet");
            }
            Err(e) => {
                println!("[ASSIGMENT_INFO] STEP 5 ⚠ attempt lookup error: {}", e);
            }
        }
    } else {
        println!("[ASSIGMENT_INFO] STEP 5   caller is a teacher — no per-attempt grade");
    }

    // ── 6) RETURN ───────────────────────────────────────────────────
    let response = AssigmentInfo {
        label: assignment.label,
        assigment_type: assignment.assigment_type,
        grade,
    };

    match serde_json::to_string(&response) {
        Ok(json) => {
            println!("[ASSIGMENT_INFO] STEP 6 ✅ ── DONE ── {}", json);
            println!("════════════════════════════════════════════════════════════");
            format!("OK:{}", json)
        }
        Err(e) => {
            println!("[ASSIGMENT_INFO] STEP 6 ❌ serialize error: {}", e);
            println!("════════════════════════════════════════════════════════════");
            "FAIL:Failed to serialize result".to_string()
        }
    }
}