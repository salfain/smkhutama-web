import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ── 5 Mata Pelajaran & 5 Guru ───────────────────────────────────────────────
const SUBJECTS = [
  { code: "MTK",  name: "Matematika" },
  { code: "BIG",  name: "Bahasa Inggris" },
  { code: "BIN",  name: "Bahasa Indonesia" },
  { code: "PKK",  name: "Produk Kreatif dan Kewirausahaan" },
  { code: "IPAS", name: "Ilmu Pengetahuan Alam Sosial" },
];

const TEACHERS = [
  { name: "Budi Santoso, S.Pd",    username: "budi.santoso",    subjectCode: "MTK"  },
  { name: "Dewi Rahayu, S.Pd",     username: "dewi.rahayu",     subjectCode: "BIG"  },
  { name: "Hendra Wijaya, S.Pd",   username: "hendra.wijaya",   subjectCode: "BIN"  },
  { name: "Rina Marlina, S.Kom",   username: "rina.marlina",    subjectCode: "PKK"  },
  { name: "Agus Purnomo, S.T",     username: "agus.purnomo",    subjectCode: "IPAS" },
];

const PASSWORD = "guru123";

// ── 8 Soal per Mata Pelajaran (total 40) ─────────────────────────────────────
// format: [pertanyaan, [A, B, C, D, E], indexBenar(0=A), difficulty]
type QRaw = [string, [string,string,string,string,string], number, "EASY"|"MEDIUM"|"HARD"];

const QUESTIONS: Record<string, QRaw[]> = {
  MTK: [
    ["Berapakah hasil dari 15 × 8?", ["120","115","125","130","110"], 0, "EASY"],
    ["Nilai dari 2³ + 3² adalah...", ["17","15","18","14","16"], 0, "EASY"],
    ["Jika x + 5 = 12, maka x = ...", ["7","6","8","5","9"], 0, "EASY"],
    ["Luas lingkaran dengan jari-jari 7 cm (π = 22/7) adalah...", ["154","144","164","148","140"], 0, "MEDIUM"],
    ["Hasil dari √144 adalah...", ["12","11","13","14","10"], 0, "EASY"],
    ["Persamaan garis y = 2x + 3 memotong sumbu-y di titik...", ["(0,3)","(3,0)","(0,-3)","(-3,0)","(1,5)"], 0, "MEDIUM"],
    ["Jumlah sudut dalam segitiga adalah...", ["180°","360°","90°","270°","120°"], 0, "EASY"],
    ["Jika matriks A = [[2,1],[3,4]], determinan A adalah...", ["5","8","11","6","7"], 0, "HARD"],
  ],
  BIG: [
    ["What is the plural of 'child'?", ["children","childs","childes","child","childrens"], 0, "EASY"],
    ["Choose the correct sentence:", ["She doesn't like coffee","She don't like coffee","She not like coffee","She didn't likes coffee","She isn't like coffee"], 0, "MEDIUM"],
    ["'Diligent' means...", ["Hard-working","Lazy","Careless","Brave","Honest"], 0, "EASY"],
    ["The synonym of 'happy' is...", ["Joyful","Sad","Angry","Tired","Afraid"], 0, "EASY"],
    ["Which is the correct past tense of 'go'?", ["went","goed","going","gone","goes"], 0, "EASY"],
    ["'She ___ her homework every day.' The correct word is...", ["does","do","did","done","doing"], 0, "MEDIUM"],
    ["What does 'perseverance' mean?", ["Persistence","Intelligence","Creativity","Honesty","Kindness"], 0, "HARD"],
    ["The antonym of 'difficult' is...", ["Easy","Hard","Rough","Tricky","Complex"], 0, "EASY"],
  ],
  BIN: [
    ["Apa yang dimaksud dengan kalimat efektif?", ["Kalimat yang jelas dan tepat","Kalimat panjang","Kalimat bermajas","Kalimat tunggal","Kalimat majemuk"], 0, "MEDIUM"],
    ["Kata 'fotografi' merupakan kata serapan dari bahasa...", ["Belanda","Inggris","Portugis","Arab","Sansekerta"], 0, "MEDIUM"],
    ["Teks yang bertujuan meyakinkan pembaca disebut teks...", ["Persuasif","Narasi","Deskripsi","Eksposisi","Rekon"], 0, "EASY"],
    ["Sinonim kata 'cerdas' adalah...", ["Pandai","Malas","Bodoh","Lambat","Lemah"], 0, "EASY"],
    ["Majas yang membandingkan dua hal menggunakan kata seperti/bagai adalah...", ["Simile","Metafora","Hiperbola","Personifikasi","Litotes"], 0, "MEDIUM"],
    ["EYD adalah singkatan dari...", ["Ejaan Yang Disempurnakan","Ejaan Yang Distandarkan","Ejaan Yang Disetujui","Ejaan Yang Diciptakan","Ejaan Yang Ditentukan"], 0, "EASY"],
    ["Paragraf yang kalimat utamanya di awal disebut paragraf...", ["Deduktif","Induktif","Campuran","Deskriptif","Naratif"], 0, "MEDIUM"],
    ["Kata 'mengkomunikasikan' mendapatkan imbuhan...", ["me-kan","me-i","ber-kan","di-kan","ter-kan"], 0, "HARD"],
  ],
  PKK: [
    ["Singkatan PKK dalam mata pelajaran ini adalah...", ["Produk Kreatif dan Kewirausahaan","Pelajaran Kreatif Kewirausahaan","Program Kreasi Kewirausahaan","Produk Karya Kewirausahaan","Pola Kerja Kewirausahaan"], 0, "EASY"],
    ["Karakteristik utama seorang wirausahawan adalah...", ["Inovatif dan berani ambil risiko","Menghindari risiko","Menunggu peluang","Bergantung pada orang lain","Tidak mau berubah"], 0, "EASY"],
    ["Analisis SWOT singkatan dari...", ["Strength, Weakness, Opportunity, Threat","Strategy, Work, Output, Target","System, Work, Organize, Team","Strong, Weak, Open, Total","Survey, Work, Object, Trend"], 0, "MEDIUM"],
    ["Break Even Point (BEP) adalah titik di mana...", ["Total pendapatan = total biaya","Laba maksimum","Rugi maksimum","Produksi nol","Harga tertinggi"], 0, "MEDIUM"],
    ["Ciri produk yang memiliki nilai jual tinggi adalah...", ["Unik, berkualitas, dan memenuhi kebutuhan","Murah dan banyak","Tiruan produk terkenal","Sederhana dan tidak perlu promosi","Hanya dijual secara offline"], 0, "EASY"],
    ["Promosi melalui media sosial termasuk jenis pemasaran...", ["Digital marketing","Konvensional","Word of mouth","Direct selling","Guerrilla marketing"], 0, "EASY"],
    ["Modal awal usaha yang berasal dari tabungan pemilik disebut modal...", ["Sendiri","Asing","Campuran","Pinjaman","Ventura"], 0, "MEDIUM"],
    ["Laporan keuangan yang menunjukkan posisi aset, liabilitas, dan ekuitas adalah...", ["Neraca","Laba rugi","Arus kas","Jurnal","Buku besar"], 0, "HARD"],
  ],
  IPAS: [
    ["Proses fotosintesis pada tumbuhan menghasilkan...", ["Oksigen dan glukosa","Karbondioksida dan air","Nitrogen dan protein","Hidrogen dan mineral","Oksigen dan protein"], 0, "EASY"],
    ["Satuan kecepatan dalam SI adalah...", ["m/s","km/jam","m/s²","km/s","cm/s"], 0, "EASY"],
    ["Hukum Newton pertama disebut hukum...", ["Inersia","Aksi-reaksi","Gerak","Gravitasi","Termodinamika"], 0, "EASY"],
    ["Proses perubahan wujud dari gas menjadi cair disebut...", ["Kondensasi","Evaporasi","Sublimasi","Deposisi","Pembekuan"], 0, "MEDIUM"],
    ["Organ yang berfungsi memompa darah ke seluruh tubuh adalah...", ["Jantung","Paru-paru","Hati","Ginjal","Limpa"], 0, "EASY"],
    ["Lapisan atmosfer tempat terjadinya cuaca adalah...", ["Troposfer","Stratosfer","Mesosfer","Termosfer","Eksosfer"], 0, "MEDIUM"],
    ["Apa yang dimaksud dengan ekosistem?", ["Kumpulan organisme dan lingkungannya","Kumpulan hewan saja","Kumpulan tumbuhan saja","Lingkungan tanpa makhluk hidup","Komunitas tumbuhan"], 0, "MEDIUM"],
    ["Reaksi kimia yang membutuhkan energi disebut reaksi...", ["Endoterm","Eksoterm","Redoks","Oksidasi","Reduksi"], 0, "HARD"],
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Membuat 5 guru, 5 mata pelajaran, 5 bank soal, 40 soal dummy...\n");
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── 1. Buat/update mata pelajaran ─────────────────────────────────────────
  const subjectMap: Record<string, string> = {}; // code -> id
  for (const s of SUBJECTS) {
    const subj = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { code: s.code, name: s.name },
    });
    subjectMap[s.code] = subj.id;
    console.log(`📚 Mata pelajaran: ${s.code} — ${s.name}`);
  }

  // ── 2. Buat/update guru ────────────────────────────────────────────────────
  const teacherMap: Record<string, string> = {}; // username -> teacher.id
  for (const t of TEACHERS) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: { name: t.name, role: "TEACHER", isActive: true },
      create: { name: t.name, username: t.username, passwordHash: hash, role: "TEACHER", isActive: true },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: { subjectId: subjectMap[t.subjectCode] },
      create: { userId: user.id, subjectId: subjectMap[t.subjectCode] },
    });
    teacherMap[t.username] = teacher.id;
    console.log(`👨‍🏫 Guru: ${t.name} (${t.username}) — Mapel: ${t.subjectCode}`);
  }

  // ── 3. Buat bank soal + soal ──────────────────────────────────────────────
  let totalQuestions = 0;
  for (const t of TEACHERS) {
    const subjId = subjectMap[t.subjectCode];
    const tchId  = teacherMap[t.username];
    const qList  = QUESTIONS[t.subjectCode];

    // Buat QuestionSet (bank soal)
    const setTitle = `Bank Soal ${t.subjectCode} — ${SUBJECTS.find(s=>s.code===t.subjectCode)?.name}`;
    const qSet = await prisma.questionSet.create({
      data: {
        title: setTitle,
        subjectId: subjId,
        ownerTeacherId: tchId,
        examType: "UTS",
        totalQuestions: qList.length,
        multipleChoiceCount: qList.length,
        status: "APPROVED",
      },
    });
    console.log(`\n📦 Bank soal: ${setTitle}`);

    // Buat soal + opsi jawaban
    for (const [i, [qText, opts, correctIdx, diff]] of qList.entries()) {
      const q = await prisma.question.create({
        data: {
          subjectId: subjId,
          teacherId: tchId,
          questionSetId: qSet.id,
          questionType: "MULTIPLE_CHOICE",
          questionText: qText,
          difficulty: diff,
          scoreWeight: 1,
          isActive: true,
          options: {
            create: opts.map((opt, oi) => ({
              optionLabel: ["A","B","C","D","E"][oi],
              optionText: opt,
              isCorrect: oi === correctIdx,
              orderNumber: oi,
            })),
          },
        },
      });
      console.log(`   ✅ Soal ${i + 1}: ${qText.substring(0, 60)}...`);
      totalQuestions++;
      void q;
    }
  }

  console.log(`\n🎉 Selesai! Total dibuat:`);
  console.log(`   • ${SUBJECTS.length} mata pelajaran`);
  console.log(`   • ${TEACHERS.length} guru (password: ${PASSWORD})`);
  console.log(`   • ${TEACHERS.length} bank soal`);
  console.log(`   • ${totalQuestions} soal pilihan ganda`);
  console.log(`\n📋 Akun Guru:`);
  for (const t of TEACHERS) {
    console.log(`   ${t.username.padEnd(20)} → mapel: ${t.subjectCode}`);
  }
  console.log(`   (password semua: ${PASSWORD})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
