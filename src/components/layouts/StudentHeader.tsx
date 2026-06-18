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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

type UserInfo = { name: string; nis: string | null; className: string | null };

export function StudentHeader({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  const system = getCookie("student-system") || "CBT";

  const logoText = system === "SIBIKONS" ? "BK SMK HUTAMA" : "CBT SMK HUTAMA";
  const logoAbbr = system === "SIBIKONS" ? "BK" : "CB";
  const logoBg = system === "SIBIKONS" ? "bg-purple-600" : "bg-blue-500";
  const activeLinkClass = system === "SIBIKONS" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600";

  const filteredNavItems = navItems.filter((item) => {
    if (system === "SIBIKONS") {
      return item.href === "/student/bk";
    } else {
      return item.href !== "/student/bk";
    }
  });

  return (
    <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-xs transition-colors duration-300 ${logoBg}`}>
            {logoAbbr}
          </div>
          <span className="text-sm font-bold text-gray-900 hidden sm:block transition-all duration-300">
            {logoText}
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {filteredNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? activeLinkClass : "text-gray-600 hover:bg-gray-100"
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
