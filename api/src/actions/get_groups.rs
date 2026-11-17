use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{Group, ResourceAccess, Session, Teacher, UserInfo};
use axum::Json;
use mongodb::bson::doc;
use serde_json;

pub async fn get_groups(Json(req): Json<ResourceAccess>) -> String {
    // 1) Session exists?
    let session: Session = match sessions::get_by_token(&req.token) {
        Some(s) => s,
        None => return "FAIL:Invalid session".to_string(),
    };

    // 2) Session not expired?
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("GET GROUPS PARSE ERROR: {}", e);
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
            println!("GET GROUPS TEACHER ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── Collect students belonging to this teacher ──────────────────────
    let mut cursor = match db()
        .users()
        .find(doc! { "teacher": &teacher.id })
        .await
    {
        Ok(c) => c,
        Err(e) => {
            println!("GET GROUPS FIND ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut counts: std::collections::BTreeMap<String, usize> = std::collections::BTreeMap::new();
    while cursor.advance().await.unwrap_or(false) {
        if let Ok(u) = cursor.deserialize_current() {
            if !u.group.is_empty() {
                *counts.entry(u.group).or_insert(0) += 1;
            }
        }
    }

    let groups: Vec<Group> = counts
        .into_iter()
        .map(|(name, size)| Group { name, size })
        .collect();

    match serde_json::to_string(&groups) {
        Ok(json) => format!("OK:{}", json),
        Err(e) => {
            println!("GET GROUPS SERIALIZE ERROR: {}", e);
            "FAIL:Failed to serialize groups".to_string()
        }
    }
}