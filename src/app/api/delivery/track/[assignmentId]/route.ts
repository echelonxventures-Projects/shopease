import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/delivery/track/[assignmentId] — continuous Server-Sent Events stream.
// Streams existing tracking events, then pushes new events as they are recorded
// until the delivery reaches a terminal state or the client disconnects.
export async function GET(req: NextRequest, context: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await context.params;
  if (!assignmentId) return new NextResponse("Missing assignmentId", { status: 400 });

  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, status: true },
  });
  if (!assignment) return new NextResponse("Assignment not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastTs: Date | null = null;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      };

      const flush = async () => {
        if (closed) return;
        try {
          const events = await prisma.deliveryTrackingEvent.findMany({
            where: { deliveryAssignmentId: assignmentId, ...(lastTs ? { createdAt: { gt: lastTs } } : {}) },
            orderBy: { createdAt: "asc" },
          });
          for (const e of events) {
            send(e.eventType.toLowerCase(), {
              id: e.id,
              type: e.eventType,
              message: e.message,
              lat: e.lat ? Number(e.lat) : null,
              lng: e.lng ? Number(e.lng) : null,
              createdAt: e.createdAt,
              metadata: e.metadata,
            });
            lastTs = e.createdAt;
          }
          const current = await prisma.deliveryAssignment.findUnique({ where: { id: assignmentId }, select: { status: true } });
          send("heartbeat", { status: current?.status, latestCreatedAt: lastTs });
          if (current && ["DELIVERED", "CANCELLED"].includes(current.status)) close();
        } catch {
          close();
        }
      };

      const interval = setInterval(flush, 3000);
      req.signal.addEventListener("abort", close);
      await flush();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
