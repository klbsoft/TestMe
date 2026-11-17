use crate::components::dbfactory::db;
use crate::components::encrypt::CryptoService;
use crate::components::sessions;
use crate::identity::identities::Session;
use axum::Json;
use mongodb::bson::doc;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SessionRequest {
    pub token: String,
}

/// POST /session/check
/// Body: { "token": "..." }
/// Returns:
///   "OK:<new_token>" → valid, refreshed (rotated token + slid 1 hour)
///   "EXPIRED"        → past ends_at
///   "NOT_FOUND"      → no session
///   "ERROR:..."      → parse failure
pub async fn check_session(Json(body): Json<SessionRequest>) -> String {
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => s,
        None => return "NOT_FOUND".to_string(),
    };

    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("CHECK SESSION PARSE ERROR: {}", e);
            return format!("ERROR:{}", e);
        }
    };

    if now >= ends_at {
        return "EXPIRED".to_string();
    }

    let new_token = CryptoService::random_string(32);
    let new_end = (now + chrono::Duration::hours(1)).to_rfc3339();

    let matched = sessions::update_by_token(&body.token, |s| {
        s.token = new_token.clone();
        s.updated_at = now.to_rfc3339();
        s.ends_at = new_end;
    });

    if !matched {
        // the session vanished between our read and our write
        println!("CHECK SESSION REFRESH ERROR: session disappeared mid-update");
        return "NOT_FOUND".to_string();
    }

    format!("OK:{}", new_token)
}

/// POST /session/refresh
/// Body: { "token": "..." }
/// Returns:
///   "OK:<new_token>" → exists, still valid, rotated + extended 1 hour
///   "EXPIRED"        → past ends_at (deleted, not revived)
///   "NOT_FOUND"      → no session
///   "ERROR:..."      → parse failure
pub async fn refresh_session(Json(body): Json<SessionRequest>) -> String {
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => s,
        None => return "NOT_FOUND".to_string(),
    };

    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("REFRESH SESSION PARSE ERROR: {}", e);
            return format!("ERROR:{}", e);
        }
    };

    if now >= ends_at {
        let _ = sessions::delete_by_token(&body.token);
        return "EXPIRED".to_string();
    }

    let new_token = CryptoService::random_string(32);
    let new_end = (now + chrono::Duration::hours(1)).to_rfc3339();

    let matched = sessions::update_by_token(&body.token, |s| {
        s.token = new_token.clone();
        s.updated_at = now.to_rfc3339();
        s.ends_at = new_end;
    });

    if !matched {
        println!("REFRESH SESSION UPDATE ERROR: session disappeared mid-update");
        return "NOT_FOUND".to_string();
    }

    format!("OK:{}", new_token)
}