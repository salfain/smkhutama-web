"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  LogIn,
  Newspaper,
  Phone,
  Trophy,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav, type MobileNavItem } from "@/components/layouts/MobileBottomNav";
import { SheetClose } from "@/components/ui/sheet";

type NavItem = { label: string; href: string };
type NavGroup = { label: string; children: NavItem[] };

const nav: (NavItem | NavGroup)[] = [
  { label: "Beranda", href: "/" },
  {
    label: "Profil",
    children: [
      { label: "Tentang Kami", href: "/tentang" },
      { label: "Program Keahlian", href: "/jurusan" },
      { label: "Data Guru", href: "/guru" },
      { label: "Ekstrakurikuler", href: "/ekstrakurikuler" },
      { label: "Galeri", href: "/galeri" },
    ],
  },
  { label: "Berita", href: "/berita" },
  { label: "FAQ", href: "/faq" },
  { label: "Kontak", href: "/kontak" },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item;
}

// Bar bawah mobile: 3 tautan utama, sisanya masuk sheet "Lainnya".
const mobileNav: MobileNavItem[] = [
  { href: "/", icon: Home, label: "Beranda" },
  { href: "/berita", icon: Newspaper, label: "Berita" },
  { href: "/ppdb", icon: CalendarCheck, label: "PPDB" },
  { href: "/tentang", icon: Info, label: "Tentang Kami" },
  { href: "/jurusan", icon: Building2, label: "Program Keahlian" },
  { href: "/guru", icon: Users, label: "Data Guru" },
  { href: "/ekstrakurikuler", icon: Trophy, label: "Ekstrakurikuler" },
  { href: "/galeri", icon: ImageIcon, label: "Galeri" },
  { href: "/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/kontak", icon: Phone, label: "Kontak" },
];

export function LandingNavbar({ logoUrl, shortName }: { logoUrl?: string | null; shortName: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <div className="fixed inset-x-0 top-4 z-50 px-4 transition-all duration-300">
      <header
        className={`mx-auto max-w-6xl rounded-full border transition-all duration-300 ${
          scrolled
            ? "border-hairline bg-canvas-alt/75 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-canvas/85 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)]"
            : "border-hairline/60 bg-canvas-alt/45 backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
        }`}
      >
        <nav className="flex h-14 items-center justify-between pl-6 pr-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={shortName} className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
            )}
            <div className="leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text">SMK</div>
              <div className="text-xs font-extrabold text-ink tracking-tight">{shortName}</div>
            </div>
          </Link>

          {/* Links (Pill-like active state & hover) */}
          <div className="hidden items-center gap-1 md:flex">
            {nav.map((item) =>
              isGroup(item) ? (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-ink-soft transition hover:text-ink dark:hover:text-ink rounded-full hover:bg-slate-100/50 dark:hover:bg-white/5">
                    {item.label}
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="min-w-[190px] rounded-2xl border border-hairline bg-canvas-alt/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/5 dark:bg-surface/95">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-xl px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-brand-soft hover:text-ink dark:hover:text-ink"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3.5 py-1.5 text-xs font-bold text-ink-soft transition hover:text-ink dark:hover:text-ink rounded-full hover:bg-slate-100/50 dark:hover:bg-white/5"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs font-bold text-ink-soft hover:bg-brand-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-ink">
                Masuk
              </Button>
            </Link>
            <Link href="/ppdb">
              <Button size="sm" className="rounded-full bg-brand px-5 text-xs font-extrabold text-brand-ink shadow-md shadow-brand/10 hover:bg-brand-strong hover:shadow-lg hover:shadow-brand/20 active:scale-95 transition-all h-9">
                Daftar PPDB
              </Button>
            </Link>
            <div className="h-4 w-px bg-hairline mx-1" />
            <ThemeToggle className="rounded-full h-8 w-8 text-ink-soft hover:bg-brand-soft dark:hover:bg-white/10" />
          </div>

          {/* Mobile: navigasi & CTA PPDB ada di bar bawah */}
          <div className="flex items-center md:hidden">
            <ThemeToggle className="rounded-full h-8 w-8 text-ink-soft hover:bg-brand-soft dark:hover:bg-white/10" />
          </div>
        </nav>

      </header>
    </div>

      <MobileBottomNav
        items={mobileNav}
        hiddenAtClass="md:hidden"
        sheetTitle="Menu"
        sheetExtra={
          <div className="border-t border-slate-100 pt-4 dark:border-white/10">
            <SheetClose asChild>
              <Link href="/login">
                <Button size="sm" variant="outline" className="w-full rounded-full border-slate-200 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-white">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />Masuk
                </Button>
              </Link>
            </SheetClose>
          </div>
        }
      />
    </>
  );
}
