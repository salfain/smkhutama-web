import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

// 5 jurusan SMK Hutama
const MAJORS = [
  { code: "TKJ",  name: "Teknik Komputer dan Jaringan" },
  { code: "RPL",  name: "Rekayasa Perangkat Lunak" },
  { code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif" },
  { code: "AKL",  name: "Akuntansi dan Keuangan Lembaga" },
  { code: "OTKP", name: "Otomatisasi & Tata Kelola Perkantoran" },
];

// Tiap jurusan dapat 2 kelas paralel di tingkat X
const PARALEL = 2;
const GRADE = "X";

async function main() {
  console.log("\n📚 Membuat jurusan & kelas...\n");

  for (const m of MAJORS) {
    const major = await prisma.major.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: { code: m.code, name: m.name },
    });
    console.log(`✅ Jurusan: ${m.code} — ${m.name}`);

    for (let i = 1; i <= PARALEL; i++) {
      const className = `${GRADE} ${m.code} ${i}`;
      const existing = await prisma.class.findFirst({
        where: { name: className, majorId: major.id },
      });
      if (existing) {
        console.log(`   ⏩ Kelas sudah ada: ${className}`);
        continue;
      }
      await prisma.class.create({
        data: { name: className, grade: GRADE, majorId: major.id },
      });
      console.log(`   ➕ Kelas dibuat: ${className}`);
    }
  }

  const totalMajors = await prisma.major.count();
  const totalClasses = await prisma.class.count();
  console.log(`\n🎉 Selesai. Total: ${totalMajors} jurusan, ${totalClasses} kelas.`);
  console.log(`   Kelola lewat /admin/majors dan /admin/classes`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
