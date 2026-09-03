"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, HeartHandshake, IdCard, KeyRound, LayoutDashboard, Trophy } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SheetClose } from "@/components/ui/sheet";

const navItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/schedule", icon: CalendarDays, label: "Jadwal" },
  { href: "/student/exams", icon: ClipboardList, label: "Ujian Saya" },
  { href: "/student/results", icon: Trophy, label: "Nilai Saya" },
  { href: "/student/bk", icon: HeartHandshake, label: "Konseling" },
  { href: "/student/profile", icon: IdCard, label: "Biodata" },
];

type UserInfo = { name: string; nis: string | null; className: string | null };

function StudentAccount({ user }: { user: UserInfo }) {
  const initials = user.name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#E8E8EC] bg-[#FAFAFA] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{user.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#9C9C9C]">{user.className ?? "—"}{user.nis && ` · ${user.nis}`}</p>
        </div>
      </div>
      <NotificationCenter />
      <SheetClose asChild>
        <Link href="/student/change-password" className="mb-1 flex h-9 items-center gap-2.5 rounded-md border border-[#E8E8EC] px-3 text-xs font-medium text-[#6B6B6B] transition-colors hover:bg-[#FAFAFA] hover:text-[#0A0A0A] dark:border-white/10 dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]">
          <KeyRound className="h-3.5 w-3.5 text-[#9C9C9C]" /> Ganti Password
        </Link>
      </SheetClose>
      <ThemeToggle
        showLabel
        className="mb-1 h-9 w-full justify-start gap-2.5 rounded-md border border-[#E8E8EC] px-3 text-xs font-medium text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] dark:border-white/10 dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]"
      />
      <div className="[&_button]:h-9 [&_button]:rounded-md [&_button]:text-xs [&_button]:font-medium"><LogoutButton /></div>
    </>
  );
}

export function StudentHeader({ user, system }: { user: UserInfo; system: "CBT" | "SIBIKONS" }) {
  const pathname = usePathname();
  const brandTitle = system === "SIBIKONS" ? "BK SMK HUTAMA" : "SISWA SMK HUTAMA";
  const brandAbbr = system === "SIBIKONS" ? "BK" : "SW";
  // Biodata dipakai kedua sistem; menu Konseling hanya untuk SIBIKONS.
  const filteredNavItems = navItems.filter((item) =>
    item.href === "/student/profile"
      ? true
      : system === "SIBIKONS"
        ? item.href === "/student/bk"
        : item.href !== "/student/bk",
  );

  return (
    <>
      <header className="genesis-dashboard sticky top-0 z-30 hidden h-16 border-b border-[#E8E8EC] bg-[#FFFFFF]/90 backdrop-blur-xl lg:block dark:border-white/10 dark:bg-[#161618]/90">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="genesis-heading flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-white">{brandAbbr}</div>
            <span className="genesis-heading text-[13px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">{brandTitle}</span>
          </div>
          <nav className="flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={`flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors ${active ? "bg-brand text-white" : "text-[#6B6B6B] hover:bg-[#F5F5F7] hover:text-[#0A0A0A] dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]"}`}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="mr-1 text-right">
              <p className="text-xs font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{user.name}</p>
              <p className="text-[11px] text-[#9C9C9C]">{user.className ?? "—"}</p>
            </div>
            <NotificationCenter compact />
            <Link href="/student/change-password" className="flex h-9 w-9 items-center justify-center rounded-md text-[#6B6B6B] hover:bg-[#F5F5F7] dark:text-[#A7A7AE] dark:hover:bg-white/5" title="Ganti Password"><KeyRound className="h-4 w-4" /></Link>
            <ThemeToggle />
            <div className="w-9 overflow-hidden [&_button]:w-9 [&_button]:px-2 [&_button]:text-transparent [&_svg]:shrink-0"><LogoutButton /></div>
          </div>
        </div>
      </header>

      <MobileBottomNav
        items={filteredNavItems}
        sheetTitle="Menu & akun"
        sheetExtra={
          <div className="border-t border-[#E8E8EC] pt-4 dark:border-white/10">
            <StudentAccount user={user} />
          </div>
        }
      />
    </>
  );
}
