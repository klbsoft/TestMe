// src/actions/start_group_session.rs
use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;

use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{
    RequestGroupAction, ResourceAccess, Session, Teacher,
};

const GROUP_SESSION_MINUTES: i64 = 50;

pub async fn start_group_session(
    Json(body): Json<RequestGroupAction>,
) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[START_GROUP_SESSION] ── INCOMING REQUEST ─────────────────");
    println!("[START_GROUP_SESSION] group = {:?}", body.group);
    println!("[START_GROUP_SESSION] token = {:?}", mask(&body.token));

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[START_GROUP_SESSION] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!(
                "[START_GROUP_SESSION] STEP 1 ✅ session found for user = {:?}",
                s.user
            );
            s
        }
        None => {
            println!("[START_GROUP_SESSION] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[START_GROUP_SESSION] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[START_GROUP_SESSION] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[START_GROUP_SESSION] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[START_GROUP_SESSION] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    println!("[START_GROUP_SESSION] STEP 3 ── verifying teacher");
    let teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[START_GROUP_SESSION] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[START_GROUP_SESSION] STEP 3 ❌ caller is not a teacher");
            return "FAIL:Only teachers can start group sessions".to_string();
        }
        Err(e) => {
            println!("[START_GROUP_SESSION] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) VALIDATE THE GROUP BELONGS TO THIS TEACHER ────────────────
    println!(
        "[START_GROUP_SESSION] STEP 4 ── verifying group {:?} belongs to teacher {:?}",
        body.group, teacher.id
    );
    let group_exists = matches!(
        db()
            .users()
            .find_one(doc! { "group": &body.group, "teacher": &teacher.id })
            .await,
        Ok(Some(_))
    );
    if !group_exists {
        println!(
            "[START_GROUP_SESSION] STEP 4 ❌ no students in group {:?} for this teacher",
            body.group
        );
        return "FAIL:Group not found".to_string();
    }
    println!("[START_GROUP_SESSION] STEP 4 ✅ group exists");

    // ── 5) PURGE ANY EXISTING SESSION FOR THIS GROUP ────────────────
    // A group must have exactly one active code at a time. Remove any
    // session whose `user` equals this group's name before issuing a
    // new one. Done after validation (so a bad request can't wipe the
    // current code) and before the insert (no `.await` between the
    // two, so no other task can observe an empty window).
    println!(
        "[START_GROUP_SESSION] STEP 5 ── purging prior sessions for group {:?}",
        body.group
    );
    let purged = sessions::delete_by_user(&body.group);
    println!(
        "[START_GROUP_SESSION] STEP 5 ✅ purged {} prior session(s) for group {:?}",
        purged, body.group
    );

    // ── 6) GENERATE THE 4-CHAR GROUP CODE ───────────────────────────
    println!("[START_GROUP_SESSION] STEP 6 ── generating group token");
    let group_token = CryptoService::random_string(4).to_uppercase();
    println!("[START_GROUP_SESSION] STEP 6 ✅ token = {:?}", group_token);

    // ── 7) INSERT THE NEW GROUP SESSION ─────────────────────────────
    println!("[START_GROUP_SESSION] STEP 7 ── inserting group session");
    let group_session = Session {
        id: CryptoService::random_string(32),
        token: group_token.clone(),
        user: body.group.clone(),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
        ends_at: (now + chrono::Duration::minutes(GROUP_SESSION_MINUTES)).to_rfc3339(),
    };

    sessions::insert(group_session);
    println!(
        "[START_GROUP_SESSION] STEP 7 ✅ group session issued (expires in {} min)",
        GROUP_SESSION_MINUTES
    );

    // ── 8) RETURN THE TOKEN AS JSON ─────────────────────────────────
    let response = ResourceAccess {
        token: group_token,
    };

    match serde_json::to_string(&response) {
        Ok(json) => {
            println!("[START_GROUP_SESSION] STEP 8 ✅ ── DONE ── {}", json);
            println!("════════════════════════════════════════════════════════════");
            format!("OK:{}", json)
        }
        Err(e) => {
            println!("[START_GROUP_SESSION] STEP 8 ❌ serialize error: {}", e);
            println!("════════════════════════════════════════════════════════════");
            "FAIL:Failed to serialize result".to_string()
        }
    }
}

/// Mask the middle of a token for safe logging (keeps first/last 4).
fn mask(token: &str) -> String {
    if token.len() <= 8 {
        return "*".repeat(token.len());
    }
    format!("{}…{}", &token[..4], &token[token.len() - 4..])
}