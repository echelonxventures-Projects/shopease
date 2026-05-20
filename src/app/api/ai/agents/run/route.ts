import { NextRequest, NextResponse } from "next/server";
import { initializeDefaultAgents, runAgent, listAgents } from "@/server/actions/ai-agent-actions";

export async function POST(req: NextRequest) {
  try {
    const { agentId, action } = await req.json();

    if (action === "init") {
      const agents = await initializeDefaultAgents();
      return NextResponse.json({ agents });
    }

    if (agentId) {
      const run = await runAgent(agentId);
      return NextResponse.json({ run });
    }

    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
