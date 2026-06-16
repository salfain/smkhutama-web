import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "admin";
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hash, role: "ADMIN", isActive: true },
    create: {
      name: "Administrator",
      username,
      email: "admin@smkhutama.sch.id",
      passwordHash: hash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Akun Admin CBT berhasil dibuat/diperbarui:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ADMIN`);
  console.log(`   Login di: /login`);
  console.log(`   ID: ${user.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
