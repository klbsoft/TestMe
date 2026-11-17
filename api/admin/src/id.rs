use argon2::password_hash::rand_core::{OsRng, RngCore};

/// 64-char hex id (32 random bytes).
pub fn random_id_32() -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}