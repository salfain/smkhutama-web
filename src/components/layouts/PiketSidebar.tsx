"use client";

import { Clock, FileText, LayoutDashboard, LogOut, Users } from "lucide-react";
import { GenesisSidebar } from "@/components/layouts/GenesisSidebar";

type UserInfo = { name: string };

const navItems = [
  { href: "/piket/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/piket/terlambat", icon: Clock, label: "Keterlambatan" },
  { href: "/piket/izin", icon: LogOut, label: "Izin Keluar/Masuk" },
  { href: "/piket/guru", icon: Users, label: "Kehadiran Guru" },
  { href: "/piket/laporan", icon: FileText, label: "Laporan" },
];

export function PiketSidebar({ user }: { user: UserInfo }) {
  return (
    <GenesisSidebar
      brandAbbr="GP"
      brandTitle="PIKET SMK HUTAMA"
      brandSubtitle="Ketertiban Harian"
      navItems={navItems}
      userName={user.name}
      userDetail="Guru Piket"
      changePasswordHref="/piket/change-password"
      printHidden
    />
  );
}
