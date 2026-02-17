/**
 * Check that the DB has admin user(s). Use the SAME DATABASE_URL as in Vercel.
 * Run: DATABASE_URL="postgresql://..." npx tsx scripts/check-admin.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { email: true, id: true } });
  console.log("User count:", count);
  console.log("Emails:", users.map((u) => u.email).join(", ") || "(none)");
  if (count === 0) {
    console.log("No users in DB. Run: npx tsx scripts/create-admin.ts");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
