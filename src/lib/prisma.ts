import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "production"
    ? [{ emit: "event", level: "error" }]
    : [{ emit: "stdout", level: "query" }, { emit: "stdout", level: "error" }],
});

// Error event listener for logging (only registered when "error" is an event emitter)
if (process.env.NODE_ENV === "production") {
  (prisma as unknown as { $on: (e: "error", cb: (e: { message?: string }) => void) => void }).$on(
    "error",
    (e) => console.error("[Prisma] Error:", e.message),
  );
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
