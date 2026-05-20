import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, productId, sessionId, userId, metadata } = body;

    if (!type || !sessionId) {
      return NextResponse.json({ error: "type and sessionId required" }, { status: 400 });
    }

    await prisma.conversionEvent.create({
      data: {
        type,
        sessionId,
        userId: userId || null,
        productId: productId || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
