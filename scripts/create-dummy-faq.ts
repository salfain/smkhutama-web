import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const faqs = [
  {
    question: "Kapan pendaftaran peserta didik baru (PPDB) dibuka?",
    answer:
      "Pendaftaran PPDB SMK Hutama untuk Tahun Ajaran 2026/2027 dibuka mulai 1 Juni hingga 15 Juli 2026. Pendaftaran dapat dilakukan secara online melalui menu \"Daftar PPDB\" di website ini, atau datang langsung ke sekretariat PPDB sekolah.",
  },
  {
    question: "Apa saja persyaratan untuk mendaftar di SMK Hutama?",
    answer:
      "Persyaratan pendaftaran: fotokopi ijazah/Surat Keterangan Lulus, fotokopi rapor semester 1-5, pas foto 3x4 sebanyak 4 lembar, fotokopi Kartu Keluarga, dan fotokopi Akta Kelahiran. Berkas fisik diserahkan saat daftar ulang setelah dinyatakan diterima.",
  },
  {
    question: "Bagaimana cara mengetahui status pendaftaran saya?",
    answer:
      "Setelah mendaftar online, Anda akan mendapatkan nomor pendaftaran (format PPDB-2026-XXXXX). Simpan nomor tersebut, lalu buka halaman \"Cek Status\" pada menu PPDB dan masukkan nomor pendaftaran untuk melihat status seleksi Anda secara real-time.",
  },
  {
    question: "Jurusan apa saja yang tersedia di SMK Hutama?",
    answer:
      "SMK Hutama memiliki beberapa program keahlian unggulan, antara lain Teknik Komputer dan Jaringan (TKJ), Teknik Kendaraan Ringan Otomotif (TKRO), Akuntansi dan Keuangan Lembaga (AKL), serta jurusan lainnya. Detail lengkap dapat dilihat pada menu Profil → Program Keahlian.",
  },
  {
    question: "Bagaimana cara siswa mengikuti ujian online (CBT)?",
    answer:
      "Siswa login ke sistem CBT menggunakan akun yang diberikan sekolah (NIS/username dan password). Pada jadwal ujian, siswa memilih ujian yang tersedia, memasukkan token ujian yang diberikan pengawas, lalu mengerjakan soal. Jawaban tersimpan otomatis dan nilai untuk soal pilihan ganda muncul setelah ujian selesai.",
  },
];

async function main() {
  const existing = await prisma.landingFaq.count();
  if (existing > 0) {
    console.log(`⏩ Lewati: sudah ada ${existing} FAQ.`);
    return;
  }
  for (let i = 0; i < faqs.length; i++) {
    await prisma.landingFaq.create({
      data: { question: faqs[i].question, answer: faqs[i].answer, orderNumber: i, isActive: true },
    });
    console.log(`✅ ${faqs[i].question}`);
  }
  console.log("\n🎉 5 FAQ berhasil dibuat! Kelola di /cms/faq, tampil di /faq");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
