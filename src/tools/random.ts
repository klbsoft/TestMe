/**
 * Generate a random string of `length` characters from `A-Z`, `a-z`, `0-9`.
 * Uses `crypto.getRandomValues` (Web Crypto API) — cryptographically secure,
 * available in every browser and in Node 19+.
 *
 */
export function randomString(length: number): string {
  const CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out;
}