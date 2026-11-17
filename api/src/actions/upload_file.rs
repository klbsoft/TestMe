use axum::{
    extract::Multipart,
    response::IntoResponse,
};
use mongodb::bson::doc;
use std::path::PathBuf;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::{FileInfo, Session, Teacher};

const MAX_UPLOAD: usize = 1024 * 1024 * 1024 * 2; // 2 GB
const UPLOAD_DIR: &str = "./uploads";
const RESOURCE_BASE: &str = "https://klbsoft.work/testme-api/resource";//"http://localhost/testme-api/resource";
// const RESOURCE_BASE_PRODUCTION: &str = "https://klbsoft.work/testme-api/resource";

const TEACHER_DAILY_UPLOAD_LIMIT: i64 = 100;
const STUDENT_DAILY_UPLOAD_LIMIT: i64 = 50;

pub async fn upload_file(mut multipart: Multipart) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[UPLOAD] ── INCOMING REQUEST ──────────────────────────────");

    // ── 1) READ "token" FIELD FIRST ───────────────────────────────────
    println!("[UPLOAD] STEP 1 ── reading `token` field");
    let token = match multipart.next_field().await {
        Ok(Some(field)) if field.name() == Some("token") => {
            match field.text().await {
                Ok(t) if !t.is_empty() => {
                    println!("[UPLOAD] STEP 1 ✅ token = {:?}", mask(&t));
                    t
                }
                Ok(_) => {
                    println!("[UPLOAD] STEP 1 ❌ empty token");
                    return "FAIL:Empty token".to_string();
                }
                Err(e) => {
                    println!("[UPLOAD] STEP 1 ❌ token read error: {}", e);
                    return format!("FAIL:token read:{}", e);
                }
            }
        }
        Ok(Some(field)) => {
            println!(
                "[UPLOAD] STEP 1 ❌ expected `token` first, got {:?}",
                field.name()
            );
            return format!(
                "FAIL:Expected token field first, got {:?}",
                field.name()
            );
        }
        Ok(None) => {
            println!("[UPLOAD] STEP 1 ❌ no fields in request");
            return "FAIL:No fields in request".to_string();
        }
        Err(e) => {
            println!("[UPLOAD] STEP 1 ❌ multipart error: {}", e);
            return format!("FAIL:multipart:{}", e);
        }
    };

    // ── 2) READ "bond" FIELD SECOND ───────────────────────────────────
    println!("[UPLOAD] STEP 2 ── reading `bond` field");
    let bond = match multipart.next_field().await {
        Ok(Some(field)) if field.name() == Some("bond") => {
            match field.text().await {
                Ok(b) if !b.is_empty() => {
                    println!("[UPLOAD] STEP 2 ✅ bond = {:?}", b);
                    b
                }
                Ok(_) => {
                    println!("[UPLOAD] STEP 2 ❌ empty bond");
                    return "FAIL:Empty bond".to_string();
                }
                Err(e) => {
                    println!("[UPLOAD] STEP 2 ❌ bond read error: {}", e);
                    return format!("FAIL:bond read:{}", e);
                }
            }
        }
        Ok(Some(field)) => {
            println!(
                "[UPLOAD] STEP 2 ❌ expected `bond` second, got {:?}",
                field.name()
            );
            return format!(
                "FAIL:Expected bond field second, got {:?}",
                field.name()
            );
        }
        Ok(None) => {
            println!("[UPLOAD] STEP 2 ❌ missing bond field");
            return "FAIL:Missing bond field".to_string();
        }
        Err(e) => {
            println!("[UPLOAD] STEP 2 ❌ multipart error: {}", e);
            return format!("FAIL:multipart:{}", e);
        }
    };

    // ── 3) SESSION EXISTS ─────────────────────────────────────────────
    println!("[UPLOAD] STEP 3 ── looking up session");
    let session: Session = match sessions::get_by_token(&token) {
        Some(s) => {
            println!(
                "[UPLOAD] STEP 3 ✅ session found (id = {:?}, user = {:?})",
                s.id, s.user
            );
            s
        }
        None => {
            println!("[UPLOAD] STEP 3 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 4) SESSION NOT EXPIRED ────────────────────────────────────────
    println!("[UPLOAD] STEP 4 ── checking session expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[UPLOAD] STEP 4 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    println!("[UPLOAD] STEP 4   now = {}, ends_at = {}", now, ends_at);
    if now >= ends_at {
        println!("[UPLOAD] STEP 4 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[UPLOAD] STEP 4 ✅ session not expired");

    // ── 5) AUTHORIZE THE SESSION ──────────────────────────────────────
    // Rules:
    //   a) session.user is a real teacher → allowed (any file, quota applies)
    //   b) session.id traces back to an existing AssigmentAttempt → allowed
    //      (student mid-attempt: session.id was set to the attempt_id at
    //      session creation in `start_attempt`)
    //   c) anything else → reject
    println!(
        "[UPLOAD] STEP 5 ── authorizing session (id = {:?}, user = {:?})",
        session.id, session.user
    );

    let is_teacher = matches!(
        db().teachers().find_one(doc! { "id": &session.user }).await,
        Ok(Some(_))
    );

    let is_attempt = if is_teacher {
        false
    } else {
        matches!(
            db().attempts().find_one(doc! { "id": &session.id }).await,
            Ok(Some(_))
        )
    };

    if !is_teacher && !is_attempt {
        println!(
            "[UPLOAD] STEP 5 ❌ session is neither a teacher nor tied to an attempt (id = {:?}, user = {:?})",
            session.id, session.user
        );
        return "FAIL:Not authorized to upload".to_string();
    }

    println!(
        "[UPLOAD] STEP 5 ✅ authorized (teacher = {}, attempt = {})",
        is_teacher, is_attempt
    );

    // ── 6) DAILY QUOTA CHECK (skip for attempt) ───────────────────────
    if is_attempt {
        println!("[UPLOAD] STEP 6 ── skipping daily quota for attempt session");
    } else {
        println!("[UPLOAD] STEP 6 ── checking daily quota for user = {:?}", session.user);
        if let Err(msg) = check_daily_quota(&session.user, &now).await {
            println!("[UPLOAD] STEP 6 ❌ quota blocked: {}", msg);
            return msg;
        }
        println!("[UPLOAD] STEP 6 ✅ quota OK");
    }

    // ── 7) ENSURE UPLOAD DIR EXISTS ───────────────────────────────────
    println!("[UPLOAD] STEP 7 ── ensuring upload dir exists");
    let upload_dir = PathBuf::from(UPLOAD_DIR);
    if let Err(e) = tokio::fs::create_dir_all(&upload_dir).await {
        println!("[UPLOAD] STEP 7 ❌ mkdir error: {}", e);
        return format!("FAIL:mkdir:{}", e);
    }
    println!("[UPLOAD] STEP 7 ✅ upload dir ready");

    // ── 8) STREAM THE FILE FIELD ──────────────────────────────────────
    println!("[UPLOAD] STEP 8 ── streaming file field");
    while let Some(mut field) = match multipart.next_field().await {
        Ok(f) => f,
        Err(e) => {
            println!("[UPLOAD] STEP 8 ❌ multipart error: {}", e);
            return format!("FAIL:multipart:{}", e);
        }
    } {
        let original_name = match field.file_name() {
            Some(n) if !n.is_empty() => sanitize_filename::sanitize(n),
            _ => {
                println!(
                    "[UPLOAD] STEP 8   skipping non-file field {:?}",
                    field.name()
                );
                continue;
            }
        };

        let ext = std::path::Path::new(&original_name)
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| format!(".{}", e))
            .unwrap_or_default();

        let id = CryptoService::random_string(32);
        let stored_name = format!("{}{}", id, ext);
        let path = upload_dir.join(&stored_name);

        println!(
            "[UPLOAD] STEP 8   original = {:?}, stored = {:?}",
            original_name, stored_name
        );

        let mut file = match File::create(&path).await {
            Ok(f) => {
                println!("[UPLOAD] STEP 8   ✅ file created on disk");
                f
            }
            Err(e) => {
                println!("[UPLOAD] STEP 8   ❌ create error: {}", e);
                return format!("FAIL:create:{}", e);
            }
        };

        let mut written: usize = 0;

        while let Some(chunk) = match field.chunk().await {
            Ok(c) => c,
            Err(e) => {
                println!("[UPLOAD] STEP 8   ❌ read error after {} bytes: {}", written, e);
                let _ = tokio::fs::remove_file(&path).await;
                return format!("FAIL:read:{}", e);
            }
        } {
            written += chunk.len();
            if written > MAX_UPLOAD {
                println!(
                    "[UPLOAD] STEP 8   ❌ exceeded 2 GB limit at {} bytes",
                    written
                );
                let _ = tokio::fs::remove_file(&path).await;
                return "FAIL:File exceeds 2 GB limit".to_string();
            }
            if let Err(e) = file.write_all(&chunk).await {
                println!("[UPLOAD] STEP 8   ❌ write error after {} bytes: {}", written, e);
                let _ = tokio::fs::remove_file(&path).await;
                return format!("FAIL:write:{}", e);
            }
        }

        if let Err(e) = file.flush().await {
            println!("[UPLOAD] STEP 8   ❌ flush error: {}", e);
            let _ = tokio::fs::remove_file(&path).await;
            return format!("FAIL:flush:{}", e);
        }

        println!("[UPLOAD] STEP 8   ✅ wrote {} bytes to disk", written);

        // ── 9) REGISTER IN THE DB (WITH BOND) ────────────────────────
        println!("[UPLOAD] STEP 9 ── registering file in DB");
        let info = FileInfo {
            id: id.clone(),
            name: original_name.clone(),
            bonded: bond.clone(),
            uploaded_by: session.user.clone(),
            uploaded_date: now.to_rfc3339(),
        };

        println!(
            "[UPLOAD] STEP 9   FileInfo {{ id: {:?}, name: {:?}, bonded: {:?}, uploaded_by: {:?} }}",
            info.id, info.name, info.bonded, info.uploaded_by
        );

        if let Err(e) = db().files().insert_one(&info).await {
            println!("[UPLOAD] STEP 9   ❌ insert error: {}", e);
            let _ = tokio::fs::remove_file(&path).await;
            return "FAIL:Database error".to_string();
        }
        println!("[UPLOAD] STEP 9   ✅ file doc inserted");

        // ── 10) RETURN THE RESOURCE URL ───────────────────────────────
        let url = format!("OK:{}/{}", RESOURCE_BASE, stored_name);
        println!("[UPLOAD] STEP 10 ✅ ── DONE ── returning {}", url);
        println!("════════════════════════════════════════════════════════════");
        return url;
    }

    println!("[UPLOAD] ❌ no file field found in request");
    println!("════════════════════════════════════════════════════════════");
    "FAIL:No file in request".to_string()
}

async fn check_daily_quota(user: &str, now: &chrono::DateTime<chrono::Utc>) -> Result<(), String> {
    println!("[QUOTA] checking daily quota for user = {:?}", user);

    let last = match db()
        .files()
        .find_one(doc! { "uploaded_by": user })
        .sort(doc! { "uploaded_date": -1 })
        .await
    {
        Ok(Some(f)) => {
            println!(
                "[QUOTA] found last upload = {:?} at {:?}",
                f.name, f.uploaded_date
            );
            Some(f)
        }
        Ok(None) => {
            println!("[QUOTA] no previous uploads for this user");
            None
        }
        Err(e) => {
            println!("[QUOTA] ❌ find error: {}", e);
            return Err("FAIL:Database error".to_string());
        }
    };

    let start_of_today = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
    println!("[QUOTA] start_of_today = {}", start_of_today);

    if let Some(ref last_file) = last {
        if let Ok(last_time) = chrono::DateTime::parse_from_rfc3339(&last_file.uploaded_date) {
            if last_time.with_timezone(&chrono::Utc) < start_of_today {
                println!("[QUOTA] last upload was before today → quota reset, allow");
                return Ok(());
            }
        }
    } else {
        println!("[QUOTA] no history → allow");
        return Ok(());
    }

    let start_str = start_of_today.to_rfc3339();
    let count = match db()
        .files()
        .count_documents(doc! {
            "uploaded_by": user,
            "uploaded_date": { "$gte": &start_str },
        })
        .await
    {
        Ok(c) => {
            println!("[QUOTA] uploads today = {}", c);
            c
        }
        Err(e) => {
            println!("[QUOTA] ❌ count error: {}", e);
            return Err("FAIL:Database error".to_string());
        }
    };

    let is_teacher = db()
        .teachers()
        .find_one(doc! { "id": user })
        .await
        .ok()
        .flatten()
        .is_some();

    let limit = if is_teacher {
        println!("[QUOTA] user is a teacher → limit = {}", TEACHER_DAILY_UPLOAD_LIMIT);
        TEACHER_DAILY_UPLOAD_LIMIT
    } else {
        println!("[QUOTA] student limit = {}", STUDENT_DAILY_UPLOAD_LIMIT);
        STUDENT_DAILY_UPLOAD_LIMIT
    };

    if count as i64 >= limit {
        println!("[QUOTA] ❌ limit reached ({}/{})", count, limit);
        return Err(format!(
            "FAIL:Daily upload limit reached ({}/{})",
            count, limit
        ));
    }

    println!("[QUOTA] ✅ under limit ({}/{})", count, limit);
    Ok(())
}

/// Mask the middle of a token for safe logging (keeps first/last 4).
fn mask(token: &str) -> String {
    if token.len() <= 8 {
        return "*".repeat(token.len());
    }
    format!("{}…{}", &token[..4], &token[token.len() - 4..])
}