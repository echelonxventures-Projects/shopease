import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  initializeDefaultAgents,
  runAgent,
  listAgents,
} from "@/server/actions/ai-agent-actions";

// AI agents can be expensive to run (LLM/inference cost) and access internal
// data; restrict the trigger endpoints to ADMIN.

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false as const, status: 401, msg: "Unauthorized" };
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return { ok: false as const, status: 403, msg: "Admin only" };
  }
  return { ok: true as const, session };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.msg }, { status: auth.status });
  }

  let body: { agentId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { agentId, action } = body;

  try {
    if (action === "init") {
      const agents = await initializeDefaultAgents();
      return NextResponse.json({ agents });
    }
    if (typeof agentId === "string" && agentId.length > 0) {
      const run = await runAgent(agentId);
      return NextResponse.json({ run });
    }
    return NextResponse.json(
      { error: "Provide `agentId` to run, or `action: \"init\"` to bootstrap." },
      { status: 400 },
    );
  } catch (err) {
    logger.error({ err, agentId, action }, "AI agent run API failed");
    return NextResponse.json({ error: "Agent run failed" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.msg }, { status: auth.status });
  }

  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (err) {
    logger.error({ err }, "AI agent list API failed");
    return NextResponse.json({ error: "Failed to list agents" }, { status: 500 });
  }
}
