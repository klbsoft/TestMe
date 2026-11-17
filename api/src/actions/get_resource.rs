use axum::{
    extract::Path,
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use mongodb::bson::doc;
use std::path::PathBuf;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{ResourceAccess, Session};

const UPLOAD_DIR: &str = "./uploads";

pub async fn get_resource(
    Path(name): Path<String>,
    Json(body): Json<ResourceAccess>,
) -> impl IntoResponse {
    println!("[get_resource] ──────────────────────────────────────");
    println!("[get_resource] requested name = {:?}", name);
    println!("[get_resource] token (first 8) = {:?}", &body.token.chars().take(8).collect::<String>());
    println!("[get_resource] UPLOAD_DIR = {:?}", UPLOAD_DIR);
    println!("[get_resource] cwd = {:?}", std::env::current_dir().ok());

    // ── 1) Sanitize ─────────────────────────────────────────────────
    if name.is_empty()
        || name.contains('/')
        || name.contains('\\')
        || name.contains("..")
    {
        println!("[get_resource] REJECT: bad name");
        return (StatusCode::BAD_REQUEST, "FAIL:Invalid resource name").into_response();
    }

    // ── 2) Session lookup ───────────────────────────────────────────
    println!("[get_resource] looking up session…");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[get_resource] session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[get_resource] REJECT: no session for that token");
            return (StatusCode::UNAUTHORIZED, "FAIL:Invalid session").into_response();
        }
    };

    // ── 3) Expiry ───────────────────────────────────────────────────
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[get_resource] PARSE ERROR: {}", e);
            return (StatusCode::UNAUTHORIZED, "FAIL:Invalid session format").into_response();
        }
    };
    println!("[get_resource] now = {}, ends_at = {}", now, ends_at);
    if now >= ends_at {
        println!("[get_resource] REJECT: session expired");
        return (StatusCode::UNAUTHORIZED, "FAIL:Session expired").into_response();
    }

    // ── 4) Open file ────────────────────────────────────────────────
    let path = PathBuf::from(UPLOAD_DIR).join(&name);
    println!("[get_resource] resolving file path = {:?}", path);
    println!("[get_resource] path exists = {}", path.exists());

    let mut file = match File::open(&path).await {
        Ok(f) => {
            println!("[get_resource] file opened OK");
            f
        }
        Err(e) => {
            println!("[get_resource] REJECT: cannot open file: {}", e);
            return (StatusCode::NOT_FOUND, "FAIL:Resource not found").into_response();
        }
    };

    // ── 5) Read ─────────────────────────────────────────────────────
    let mut bytes = Vec::new();
    match file.read_to_end(&mut bytes).await {
        Ok(n) => println!("[get_resource] read {} bytes", n),
        Err(e) => {
            println!("[get_resource] READ ERROR: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, "FAIL:Read error").into_response();
        }
    }

    if bytes.is_empty() {
        println!("[get_resource] WARN: file is empty on disk");
    }

    // ── 6) Content-Type ─────────────────────────────────────────────
    let mime = mime_guess::from_path(&path)
        .first_or_octet_stream()
        .to_string();
    println!("[get_resource] mime = {:?}", mime);

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, mime.parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("inline; filename=\"{}\"", name).parse().unwrap(),
    );

    println!("[get_resource] SUCCESS: returning {} bytes", bytes.len());
    (StatusCode::OK, headers, bytes).into_response()
}