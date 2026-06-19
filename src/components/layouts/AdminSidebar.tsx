"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  Building2,
  CalendarDays,
  KeyRound,
  MonitorCheck,
  BarChart3,
  Printer,
  Settings,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

type UserInfo = { name: string; username: string; email: string | null };

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/school-profile", icon: School, label: "Profil Sekolah" },
  { href: "/admin/students", icon: Users, label: "Data Siswa" },
  { href: "/admin/teachers", icon: GraduationCap, label: "Data Guru" },
  { href: "/admin/classes", icon: Building2, label: "Kelas" },
  { href: "/admin/majors", icon: Building2, label: "Jurusan" },
  { href: "/admin/subjects", icon: BookOpen, label: "Mata Pelajaran" },
  { href: "/admin/academic-years", icon: CalendarDays, label: "Tahun Ajaran" },
  { href: "/admin/exams", icon: UserCog, label: "Jadwal Ujian" },
  { href: "/admin/tokens", icon: KeyRound, label: "Token Ujian" },
  { href: "/admin/monitoring", icon: MonitorCheck, label: "Monitoring" },
  { href: "/admin/reports", icon: BarChart3, label: "Laporan" },
  { href: "/admin/print", icon: Printer, label: "Cetak Dokumen" },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

function SidebarContent({ user }: { user: UserInfo }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm shrink-0">
            CB
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">
              CBT SMK HUTAMA
            </p>
            <p className="text-xs text-blue-600 font-medium">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
              />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.email ?? user.username}</p>
          </div>
        </div>
        <Link
          href="/admin/change-password"
          className="mb-2 flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
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

export function AdminSidebar({ user }: { user: UserInfo }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <SidebarContent user={user} />
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40 bg-white shadow-md border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SidebarContent user={user} />
        </SheetContent>
      </Sheet>
    </>
  );
}
