"use client";

import { Award, BarChart3, BookUser, CalendarDays, ClipboardList, Gavel, Home, Inbox, LayoutDashboard, MessagesSquare, ShieldAlert } from "lucide-react";
import { GenesisSidebar } from "@/components/layouts/GenesisSidebar";

type UserInfo = { name: string };

const navItems = [
  { href: "/counselor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/counselor/agenda", icon: CalendarDays, label: "Agenda" },
  { href: "/counselor/requests", icon: Inbox, label: "Permohonan" },
  { href: "/counselor/cases", icon: MessagesSquare, label: "Sesi Konseling" },
  { href: "/counselor/violations", icon: ShieldAlert, label: "Pelanggaran" },
  { href: "/counselor/achievements", icon: Award, label: "Prestasi" },
  { href: "/counselor/follow-up", icon: Gavel, label: "Tindak Lanjut" },
  { href: "/counselor/home-visits", icon: Home, label: "Kunjungan Rumah" },
  { href: "/counselor/students", icon: BookUser, label: "Buku Siswa" },
  { href: "/counselor/surveys", icon: ClipboardList, label: "Angket" },
  { href: "/counselor/reports", icon: BarChart3, label: "Laporan" },
];

export function CounselorSidebar({ user }: { user: UserInfo }) {
  return (
    <GenesisSidebar
      brandAbbr="BK"
      brandTitle="BK SMK HUTAMA"
      brandSubtitle="Bimbingan Konseling"
      navItems={navItems}
      userName={user.name}
      userDetail="Guru BK"
      changePasswordHref="/counselor/change-password"
      printHidden
    />
  );
}
