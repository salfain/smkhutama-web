import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "bk.hutama";
  const password = "bk123";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hash, role: "COUNSELOR", isActive: true },
    create: {
      name: "Guru BK Hutama",
      username,
      email: "bk@smkhutama.sch.id",
      passwordHash: hash,
      role: "COUNSELOR",
      isActive: true,
    },
  });

  // Pastikan ada profil Counselor
  await prisma.counselor.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log("✅ Akun Guru BK berhasil dibuat/diperbarui:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: COUNSELOR`);
  console.log(`   Login di: /login (pilih tab Guru BK)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
