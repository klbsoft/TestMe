#!/usr/bin/env node
import { createHash } from 'node:crypto';

/**
 * Identical output to:
 *   crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
 */
function hash512(input) {
    const data = typeof input === 'string'
        ? Buffer.from(input, 'utf8')
        : Buffer.from(input);
    return createHash('sha512').update(data).digest(); // 64-byte Buffer
}

// CLI entry
const input = process.argv.slice(2).join(' ');
if (!input) {
    console.error('Usage: node hash.js <password>');
    process.exit(1);
}

console.log(hash512(input).toString('hex'));