// ===================== TOTP IMPLEMENTATION (RFC 6238) =====================
// Pure Node.js crypto — no external dependencies.

import crypto from "crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const HMAC_ALGORITHM = "sha1";

// ── Base32 helpers ────────────────────────────────────────────────────────────

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue; // skip invalid
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a random base32-encoded secret.
 * @param length  Number of random bytes (default 20 → 32 base32 chars)
 */
export function generateSecret(length: number = 20): string {
  const buffer = crypto.randomBytes(length);
  return base32Encode(buffer);
}

/**
 * Generate an otpauth:// URI suitable for QR code rendering.
 */
export function generateTOTPUri(secret: string, email: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Verify a TOTP token against a secret with a configurable time window.
 * @param secret  Base32-encoded secret
 * @param token   6-digit token string
 * @param window  Number of periods to check before/after (default 1)
 */
export function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  if (!token || token.length !== TOTP_DIGITS) return false;

  const secretBuffer = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_PERIOD);

  for (let i = -window; i <= window; i++) {
    const expected = generateCode(secretBuffer, counter + i);
    if (timingSafeEqual(expected, token)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate cryptographically secure backup codes.
 * Format: XXXXX-XXXXX (10 alphanumeric chars, easy to type).
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(10);
    let code = "";
    for (let j = 0; j < 10; j++) {
      if (j === 5) code += "-";
      code += chars[bytes[j] % chars.length];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * SHA-256 hash a backup code for safe storage.
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.toUpperCase().replace(/[\s-]/g, ""))
    .digest("hex");
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function generateCode(secret: Buffer, counter: number): string {
  // 8-byte big-endian counter
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = crypto.createHmac(HMAC_ALGORITHM, secret);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  // Dynamic truncation per RFC 4226
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}
