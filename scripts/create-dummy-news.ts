import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/:[^@]+@/, ":***@"));
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const newsData = [
  {
    slug: "penerimaan-peserta-didik-baru-2026",
    title: "Penerimaan Peserta Didik Baru Tahun Ajaran 2026/2027",
    excerpt: "SMK HUTAMA membuka pendaftaran siswa baru untuk tahun ajaran 2026/2027. Segera daftarkan diri Anda melalui jalur online maupun offline.",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    content: `<p>SMK HUTAMA dengan bangga mengumumkan pembukaan Penerimaan Peserta Didik Baru (PPDB) untuk Tahun Ajaran 2026/2027.</p>
<p>Pendaftaran dibuka mulai tanggal 1 Juni hingga 15 Juli 2026. Calon siswa dapat mendaftar melalui website resmi sekolah atau datang langsung ke sekretariat PPDB.</p>
<h3>Persyaratan:</h3>
<ul>
<li>Fotokopi ijazah SMP/MTs atau surat keterangan lulus</li>
<li>Fotokopi rapor semester 1-5</li>
<li>Pas foto 3x4 sebanyak 4 lembar</li>
<li>Fotokopi kartu keluarga</li>
</ul>
<p>Informasi lebih lanjut hubungi panitia PPDB di nomor (021) 12345678.</p>`,
    publishedAt: new Date("2026-06-01"),
  },
  {
    slug: "juara-lomba-kompetensi-siswa-2026",
    title: "Siswa SMK HUTAMA Raih Juara 1 Lomba Kompetensi Siswa Tingkat Provinsi",
    excerpt: "Prestasi membanggakan diraih oleh siswa jurusan RPL yang berhasil meraih juara pertama dalam ajang LKS tingkat provinsi bidang Web Technology.",
    imageUrl: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80",
    content: `<p>Selamat kepada Muhammad Rizky Pratama, siswa kelas XII RPL yang telah meraih Juara 1 dalam Lomba Kompetensi Siswa (LKS) Tingkat Provinsi bidang Web Technology.</p>
<p>Kompetisi yang diselenggarakan pada tanggal 15-17 Mei 2026 ini diikuti oleh 35 peserta dari berbagai SMK se-provinsi. Rizky berhasil mengungguli seluruh peserta dengan nilai tertinggi pada kategori Front-End Development dan Full-Stack Application.</p>
<p>Kepala Sekolah, Bapak Drs. Ahmad Sudrajat, M.Pd., menyatakan kebanggaannya atas prestasi ini dan berharap dapat menjadi motivasi bagi siswa lainnya.</p>
<p>Rizky akan mewakili provinsi dalam LKS Tingkat Nasional yang akan diselenggarakan pada bulan September 2026.</p>`,
    publishedAt: new Date("2026-05-20"),
  },
  {
    slug: "workshop-industri-4-0",
    title: "Workshop Industri 4.0: Mempersiapkan Siswa Menghadapi Era Digital",
    excerpt: "SMK HUTAMA menggelar workshop bertema Industri 4.0 dengan menghadirkan praktisi dari perusahaan teknologi ternama sebagai narasumber.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    content: `<p>Dalam rangka mempersiapkan lulusan yang siap menghadapi tantangan era digital, SMK HUTAMA menggelar Workshop Industri 4.0 pada tanggal 10 Mei 2026.</p>
<p>Workshop ini menghadirkan narasumber dari berbagai perusahaan teknologi ternama, antara lain:</p>
<ul>
<li>Bapak Andi Wijaya - Senior Developer di PT Teknologi Indonesia</li>
<li>Ibu Sarah Putri - Product Manager di startup unicorn</li>
<li>Bapak Reza Firmansyah - Data Scientist di perusahaan fintech</li>
</ul>
<p>Kegiatan ini diikuti oleh seluruh siswa kelas XI dan XII dari semua jurusan. Materi yang disampaikan meliputi Artificial Intelligence, Internet of Things, Cloud Computing, dan Cybersecurity.</p>
<p>Para siswa antusias mengikuti sesi hands-on yang diberikan dan berharap kegiatan serupa dapat diadakan secara rutin.</p>`,
    publishedAt: new Date("2026-05-10"),
  },
  {
    slug: "kunjungan-industri-ke-jakarta",
    title: "Kunjungan Industri Siswa Kelas XI ke Perusahaan IT di Jakarta",
    excerpt: "Sebanyak 120 siswa kelas XI melakukan kunjungan industri ke beberapa perusahaan IT di Jakarta untuk mengenal dunia kerja secara langsung.",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    content: `<p>Pada tanggal 25-26 April 2026, sebanyak 120 siswa kelas XI SMK HUTAMA melaksanakan kegiatan Kunjungan Industri (KI) ke beberapa perusahaan IT terkemuka di Jakarta.</p>
<p>Perusahaan yang dikunjungi antara lain:</p>
<ol>
<li>PT Telkom Indonesia - Mengenal infrastruktur telekomunikasi</li>
<li>Tokopedia HQ - Mempelajari ekosistem e-commerce</li>
<li>Google Indonesia - Workshop tentang teknologi cloud</li>
</ol>
<p>Kegiatan ini bertujuan untuk memberikan gambaran nyata tentang dunia kerja di bidang teknologi informasi dan komunikasi kepada para siswa.</p>
<p>"Kunjungan industri ini sangat membuka wawasan kami tentang bagaimana teknologi diterapkan di dunia nyata," ujar salah satu siswa peserta kunjungan.</p>`,
    publishedAt: new Date("2026-04-28"),
  },
  {
    slug: "pelaksanaan-ujian-berbasis-komputer",
    title: "SMK HUTAMA Resmi Terapkan Ujian Berbasis Komputer (CBT) untuk Semua Mata Pelajaran",
    excerpt: "Mulai semester ini, seluruh ujian di SMK HUTAMA dilaksanakan secara online menggunakan sistem CBT yang dikembangkan sendiri oleh tim IT sekolah.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    content: `<p>SMK HUTAMA resmi menerapkan sistem Ujian Berbasis Komputer (Computer Based Test/CBT) untuk seluruh mata pelajaran mulai semester genap tahun ajaran 2025/2026.</p>
<p>Sistem CBT ini dikembangkan secara mandiri oleh tim IT sekolah dengan fitur-fitur unggulan:</p>
<ul>
<li>Pengacakan soal dan jawaban otomatis</li>
<li>Timer otomatis dengan auto-submit</li>
<li>Monitoring real-time oleh guru pengawas</li>
<li>Penilaian otomatis untuk soal pilihan ganda</li>
<li>Analisis hasil ujian yang komprehensif</li>
</ul>
<p>Kepala Sekolah menyatakan bahwa penerapan CBT ini merupakan langkah maju dalam digitalisasi pendidikan di SMK HUTAMA. Sistem ini diharapkan dapat meningkatkan efisiensi pelaksanaan ujian dan mengurangi penggunaan kertas.</p>
<p>Seluruh guru telah mendapatkan pelatihan penggunaan sistem CBT dan siap mengimplementasikan pada ujian yang akan datang.</p>`,
    publishedAt: new Date("2026-04-15"),
  },
];

async function main() {
  for (const news of newsData) {
    const result = await prisma.landingNews.upsert({
      where: { slug: news.slug },
      update: { ...news, isPublished: true },
      create: { ...news, isPublished: true },
    });
    console.log(`✅ ${result.title}`);
  }
  console.log("\n🎉 5 berita dummy berhasil dibuat!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
