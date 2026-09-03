import { GraduationCap, Users, ShieldCheck, HeartHandshake, ClipboardList } from "lucide-react";

/**
 * Tabel portal login - satu sumber untuk route, formulir, dan validasi server.
 *
 * Tiap portal adalah satu pintu masuk dengan URL sendiri (`/login/siswa`,
 * `/login/guru`, …) sehingga tautannya bisa dibagikan langsung ke kelompok
 * yang dituju. Yang membedakan pintu bukan tampilannya, melainkan `roles`:
 * daftar peran yang boleh lewat situ, dipakai [actions.ts] untuk menolak akun
 * yang salah pintu setelah kredensialnya terbukti benar.
 *
 * Pengguna tidak pernah memilih perannya sendiri. Peran dibaca dari akun;
 * pilihan pengguna hanya sebatas pintu mana yang ia buka.
 */

export type Role =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "COUNSELOR"
  | "PIKET"
  | "KURIKULUM"
  | "KESISWAAN"
  | "ADMIN_CBT";

/** Sub-sistem yang dituju; menentukan syarat tambahan di sisi server. */
export type System = "CBT" | "SIBIKONS" | "PIKET";

export type Portal = "siswa" | "guru" | "staf" | "sibikons" | "piket";

/** Portal CBT ditampilkan sebagai satu kelompok di halaman pemilih. */
export const PORTAL_GROUPS: { label: string; hint: string; portals: Portal[] }[] = [
  {
    label: "CBT - Ujian Online",
    hint: "Sistem ujian digital sekolah",
    portals: ["siswa", "guru", "staf"],
  },
  {
    label: "Sistem lain",
    hint: "Bimbingan konseling dan ketertiban harian",
    portals: ["sibikons", "piket"],
  },
];

export const portalPath = (portal: Portal) => `/login/${portal}`;

/**
 * Warna per portal ditulis sebagai kelas utuh - Tailwind memindai kelas secara
 * statis, jadi nama kelas tidak boleh dirangkai dari potongan string.
 */
const themes = {
  blue: {
    panel: "from-blue-600 via-blue-700 to-indigo-800",
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500/40",
    bar: "from-blue-500 to-indigo-600",
    icon: "bg-blue-600",
    card: "hover:border-blue-500 hover:ring-blue-500/15",
    text: "text-blue-700 dark:text-blue-400",
    field: "focus-within:border-blue-500 focus-within:ring-blue-500/20",
    glow: "bg-blue-500/25",
  },
  emerald: {
    panel: "from-emerald-600 via-emerald-700 to-teal-800",
    button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500/40",
    bar: "from-emerald-500 to-teal-600",
    icon: "bg-emerald-600",
    card: "hover:border-emerald-500 hover:ring-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    field: "focus-within:border-emerald-500 focus-within:ring-emerald-500/20",
    glow: "bg-emerald-500/25",
  },
  slate: {
    panel: "from-slate-700 via-slate-800 to-slate-900",
    button: "bg-slate-800 hover:bg-slate-900 focus-visible:ring-slate-500/40",
    bar: "from-slate-600 to-slate-800",
    icon: "bg-slate-800",
    card: "hover:border-slate-500 hover:ring-slate-500/15",
    text: "text-slate-800 dark:text-slate-200",
    field: "focus-within:border-slate-500 focus-within:ring-slate-500/20",
    glow: "bg-slate-500/25",
  },
  purple: {
    panel: "from-purple-600 via-purple-700 to-fuchsia-800",
    button: "bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-500/40",
    bar: "from-purple-500 to-fuchsia-600",
    icon: "bg-purple-600",
    card: "hover:border-purple-500 hover:ring-purple-500/15",
    text: "text-purple-700 dark:text-purple-400",
    field: "focus-within:border-purple-500 focus-within:ring-purple-500/20",
    glow: "bg-purple-500/25",
  },
  amber: {
    panel: "from-amber-500 via-orange-500 to-orange-600",
    button: "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500/40",
    bar: "from-amber-400 to-orange-500",
    icon: "bg-amber-500",
    card: "hover:border-amber-500 hover:ring-amber-500/15",
    text: "text-amber-700 dark:text-amber-500",
    field: "focus-within:border-amber-500 focus-within:ring-amber-500/20",
    glow: "bg-amber-500/25",
  },
} as const;

export type PortalDef = {
  /** Nama pendek untuk judul tab dan pesan kesalahan. */
  name: string;
  title: string;
  subtitle: string;
  button: string;
  /** Ringkasan siapa yang dilayani, tampil di halaman pemilih. */
  audience: string;
  system: System;
  roles: Role[];
  /** Siswa masuk dengan NIS/NISN, selebihnya dengan username. */
  identity: "NIS" | "USERNAME";
  placeholder: string;
  icon: typeof GraduationCap;
  tagline: string;
  features: string[];
  theme: (typeof themes)[keyof typeof themes];
};

export const portals: Record<Portal, PortalDef> = {
  siswa: {
    name: "Login Siswa",
    title: "Masuk Siswa",
    subtitle: "Ujian online dan hasil belajar",
    button: "Masuk sebagai Siswa",
    audience: "Siswa SMK Hutama",
    system: "CBT",
    roles: ["STUDENT"],
    identity: "NIS",
    placeholder: "2324001",
    icon: GraduationCap,
    tagline: "Kerjakan ujian, lihat jadwal, dan pantau hasil belajar Anda dari satu tempat.",
    features: ["Ujian bergaya TKA/CBT", "Jawaban tersimpan otomatis", "Jadwal ujian terbaru", "Hasil & nilai akhir"],
    theme: themes.blue,
  },
  guru: {
    name: "Login Guru",
    title: "Masuk Guru",
    subtitle: "Kelola soal, ujian, dan penilaian",
    button: "Masuk sebagai Guru",
    audience: "Guru mata pelajaran",
    system: "CBT",
    roles: ["TEACHER"],
    identity: "USERNAME",
    placeholder: "sari.dewi",
    icon: Users,
    tagline: "Susun bank soal, jadwalkan ujian, pantau peserta secara langsung, dan nilai jawaban esai.",
    features: ["Bank soal & paket ujian", "Monitoring peserta langsung", "Penilaian esai", "Rekap nilai per kelas"],
    theme: themes.emerald,
  },
  staf: {
    name: "Login Staf",
    title: "Masuk Staf Sekolah",
    subtitle: "Admin, Kurikulum, Kesiswaan, dan Admin CBT",
    button: "Masuk sebagai Staf",
    audience: "Admin · Kurikulum · Kesiswaan · Admin CBT",
    system: "CBT",
    roles: ["ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT"],
    identity: "USERNAME",
    placeholder: "admin",
    icon: ShieldCheck,
    tagline: "Pengelolaan data induk sekolah: pengguna, kelas, jurusan, jadwal ujian, dan laporan menyeluruh.",
    features: ["Data siswa, guru & kelas", "Pengaturan ujian sekolah", "Laporan & analisis", "Pengaturan sistem"],
    theme: themes.slate,
  },
  sibikons: {
    name: "Login SIBIKONS",
    title: "SIBIKONS - Bimbingan Konseling",
    subtitle: "Untuk Guru BK dan Siswa",
    button: "Masuk ke SIBIKONS",
    audience: "Guru BK · Siswa",
    system: "SIBIKONS",
    roles: ["COUNSELOR", "STUDENT"],
    identity: "USERNAME",
    placeholder: "bk.hutama",
    icon: HeartHandshake,
    tagline: "Sistem informasi bimbingan konseling untuk mengelola sesi konseling, poin pelanggaran, dan prestasi siswa.",
    features: ["Catatan sesi konseling", "Poin pelanggaran siswa", "Pencatatan prestasi", "Ajukan konseling (siswa)"],
    theme: themes.purple,
  },
  piket: {
    name: "Login Piket",
    title: "Guru Piket",
    subtitle: "Untuk guru yang sedang terjadwal piket",
    button: "Masuk sebagai Guru Piket",
    audience: "Guru yang terjadwal piket hari ini",
    system: "PIKET",
    roles: ["TEACHER"],
    identity: "USERNAME",
    placeholder: "piket.hutama",
    icon: ClipboardList,
    tagline: "Sistem pencatatan ketertiban harian: kehadiran guru, keterlambatan siswa, dan izin keluar/masuk.",
    features: ["Catat keterlambatan siswa", "Pantau izin keluar/masuk", "Rekap kehadiran guru", "Dashboard harian"],
    theme: themes.amber,
  },
};

/**
 * Portal yang sebaiknya dipakai oleh sebuah peran.
 *
 * Dipakai untuk mengarahkan pengguna yang membuka pintu keliru - kredensialnya
 * benar, hanya salah halaman, jadi lebih baik ditunjukkan pintu yang tepat
 * daripada sekadar ditolak. Portal khusus (SIBIKONS, piket) sengaja tidak
 * disarankan otomatis karena punya syarat tambahan sendiri.
 */
export function suggestedPortal(role: Role): Portal | null {
  if (role === "STUDENT") return "siswa";
  if (role === "TEACHER") return "guru";
  if (role === "COUNSELOR") return "sibikons";
  if (portals.staf.roles.includes(role)) return "staf";
  return null;
}
