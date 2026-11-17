use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;
use serde::Deserialize;

use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{RawAssigment, Session, Teacher, UpdateAssigmentRequest};

const UPLOAD_DIR: &str = "./uploads";

pub async fn update_assigment(Json(body): Json<UpdateAssigmentRequest>) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[UPDATE_ASSIGMENT] ── INCOMING REQUEST ────────────────────");
    println!("[UPDATE_ASSIGMENT] token        = {:?}", mask(&body.token));
    println!("[UPDATE_ASSIGMENT] label        = {:?}", body.label);
    println!("[UPDATE_ASSIGMENT] type         = {:?}", body.assigment_type);
    println!("[UPDATE_ASSIGMENT] max_attempts = {}", body.max_attempts);
    println!("[UPDATE_ASSIGMENT] bond         = {:?}", body.bond);
    println!("[UPDATE_ASSIGMENT] json_len     = {} bytes", body.json.len());

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[UPDATE_ASSIGMENT] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[UPDATE_ASSIGMENT] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[UPDATE_ASSIGMENT] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[UPDATE_ASSIGMENT] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[UPDATE_ASSIGMENT] STEP 2 ❌ PARSE ERROR: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    println!("[UPDATE_ASSIGMENT] STEP 2   now = {}, ends_at = {}", now, ends_at);
    if now >= ends_at {
        println!("[UPDATE_ASSIGMENT] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[UPDATE_ASSIGMENT] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ─────────────────────────────────────────
    println!("[UPDATE_ASSIGMENT] STEP 3 ── verifying teacher");
    let _teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[UPDATE_ASSIGMENT] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[UPDATE_ASSIGMENT] STEP 3 ❌ not a teacher");
            return "FAIL:Only teachers can create assignments".to_string();
        }
        Err(e) => {
            println!("[UPDATE_ASSIGMENT] STEP 3 ❌ DB ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) VALIDATE ──────────────────────────────────────────────────
    println!("[UPDATE_ASSIGMENT] STEP 4 ── validating payload");
    if body.json.len() > 10_000_000 {
        println!("[UPDATE_ASSIGMENT] STEP 4 ❌ json too large ({} bytes)", body.json.len());
        return "FAIL:Payload too large (max 10 MB)".to_string();
    }
    if body.label.trim().is_empty() {
        println!("[UPDATE_ASSIGMENT] STEP 4 ❌ empty label");
        return "FAIL:Label is required".to_string();
    }
    if body.assigment_type.trim().is_empty() {
        println!("[UPDATE_ASSIGMENT] STEP 4 ❌ empty assignment type");
        return "FAIL:Assignment type is required".to_string();
    }
    if body.max_attempts == 0 {
        println!("[UPDATE_ASSIGMENT] STEP 4 ❌ max_attempts == 0");
        return "FAIL:Max attempts must be at least 1".to_string();
    }
    println!("[UPDATE_ASSIGMENT] STEP 4 ✅ payload valid");

    // // ── 5) V0: ONLY ONE ASSIGNMENT PER TEACHER ───────────────────────
    // println!("[UPDATE_ASSIGMENT] STEP 5 ── collecting old bonds");
    // let mut old_bonds: Vec<String> = Vec::new();

    // match db()
    //     .raw_assigments()
    //     .find(doc! { "teacher": &session.user })
    //     .await
    // {
    //     Ok(mut cursor) => {
    //         while cursor.advance().await.unwrap_or(false) {
    //             if let Ok(a) = cursor.deserialize_current() {
    //                 println!(
    //                     "[UPDATE_ASSIGMENT] STEP 5   found old assignment id={:?} bond={:?}",
    //                     a.id, a.bond
    //                 );
    //                 if !a.bond.is_empty() {
    //                     old_bonds.push(a.bond);
    //                 }
    //             }
    //         }
    //     }
    //     Err(e) => {
    //         println!("[UPDATE_ASSIGMENT] STEP 5 ❌ BOND LOOKUP ERROR: {}", e);
    //         return "FAIL:Database error".to_string();
    //     }
    // }
    // println!(
    //     "[UPDATE_ASSIGMENT] STEP 5   collected {} old bond(s): {:?}",
    //     old_bonds.len(), old_bonds
    // );

    // for bond in &old_bonds {
    //     println!("[UPDATE_ASSIGMENT] STEP 5   purging files for bond = {:?}", bond);

    //     match db()
    //         .files()
    //         .find(doc! { "bonded": bond })
    //         .await
    //     {
    //         Ok(mut cursor) => {
    //             let mut file_count = 0;
    //             while cursor.advance().await.unwrap_or(false) {
    //                 if let Ok(f) = cursor.deserialize_current() {
    //                     file_count += 1;
    //                     let ext = std::path::Path::new(&f.name)
    //                         .extension()
    //                         .and_then(|e| e.to_str())
    //                         .map(|e| format!(".{}", e))
    //                         .unwrap_or_default();
    //                     let stored_name = format!("{}{}", f.id, ext);
    //                     let path = std::path::PathBuf::from(UPLOAD_DIR).join(&stored_name);

    //                     println!(
    //                         "[UPDATE_ASSIGMENT] STEP 5   → file id={:?} name={:?} stored={:?}",
    //                         f.id, f.name, stored_name
    //                     );

    //                     match tokio::fs::remove_file(&path).await {
    //                         Ok(_) => println!(
    //                             "[UPDATE_ASSIGMENT] STEP 5     ✅ removed disk file {:?}",
    //                             path
    //                         ),
    //                         Err(e) => println!(
    //                             "[UPDATE_ASSIGMENT] STEP 5     ⚠ disk remove warn ({}): {}",
    //                             stored_name, e
    //                         ),
    //                     }
    //                 }
    //             }
    //             println!(
    //                 "[UPDATE_ASSIGMENT] STEP 5   found {} file(s) for bond {:?}",
    //                 file_count, bond
    //             );
    //         }
    //         Err(e) => {
    //             println!(
    //                 "[UPDATE_ASSIGMENT] STEP 5   ⚠ file lookup error for bond {:?}: {}",
    //                 bond, e
    //             );
    //         }
    //     }

    //     match db().files().delete_many(doc! { "bonded": bond }).await {
    //         Ok(res) => println!(
    //             "[UPDATE_ASSIGMENT] STEP 5   ✅ deleted {} file doc(s) for bond {:?}",
    //             res.deleted_count, bond
    //         ),
    //         Err(e) => println!(
    //             "[UPDATE_ASSIGMENT] STEP 5   ⚠ file doc delete error for bond {:?}: {}",
    //             bond, e
    //         ),
    //     }
    // }

    println!("[UPDATE_ASSIGMENT] STEP 5 ── wiping old assignments");
    match db()
        .raw_assigments()
        .delete_many(doc! { "teacher": &session.user })
        .await
    {
        Ok(res) => println!(
            "[UPDATE_ASSIGMENT] STEP 5 ✅ deleted {} old assignment doc(s)",
            res.deleted_count
        ),
        Err(e) => {
            println!("[UPDATE_ASSIGMENT] STEP 5 ❌ WIPE ERROR: {}", e);
            return "FAIL:Database error".to_string();
        }
    }

    // ── 6) WRITE THE RAW ASSIGNMENT ──────────────────────────────────
    println!("[UPDATE_ASSIGMENT] STEP 6 ── inserting new assignment");
    let id = CryptoService::random_string(32);
    let now_str = now.to_rfc3339();

    println!(
        "[UPDATE_ASSIGMENT] STEP 6   new id = {:?}, bond = {:?}",
        id, body.bond
    );

    let doc = RawAssigment {
        id: id.clone(),
        json: body.json,
        max_attempts: body.max_attempts,
        label: body.label,
        assigment_type: body.assigment_type,
        teacher: session.user.clone(),
        created_date: now_str.clone(),
        updated_date: now_str,
        bond: body.bond,
    };

    match db().raw_assigments().insert_one(&doc).await {
        Ok(_) => {
            println!(
                "[UPDATE_ASSIGMENT] STEP 6 ✅ insert OK ── DONE ────────────"
            );
            println!("════════════════════════════════════════════════════════════");
            "OK:Assigment updated sucessfully!!!".to_string()
        }
        Err(e) => {
            println!("[UPDATE_ASSIGMENT] STEP 6 ❌ INSERT ERROR: {}", e);
            println!("════════════════════════════════════════════════════════════");
            "FAIL:Database error".to_string()
        }
    }
}

/// Mask the middle of a token for safe logging (keeps first/last 4).
fn mask(token: &str) -> String {
    if token.len() <= 8 {
        return "*".repeat(token.len());
    }
    format!(
        "{}…{}",
        &token[..4],
        &token[token.len() - 4..]
    )
}