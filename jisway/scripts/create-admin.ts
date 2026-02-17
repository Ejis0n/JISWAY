/**
 * Create or update a single admin user. Use when you cannot sign in after seed.
 *
 * Run (replace with your Neon URL and desired email/password):
 *   DATABASE_URL="postgresql://..." ADMIN_SEED_EMAIL="you@example.com" ADMIN_SEED_PASSWORD="yourpassword" npx tsx scripts/create-admin.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.ADMIN_SEED_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "admin@jisway.local";
  const rawPassword =
    process.env.ADMIN_SEED_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "admin12345";

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    console.log(`Updated password for: ${email}`);
  } else {
    await prisma.user.create({
      data: { email, passwordHash },
    });
    console.log(`Created admin user: ${email}`);
  }
  console.log("You can now sign in at /admin with the email and password you set.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
