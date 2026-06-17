"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutDashboard, Image, BarChart3, GraduationCap,
  Newspaper, Users, Settings, LogOut, Menu, ChevronRight, ExternalLink,
  UserCog, Sparkles, Images, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cmsLogout } from "@/app/cms/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/cms/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cms/profile", icon: Settings, label: "Profil & Hero" },
  { href: "/cms/hero-images", icon: Image, label: "Gambar Hero" },
  { href: "/cms/stats", icon: BarChart3, label: "Statistik" },
  { href: "/cms/majors", icon: GraduationCap, label: "Jurusan" },
  { href: "/cms/teachers", icon: UserCog, label: "Data Guru" },
  { href: "/cms/extracurriculars", icon: Sparkles, label: "Ekstrakurikuler" },
  { href: "/cms/gallery", icon: Images, label: "Galeri" },
  { href: "/cms/news", icon: Newspaper, label: "Berita" },
  { href: "/cms/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/cms/registrations", icon: Users, label: "Pendaftar PPDB" },
];

function Content({ name }: { name: string }) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">CM</div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">CMS Landing</p>
            <p className="text-xs font-medium text-blue-600">SMK Hutama</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}>
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
          <ExternalLink className="h-4 w-4 text-gray-400" />Lihat Beranda
        </a>
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">Admin Landing</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => startTransition(async () => { await cmsLogout(); })}>
          <LogOut className="h-4 w-4" />Keluar
        </Button>
        <ThemeToggle className="w-full justify-start gap-2 h-9" />
      </div>
    </div>
  );
}

export function CmsSidebar({ name }: { name: string }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <Content name={name} />
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-3 top-3 z-40 border bg-white shadow-md lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0"><Content name={name} /></SheetContent>
      </Sheet>
    </>
  );
}
