// Ensures a default platform site exists. Plain Node + @prisma/client so it runs
// inside the standalone Docker image (no tsx/ts-node required). Idempotent.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const site = await prisma.site.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: process.env.NEXT_PUBLIC_APP_NAME || "Commerce",
      slug: "platform",
      isDefault: true,
      status: "ACTIVE",
      primaryColor: "#2563eb",
      secondaryColor: "#f59e0b",
      fontFamily: "sans",
      settings: { taxInclusive: true, currency: "INR", maintenanceMode: false },
    },
  });
  console.log(`[seed-site] Default site ready: ${site.name} (${site.id})`);
}

main()
  .catch((e) => {
    console.error("[seed-site] failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
