use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{Assignment, Session, Teacher, UpdateGroupRequest, UserInfo};
use axum::Json;
use mongodb::bson::doc;

pub async fn update_groups(Json(requests): Json<Vec<UpdateGroupRequest>>) -> String {
    // ── Validate the batch is consistent BEFORE any DB work ─────────────
    // Empty request is allowed: it means "delete every group for this teacher".
    // But an empty request carries no token, so we can't authenticate it.
    // → require the client to always include a token, even for the empty case.
    // Solution: reject empty bodies at the client, and accept an empty list only
    // when it's accompanied by a token. For now, guard it here:
    if requests.is_empty() {
        return "FAIL:Empty request (no token)".to_string();
    }

    let token = requests[0].token.clone();

    for req in &requests {
        if req.token != token {
            return "FAIL:Inconsistent token in batch".to_string();
        }
        if req.size.parse::<u32>().is_err() {
            return format!("FAIL:Invalid size for group {}", req.name);
        }
    }

    // 1) Session exists?
    let session: Session = match sessions::get_by_token(&token) {
        Some(s) => s,
        None => return "FAIL:Invalid session".to_string(),
    };

    // 2) Session not expired?
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("UPDATE GROUPS PARSE ERROR: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        return "FAIL:Session expired".to_string();
    }

    // 3) Teacher exists — derived from session.user.
    let teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => return "FAIL:Teacher not found".to_string(),
        Err(e) => {
            println!("UPDATE GROUPS TEACHER ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── Wipe every student for this teacher ────────────────────────────
    let mut deleted = 0usize;
    match db()
        .users()
        .delete_many(doc! { "teacher": &teacher.id })
        .await
    {
        Ok(res) => deleted += res.deleted_count as usize,
        Err(e) => {
            println!("UPDATE GROUPS WIPE ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    }

    // ── Re-create from the request ─────────────────────────────────────
    let mut created = 0usize;
    let mut failed = 0usize;

    for req in &requests {
        let target: u32 = req.size.parse().unwrap_or(0);

        for n in 1..=target {
            let code = format!("{}{}", req.name, n);
            let password = CryptoService::random_string(4).to_uppercase();

            let user = UserInfo {
                id: CryptoService::random_string(32),
                code,
                group: req.name.clone(),
                teacher: teacher.id.clone(),
                password,
                assignments: Vec::<Assignment>::new(),
            };

            match db().users().insert_one(&user).await {
                Ok(_) => created += 1,
                Err(e) => {
                    println!("UPDATE GROUPS INSERT ERROR ({}): {}", user.code, e);
                    failed += 1;
                }
            }
        }
    }

    format!(
        "OK:created={},deleted={},failed={}",
        created, deleted, failed
    )
}