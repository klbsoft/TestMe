use sha2::{Digest, Sha512};
use aes_gcm::aead::OsRng;
use argon2::{password_hash::SaltString, Argon2};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use anyhow::{anyhow, Result};
use rand::RngCore;

pub fn deterministic_hash_512(input: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn non_deterministic_hash(data: &str) -> Result<(String, String)> {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);

    let argon2 = Argon2::default();
    let salt_string = SaltString::encode_b64(&salt)
        .map_err(|_| anyhow!("Failed to encode salt"))?;

    let mut output = [0u8; 32];
    argon2.hash_password_into(
        data.as_bytes(),
        salt_string.as_str().as_bytes(),
        &mut output
    ).map_err(|_| anyhow!("Hashing failed"))?;

    let mut result = salt.to_vec();
    result.extend(output);

    Ok((STANDARD.encode(result), salt_string.as_str().to_string()))
}