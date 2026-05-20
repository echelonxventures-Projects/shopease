import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/delivery/track/[assignmentId] — Server-Sent Events stream
// Polls the database for tracking events and streams them to the client
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await context.params;

  if (!assignmentId) {
    return new NextResponse("Missing assignmentId", { status: 400 });
  }

  // Verify assignment exists
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, status: true },
  });

  if (!assignment) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  // SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable Nginx buffering
  };

  // Get current events
  const events = await prisma.deliveryTrackingEvent.findMany({
    where: { deliveryAssignmentId: assignmentId },
    orderBy: { createdAt: "asc" },
  });

  const latestCreatedAt = events.length > 0
    ? events[events.length - 1].createdAt.toISOString()
    : null;

  // Build SSE response with initial events
  let data = "";

  // Send existing events
  for (const event of events) {
    data += `event: ${event.eventType.toLowerCase()}\n`;
    data += `data: ${JSON.stringify({
      id: event.id,
      type: event.eventType,
      message: event.message,
      lat: event.lat ? Number(event.lat) : null,
      lng: event.lng ? Number(event.lng) : null,
      createdAt: event.createdAt,
      metadata: event.metadata,
    })}\n\n`;
  }

  // Send heartbeat with latest timestamp
  data += `event: heartbeat\n`;
  data += `data: ${JSON.stringify({ latestCreatedAt, status: assignment.status })}\n\n`;

  return new NextResponse(data, {
    headers,
    status: 200,
  });
}
