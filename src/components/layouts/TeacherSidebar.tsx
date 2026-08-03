"use client";

import { BarChart3, CalendarDays, CheckSquare, ClipboardList, HeartHandshake, LayoutDashboard, MonitorCheck, TrendingUp } from "lucide-react";
import { GenesisSidebar } from "@/components/layouts/GenesisSidebar";

type UserInfo = { name: string; subjectName: string | null };

const navItems = [
  { href: "/teacher/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/teacher/schedule", icon: CalendarDays, label: "Jadwal Mengajar" },
  { href: "/teacher/question-sets", icon: ClipboardList, label: "Paket Bank Soal" },
  { href: "/teacher/monitoring", icon: MonitorCheck, label: "Monitoring" },
  { href: "/teacher/essay-grading", icon: CheckSquare, label: "Koreksi Esai" },
  { href: "/teacher/results", icon: BarChart3, label: "Hasil Nilai" },
  { href: "/teacher/analysis", icon: TrendingUp, label: "Analisis Soal" },
  { href: "/teacher/bk", icon: HeartHandshake, label: "BK Perwalian" },
];

export function TeacherSidebar({ user }: { user: UserInfo }) {
  return (
    <GenesisSidebar
      brandAbbr="GR"
      brandTitle="GURU SMK HUTAMA"
      brandSubtitle="CBT · Ruang Pengajar"
      navItems={navItems}
      userName={user.name}
      userDetail={user.subjectName ?? "Guru"}
      changePasswordHref="/teacher/change-password"
    />
  );
}
