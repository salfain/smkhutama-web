"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, GraduationCap, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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

export function LandingNavbar({ logoUrl, shortName }: { logoUrl?: string | null; shortName: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 border-b border-slate-200/80 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/5 dark:bg-[#09090b]/80 dark:shadow-[0_2px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={shortName} className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                  <GraduationCap className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">SMK</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{shortName}</div>
            </div>
          </Link>

          {/* Center Links (Anara Style: clean spacing, hover line indicator) */}
          <div className="hidden items-center gap-2 md:flex">
            {nav.map((item) =>
              isGroup(item) ? (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="min-w-[200px] rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-black/5 dark:border-white/5 dark:bg-[#0f0f17]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
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
                  className="relative px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Right Actions (Anara Style: minimalist, border-less search + outline button) */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                Masuk
              </Button>
            </Link>
            <Link href="/ppdb">
              <Button size="sm" className="rounded-full bg-sky-600 px-5 text-xs font-bold text-white shadow-md shadow-sky-600/10 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-600/20 active:scale-95 transition-all">
                Daftar PPDB
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 ml-1 mr-1" />
            <ThemeToggle className="rounded-full h-8 w-8 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle className="rounded-full h-8 w-8 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" />
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-md dark:border-white/5 dark:bg-[#09090b]/95 md:hidden">
            <div className="flex flex-col gap-1.5">
              {nav.map((item) =>
                isGroup(item) ? (
                  <div key={item.label} className="py-1">
                    <button
                      onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      {item.label}
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openGroup === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {openGroup === item.label && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-100 pl-3 dark:border-white/5">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} onClick={() => setOpen(false)}
                            className="rounded-md py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                    {item.label}
                  </Link>
                )
              )}
              <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full rounded-full border-slate-200 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-white">
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />Masuk
                  </Button>
                </Link>
                <Link href="/ppdb" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full rounded-full bg-sky-600 text-xs font-bold text-white hover:bg-sky-500">
                    Daftar PPDB
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
