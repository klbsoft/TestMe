// src/actions/heartbeat.rs
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query,
    },
    response::IntoResponse,
};
use serde::Deserialize;
use std::time::Instant;
use tokio::time::{interval, Duration};

use crate::components::sessions;
use crate::identity::identities::Session;

// ─────────────────────────────────────────────────────────────────────
// Tunables — tweak here
// ─────────────────────────────────────────────────────────────────────

/// How often the server sends a Ping frame.
const HEARTBEAT_PING_INTERVAL_SECS: u64 = 10;

/// How long the server tolerates silence from the client before
/// considering the socket dead and closing it. Must be greater than
/// the client's pong latency. Also acts as the "no pong received" cap
/// even if the TCP socket is still technically open.
const HEARTBEAT_TIMEOUT_SECS: u64 = 10;

// ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct HeartbeatQuery {
    pub token: String,
}

/// GET /heartbeat?token=...
pub async fn get_heartbeat(
    ws: WebSocketUpgrade,
    Query(q): Query<HeartbeatQuery>,
) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[HEARTBEAT] ── INCOMING UPGRADE ───────────────────────────");
    println!("[HEARTBEAT] token = {:?}", mask(&q.token));
    ws.on_upgrade(move |socket| handle(socket, q.token))
}

async fn handle(mut socket: WebSocket, token: String) {
    let connected_at = Instant::now();
    println!("[HEARTBEAT] STEP 1 ── socket accepted, looking up session");
    println!("[HEARTBEAT] STEP 1   token = {:?}", mask(&token));

    let session: Session = match sessions::get_by_token(&token) {
        Some(s) => {
            println!(
                "[HEARTBEAT] STEP 1 ✅ session found (id = {:?}, user = {:?})",
                s.id, s.user
            );
            s
        }
        None => {
            println!("[HEARTBEAT] STEP 1 ❌ no session for that token");
            let _ = socket
                .send(Message::Text("FAIL:Invalid session".into()))
                .await;
            let _ = socket.close().await;
            return;
        }
    };

    println!("[HEARTBEAT] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[HEARTBEAT] STEP 2 ❌ parse error: {}", e);
            let _ = socket
                .send(Message::Text("FAIL:Invalid session format".into()))
                .await;
            let _ = socket.close().await;
            return;
        }
    };
    println!("[HEARTBEAT] STEP 2   now = {}, ends_at = {}", now, ends_at);
    if now >= ends_at {
        println!("[HEARTBEAT] STEP 2 ❌ expired");
        let _ = socket
            .send(Message::Text("FAIL:Session expired".into()))
            .await;
        let _ = socket.close().await;
        return;
    }
    println!("[HEARTBEAT] STEP 2 ✅ session not expired");

    println!(
        "[HEARTBEAT] STEP 3 ✅ connected (user = {:?}, expires = {})",
        session.user, session.ends_at
    );

    if let Err(e) = socket.send(Message::Text("OK:connected".into())).await {
        println!("[HEARTBEAT] STEP 3 ⚠ failed to send OK:connected: {}", e);
        return;
    }
    println!("[HEARTBEAT] STEP 3 ✅ sent OK:connected to client");

    println!(
        "[HEARTBEAT] STEP 4 ── entering keep-alive loop (ping every {} s, timeout {} s)",
        HEARTBEAT_PING_INTERVAL_SECS, HEARTBEAT_TIMEOUT_SECS
    );

    let mut tick = interval(Duration::from_secs(HEARTBEAT_PING_INTERVAL_SECS));
    let mut tick_count: u64 = 0;

    // last time we received *any* frame from the client
    let mut last_seen = Instant::now();
    // last time we sent a ping that hasn't been pong'd
    let mut last_ping_sent: Option<Instant> = None;

    // The token we were opened with. Used to re-check the session each tick.
    // Note: if the session is rotated server-side (refresh_session), the
    // old token no longer matches anything in the store — so the next tick
    // will see None and hang up. That is the intended behavior for now:
    // this socket is bound to the token it was opened with.
    let bound_token = token.clone();

    loop {
        tokio::select! {
            _ = tick.tick() => {
                tick_count += 1;

                // ── session liveness check ──────────────────────────────
                // If the session has been deleted or rotated away, this
                // socket is no longer authorized. Tell the client to log
                // out and hang up.
                match sessions::get_by_token(&bound_token) {
                    Some(current) => {
                        // Session still exists. Also verify it hasn't
                        // expired since we last looked.
                        let expired = chrono::DateTime::parse_from_rfc3339(&current.ends_at)
                            .map(|dt| chrono::Utc::now() >= dt.with_timezone(&chrono::Utc))
                            .unwrap_or(true); // parse failure ⇒ treat as expired
                        if expired {
                            println!(
                                "[HEARTBEAT] STEP 4 ❌ session expired mid-stream — sending LOGOUT"
                            );
                            let _ = socket.send(Message::Text("LOGOUT".into())).await;
                            let _ = socket.close().await;
                            break;
                        }
                    }
                    None => {
                        println!(
                            "[HEARTBEAT] STEP 4 ❌ session gone from store — sending LOGOUT"
                        );
                        let _ = socket.send(Message::Text("LOGOUT".into())).await;
                        let _ = socket.close().await;
                        break;
                    }
                }
                // ───────────────────────────────────────────────────────

                println!(
                    "[HEARTBEAT] STEP 4   tick #{} — sending ping (last client frame {} s ago)",
                    tick_count,
                    last_seen.elapsed().as_secs()
                );
                if let Err(e) = socket.send(Message::Ping(Vec::new())).await {
                    println!("[HEARTBEAT] STEP 4 ❌ ping failed (client gone): {}", e);
                    break;
                }
                last_ping_sent = Some(Instant::now());
                println!("[HEARTBEAT] STEP 4   tick #{} ✅ ping sent", tick_count);

                // timeout check: if we sent a ping and never heard back
                // within HEARTBEAT_TIMEOUT_SECS, the connection is dead
                // even if the TCP layer hasn't noticed yet.
                if let Some(sent_at) = last_ping_sent {
                    if sent_at.elapsed().as_secs() >= HEARTBEAT_TIMEOUT_SECS {
                        println!(
                            "[HEARTBEAT] STEP 4 ❌ no pong for {} s (last client frame {} s ago) — closing",
                            sent_at.elapsed().as_secs(),
                            last_seen.elapsed().as_secs()
                        );
                        let _ = socket.send(Message::Close(None)).await;
                        break;
                    }
                }
            }

            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(t))) => {
                        last_seen = Instant::now();
                        last_ping_sent = None; // any client frame clears the pending ping
                        println!(
                            "[HEARTBEAT] STEP 4   ← text frame (len = {}) = {:?} (last client frame reset)",
                            t.len(),
                            if t.len() > 64 { &t[..64] } else { &t }
                        );
                        if t == "ping" {
                            println!("[HEARTBEAT] STEP 4   ← client ping, replying pong");
                            if let Err(e) = socket.send(Message::Text("pong".into())).await {
                                println!("[HEARTBEAT] STEP 4 ❌ pong send failed: {}", e);
                                break;
                            }
                            println!("[HEARTBEAT] STEP 4   ✅ pong sent");
                        }
                    }
                    Some(Ok(Message::Binary(b))) => {
                        last_seen = Instant::now();
                        last_ping_sent = None;
                        println!(
                            "[HEARTBEAT] STEP 4   ← binary frame ({} bytes), ignoring",
                            b.len()
                        );
                    }
                    Some(Ok(Message::Pong(p))) => {
                        last_seen = Instant::now();
                        last_ping_sent = None;
                        println!(
                            "[HEARTBEAT] STEP 4   ← pong ({} bytes) — connection alive (ping→pong {} s)",
                            p.len(),
                            last_ping_sent.map(|t| t.elapsed().as_secs()).unwrap_or(0)
                        );
                    }
                    Some(Ok(Message::Ping(p))) => {
                        last_seen = Instant::now();
                        last_ping_sent = None;
                        println!(
                            "[HEARTBEAT] STEP 4   ← ping from client ({} bytes) — axum auto-replies",
                            p.len()
                        );
                    }
                    Some(Ok(Message::Close(frame))) => {
                        let lifetime = connected_at.elapsed().as_secs();
                        match frame {
                            Some(f) => println!(
                                "[HEARTBEAT] STEP 4   ← close frame (code = {}, reason = {:?}) — socket lived {} s",
                                f.code, f.reason, lifetime
                            ),
                            None => println!(
                                "[HEARTBEAT] STEP 4   ← close frame (no body) — socket lived {} s",
                                lifetime
                            ),
                        }
                        break;
                    }
                    None => {
                        println!(
                            "[HEARTBEAT] STEP 4   ← stream ended (None) — socket lived {} s",
                            connected_at.elapsed().as_secs()
                        );
                        break;
                    }
                    Some(Err(e)) => {
                        println!(
                            "[HEARTBEAT] STEP 4 ❌ ws error: {} — socket lived {} s",
                            e,
                            connected_at.elapsed().as_secs()
                        );
                        break;
                    }
                }
            }
        }
    }

    println!(
        "[HEARTBEAT] STEP 5 ── loop exited after {} tick(s), total lifetime {} s (user = {:?})",
        tick_count,
        connected_at.elapsed().as_secs(),
        session.user
    );
    println!("════════════════════════════════════════════════════════════");
}

fn mask(token: &str) -> String {
    if token.len() <= 8 {
        return "*".repeat(token.len());
    }
    format!("{}…{}", &token[..4], &token[token.len() - 4..])
}