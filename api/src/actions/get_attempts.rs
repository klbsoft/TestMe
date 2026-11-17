use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Serialize;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{
    AssigmentAttempt, AttemptRow, ResourceAccess, Session, Teacher, UserInfo,
};

 

pub async fn get_attempts(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    // ── 1) SESSION ──────────────────────────────────────────────────
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => s,
        None => return "FAIL:Invalid session".to_string(),
    };

    // ── 2) EXPIRY ───────────────────────────────────────────────────
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("GET ATTEMPTS PARSE ERROR: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        return "FAIL:Session expired".to_string();
    }

    // ── 3) RESOLVE ROLE ─────────────────────────────────────────────
    let teacher_opt: Option<Teacher> = db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
        .ok()
        .flatten();

    if let Some(teacher) = teacher_opt {
        // ── TEACHER PATH: all attempts from all their students ──────
        let mut students_by_id: std::collections::HashMap<String, (String, String)> =
            std::collections::HashMap::new();

        let mut students_cursor = match db()
            .users()
            .find(doc! { "teacher": &teacher.id })
            .await
        {
            Ok(c) => c,
            Err(e) => {
                println!("GET ATTEMPTS STUDENTS ERROR: {}", e);
                return "FAIL:Database error".to_string();
            }
        };

        while students_cursor.advance().await.unwrap_or(false) {
            if let Ok(u) = students_cursor.deserialize_current() {
                students_by_id.insert(u.id.clone(), (u.code, u.group));
            }
        }

        if students_by_id.is_empty() {
            return "OK:[]".to_string();
        }

        let student_ids: Vec<String> = students_by_id.keys().cloned().collect();

        let mut cursor = match db()
            .attempts()
            .find(doc! { "user": { "$in": &student_ids } })
            .await
        {
            Ok(c) => c,
            Err(e) => {
                println!("GET ATTEMPTS FIND ERROR: {}", e);
                return "FAIL:Database error".to_string();
            }
        };

        let mut rows: Vec<AttemptRow> = Vec::new();

        while cursor.advance().await.unwrap_or(false) {
            let a: AssigmentAttempt = match cursor.deserialize_current() {
                Ok(a) => a,
                Err(e) => {
                    println!("GET ATTEMPTS DESERIALIZE ERROR: {}", e);
                    continue;
                }
            };

            let Some((code, group)) = students_by_id.get(&a.user) else {
                continue;
            };

            rows.push(AttemptRow {
                id: a.id,
                user: a.user,
                code: code.clone(),
                group: group.clone(),
                attempt: a.attempt,
                assigment_label: a.assigment_label,
                assigment_type: a.assigment_type,
                assigment_id: a.assigment_id,
                max_attempts: a.max_attempts,
                grade: a.grade,
                window: a.window,
                json: a.json,
            });
        }

        rows.sort_by(|a, b| {
            a.group
                .cmp(&b.group)
                .then_with(|| numeric_suffix(&a.code).cmp(&numeric_suffix(&b.code)))
                .then_with(|| a.attempt.cmp(&b.attempt))
        });

        return match serde_json::to_string(&rows) {
            Ok(json) => format!("OK:{}", json),
            Err(e) => {
                println!("GET ATTEMPTS SERIALIZE ERROR: {}", e);
                "FAIL:Failed to serialize result".to_string()
            }
        };
    }

    // ── STUDENT PATH: all attempts belonging to this student ────────
    let student: UserInfo = match db()
        .users()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(s)) => s,
        Ok(None) => return "FAIL:User not found".to_string(),
        Err(e) => {
            println!("GET ATTEMPTS USER ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut cursor = match db()
        .attempts()
        .find(doc! { "user": &student.id })
        .await
    {
        Ok(c) => c,
        Err(e) => {
            println!("GET ATTEMPTS FIND ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    let mut rows: Vec<AttemptRow> = Vec::new();

    while cursor.advance().await.unwrap_or(false) {
        let a: AssigmentAttempt = match cursor.deserialize_current() {
            Ok(a) => a,
            Err(e) => {
                println!("GET ATTEMPTS DESERIALIZE ERROR: {}", e);
                continue;
            }
        };

        rows.push(AttemptRow {
            id: a.id,
            user: a.user,
            code: student.code.clone(),
            group: student.group.clone(),
            attempt: a.attempt,
            assigment_label: a.assigment_label,
            assigment_type: a.assigment_type,
            assigment_id: a.assigment_id,
            max_attempts: a.max_attempts,
            grade: a.grade,
            window: a.window,
            json: String::new(),   // student sees no submission json
        });
    }

    rows.sort_by(|a, b| a.attempt.cmp(&b.attempt));

    match serde_json::to_string(&rows) {
        Ok(json) => format!("OK:{}", json),
        Err(e) => {
            println!("GET ATTEMPTS SERIALIZE ERROR: {}", e);
            "FAIL:Failed to serialize result".to_string()
        }
    }
}

fn numeric_suffix(code: &str) -> u32 {
    code.chars()
        .skip_while(|c| !c.is_ascii_digit())
        .collect::<String>()
        .parse()
        .unwrap_or(0)
}