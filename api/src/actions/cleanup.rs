// src/actions/cleanup.rs

use crate::components::sessions;


/// Delete every session whose `ends_at` is in the past.
/// One pass over the in-memory store — no per-document round trip.
pub async fn purge_expired_sessions() {
    let now = chrono::Utc::now().to_rfc3339();

    let purged = sessions::purge_expired(&now);

    if purged > 0 {
        println!("[cleanup] purged {} expired session(s)", purged);
    }
}

/// Spawn a background task that purges expired sessions every 30 minutes.
/// Call once at startup, right after `init_db().await`.
pub fn spawn_session_cleanup() {
    tokio::spawn(async {
        // run once immediately so a fresh boot also cleans up
        purge_expired_sessions().await;

        let mut interval =
        tokio::time::interval(std::time::Duration::from_secs(30 * 60));
        interval.tick().await; // consume the immediate first tick

        loop {
            interval.tick().await;
            purge_expired_sessions().await;
        }
    });
}