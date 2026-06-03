"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { encrypt, decrypt } from "@/lib/encryption";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import {
  generateSecret,
  generateTOTPUri,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/mfa/totp";
import { compare } from "bcryptjs";

// ── SystemConfig key helpers ──────────────────────────────────────────────────
// MFA secrets & backup codes are stored in SystemConfig with per-user keys.
// Secrets are encrypted with AES-256-GCM, backup codes are SHA-256 hashed.

function secretKey(userId: string) { return `mfa_secret_${userId}`; }
function enabledKey(userId: string) { return `mfa_enabled_${userId}`; }
function backupKey(userId: string) { return `mfa_backup_${userId}`; }
function pendingKey(userId: string) { return `mfa_pending_${userId}`; }

async function setConfig(key: string, value: string) {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, category: "mfa" },
  });
}

async function getConfig(key: string): Promise<string | null> {
  const cfg = await prisma.systemConfig.findUnique({ where: { key } });
  return cfg?.value ?? null;
}

async function deleteConfig(key: string) {
  await prisma.systemConfig.delete({ where: { key } }).catch(() => {});
}

// ── Setup MFA ─────────────────────────────────────────────────────────────────

async function _setupMFA() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;
  const email = session.user?.email as string;

  // Check if already enabled
  const enabled = await getConfig(enabledKey(userId));
  if (enabled === "true") throw new Error("MFA is already enabled");

  // Generate secret & backup codes
  const secret = generateSecret();
  const uri = generateTOTPUri(secret, email, "E-Commerce");
  const backupCodes = generateBackupCodes(8);

  // Store pending secret (encrypted) — not yet verified
  await setConfig(pendingKey(userId), encrypt(secret));

  logger.info({ userId }, "[MFA] Setup initiated");

  return {
    secret,
    uri,
    backupCodes,
  };
}

// ── Verify MFA Setup ────────────────────────────────────────────────────────

async function _verifyMFASetup(code: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  // Get pending secret
  const encryptedPending = await getConfig(pendingKey(userId));
  if (!encryptedPending) throw new Error("No pending MFA setup. Call setupMFA first.");

  const secret = decrypt(encryptedPending);

  // Verify code
  if (!verifyTOTP(secret, code)) {
    throw new Error("Invalid verification code. Please try again.");
  }

  // Get backup codes from setupMFA — they should be passed from client
  // We generate fresh ones and store them
  const backupCodes = generateBackupCodes(8);
  const hashedCodes = backupCodes.map((c) => hashBackupCode(c));

  // Save encrypted secret and hashed backup codes
  await setConfig(secretKey(userId), encrypt(secret));
  await setConfig(enabledKey(userId), "true");
  await setConfig(backupKey(userId), JSON.stringify(hashedCodes));
  await deleteConfig(pendingKey(userId));

  logger.info({ userId }, "[MFA] Setup verified and enabled");

  return { success: true, backupCodes };
}

// ── Verify MFA Login ────────────────────────────────────────────────────────

async function _verifyMFALogin(userId: string, code: string) {
  const enabled = await getConfig(enabledKey(userId));
  if (enabled !== "true") throw new Error("MFA is not enabled for this user");

  const encryptedSecret = await getConfig(secretKey(userId));
  if (!encryptedSecret) throw new Error("MFA secret not found");

  const secret = decrypt(encryptedSecret);

  if (!verifyTOTP(secret, code)) {
    logger.warn({ userId }, "[MFA] Invalid login code");
    throw new Error("Invalid verification code");
  }

  logger.info({ userId }, "[MFA] Login verified");
  return { success: true };
}

// ── Disable MFA ─────────────────────────────────────────────────────────────

async function _disableMFA(password: string, code?: string, backupCode?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  // Verify password
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const validPassword = await compare(password, user.password);
  if (!validPassword) throw new Error("Invalid password");

  // Verify TOTP code or backup code
  const encryptedSecret = await getConfig(secretKey(userId));
  if (!encryptedSecret) throw new Error("MFA is not enabled");

  const secret = decrypt(encryptedSecret);
  let verified = false;

  if (code && verifyTOTP(secret, code)) {
    verified = true;
  }

  if (!verified && backupCode) {
    const hashedInput = hashBackupCode(backupCode);
    const storedCodesRaw = await getConfig(backupKey(userId));
    if (storedCodesRaw) {
      const storedCodes: string[] = JSON.parse(storedCodesRaw);
      const idx = storedCodes.indexOf(hashedInput);
      if (idx !== -1) {
        verified = true;
        // Remove used backup code
        storedCodes.splice(idx, 1);
        await setConfig(backupKey(userId), JSON.stringify(storedCodes));
      }
    }
  }

  if (!verified) throw new Error("Invalid code or backup code");

  // Remove MFA data
  await deleteConfig(secretKey(userId));
  await deleteConfig(enabledKey(userId));
  await deleteConfig(backupKey(userId));
  await deleteConfig(pendingKey(userId));

  logger.info({ userId }, "[MFA] Disabled");
  return { success: true };
}

// ── Use Backup Code ─────────────────────────────────────────────────────────

async function _useBackupCode(userId: string, code: string) {
  const enabled = await getConfig(enabledKey(userId));
  if (enabled !== "true") throw new Error("MFA is not enabled for this user");

  const hashedInput = hashBackupCode(code);
  const storedCodesRaw = await getConfig(backupKey(userId));
  if (!storedCodesRaw) throw new Error("No backup codes found");

  const storedCodes: string[] = JSON.parse(storedCodesRaw);
  const idx = storedCodes.indexOf(hashedInput);
  if (idx === -1) {
    logger.warn({ userId }, "[MFA] Invalid backup code used");
    throw new Error("Invalid backup code");
  }

  // Remove used backup code (one-time use)
  storedCodes.splice(idx, 1);
  await setConfig(backupKey(userId), JSON.stringify(storedCodes));

  logger.info({ userId, remaining: storedCodes.length }, "[MFA] Backup code used");
  return { success: true, remainingCodes: storedCodes.length };
}

// ── Check MFA Status ────────────────────────────────────────────────────────

async function _getMFAStatus() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const enabled = await getConfig(enabledKey(userId));
  const backupCodesRaw = await getConfig(backupKey(userId));
  const backupCodesCount = backupCodesRaw ? JSON.parse(backupCodesRaw).length : 0;

  return {
    enabled: enabled === "true",
    backupCodesRemaining: backupCodesCount,
  };
}

// ── Get Backup Codes (reveal) ──────────────────────────────────────────────

async function _getBackupCodes(password: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  // Verify password before revealing
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const validPassword = await compare(password, user.password);
  if (!validPassword) throw new Error("Invalid password");

  const backupCodesRaw = await getConfig(backupKey(userId));
  if (!backupCodesRaw) return { count: 0 };

  const storedCodes: string[] = JSON.parse(backupCodesRaw);
  // We can't reveal original codes (they're hashed), so just return count
  return { count: storedCodes.length };
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const setupMFA = withErrorHandling(_setupMFA);
export const verifyMFASetup = withErrorHandling(_verifyMFASetup);
export const verifyMFALogin = withErrorHandling(_verifyMFALogin);
export const disableMFA = withErrorHandling(_disableMFA);
export const useBackupCode = withErrorHandling(_useBackupCode);
export const getMFAStatus = withErrorHandling(_getMFAStatus);
export const getBackupCodes = withErrorHandling(_getBackupCodes);
