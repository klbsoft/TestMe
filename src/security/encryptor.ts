// crypto.ts

/**
 * Encrypt a Blob with AES-256-GCM.
 * Returns a Blob containing: [salt(16) | iv(12) | ciphertext+tag]
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
    const enc = new TextEncoder();
    const data = new Uint8Array(await blob.arrayBuffer());

    // 16-byte random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // derive a 256-bit AES key from the password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    // 12-byte random IV (standard for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // encrypt
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
    );

    // pack: salt | iv | ciphertext
    const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
    packed.set(salt, 0);
    packed.set(iv, salt.length);
    packed.set(ciphertext, salt.length + iv.length);

    return new Blob([packed], { type: "application/octet-stream" });
}

/**
 * Decrypt a Blob produced by encryptBlob.
 * Returns the original Blob with the given mime type.
 */
export async function decryptBlob(
    encrypted: Blob,
    password: string,
    mimeType = "audio/mpeg"
): Promise<Blob> {
    const enc = new TextEncoder();
    const packed = new Uint8Array(await encrypted.arrayBuffer());

    // unpack: salt(16) | iv(12) | ciphertext
    const salt = packed.slice(0, 16);
    const iv = packed.slice(16, 28);
    const ciphertext = packed.slice(28);

    // re-derive the key with the same params
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    // decrypt (GCM verifies the auth tag automatically)
    const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );

    return new Blob([plaintext], { type: mimeType });
}