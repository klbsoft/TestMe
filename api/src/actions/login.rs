// use std::fmt::format;

use argon2::password_hash::Encoding::Crypt;
// use argon2::password_hash::Encoding::Crypt;
use axum::Json;
use mongodb::bson::doc;

use crate::{components::{dbfactory::db, encrypt::CryptoService, sessions}, identity::identities::{Session, TeacherLogin, UserInfo, UserLogin}};
 
// use std::fmt::format;
 
pub async fn login(Json(credentials): Json<UserLogin>) -> String {
    println!("════════════════════════════════════════════════════════════");
    println!("[LOGIN] ── INCOMING REQUEST ────────────────────────────────");
    println!("[LOGIN] code = {:?}", credentials.code);
    println!("[LOGIN] auth = {:?}", credentials.auth);

    // ── 1) STUDENT EXISTS ───────────────────────────────────────────
    println!("[LOGIN] STEP 1 ── looking up student by code");
    let user: UserInfo = match db().users().find_one(doc! { "code": &credentials.code }).await {
        Ok(Some(user)) => {
            println!("[LOGIN] STEP 1 ✅ student found (id = {:?}, group = {:?})", user.id, user.group);
            user
        }
        Ok(None) => {
            println!("[LOGIN] STEP 1 ❌ no student with code = {:?}", credentials.code);
            return "FAIL:User not found".to_string();
        }
        Err(e) => {
            println!("[LOGIN] STEP 1 ❌ DB error: {}", e);
            return "FAIL:There was a data base error".to_string();
        }
    };

    // ── 2) STUDENT'S OWN PASSWORD ───────────────────────────────────
    println!("[LOGIN] STEP 2 ── checking student password");
    println!("sent: {} stored: {}",credentials.password,user.password);
    if credentials.password != user.password {
        println!("[LOGIN] STEP 2 ❌ password mismatch for {:?}", user.code);
        return "FAIL:Either password or user are invalid".to_string();
    }
    println!("[LOGIN] STEP 2 ✅ password matches");

    // ── 3) GROUP SESSION EXISTS FOR THIS STUDENT'S GROUP ────────────
    // `auth` is the 4-digit code the teacher generated in
    // start_group_session. It lives in the sessions Vec with
    // `user = <group name>`. We look it up and require that its group
    // matches this student's group.
    println!("[LOGIN] STEP 3 ── verifying group session for auth = {:?}", mask(&credentials.auth));
    let group_session: Session = match sessions::get_by_token(&credentials.auth) {
        Some(s) => {
            println!(
                "[LOGIN] STEP 3 ✅ group session found (group = {:?}, ends_at = {})",
                s.user, s.ends_at
            );
            s
        }
        None => {
            println!("[LOGIN] STEP 3 ❌ no active group session with that auth code");
            return "FAIL:Invalid or expired group code".to_string();
        }
    };

    // ── 4) GROUP SESSION NOT EXPIRED ────────────────────────────────
    println!("[LOGIN] STEP 4 ── checking group session expiry");
    let now = chrono::Utc::now();
    let group_ends_at = match chrono::DateTime::parse_from_rfc3339(&group_session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[LOGIN] STEP 4 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= group_ends_at {
        println!("[LOGIN] STEP 4 ❌ group session expired");
        return "FAIL:Invalid or expired group code".to_string();
    }
    println!("[LOGIN] STEP 4 ✅ group session not expired");

    // ── 5) STUDENT BELONGS TO THAT GROUP ────────────────────────────
    println!(
        "[LOGIN] STEP 5 ── verifying student's group ({:?}) matches session's group ({:?})",
        user.group, group_session.user
    );
    if user.group != group_session.user {
        println!(
            "[LOGIN] STEP 5 ❌ student is in group {:?}, auth is for group {:?}",
            user.group, group_session.user
        );
        return "FAIL:This code is not for your group".to_string();
    }
    println!("[LOGIN] STEP 5 ✅ student belongs to the group");

    // ── 6) ISSUE A NEW LOGIN SESSION ────────────────────────────────
    println!("[LOGIN] STEP 6 ── issuing login session");
    let token = CryptoService::random_string(32);

    let session = Session{
        id: CryptoService::random_string(32),
        token: token.clone(),
        user: user.id.clone(),
        updated_at: now.to_rfc3339(),
        created_at: now.to_rfc3339(),
        ends_at: (now + chrono::Duration::hours(1)).to_rfc3339(),
    };

    sessions::insert(session);
    println!("[LOGIN] STEP 6 ✅ login session issued for user = {:?}", user.id);
    println!("════════════════════════════════════════════════════════════");

    format!("OK:{}", token)
}

/// Mask the middle of a token for safe logging. The auth field is only
/// 4 digits, so keep first/last 2 to avoid indexing past the end.
fn mask(token: &str) -> String {
    if token.len() <= 4 {
        return "*".repeat(token.len());
    }
    format!("{}…{}", &token[..2], &token[token.len() - 2..])
}



pub async fn loginAdmin(Json(credentials): Json<TeacherLogin>) -> String {
    let user = match db().teachers().find_one(doc! { "name": &credentials.name }).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            println!("FAIL TO LOGIN CODE: {} PASSWORD: {}", credentials.name, credentials.password);
            return "FAIL:User not found".to_string();
        }
        Err(e) => {
            println!("LOGIN: Database error: {}", e);
            return "FAIL:There was a data base error".to_string();
        }
    };

    let crypto = CryptoService::new();
    let hash = credentials.password;
    println!("[{}]\n[{}]\n[{}]", user.name, &hash, &user.password_hash);

    match crypto.verify_non_deterministic_hash(&hash, &user.password_hash) {
        Ok(true) => {
            println!("LOGIN SUCESSFULL");
            let token = CryptoService::random_string(32);

            let now = chrono::Utc::now();
            let session = Session {
                id: CryptoService::random_string(32),
                user: user.id,
                token: token.clone(),
                updated_at: now.to_rfc3339(),
                created_at: now.to_rfc3339(),
                ends_at: (now + chrono::Duration::hours(8)).to_rfc3339(),
            };

            sessions::insert(session);

            format!("OK:{}", token)
        }
        Ok(false) => {
            println!("FAIL TO LOGIN");
            "FAIL:Incorrect user or Password".to_string()
        }
        Err(e) => {
            println!("{:?}", e);
            "FAIL:Invalid password or user.".to_string()
        }
    }
}