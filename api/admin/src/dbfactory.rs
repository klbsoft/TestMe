use mongodb::{Client, Collection, Database as MongoDatabase};
// use mongodb::bson::doc;

use crate::identity::Teacher;
use std::sync::OnceLock;

static DB: OnceLock<Mongo> = OnceLock::new();

#[derive(Debug, Clone)]
pub struct Mongo {
    db: MongoDatabase,
}

impl Mongo {
    pub async fn open() -> Self {
        let client = Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to connect");
        let db = client.database("testme");
        Mongo { db }
    }

    pub fn teachers(&self) -> Collection<Teacher> {
        self.db.collection("teachers")
    }
}

pub async fn init_db() {
    let database = Mongo::open().await;
    DB.set(database).expect("Already initialized");
}

pub fn db() -> &'static Mongo {
    DB.get().expect("Database not initialized")
}