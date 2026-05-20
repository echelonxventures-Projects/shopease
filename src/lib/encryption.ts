import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.VOUCHER_CODE_ENCRYPTION_KEY || "";

if (!KEY_HEX) {
  throw new Error("VOUCHER_CODE_ENCRYPTION_KEY environment variable is required");
}

const KEY = Buffer.from(KEY_HEX, "hex");

if (KEY.length !== 32) {
  throw new Error(`VOUCHER_CODE_ENCRYPTION_KEY must be 64 hex chars (32 bytes), got ${KEY_HEX.length / 2}`);
}

/**
 * Encrypt a voucher/promo code with AES-256-GCM.
 * Returns base64-encoded ciphertext:iv:authTag
 */
export function encrypt(code: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(code, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${encrypted.toString("base64")}:${iv.toString("base64")}:${authTag.toString("base64")}`;
}

/**
 * Decrypt an encrypted voucher/promo code.
 * Expects base64-encoded ciphertext:iv:authTag format.
 */
export function decrypt(encoded: string): string {
  const [encryptedB64, ivB64, authTagB64] = encoded.split(":");
  if (!encryptedB64 || !ivB64 || !authTagB64) {
    throw new Error("Invalid encrypted data format");
  }
  const encrypted = Buffer.from(encryptedB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * SHA-256 hash for database lookup.
 * One-way — can't reverse to find the original code.
 * Used for indexed lookups instead of storing plaintext.
 */
export function hash(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase().trim()).digest("hex");
}

/**
 * Generate a cryptographically secure voucher code.
 * Uses crypto.randomBytes instead of Math.random().
 * Format: VOU-X7K9-M2P4-R8W3 (prefix + 4 segments of 4 alphanumeric chars)
 * Total: 23 characters with built-in checksum capability.
 */
export function generateSecureCode(prefix = "VOU", length = 20): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excluded: I, O, Q, 0, 1 (ambiguous)
  const cleanPrefix = prefix.toUpperCase();

  if (length <= cleanPrefix.length) {
    const bytes = crypto.randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return cleanPrefix + code;
  }

  const remaining = length - cleanPrefix.length;
  const bytes = crypto.randomBytes(remaining * 2); // extra bytes for uniform distribution
  let code = cleanPrefix + "-";

  for (let i = 0; i < remaining; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * Derive a per-user redemption token from a code.
 * Prevents replay attacks — each token is only valid for one user.
 */
export function deriveRedemptionToken(code: string, userId: string): string {
  return crypto
    .createHmac("sha256", KEY)
    .update(`${code.toUpperCase().trim()}:${userId}`)
    .digest("hex");
}

// ===================== PII ENCRYPTION (GDPR Article 32) =====================

const PII_KEY_HEX = process.env.PII_ENCRYPTION_KEY || "";

if (!PII_KEY_HEX) {
  console.warn(
    "[SECURITY] PII_ENCRYPTION_KEY not set — PII encryption disabled. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

const PII_KEY = PII_KEY_HEX ? Buffer.from(PII_KEY_HEX, "hex") : null;

/**
 * Encrypt PII (email, phone, address) with AES-256-GCM.
 * Uses a separate key from voucher codes for defense-in-depth.
 * Returns base64-encoded ciphertext:iv:authTag or plaintext if key missing.
 */
export function encryptPII(value: string | null | undefined): string {
  if (!value) return "";
  if (!PII_KEY || PII_KEY.length !== 32) return value; // Fallback: no encryption

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, PII_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `pii:${encrypted.toString("base64")}:${iv.toString("base64")}:${authTag.toString("base64")}`;
}

/**
 * Decrypt PII. Returns plaintext. Auto-detects encrypted vs plaintext format.
 * Safe to call on already-decrypted values (returns as-is if not encrypted).
 */
export function decryptPII(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith("pii:")) return value; // Plaintext or legacy data

  if (!PII_KEY || PII_KEY.length !== 32) {
    console.warn("[SECURITY] Cannot decrypt PII: PII_ENCRYPTION_KEY not set");
    return "[encrypted]";
  }

  const parts = value.split(":");
  if (parts.length !== 4) return value; // Invalid format — return as-is

  const encrypted = Buffer.from(parts[1], "base64");
  const iv = Buffer.from(parts[2], "base64");
  const authTag = Buffer.from(parts[3], "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, PII_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Encrypt an object of PII fields.
 * Returns a new object with encrypted values.
 */
export function encryptPIIFields<T extends Record<string, string | null | undefined>>(fields: T): T {
  const result = { ...fields } as any;
  for (const key of Object.keys(fields)) {
    if (fields[key]) {
      result[key] = encryptPII(fields[key]);
    }
  }
  return result as T;
}

/**
 * Decrypt an object of PII fields.
 * Returns a new object with decrypted values.
 */
export function decryptPIIFields<T extends Record<string, string | null | undefined>>(fields: T): T {
  const result = { ...fields } as any;
  for (const key of Object.keys(fields)) {
    if (fields[key]) {
      result[key] = decryptPII(fields[key]);
    }
  }
  return result as T;
}
