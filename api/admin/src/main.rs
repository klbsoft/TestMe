mod hash;
mod id;
mod identity;
mod dbfactory;

use anyhow::{Context, Result};
use clap::Parser;
use std::io::{self, Write};

use mongodb::bson::doc;
use mongodb::options::UpdateOptions;

use dbfactory::{db, init_db};
use identity::Teacher;

#[derive(Parser, Debug)]
#[command(name = "teacher-cli", about = "Create a teacher account")]
struct Args {
    #[arg(short, long)]
    name: String,

    /// Stage-1 SHA-512 hex (128 chars) from the JS tool.
    #[arg(short = 'p', long = "password-hash", conflicts_with = "raw_password")]
    password_hash: Option<String>,

    /// Raw password; stage 1 runs here.
    #[arg(long = "raw-password")]
    raw_password: Option<String>,

    #[arg(long)]
    dry_run: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // ── STAGE 1 (deterministic) ─────────────────────────────────────────
    let prehash_hex = match (args.password_hash, args.raw_password) {
        (Some(h), None) => {
            let h = h.trim().to_lowercase();
            if h.len() != 128 || !h.chars().all(|c| c.is_ascii_hexdigit()) {
                anyhow::bail!("password-hash must be 128 hex chars (SHA-512)");
            }
            h
        }
        (None, Some(raw)) => hash::deterministic_hash_512(&raw),
        (None, None) => {
            print!("Password (visible): ");
            io::stdout().flush()?;
            let mut buf = String::new();
            io::stdin().read_line(&mut buf)?;
            hash::deterministic_hash_512(buf.trim_end_matches(['\n', '\r']))
        }
        _ => unreachable!("clap conflicts_with"),
    };

    eprintln!("deterministic (SHA-512 hex): {}", prehash_hex);

    // ── STAGE 2 (non-deterministic) ─────────────────────────────────────
    let (password_hash, salt) =
        hash::non_deterministic_hash(&prehash_hex).context("non-deterministic re-hash")?;

    // ── Build Teacher ───────────────────────────────────────────────────
    let now = chrono::Utc::now().to_rfc3339();
    let teacher = Teacher {
        id: id::random_id_32(),
        name: args.name.clone(),
        password_hash,
        salt,
        created_at: now.clone(),
        updated_at: now,
    };

    if args.dry_run {
        let teacher_json = serde_json::to_value(&teacher)?;
        println!("{}", serde_json::to_string_pretty(&teacher_json)?);
        return Ok(());
    }

    // ── Initialize your factory ─────────────────────────────────────────
    init_db().await;

    // ── Upsert by name: create if missing, else rotate password + salt ──
    let result = db()
        .teachers()
        .update_one(
            doc! { "name": &teacher.name },
            doc! { "$set": {
                "password_hash": &teacher.password_hash,
                "salt":          &teacher.salt,
                "updated_at":    &teacher.updated_at,
            }, "$setOnInsert": {
                "id":         &teacher.id,
                "name":       &teacher.name,
                "created_at": &teacher.created_at,
            }},
        )
        .with_options(UpdateOptions::builder().upsert(true).build())
        .await
        .context("upsert teacher")?;

    if result.upserted_id.is_some() {
        eprintln!("created teacher '{}'", teacher.name);
    } else {
        eprintln!("updated password for existing teacher '{}'", teacher.name);
    }

    // Re-read so the printed JSON reflects what's actually stored
    let stored = db()
        .teachers()
        .find_one(doc! { "name": &teacher.name })
        .await
        .context("re-read teacher")?
        .context("teacher vanished after upsert")?;

    println!("{}", serde_json::to_string(&stored)?);
    Ok(())
}