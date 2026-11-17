// src/components/sessionstore.rs

use std::sync::{OnceLock, RwLock};
use crate::identity::identities::Session;

static SESSIONS: OnceLock<RwLock<Vec<Session>>> = OnceLock::new();

fn store() -> &'static RwLock<Vec<Session>> {
    SESSIONS.get_or_init(|| RwLock::new(Vec::new()))
}

/// Look up a session by token. Returns a clone so the caller never holds
/// the lock guard across an `.await`. Does NOT filter expired sessions —
/// callers that need liveness should use `get_live_by_token`.
pub fn get_by_token(token: &str) -> Option<Session> {
    let guard = store().read().expect("sessionstore poisoned");
    guard.iter().find(|s| s.token == token).cloned()
}

/// Look up a session by token, returning `None` if it has expired.
/// Expiry is a lexicographic compare, which is correct for RFC3339 UTC.
pub fn get_live_by_token(token: &str, now_rfc3339: &str) -> Option<Session> {
    let guard = store().read().expect("sessionstore poisoned");
    guard
        .iter()
        .find(|s| s.token == token && s.ends_at.as_str() > now_rfc3339)
        .cloned()
}

/// Look up a session by its `id` (used by attempt-context paths where
/// `session.id == attempt.id`).
pub fn get_by_id(id: &str) -> Option<Session> {
    let guard = store().read().expect("sessionstore poisoned");
    guard.iter().find(|s| s.id == id).cloned()
}

/// Insert a session. If a session with the same token already exists it is
/// replaced — this keeps the "one token = one session" invariant that the
/// Mongo `find_one` by token relied on.
pub fn insert(session: Session) {
    let mut guard = store().write().expect("sessionstore poisoned");
    if let Some(existing) = guard.iter_mut().find(|s| s.token == session.token) {
        *existing = session;
    } else {
        guard.push(session);
    }
}

/// Mutate the session with the given token in place. Returns `true` if a
/// session matched, `false` otherwise (mirrors `matched_count > 0`).
pub fn update_by_token(token: &str, f: impl FnOnce(&mut Session)) -> bool {
    let mut guard = store().write().expect("sessionstore poisoned");
    match guard.iter_mut().find(|s| s.token == token) {
        Some(s) => {
            f(s);
            true
        }
        None => false,
    }
}

/// Delete the session with the given token. Returns `true` if one was
/// removed (mirrors `deleted_count > 0`).
pub fn delete_by_token(token: &str) -> bool {
    let mut guard = store().write().expect("sessionstore poisoned");
    let before = guard.len();
    guard.retain(|s| s.token != token);
    guard.len() != before
}

/// Remove every session whose `ends_at` is strictly before `now_rfc3339`.
/// Returns the number removed (mirrors `deleted_count`).
pub fn purge_expired(now_rfc3339: &str) -> usize {
    let mut guard = store().write().expect("sessionstore poisoned");
    let before = guard.len();
    guard.retain(|s| s.ends_at.as_str() >= now_rfc3339);
    before - guard.len()
}

/// Current number of sessions (debug / diagnostics).
pub fn len() -> usize {
    store().read().expect("sessionstore poisoned").len()
}

/// Drop every session. Test helper and useful for shutdown.
pub fn clear() {
    store()
        .write()
        .expect("sessionstore poisoned")
        .clear();
}



// src/components/sessions.rs — add this

/// Remove every session whose `user` is in `users`. Returns the number
/// removed. Used by `stop_site` to invalidate all of a teacher's
/// students' login sessions at once.
pub fn delete_by_users(users: &[String]) -> usize {
    if users.is_empty() {
        return 0;
    }
    let mut guard = store().write().expect("sessions poisoned");
    let before = guard.len();
    guard.retain(|s| !users.iter().any(|u| u == &s.user));
    before - guard.len()
}


 
/// Upsert a session by `id` (not token). Used for the "SITE" row where
/// there is exactly one per teacher.
pub fn upsert_by_id(session: Session) {
    let mut guard = store().write().expect("sessions poisoned");
    if let Some(existing) = guard.iter_mut().find(|s| s.id == session.id) {
        *existing = session;
    } else {
        guard.push(session);
    }
}

/// Delete by `id`. Returns true if something was removed.
pub fn delete_by_id(id: &str) -> bool {
    let mut guard = store().write().expect("sessions poisoned");
    let before = guard.len();
    guard.retain(|s| s.id != id);
    guard.len() != before
}


// src/components/sessions.rs — append

/// Returns true if any SITE row exists with token == "ON".
/// Single-teacher deployment: this is the whole liveness check.
pub fn any_site_on() -> bool {
    let guard = store().read().expect("sessions poisoned");
    guard
        .iter()
        .any(|s| s.user == "SITE" && s.token == "ON")
}


/// Remove every session whose `user` matches. Returns the number removed.
/// Used by `start_group_session` to enforce one active session per group.
pub fn delete_by_user(user: &str) -> usize {
    let mut guard = store().write().expect("sessions poisoned");
    let before = guard.len();
    guard.retain(|s| s.user != user);
    before - guard.len()
}