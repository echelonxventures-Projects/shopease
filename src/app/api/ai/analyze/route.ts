import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  analyzeText,
  analyzeImage,
  analyzeAudio,
  analyzeVideo,
  analyzeMultiModal,
} from "@/lib/ai/multi-modal";

// Multi-modal AI inference is expensive and a target for resource abuse.
// Require an authenticated session, and cap input sizes to avoid memory
// blow-ups (a 25MB base64 string is ~18MB after decode).

const MAX_BASE64_LEN = 25 * 1024 * 1024; // ~25MB
const ALLOWED_TYPES = new Set(["text", "image", "audio", "video", "multi"]);

function decodeBase64(input: unknown, field: string): Buffer {
  if (typeof input !== "string") {
    throw new Error(`Field "${field}" must be a base64 string`);
  }
  if (input.length > MAX_BASE64_LEN) {
    throw new Error(`Field "${field}" exceeds maximum size`);
  }
  return Buffer.from(input, "base64");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Unknown analysis type" },
      { status: 400 },
    );
  }

  try {
    switch (type) {
      case "text": {
        const text = typeof body.data === "string" ? body.data : "";
        if (text.length > 100_000) {
          return NextResponse.json(
            { error: "Text exceeds 100k characters" },
            { status: 400 },
          );
        }
        const locale = typeof body.locale === "string" ? body.locale : undefined;
        const result = await analyzeText(text, locale);
        return NextResponse.json(result);
      }
      case "image": {
        const buffer = decodeBase64(body.data, "data");
        const result = await analyzeImage(buffer);
        return NextResponse.json(result);
      }
      case "audio": {
        const buffer = decodeBase64(body.data, "data");
        const result = await analyzeAudio(buffer, "wav");
        return NextResponse.json(result);
      }
      case "video": {
        const buffer = decodeBase64(body.data, "data");
        const result = await analyzeVideo(buffer);
        return NextResponse.json(result);
      }
      case "multi": {
        const parsed: {
          text?: string;
          image?: Buffer;
          audio?: Buffer;
          video?: Buffer;
        } = {};
        if (typeof body.text === "string") parsed.text = body.text;
        if (typeof body.image === "string")
          parsed.image = decodeBase64(body.image, "image");
        if (typeof body.audio === "string")
          parsed.audio = decodeBase64(body.audio, "audio");
        if (typeof body.video === "string")
          parsed.video = decodeBase64(body.video, "video");
        const result = await analyzeMultiModal(parsed);
        return NextResponse.json(result);
      }
    }
    return NextResponse.json({ error: "Unhandled type" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    // Surface validation messages but not internals.
    const isValidation =
      msg.startsWith("Field ") || msg.includes("exceeds") || msg.includes("characters");
    if (isValidation) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    logger.error({ err, type }, "AI analyze API error");
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
