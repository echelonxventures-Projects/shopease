"use server";

import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { signIn } from "next-auth/react";

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
