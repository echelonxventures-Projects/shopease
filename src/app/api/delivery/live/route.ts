import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const assignmentId = req.nextUrl.searchParams.get("assignmentId");
  if (!assignmentId) return new Response("Missing assignmentId", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const interval = setInterval(async () => {
        try {
          const latest = await prisma.deliveryTrackingEvent.findFirst({
            where: { deliveryAssignmentId: assignmentId },
            orderBy: { createdAt: "desc" },
            select: { lat: true, lng: true, eventType: true, createdAt: true },
          });
          if (latest) send({ lat: latest.lat, lng: latest.lng, event: latest.eventType, ts: latest.createdAt });
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      req.signal.addEventListener("abort", () => { clearInterval(interval); controller.close(); });
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
