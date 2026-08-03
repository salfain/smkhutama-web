/**
 * Script untuk membuat akun Kurikulum pertama.
 * Jalankan dari folder cbt-smkhutama:
 *   npx tsx scripts/create-kurikulum.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "kurikulum.hutama";
  const password = "kurikulum123";
  const name = "Waka Kurikulum";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`✓ Akun '${username}' sudah ada.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      name,
      passwordHash,
      role: "KURIKULUM",
      isActive: true,
    },
  });

  console.log(`✓ Akun Kurikulum berhasil dibuat:`);
  console.log(`  Username : ${username}`);
  console.log(`  Password : ${password}`);
  console.log(`  ID       : ${user.id}`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
