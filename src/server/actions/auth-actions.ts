"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";
import { signIn } from "next-auth/react";
import { evaluateAdvancedFraud, type RequestContext } from "@/lib/fraud/advanced-detection";

export async function registerUser(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phone: formData.get("phone") as string,
  };

  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { error: "Validation failed", issues: result.error.issues };
  }

  // Consent validation — required
  const consentPrivacy = formData.get("consent_privacy_policy");
  const consentTerms = formData.get("consent_terms_of_service");
  if (consentPrivacy !== "on" || consentTerms !== "on") {
    return { error: "You must agree to the Privacy Policy and Terms of Service" };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  // Check phone uniqueness
  if (data.phone) {
    const phoneExists = await prisma.user.findFirst({ where: { phone: data.phone }, select: { id: true } });
    if (phoneExists) {
      return { error: "Phone number already registered" };
    }
  }

  // Advanced fraud detection on registration
  const deviceSignals = {
    userAgent: formData.get("_ua") as string || undefined,
    fingerprint: formData.get("_fp") as string || undefined,
    timezone: formData.get("_tz") as string || undefined,
    screenResolution: formData.get("_sr") as string || undefined,
    language: formData.get("_lang") as string || undefined,
  };
  const fraudContext: RequestContext = {
    ip: formData.get("_ip") as string || undefined,
    userAgent: deviceSignals.userAgent,
    device: deviceSignals,
  };

  // Use a temporary ID for pre-registration fraud check
  const tempId = `pre_reg_${data.email}`;
  const verdict = await evaluateAdvancedFraud(tempId, "REGISTER", fraudContext);
  if (verdict.action === "BLOCK") {
    return { error: "Registration blocked due to suspicious activity. Please try again later." };
  }
  if (verdict.requiresCaptcha) {
    const captchaToken = formData.get("_captcha") as string;
    if (!captchaToken) {
      return { error: "Please complete the captcha verification", requiresCaptcha: true, riskScore: verdict.score };
    }
  }

  const hashedPassword = await hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
    },
  });

  // Create consent records
  await prisma.consentRecord.createMany({
    data: [
      { userId: user.id, type: "PRIVACY_POLICY" },
      { userId: user.id, type: "TERMS_OF_SERVICE" },
    ],
  });

  // Optional: marketing consent
  if (formData.get("consent_marketing_emails") === "on") {
    await prisma.consentRecord.create({
      data: { userId: user.id, type: "MARKETING_EMAILS" },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
    },
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  try {
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (res?.error) {
      return { error: res.error };
    }

    return { success: true };
  } catch {
    return { error: "Login failed" };
  }
}
