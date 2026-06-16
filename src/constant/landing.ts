// Data konten landing page SMK Hutama
// Diadaptasi dari smk-hutama-landing

export const siteConfig = {
  name: "SMK Hutama Pondok Gede",
  shortName: "SMK Hutama",
  tagline: "Siap Kerja, Siap Kuliah, Siap Wirausaha",
  logo: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/SMK%20HUTAMA%20REDESIGN-1CH7729ODJDtWJl7q1Ko7lgaylTsFq.png",
  address:
    "Jl. Raya Hankam No.37, Jatirahayu, Kec. Pondok Melati, Kota Bekasi, Jawa Barat 17414",
  phone: "(021) 84990823",
  whatsapp: "+6283892950029",
  email: "info@smkhutama.sch.id",
  officialUrl: "https://smkhutama.sch.id",
};

export const mainNav = [
  { label: "Beranda", href: "#beranda" },
  { label: "Program Keahlian", href: "#jurusan" },
  { label: "Berita", href: "#berita" },
  { label: "Kontak", href: "#kontak" },
];

export const heroContent = {
  badge: "SMK HUTAMA PONDOK GEDE",
  title:
    "Mempersiapkan generasi yang berkarakter, terampil, dan siap bersaing di dunia kerja maupun perguruan tinggi.",
  subtitle:
    "Lingkungan belajar yang religius, disiplin, dengan program keahlian unggulan dan kemitraan industri.",
  images: [
    {
      src: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/galler3-o5kwiisYRp4uvnXsCgLwwPTh33ciMD.jpg",
      alt: "Kegiatan belajar dan praktik siswa SMK Hutama 1",
    },
    {
      src: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/4_SARPRAS%20HUTAMA/IMG-20191119-WA0009-ncYutZ39aEgtGhqEvZoaqZ0Rcf4bZv.jpg",
      alt: "Kegiatan belajar dan praktik siswa SMK Hutama 2",
    },
    {
      src: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/3_GURU/WhatsApp%20Image%202025-05-17%20at%2013.40.06%20%281%29-VLkAsyBVKd8oQ0nXjhvThmgYezsmdl.jpeg",
      alt: "Kegiatan belajar dan praktik siswa SMK Hutama 3",
    },
    {
      src: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/4_SARPRAS%20HUTAMA/IMG-20191119-WA0022-VVoJywIAlfpS5QqP0dw4YOj5RHJmd8.jpg",
      alt: "Kegiatan belajar dan praktik siswa SMK Hutama 4",
    },
  ],
};

export const stats = [
  { label: "Akreditasi", value: "A" },
  { label: "Program Keahlian", value: "6+" },
  { label: "Siswa Aktif", value: "1000+" },
  { label: "Mitra DU/DI", value: "20+" },
];

export const majors = [
  { code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif", shortDescription: "Perawatan dan perbaikan kendaraan ringan sesuai standar industri bengkel modern." },
  { code: "TKJ", name: "Teknik Komputer dan Jaringan", shortDescription: "Jaringan komputer, server, keamanan jaringan, serta infrastruktur IT." },
  { code: "PSPT", name: "Produksi dan Siaran Program Televisi", shortDescription: "Broadcasting, produksi konten audio visual, dan media kreatif." },
  { code: "AKL", name: "Akuntansi dan Keuangan Lembaga", shortDescription: "Pembukuan, laporan keuangan, dan administrasi keuangan modern." },
  { code: "OTKP", name: "Otomatisasi dan Tata Kelola Perkantoran", shortDescription: "Administrasi perkantoran, layanan informasi, dan teknologi perkantoran." },
];

export const news: { slug: string; title: string; date: string; excerpt: string }[] = [
  {
    slug: "cbt-online",
    title: "SMK Hutama Luncurkan Sistem Ujian CBT Online",
    date: "2026-06-01",
    excerpt: "Pelaksanaan ujian kini lebih modern, aman, dan efisien dengan sistem Computer Based Test berbasis web.",
  },
  {
    slug: "ppdb-2026",
    title: "PPDB Tahun Ajaran 2026/2027 Telah Dibuka",
    date: "2026-05-20",
    excerpt: "Pendaftaran peserta didik baru dibuka untuk seluruh program keahlian unggulan SMK Hutama.",
  },
  {
    slug: "kunjungan-industri",
    title: "Kunjungan Industri Memperkuat Link & Match",
    date: "2026-05-10",
    excerpt: "Siswa mengikuti kunjungan industri ke perusahaan mitra untuk pengalaman dunia kerja nyata.",
  },
];
