// Data statis (dummy) untuk halaman Data Guru & Ekstrakurikuler.
// Bisa dipindah ke database/CMS nanti bila diperlukan.

export type Teacher = {
  name: string;
  position: string;
  subject: string;
  photo?: string | null;
};

export const TEACHERS: Teacher[] = [
  { name: "Drs. Ahmad Sudrajat, M.Pd.", position: "Kepala Sekolah", subject: "Manajemen Pendidikan", photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80" },
  { name: "Hj. Siti Nurhaliza, S.Pd.", position: "Wakil Kepala Kurikulum", subject: "Bahasa Indonesia", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
  { name: "Budi Santoso, S.Kom.", position: "Kepala Jurusan TKJ", subject: "Komputer & Jaringan", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { name: "Dewi Lestari, S.Pd.", position: "Guru", subject: "Matematika", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
  { name: "Eko Prasetyo, S.T.", position: "Kepala Jurusan TKRO", subject: "Teknik Otomotif", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { name: "Rina Wati, S.E.", position: "Kepala Jurusan AKL", subject: "Akuntansi", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
  { name: "Agus Hermawan, S.Pd.", position: "Guru", subject: "Bahasa Inggris", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { name: "Maya Sari, S.Pd.", position: "Guru", subject: "PKn", photo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80" },
  { name: "Hendra Gunawan, S.Kom.", position: "Guru Produktif", subject: "Pemrograman Web", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80" },
  { name: "Fitri Handayani, S.Pd.", position: "Guru BK", subject: "Bimbingan Konseling", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
  { name: "Joko Susilo, S.Pd.", position: "Guru", subject: "Pendidikan Jasmani", photo: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80" },
  { name: "Nur Aini, S.Ag.", position: "Guru", subject: "Pendidikan Agama Islam", photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80" },
];

export type Extracurricular = {
  name: string;
  category: string;
  description: string;
  schedule: string;
  icon: string; // nama lucide icon
  color: string; // tailwind gradient classes
  image?: string | null;
};

export const EXTRACURRICULARS: Extracurricular[] = [
  {
    name: "Pramuka",
    category: "Wajib",
    description: "Membentuk karakter disiplin, mandiri, dan jiwa kepemimpinan melalui kegiatan kepramukaan.",
    schedule: "Jumat, 14:00 – 16:00",
    icon: "Tent",
    color: "from-sky-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1533873984035-25970ab07461?w=600&q=80",
  },
  {
    name: "Futsal",
    category: "Olahraga",
    description: "Mengembangkan bakat sepak bola dan kerja sama tim dalam kompetisi antar sekolah.",
    schedule: "Selasa & Kamis, 15:30 – 17:00",
    icon: "Trophy",
    color: "from-green-500 to-emerald-600",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
  },
  {
    name: "Basket",
    category: "Olahraga",
    description: "Latihan teknik dan strategi bola basket untuk turnamen dan pengembangan fisik.",
    schedule: "Rabu, 15:30 – 17:00",
    icon: "Volleyball",
    color: "from-blue-500 to-red-600",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
  },
  {
    name: "Paskibra",
    category: "Kedisiplinan",
    description: "Pasukan Pengibar Bendera yang melatih kedisiplinan, ketegasan, dan baris-berbaris.",
    schedule: "Sabtu, 08:00 – 11:00",
    icon: "Flag",
    color: "from-red-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1551892589-865f69869476?w=600&q=80",
  },
  {
    name: "Rohis",
    category: "Keagamaan",
    description: "Kerohanian Islam untuk memperdalam ilmu agama dan kegiatan dakwah di sekolah.",
    schedule: "Jumat, 11:30 – 13:00",
    icon: "Moon",
    color: "from-teal-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&q=80",
  },
  {
    name: "English Club",
    category: "Akademik",
    description: "Meningkatkan kemampuan berbahasa Inggris melalui diskusi, debat, dan public speaking.",
    schedule: "Senin, 15:30 – 17:00",
    icon: "Languages",
    color: "from-blue-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
  },
  {
    name: "Band & Musik",
    category: "Seni",
    description: "Wadah ekspresi seni musik, mulai dari vokal, gitar, drum, hingga pentas seni.",
    schedule: "Kamis, 15:30 – 17:30",
    icon: "Music",
    color: "from-purple-500 to-fuchsia-600",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
  },
  {
    name: "Tari Tradisional",
    category: "Seni",
    description: "Melestarikan budaya nusantara melalui latihan tari tradisional dan modern.",
    schedule: "Rabu, 14:00 – 16:00",
    icon: "Sparkles",
    color: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80",
  },
  {
    name: "PMR",
    category: "Sosial",
    description: "Palang Merah Remaja yang melatih keterampilan pertolongan pertama dan kepedulian sosial.",
    schedule: "Sabtu, 09:00 – 11:00",
    icon: "HeartPulse",
    color: "from-red-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
  },
];
