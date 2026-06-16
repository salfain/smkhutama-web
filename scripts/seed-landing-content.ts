import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEACHERS, EXTRACURRICULARS } from "../src/lib/landing-static";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---- GURU ----
  const teacherCount = await prisma.landingTeacher.count();
  if (teacherCount === 0) {
    for (let i = 0; i < TEACHERS.length; i++) {
      const t = TEACHERS[i];
      await prisma.landingTeacher.create({
        data: {
          name: t.name,
          position: t.position,
          subject: t.subject || null,
          photoUrl: t.photo || null,
          orderNumber: i,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${TEACHERS.length} data guru berhasil ditambahkan.`);
  } else {
    console.log(`⏩ Lewati guru: sudah ada ${teacherCount} data.`);
  }

  // ---- EKSTRAKURIKULER ----
  const ekskulCount = await prisma.landingExtracurricular.count();
  if (ekskulCount === 0) {
    for (let i = 0; i < EXTRACURRICULARS.length; i++) {
      const e = EXTRACURRICULARS[i];
      await prisma.landingExtracurricular.create({
        data: {
          name: e.name,
          category: e.category,
          description: e.description,
          schedule: e.schedule || null,
          icon: e.icon,
          color: e.color,
          imageUrl: e.image || null,
          orderNumber: i,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${EXTRACURRICULARS.length} data ekstrakurikuler berhasil ditambahkan.`);
  } else {
    console.log(`⏩ Lewati ekskul: sudah ada ${ekskulCount} data.`);
  }

  console.log("\n🎉 Selesai. Data dapat dikelola di /cms/teachers dan /cms/extracurriculars");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
