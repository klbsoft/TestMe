use sha2::{Digest, Sha512};

/// Stage 1: deterministic SHA-512, byte-identical to your JS tool.
pub fn deterministic_hash_512(input: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}


/// Stage 2: non-deterministic re-hash of the stage-1 hex.
/// MUST use the same algorithm + params as `CryptoService::non_deterministic_hash`.
/// Returns (hash_string, salt_string) — salt is also embedded in the hash by
/// Argon2, but we return it separately so it can be stored in `Teacher.salt`
/// exactly like `signup` stores `user.salt`.
pub fn non_deterministic_hash(prehash_hex: &str) -> anyhow::Result<(String, String)> {
    use argon2::{Argon2, PasswordHasher};
    use argon2::password_hash::SaltString;
    use rand::rngs::OsRng;

    let salt = SaltString::generate(&mut OsRng);
    let salt_string = salt.as_str().to_string();

    let hash = Argon2::default()
        .hash_password(prehash_hex.as_bytes(), &salt)?
        .to_string();

    Ok((hash, salt_string))
}