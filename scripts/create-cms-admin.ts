import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "cms";
  const password = "cms123";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hash, role: "LANDING_ADMIN", isActive: true },
    create: {
      name: "Admin Landing",
      username,
      email: "cms@smkhutama.sch.id",
      passwordHash: hash,
      role: "LANDING_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Akun CMS berhasil dibuat/diperbarui:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: LANDING_ADMIN`);
  console.log(`   Login di: /cms/login`);
  console.log(`   ID: ${user.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
