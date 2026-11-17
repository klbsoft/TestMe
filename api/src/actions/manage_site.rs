// src/actions/start_site.rs
use axum::{response::IntoResponse, Json};

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{ResourceAccess, Session, Teacher};
use mongodb::bson::doc;

pub async fn start_site(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[START_SITE] ── INCOMING REQUEST ──────────────────────────");
    println!("[START_SITE] token = {:?}", mask(&body.token));

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[START_SITE] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[START_SITE] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[START_SITE] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[START_SITE] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[START_SITE] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[START_SITE] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[START_SITE] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    println!("[START_SITE] STEP 3 ── verifying teacher");
    let _teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[START_SITE] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[START_SITE] STEP 3 ❌ caller is not a teacher");
            return "FAIL:Only teachers can start a site".to_string();
        }
        Err(e) => {
            println!("[START_SITE] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) UPSERT THE SITE ROW (id = teacher, token = "ON") ─────────
    // No Mongo. The site state lives entirely in the RAM sessions Vec.
    // `id` is the teacher id, so there can only ever be one SITE row
    // per teacher. `token` holds the on/off state.
    println!("[START_SITE] STEP 4 ── marking site ON for teacher = {:?}", session.user);
    let site_row = Session {
        id: session.user.clone(),          // teacher id
        token: "ON".to_string(),           // site is active
        user: "SITE".to_string(),          // marker for "this is a site row"
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
        ends_at: (now + chrono::Duration::hours(24)).to_rfc3339(),
    };

    // Preserve created_at if a row already exists.
    let created_at = sessions::get_by_id(&session.user)
        .map(|existing| existing.created_at)
        .unwrap_or_else(|| site_row.created_at.clone());

    let site_row = Session { created_at, ..site_row };
    sessions::upsert_by_id(site_row);
    println!("[START_SITE] STEP 4 ✅ site ON");
    println!("════════════════════════════════════════════════════════════");

    "OK:ON".to_string()
}

fn mask(token: &str) -> String {
    if token.len() <= 8 {
        return "*".repeat(token.len());
    }
    format!("{}…{}", &token[..4], &token[token.len() - 4..])
}

 

pub async fn stop_site(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[STOP_SITE] ── INCOMING REQUEST ───────────────────────────");
    println!("[STOP_SITE] token = {:?}", mask(&body.token));

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[STOP_SITE] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[STOP_SITE] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[STOP_SITE] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[STOP_SITE] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[STOP_SITE] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[STOP_SITE] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[STOP_SITE] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    println!("[STOP_SITE] STEP 3 ── verifying teacher");
    let _teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[STOP_SITE] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[STOP_SITE] STEP 3 ❌ caller is not a teacher");
            return "FAIL:Only teachers can stop a site".to_string();
        }
        Err(e) => {
            println!("[STOP_SITE] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) UPSERT THE SITE ROW (id = teacher, token = "OFF") ────────
    println!("[STOP_SITE] STEP 4 ── marking site OFF for teacher = {:?}", session.user);
    let created_at = sessions::get_by_id(&session.user)
        .map(|existing| existing.created_at)
        .unwrap_or_else(|| now.to_rfc3339());

    let site_row = Session {
        id: session.user.clone(),          // teacher id
        token: "OFF".to_string(),          // site is inactive
        user: "SITE".to_string(),
        created_at,
        updated_at: now.to_rfc3339(),
        ends_at: (now + chrono::Duration::hours(24)).to_rfc3339(),
    };

    sessions::upsert_by_id(site_row);
    println!("[STOP_SITE] STEP 4 ✅ site OFF");

    // ── 5) CLEAR STUDENT SESSIONS ───────────────────────────────────
    println!("[STOP_SITE] STEP 5 ── clearing student sessions for teacher = {:?}", session.user);

    let mut cursor = match db()
        .users()
        .find(doc! { "teacher": &session.user })
        .await
    {
        Ok(c) => c,
        Err(e) => {
            println!("[STOP_SITE] STEP 5 ❌ find error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut student_ids: Vec<String> = Vec::new();
    while cursor.advance().await.unwrap_or(false) {
        if let Ok(u) = cursor.deserialize_current() {
            student_ids.push(u.id);
        }
    }
    println!("[STOP_SITE] STEP 5   {} student(s) under this teacher", student_ids.len());

    let removed = sessions::delete_by_users(&student_ids);
    println!("[STOP_SITE] STEP 5 ✅ cleared {} student session(s)", removed);
    println!("════════════════════════════════════════════════════════════");

    format!("OK:OFF,{}", removed)
}

 

    
/// GET /sites/check
///
/// Unauthenticated. Single-teacher deployment: returns "TRUE" if the
/// one teacher's site is active, "FALSE" otherwise (or if no site row
/// exists yet).
pub async fn check_site() -> impl IntoResponse {
    println!("[CHECK_SITE] ── incoming request");

    // Scan the RAM store for the single SITE row.
    // SITE row: user = "SITE", token = "ON" | "OFF".
    let is_on = sessions::any_site_on();

    println!("[CHECK_SITE] ✅ site is {}", if is_on { "ON" } else { "OFF" });

    if is_on { "TRUE".to_string() } else { "FALSE".to_string() }
}