"use server";

import { prisma } from "@/lib/prisma";

// ===================== SENSITIVE DATA =====================
// Use environment variables for provider credentials:
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// RESEND_API_KEY
// WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN

// ===================== SMS (Twilio) =====================

async function sendViaTwilio(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS - Twilio Disabled] To: ${phone}, Message: ${message}`);
    return { sent: false, reason: "Twilio not configured" };
  }

  try {
    // @ts-expect-error twilio is an optional runtime dependency
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });

    return { sent: true, channelId: result.sid, channel: "SMS" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SMS Twilio Error]", msg);
    return { sent: false, reason: msg };
  }
}

async function sendViaFast2SMS(phone: string, message: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`[SMS - Fast2SMS Disabled] To: ${phone}, Message: ${message}`);
    return { sent: false, reason: "Fast2SMS not configured" };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { "authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule_time: 0,
        variables_values: [message],
        route: "q",
        numbers: phone,
      }),
    });

    const data = await response.json();
    return { sent: data.status === "success", channel: "SMS", reason: data.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: msg };
  }
}

export async function sendSMS(phone: string, message: string) {
  // Try Twilio first, fall back to Fast2SMS
  const twilioResult = await sendViaTwilio(phone, message);
  if (twilioResult.sent) return twilioResult;
  return sendViaFast2SMS(phone, message);
}

// ===================== EMAIL (Resend) =====================

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL - Resend Disabled] To: ${to}, Subject: ${subject}`);
    return { sent: false, reason: "Resend not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ShopEase <noreply@shopease.in>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    return { sent: !!data.id, channel: "EMAIL", channelId: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: msg };
  }
}

async function sendViaSendGrid(to: string, subject: string, html: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { sent: false, reason: "SendGrid not configured" };

  try {
    // @ts-expect-error @sendgrid/mail is an optional runtime dependency
    const { default: sg } = await import("@sendgrid/mail");
    sg.setApiKey(apiKey);

    await sg.send({
      to,
      from: { email: process.env.EMAIL_FROM || "noreply@shopease.in", name: "ShopEase" },
      subject,
      html,
    });

    return { sent: true, channel: "EMAIL" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: msg };
  }
}

export async function sendEmail(to: string, subject: string, message: string) {
  // Build a nice HTML email
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${subject}</h2>
      <p style="color: #374151;">${message.replace(/\n/g, "<br/>")}</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        — ShopEase Team | <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shopease.in'}">shopease.in</a>
      </p>
    </div>
  `;

  const resendResult = await sendViaResend(to, subject, html);
  if (resendResult.sent) return resendResult;
  return sendViaSendGrid(to, subject, html);
}

// ===================== WHATSAPP =====================

export async function sendWhatsApp(phone: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log(`[WHATSAPP Disabled] To: ${phone}, Message: ${message}`);
    return { sent: false, reason: "WhatsApp Business API not configured" };
  }

  try {
    // WhatsApp requires template messages for outbound
    const cleanPhone = phone.replace(/^[\+0]/g, "");
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    return {
      sent: !!data.messages?.[0]?.id,
      channel: "WHATSAPP",
      channelId: data.messages?.[0]?.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: msg };
  }
}

// ===================== PUSH (Web Push / Firebase) =====================

export async function sendPush(userId: string, title: string, message: string, metadata?: Record<string, string>) {
  const fcmKey = process.env.FIREBASE_SERVER_KEY;

  if (!fcmKey) {
    console.log(`[PUSH Disabled] To: ${userId}, Title: ${title}`);
    return { sent: false, reason: "FCM not configured" };
  }

  try {
    // Get user's FCM tokens
    const tokens = await prisma.fCMToken.findMany({
      where: { userId, isActive: true },
    });

    if (tokens.length === 0) {
      return { sent: false, reason: "No FCM tokens for user" };
    }

    // Send to Firebase Cloud Messaging
    const results = [];
    for (const token of tokens) {
      const response = await fetch("https://fcm.googleapis.com/v1/projects/shopease-app/messages:send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fcmKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: token.token,
            notification: { title, body: message },
            data: metadata ? JSON.stringify(metadata) : undefined,
          },
        }),
      });

      results.push(await response.json());
    }

    return { sent: results.length > 0, channel: "PUSH" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: msg };
  }
}
