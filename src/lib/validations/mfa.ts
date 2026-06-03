import { z } from "zod";

// ── MFA Setup Verification ───────────────────────────────────────────────────

export const mfaSetupVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

// ── MFA Login ─────────────────────────────────────────────────────────────────

export const mfaLoginSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  code: z
    .string()
    .trim()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

// ── MFA Disable ───────────────────────────────────────────────────────────────

export const mfaDisableSchema = z
  .object({
    password: z.string().min(1, "Password is required").max(128),
    code: z
      .string()
      .trim()
      .length(6, "Code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Code must contain only digits")
      .optional(),
    backupCode: z
      .string()
      .trim()
      .min(8, "Backup code must be at least 8 characters")
      .max(20, "Backup code too long")
      .regex(/^[a-zA-Z0-9\-]+$/, "Invalid backup code format")
      .optional(),
  })
  .refine((data) => data.code || data.backupCode, {
    message: "Either a TOTP code or a backup code is required",
    path: ["code"],
  });

// ── Backup Code Verification ──────────────────────────────────────────────────

export const mfaBackupCodeSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  backupCode: z
    .string()
    .trim()
    .min(8, "Backup code must be at least 8 characters")
    .max(20, "Backup code too long")
    .regex(/^[a-zA-Z0-9\-]+$/, "Invalid backup code format"),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type MFASetupVerifyInput = z.infer<typeof mfaSetupVerifySchema>;
export type MFALoginInput = z.infer<typeof mfaLoginSchema>;
export type MFADisableInput = z.infer<typeof mfaDisableSchema>;
export type MFABackupCodeInput = z.infer<typeof mfaBackupCodeSchema>;
