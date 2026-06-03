/**
 * Seeds the exact users the e2e specs expect (idempotent, password force-updated).
 *   customer: test@example.com / Test1234!
 *   admin:    admin@example.com / Admin1234!
 * Run: npx tsx scripts/seed-e2e-users.ts
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const customerPw = await hash("Test1234!", 10);
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: { password: customerPw, role: UserRole.CUSTOMER },
    create: { email: "test@example.com", password: customerPw, name: "Test User", role: UserRole.CUSTOMER },
  });

  const adminPw = await hash("Admin1234!", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { password: adminPw, role: UserRole.ADMIN },
    create: { email: "admin@example.com", password: adminPw, name: "Admin", role: UserRole.ADMIN },
  });

  console.log("✓ e2e users seeded: test@example.com / Test1234!, admin@example.com / Admin1234!");
}

main().finally(() => prisma.$disconnect());
