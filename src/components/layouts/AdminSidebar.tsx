"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MonitorCheck,
  Printer,
  School,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { GenesisSidebar } from "@/components/layouts/GenesisSidebar";

type UserInfo = {
  name: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";
};

const roleLabels: Record<UserInfo["role"], string> = {
  ADMIN: "Administrator",
  KURIKULUM: "Kurikulum",
  KESISWAAN: "Kesiswaan",
  ADMIN_CBT: "Admin CBT",
};

const roleTitles: Record<UserInfo["role"], string> = {
  ADMIN: "ADMIN SMK HUTAMA",
  KURIKULUM: "KURIKULUM SMK HUTAMA",
  KESISWAAN: "KESISWAAN SMK HUTAMA",
  ADMIN_CBT: "ADMIN CBT SMK HUTAMA",
};

const roleAbbr: Record<UserInfo["role"], string> = {
  ADMIN: "AD",
  KURIKULUM: "KU",
  KESISWAAN: "KS",
  ADMIN_CBT: "CB",
};

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT"] },
  { href: "/admin/school-profile", icon: School, label: "Profil Sekolah", roles: ["ADMIN"] },
  { href: "/admin/students", icon: Users, label: "Data Siswa", roles: ["ADMIN"] },
  { href: "/admin/teachers", icon: GraduationCap, label: "Data Guru", roles: ["ADMIN"] },
  { href: "/admin/majors", icon: Building2, label: "Jurusan", roles: ["ADMIN"] },
  { href: "/admin/audit-logs", icon: ScrollText, label: "Audit Log", roles: ["ADMIN"] },
  { href: "/admin/access-control", icon: ShieldCheck, label: "Akses & Penugasan", roles: ["ADMIN"] },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan", roles: ["ADMIN"] },
  { href: "/admin/classes", icon: Building2, label: "Kelas", roles: ["KURIKULUM"] },
  { href: "/admin/subjects", icon: BookOpen, label: "Mata Pelajaran", roles: ["KURIKULUM"] },
  { href: "/admin/teaching-assignments", icon: ClipboardList, label: "Pembagian Mengajar", roles: ["KURIKULUM"] },
  { href: "/admin/lesson-schedules", icon: CalendarDays, label: "Jadwal Pelajaran", roles: ["KURIKULUM"] },
  { href: "/admin/academic-years", icon: CalendarDays, label: "Tahun Ajaran", roles: ["KURIKULUM"] },
  { href: "/admin/piket-schedules", icon: CalendarDays, label: "Jadwal Piket", roles: ["KURIKULUM"] },
  { href: "/admin/exams", icon: UserCog, label: "Jadwal Ujian", roles: ["ADMIN_CBT"] },
  { href: "/admin/question-sets", icon: ClipboardList, label: "Paket Soal", roles: ["ADMIN_CBT"] },
  { href: "/admin/tokens", icon: KeyRound, label: "Token Ujian", roles: ["ADMIN_CBT"] },
  { href: "/admin/monitoring", icon: MonitorCheck, label: "Monitoring", roles: ["ADMIN_CBT"] },
  { href: "/admin/reports", icon: BarChart3, label: "Laporan", roles: ["ADMIN_CBT"] },
  { href: "/admin/print", icon: Printer, label: "Cetak Dokumen", roles: ["ADMIN_CBT"] },
  { href: "/admin/violations", icon: ShieldAlert, label: "Pelanggaran", roles: ["KESISWAAN"] },
  { href: "/admin/achievements", icon: Award, label: "Prestasi", roles: ["KESISWAAN"] },
  { href: "/admin/tardiness", icon: Clock3, label: "Rekap Terlambat", roles: ["KESISWAAN"] },
  { href: "/admin/permits", icon: ClipboardList, label: "Rekap Izin", roles: ["KESISWAAN"] },
];

export function AdminSidebar({ user }: { user: UserInfo }) {
  return (
    <GenesisSidebar
      brandAbbr={roleAbbr[user.role]}
      brandTitle={roleTitles[user.role]}
      brandSubtitle={roleLabels[user.role]}
      navItems={navItems.filter((item) => item.roles.includes(user.role))}
      userName={user.name}
      userDetail={user.email ?? user.username}
      changePasswordHref="/admin/change-password"
    />
  );
}
