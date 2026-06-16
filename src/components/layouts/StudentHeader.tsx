"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Trophy, HeartHandshake } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/exams",     icon: ClipboardList,   label: "Ujian Saya" },
  { href: "/student/results",   icon: Trophy,          label: "Nilai Saya" },
  { href: "/student/bk",        icon: HeartHandshake,  label: "Konseling" },
];

type UserInfo = { name: string; nis: string | null; className: string | null };

export function StudentHeader({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 font-bold text-white text-xs">CB</div>
          <span className="text-sm font-bold text-gray-900 hidden sm:block">CBT SMK HUTAMA</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
            <p className="text-xs text-gray-400">
              {user.className ?? "—"}{user.nis && ` · ${user.nis}`}
            </p>
          </div>
          <div className="w-auto">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
