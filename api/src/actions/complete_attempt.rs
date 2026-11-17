use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{
    AssigmentAttempt, AssigmentAttemptResource, Session,
};

pub async fn complete_attempt(
    Json(body): Json<AssigmentAttemptResource>,
) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[COMPLETE_ATTEMPT] ── INCOMING REQUEST ───────────────────");

    // ── 1) LOAD THE SESSION ─────────────────────────────────────────
    println!("[COMPLETE_ATTEMPT] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!(
                "[COMPLETE_ATTEMPT] STEP 1 ✅ session found (id = {:?}, user = {:?})",
                s.id, s.user
            );
            s
        }
        None => {
            println!("[COMPLETE_ATTEMPT] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ──────────────────────────────────────
    println!("[COMPLETE_ATTEMPT] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[COMPLETE_ATTEMPT] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[COMPLETE_ATTEMPT] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[COMPLETE_ATTEMPT] STEP 2 ✅ session not expired");

    // ── 3) FIND THE ATTEMPT BY session.id ───────────────────────────
    // session.id == attempt.id (set at creation in start_attempt).
    println!(
        "[COMPLETE_ATTEMPT] STEP 3 ── looking up attempt by id = {:?}",
        session.id
    );
    let attempt: AssigmentAttempt = match db()
        .attempts()
        .find_one(doc! { "id": &session.id })
        .await
    {
        Ok(Some(a)) => {
            println!(
                "[COMPLETE_ATTEMPT] STEP 3 ✅ attempt found (user = {:?}, assigment_id = {:?})",
                a.user, a.assigment_id
            );
            a
        }
        Ok(None) => {
            println!("[COMPLETE_ATTEMPT] STEP 3 ❌ no attempt for session.id = {:?}", session.id);
            return "FAIL:Attempt not found".to_string();
        }
        Err(e) => {
            println!("[COMPLETE_ATTEMPT] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) SIZE CAP ─────────────────────────────────────────────────
    if body.json.len() > 10_000_000 {
        println!(
            "[COMPLETE_ATTEMPT] STEP 4 ❌ payload too large ({} bytes)",
            body.json.len()
        );
        return "FAIL:Payload too large (max 10 MB)".to_string();
    }
    println!("[COMPLETE_ATTEMPT] STEP 4 ✅ payload {} bytes", body.json.len());

    // ── 5) FILL THE ATTEMPT WITH THE ANSWER JSON ────────────────────
    println!("[COMPLETE_ATTEMPT] STEP 5 ── writing answers to attempt");
    match db()
        .attempts()
        .update_one(
            doc! { "id": &attempt.id },
            doc! { "$set": {
                "json": &body.json,
            }},
        )
        .await
    {
        Ok(res) if res.matched_count > 0 => {
            println!(
                "[COMPLETE_ATTEMPT] STEP 5 ✅ attempt updated ({} bytes written)",
                body.json.len()
            );
        }
        Ok(_) => {
            println!("[COMPLETE_ATTEMPT] STEP 5 ❌ attempt vanished mid-update");
            return "FAIL:Attempt not found".to_string();
        }
        Err(e) => {
            println!("[COMPLETE_ATTEMPT] STEP 5 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    }

    // ── 6) DELETE THE SESSION ───────────────────────────────────────
    println!("[COMPLETE_ATTEMPT] STEP 6 ── deleting session");
    if sessions::delete_by_token(&body.token) {
        println!("[COMPLETE_ATTEMPT] STEP 6 ✅ session deleted");
    } else {
        // non-fatal — the session will expire on its own
        println!("[COMPLETE_ATTEMPT] STEP 6 ⚠ session was already gone");
    }

    // ── 7) RETURN ───────────────────────────────────────────────────
    println!("[COMPLETE_ATTEMPT] STEP 7 ✅ ── DONE ──");
    println!("════════════════════════════════════════════════════════════");
    format!("OK:{}", attempt.id)
}