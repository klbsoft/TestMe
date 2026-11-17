use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Serialize;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{RequestGroupAction, Session, StudentPassword, Teacher, UserInfo};

pub async fn get_group_passwords(
    Json(body): Json<RequestGroupAction>,
) -> impl IntoResponse {
    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => s,
        None => return "FAIL:Invalid session".to_string(),
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("GET GROUP PASSWORDS PARSE ERROR: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        return "FAIL:Session expired".to_string();
    }

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    let teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => return "FAIL:Only teachers can view passwords".to_string(),
        Err(e) => {
            println!("GET GROUP PASSWORDS TEACHER ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) FETCH STUDENTS IN THAT GROUP FOR THIS TEACHER ────────────
    let mut cursor = match db()
        .users()
        .find(doc! { "group": &body.group, "teacher": &teacher.id })
        .await
    {
        Ok(c) => c,
        Err(e) => {
            println!("GET GROUP PASSWORDS FIND ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut students: Vec<UserInfo> = Vec::new();
    while cursor.advance().await.unwrap_or(false) {
        if let Ok(u) = cursor.deserialize_current() {
            students.push(u);
        }
    }

    // ── 5) SORT BY THE NUMERIC SUFFIX IN THE CODE ───────────────────
    students.sort_by_key(|u| {
        u.code
            .chars()
            .skip_while(|c| !c.is_ascii_digit())
            .collect::<String>()
            .parse::<u32>()
            .unwrap_or(0)
    });

    // ── 6) PROJECT TO { code, password } ────────────────────────────
    let rows: Vec<StudentPassword> = students
        .into_iter()
        .map(|u| StudentPassword {
            code: u.code,
            password: u.password,
        })
        .collect();

    // ── 7) RETURN AS JSON ───────────────────────────────────────────
    match serde_json::to_string(&rows) {
        Ok(json) => format!("OK:{}", json),
        Err(e) => {
            println!("GET GROUP PASSWORDS SERIALIZE ERROR: {}", e);
            "FAIL:Failed to serialize result".to_string()
        }
    }
}