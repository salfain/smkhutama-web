"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, LogOut as LogOutIcon, Menu, ChevronRight, FileText, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

type UserInfo = { name: string };

const navItems = [
  { href: "/piket/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/piket/terlambat",  icon: Clock,           label: "Keterlambatan" },
  { href: "/piket/izin",       icon: LogOutIcon,      label: "Izin Keluar/Masuk" },
  { href: "/piket/guru",       icon: Users,           label: "Kehadiran Guru" },
  { href: "/piket/laporan",    icon: FileText,        label: "Laporan" },
];

function SidebarContent({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 font-bold text-white text-sm shrink-0">GP</div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">Guru Piket</p>
            <p className="text-xs text-amber-600 font-medium">Ketertiban Harian</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active ? "bg-amber-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}>
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"}`} />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0 dark:bg-amber-900/30 dark:text-amber-400">
            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-gray-400">Guru Piket</p>
          </div>
        </div>
        <Link
          href="/piket/change-password"
          className="mb-2 flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 dark:border-slate-700/50 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <KeyRound className="h-3.5 w-3.5 text-amber-500" />
          Ganti Password
        </Link>
        <LogoutButton />
        <ThemeToggle className="w-full justify-start gap-2 h-9" />
      </div>
    </div>
  );
}

export function PiketSidebar({ user }: { user: UserInfo }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-white dark:bg-slate-900 dark:border-slate-800 lg:flex lg:flex-col print:hidden">
        <SidebarContent user={user} />
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-3 left-3 z-40 bg-white shadow-md border print:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 print:hidden">
          <SidebarContent user={user} />
        </SheetContent>
      </Sheet>
    </>
  );
}
