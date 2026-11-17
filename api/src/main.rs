mod identity;
mod components;
mod tester; 
mod actions;
mod config;
mod utils;

// use config::{load_config};
 

// use std::fmt;
// use chrono::{DateTime, NaiveDateTime, Utc};
// use rusqlite::{Connection, Result};
// use serde::{Deserialize, Serialize};
use axum::{
    Router, extract::DefaultBodyLimit, routing::{get, post}
 
};
use tower_http::cors::{Any, CorsLayer};
 
use crate::{
    actions::{check_session, check_site, complete_attempt, get_assigment_info, get_attempts, get_group_passwords, get_groups, get_heartbeat, get_resource, get_single_assigment, grade_attempt, login, loginAdmin, refresh_session, rotate_passwords, spawn_session_cleanup, start_attempt, start_group_session, start_site, stop_site, update_assigment, update_groups, upload_file}, components::dbfactory::{Mongo, db, init_db, list_users}, tester::endpoint::{test_db, test_end_point}}; 
// use crate::actions::{login};


const MAX_UPLOAD: usize = 1024 * 1024 * 1024 * 2; // 2 GB

 
#[tokio::main]
async fn main() {
    // let config = load_config();
    init_db().await; 
    spawn_session_cleanup(); 
    // list_users().await;
    let PORT = 8245; 
    let URL = format!("0.0.0.0:{}",PORT);
     
    
    // let db_path = &config.db_path;
    // let db_scheme = &config.db_scheme;
    
    // println!("Database path: {}", db_path);
    // println!("Database scheme: {}", db_scheme);
    let app = Router::new()
        // .route("/test_db", get(test_db)) // Removed extra ()
        .route("/", get(test_end_point))
        .route("/test",get(test_end_point))
         //.route("/login", post())
    
        // .route("/session",post(get_user_session))
        // .route("/sync",post(update_user_session))
        // .route("/apm",post(add_payment_method))
        // .route("/upload", post(upload))
    
        // .route("/signup", post(signup))
        //refresh_sessions
        // .route("/groups", post(get_groups))
        .route("/site/check",get(check_site))

        .route("/site/stop",post(stop_site))

        .route("/site/start",post(start_site))

        .route("/heartbeat",get(get_heartbeat))
        
        .route("/assigment/attempt/grade",post(grade_attempt))
        
        .route("/assigment/attempts", post(get_attempts))

        .route("/assigment/attempt/completed", post(complete_attempt))

        .route("/assigment/attempt", post(start_attempt))

        .route("/assigment/student/info", post(get_assigment_info))

        .route("/assigment/teacher/info", post(get_single_assigment))

        .route("/assigment/update", post(update_assigment))

        .route("/resource/:name", post(get_resource))

        .route("/upload", post(upload_file))
        
        .route("/groups/session/start", post(start_group_session))

        .route("/groups/rotate/passwords", post(rotate_passwords))

        .route("/groups/passwords", post(get_group_passwords))

        .route("/groups", post(get_groups))
       
        .route("/groups/update", post(update_groups))

        .route("/session/refresh", post(refresh_session))

        .route("/session/check", post(check_session))

        .route("/logina", post(loginAdmin))

        .route("/login", post(login))   
        .layer(DefaultBodyLimit::max(MAX_UPLOAD)); // ← required

    

    
    println!("Server running on http://{}", URL);  
    
    let listener = tokio::net::TcpListener::bind(URL).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}