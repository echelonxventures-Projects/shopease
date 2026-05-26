import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "production"
    ? [{ emit: "event", level: "error" }]
    : [{ emit: "stdout", level: "query" }, { emit: "stdout", level: "error" }],
});

// Error event listener for logging
prisma.$on("error", (e: any) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Prisma] Error:", e.message || e);
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
