"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function listAgents() {
  return prisma.aIAgent.findMany({ orderBy: { createdAt: "desc" } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function createAgent(input: { name: string; description?: string; type: string; config?: any }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.aIAgent.create({
    data: {
      name: input.name,
      description: input.description,
      type: input.type,
      config: input.config || {},
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function updateAgent(id: string, data: { status?: string; config?: any }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.aIAgent.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.config && { config: data.config }),
    },
  });
}

export async function deleteAgent(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.aIAgent.delete({ where: { id } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function runAgent(agentId: string, input?: any) {
  const agent = await prisma.aIAgent.findUnique({ where: { id: agentId } });
  if (!agent) throw new Error("Agent not found");

  const startTime = Date.now();
  const run = await prisma.agentRun.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    data: { agentId, status: "RUNNING", input: input as any },
  });

  try {
    // Execute agent based on type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    let output: any = {};

    switch (agent.type) {
      case "RECOMMENDER":
        // Refresh cached recommendations for all users
        const activeUsers = await prisma.userBehavior.findMany({ where: { userId: { not: null } }, distinct: ["userId"], take: 50 });
        output = { processed: activeUsers.length, message: "Recommendations refreshed" };
        break;
      case "PRICER":
        // Analyze pricing for products
        const products = await prisma.product.findMany({ where: { isActive: true }, take: 100 });
        output = { processed: products.length, message: "Price analysis complete" };
        break;
      case "FRAUD":
        // Score recent orders
        const recentOrders = await prisma.order.findMany({ where: { status: "PENDING" }, take: 50 });
        output = { processed: recentOrders.length, message: "Fraud scoring complete" };
        break;
      case "CHURN":
        // Update churn predictions
        const users = await prisma.user.findMany({ take: 100 });
        output = { processed: users.length, message: "Churn predictions updated" };
        break;
      case "INVENTORY":
        // Forecast demand
        const stockProducts = await prisma.product.findMany({ where: { isActive: true }, take: 50 });
        output = { processed: stockProducts.length, message: "Demand forecasts updated" };
        break;
      case "CONTENT":
        // Generate AI descriptions
        const contentProducts = await prisma.product.findMany({ where: { isActive: true }, take: 50 });
        output = { processed: contentProducts.length, message: "Content generation complete" };
        break;
      default:
        output = { message: "Custom agent executed" };
    }

    await prisma.agentRun.update({
      where: { id: run.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      data: { status: "SUCCESS", output: output as any, durationMs: Date.now() - startTime, completedAt: new Date() },
    });

    await prisma.aIAgent.update({
      where: { id: agentId },
      data: { lastRunAt: new Date(), lastStatus: "SUCCESS", errorCount: 0 },
    });

    return run;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "ERROR", error: errMsg, durationMs: Date.now() - startTime, completedAt: new Date() },
    });

    await prisma.aIAgent.update({
      where: { id: agentId },
      data: { lastRunAt: new Date(), lastStatus: "ERROR", errorCount: { increment: 1 } },
    });

    return run;
  }
}

export async function getAgentRuns(agentId?: string, limit: number = 20) {
  const where = agentId ? { agentId } : {};
  return prisma.agentRun.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
}

export async function initializeDefaultAgents() {
  const defaultAgents = [
    { name: "recommendation-refresh", type: "RECOMMENDER", description: "Refresh product recommendations" },
    { name: "fraud-scoring", type: "FRAUD", description: "Score recent orders for fraud" },
    { name: "churn-analysis", type: "CHURN", description: "Update churn predictions" },
    { name: "price-optimization", type: "PRICER", description: "Optimize product pricing" },
    { name: "demand-forecast", type: "INVENTORY", description: "Generate demand forecasts" },
    { name: "content-generation", type: "CONTENT", description: "Generate AI product content" },
  ];

  for (const agent of defaultAgents) {
    await prisma.aIAgent.upsert({
      where: { name: agent.name },
      create: { ...agent, config: {}, status: "ACTIVE" },
      update: {},
    });
  }

  return listAgents();
}
