"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ClipboardList, MonitorCheck,
  CheckSquare, BarChart3, TrendingUp, ChevronRight, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/LogoutButton";

type UserInfo = { name: string; subjectName: string | null };

const navItems = [
  { href: "/teacher/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/teacher/questions",     icon: FileText,        label: "Bank Soal" },
  { href: "/teacher/exams",         icon: ClipboardList,   label: "Paket Ujian" },
  { href: "/teacher/monitoring",    icon: MonitorCheck,    label: "Monitoring" },
  { href: "/teacher/essay-grading", icon: CheckSquare,     label: "Koreksi Esai" },
  { href: "/teacher/results",       icon: BarChart3,       label: "Hasil Nilai" },
  { href: "/teacher/analysis",      icon: TrendingUp,      label: "Analisis Soal" },
];

function SidebarContent({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-sm shrink-0">CB</div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">CBT SMK HUTAMA</p>
            <p className="text-xs text-emerald-600 font-medium">Guru</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}>
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.subjectName ?? "Guru"}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

export function TeacherSidebar({ user }: { user: UserInfo }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <SidebarContent user={user} />
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-3 left-3 z-40 bg-white shadow-md border">
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
