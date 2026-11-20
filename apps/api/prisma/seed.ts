import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "../src/config.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.log("Seed skipped: set SEED_EMAIL and SEED_PASSWORD to create a demo account.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name: "Demo Seller", passwordHash },
    create: { email: email.toLowerCase(), name: "Demo Seller", passwordHash },
  });
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-store" },
    update: { name: "Demo Store" },
    create: { name: "Demo Store", slug: "demo-store" },
  });
  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { role: "owner" },
    create: { userId: user.id, tenantId: tenant.id, role: "owner" },
  });
  console.log(`Created/updated demo account ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
