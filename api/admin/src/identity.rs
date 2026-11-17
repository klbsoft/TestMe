use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Teacher {
    pub id: String,
    pub name: String,
    pub password_hash: String,
    pub salt: String,
    pub created_at: String,
    pub updated_at: String,
}