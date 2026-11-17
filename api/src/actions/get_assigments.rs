use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Deserialize;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{ RawAssigment, RawAssigmentRequest, ResourceAccess, Session, Teacher};

pub async fn get_single_assigment(Json(body): Json<ResourceAccess>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[GET_SINGLE] ── INCOMING REQUEST ──────────────────────────");

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[GET_SINGLE] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[GET_SINGLE] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[GET_SINGLE] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[GET_SINGLE] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[GET_SINGLE] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[GET_SINGLE] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[GET_SINGLE] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    println!("[GET_SINGLE] STEP 3 ── verifying teacher");
    let _teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[GET_SINGLE] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[GET_SINGLE] STEP 3 ❌ not a teacher");
            return "FAIL:Only teachers can read assignments".to_string();
        }
        Err(e) => {
            println!("[GET_SINGLE] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) FETCH THE ASSIGNMENT ──────────────────────────────────────
    println!("[GET_SINGLE] STEP 4 ── fetching assignment for teacher = {:?}", session.user);
    let assignment: RawAssigment = match db()
        .raw_assigments()
        .find_one(doc! { "teacher": &session.user })
        .await
    {
        Ok(Some(a)) => {
            println!(
                "[GET_SINGLE] STEP 4 ✅ found assignment id = {:?}, label = {:?}",
                a.id, a.label
            );
            a
        }
        Ok(None) => {
            println!("[GET_SINGLE] STEP 4 ❌ no assignment for this teacher");
            return "FAIL:No assignment found".to_string();
        }
        Err(e) => {
            println!("[GET_SINGLE] STEP 4 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 5) PROJECT TO RawAssigmentRequest ────────────────────────────
    println!("[GET_SINGLE] STEP 5 ── serializing result");
    let response = RawAssigmentRequest {
        json: assignment.json,
        max_attempts: assignment.max_attempts,
        label: assignment.label,
        assigment_type: assignment.assigment_type,
        bond: assignment.bond,
    };

    match serde_json::to_string(&response) {
        Ok(json) => {
            println!("[GET_SINGLE] STEP 5 ✅ ── DONE ── returning {} bytes", json.len());
            println!("════════════════════════════════════════════════════════════");
            format!("OK:{}", json)
        }
        Err(e) => {
            println!("[GET_SINGLE] STEP 5 ❌ serialize error: {}", e);
            println!("════════════════════════════════════════════════════════════");
            "FAIL:Failed to serialize result".to_string()
        }
    }
}