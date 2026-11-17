use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Serialize;

use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{RequestGroupAction, Session, Teacher, UserInfo};

#[derive(Debug, Serialize)]
pub struct StudentPassword {
    code: String,
    password: String,
}

pub async fn rotate_passwords(
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
            println!("ROTATE PASSWORDS PARSE ERROR: {}", e);
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
        Ok(None) => return "FAIL:Only teachers can rotate passwords".to_string(),
        Err(e) => {
            println!("ROTATE PASSWORDS TEACHER ERROR: {}", e);
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
            println!("ROTATE PASSWORDS FIND ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut students: Vec<UserInfo> = Vec::new();
    while cursor.advance().await.unwrap_or(false) {
        if let Ok(u) = cursor.deserialize_current() {
            students.push(u);
        }
    }

    // ── 5) SORT BY NUMERIC SUFFIX IN CODE ───────────────────────────
    students.sort_by_key(|u| {
        u.code
            .chars()
            .skip_while(|c| !c.is_ascii_digit())
            .collect::<String>()
            .parse::<u32>()
            .unwrap_or(0)
    });

    // ── 6) ROTATE + UPDATE EACH STUDENT ────────────────────────────
    let mut rows: Vec<StudentPassword> = Vec::with_capacity(students.len());

    for student in students {
        let new_password = CryptoService::random_string(4).to_uppercase();

        match db()
            .users()
            .update_one(
                doc! { "id": &student.id },
                doc! { "$set": { "password": &new_password } },
            )
            .await
        {
            Ok(res) if res.matched_count > 0 => {
                rows.push(StudentPassword {
                    code: student.code,
                    password: new_password,
                });
            }
            Ok(_) => {
                println!("ROTATE PASSWORDS: student {} vanished mid-update", student.code);
            }
            Err(e) => {
                println!("ROTATE PASSWORDS UPDATE ERROR ({}): {}", student.code, e);
            }
        }
    }

    // ── 7) RETURN AS JSON ───────────────────────────────────────────
    match serde_json::to_string(&rows) {
        Ok(json) => format!("OK:{}", json),
        Err(e) => {
            println!("ROTATE PASSWORDS SERIALIZE ERROR: {}", e);
            "FAIL:Failed to serialize result".to_string()
        }
    }
}