import { describe, it, expect, beforeAll } from "vitest";
import {
  encrypt,
  decrypt,
  hash,
  generateSecureCode,
  encryptPII,
  decryptPII,
  encryptPIIFields,
  decryptPIIFields,
} from "@/lib/encryption";

describe("Encryption", () => {
  beforeAll(() => {
    // Ensure env vars are set for testing (set by vitest setup or .env.test)
    if (!process.env.VOUCHER_CODE_ENCRYPTION_KEY) {
      process.env.VOUCHER_CODE_ENCRYPTION_KEY =
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    }
    if (!process.env.PII_ENCRYPTION_KEY) {
      process.env.PII_ENCRYPTION_KEY =
        "1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b";
    }
  });

  describe("encrypt / decrypt roundtrip", () => {
    it("encrypts and decrypts a voucher code to the original value", () => {
      const code = "VOU-X7K9-M2P4-R8W3";
      const encrypted = encrypt(code);
      expect(encrypted).not.toBe(code);
      expect(encrypted.split(":").length).toBe(3);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(code);
    });

    it("produces different ciphertexts for the same input (random IV)", () => {
      const code = "SAME_CODE";
      const a = encrypt(code);
      const b = encrypt(code);
      expect(a).not.toBe(b);
      expect(decrypt(a)).toBe(code);
      expect(decrypt(b)).toBe(code);
    });

    it("handles empty strings", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("throws on malformed ciphertext", () => {
      expect(() => decrypt("not-valid-base64:also-bad")).toThrow();
    });
  });

  describe("hash", () => {
    it("is deterministic for the same input", () => {
      const h1 = hash("SAVE20");
      const h2 = hash("SAVE20");
      expect(h1).toBe(h2);
    });

    it("is case-insensitive", () => {
      expect(hash("save20")).toBe(hash("SAVE20"));
    });

    it("trims whitespace", () => {
      expect(hash("  SAVE20  ")).toBe(hash("SAVE20"));
    });

    it("returns a 64-char hex string (sha-256)", () => {
      const h = hash("TEST");
      expect(h).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different hashes for different inputs", () => {
      expect(hash("A")).not.toBe(hash("B"));
    });
  });

  describe("generateSecureCode", () => {
    it("generates a code with the default VOU prefix", () => {
      const code = generateSecureCode();
      expect(code.startsWith("VOU-")).toBe(true);
    });

    it("generates unique codes on each call", () => {
      const a = generateSecureCode();
      const b = generateSecureCode();
      expect(a).not.toBe(b);
    });

    it("uses only unambiguous characters", () => {
      const code = generateSecureCode();
      const forbidden = /[IOQ01]/;
      // Remove prefix and dashes before checking
      const body = code.replace(/^VOU-/, "").replace(/-/g, "");
      expect(forbidden.test(body)).toBe(false);
    });

    it("accepts a custom prefix", () => {
      const code = generateSecureCode("DIS");
      expect(code.startsWith("DIS-")).toBe(true);
    });
  });

  describe("encryptPII / decryptPII", () => {
    it("roundtrips PII values", () => {
      const email = "customer@example.com";
      const encrypted = encryptPII(email);
      expect(encrypted).not.toBe(email);
      expect(encrypted.startsWith("pii:")).toBe(true);
      expect(decryptPII(encrypted)).toBe(email);
    });

    it("returns empty string for null/undefined", () => {
      expect(encryptPII(null)).toBe("");
      expect(encryptPII(undefined)).toBe("");
      expect(decryptPII(null)).toBe("");
      expect(decryptPII(undefined)).toBe("");
    });

    it("returns plaintext values unchanged on decrypt", () => {
      expect(decryptPII("plain text")).toBe("plain text");
    });

    it("produces different ciphertexts each time (random IV)", () => {
      const a = encryptPII("same");
      const b = encryptPII("same");
      expect(a).not.toBe(b);
    });
  });

  describe("encryptPIIFields / decryptPIIFields", () => {
    it("roundtrips an object of PII fields", () => {
      const original = {
        email: "a@b.com",
        phone: "+919876543210",
        address: "123 Main St",
      };
      const encrypted = encryptPIIFields(original);
      expect(encrypted.email).not.toBe(original.email);
      expect(encrypted.phone).not.toBe(original.phone);
      expect(encrypted.address).not.toBe(original.address);

      const decrypted = decryptPIIFields(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("preserves null values", () => {
      const original = { email: "x@y.com", phone: null };
      const encrypted = encryptPIIFields(original);
      expect(encrypted.phone).toBeNull();
      const decrypted = decryptPIIFields(encrypted);
      expect(decrypted.email).toBe("x@y.com");
      expect(decrypted.phone).toBeNull();
    });
  });
});
