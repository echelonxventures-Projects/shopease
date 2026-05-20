import { NextRequest, NextResponse } from "next/server";
import { analyzeText, analyzeImage, analyzeAudio, analyzeVideo, analyzeMultiModal } from "@/lib/ai/multi-modal";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, locale } = body;

    switch (type) {
      case "text": {
        const result = await analyzeText(data, locale);
        return NextResponse.json(result);
      }
      case "image": {
        const buffer = Buffer.from(data, "base64");
        const result = await analyzeImage(buffer);
        return NextResponse.json(result);
      }
      case "audio": {
        const buffer = Buffer.from(data, "base64");
        const result = await analyzeAudio(buffer, "wav");
        return NextResponse.json(result);
      }
      case "video": {
        const buffer = Buffer.from(data, "base64");
        const result = await analyzeVideo(buffer);
        return NextResponse.json(result);
      }
      case "multi": {
        const parsed: any = {};
        if (body.text) parsed.text = body.text;
        if (body.image) parsed.image = Buffer.from(body.image, "base64");
        if (body.audio) parsed.audio = Buffer.from(body.audio, "base64");
        if (body.video) parsed.video = Buffer.from(body.video, "base64");
        const result = await analyzeMultiModal(parsed);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Unknown analysis type" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
