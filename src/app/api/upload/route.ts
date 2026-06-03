import { NextResponse } from "next/server";
import path from "path";
import { getSession } from "@/lib/auth";
import { validateFileType, validateImageDimensions } from "@/lib/file-validator";
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { getRealIp } from "@/lib/get-real-ip";
import { storeUpload } from "@/lib/upload";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit uploads: 5 per minute per user
  const ip = getRealIp(req);
  const userId = (session.user as any)?.id || ip;
  const rlKey = buildRateLimitKey("upload", userId);
  const rateResult = checkRateLimit(rlKey, RATE_LIMITS.upload.maxAttempts, RATE_LIMITS.upload.windowMs);

  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Upload rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate by magic bytes, not client-provided MIME type
    const typeResult = validateFileType(buffer);
    if (!typeResult.valid) {
      return NextResponse.json({ error: typeResult.error }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(typeResult.mimeType!)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Validate image dimensions
    const dimResult = validateImageDimensions(buffer, typeResult.mimeType!, 5000, 5000);
    if (!dimResult.valid) {
      return NextResponse.json({ error: dimResult.error }, { status: 400 });
    }

    // Sanitize filename
    const safeExt = path.extname(file.name).toLowerCase().replace(/[^a-z.]/g, "") || `.${typeResult.mimeType!.split("/")[1]}`;
    const filename = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;

    const { url } = await storeUpload(buffer, filename, typeResult.mimeType!);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
