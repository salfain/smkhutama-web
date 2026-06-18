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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4 transition-all duration-300">
      <header
        className={`mx-auto max-w-6xl rounded-full border transition-all duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/75 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#09090b]/80 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)]"
            : "border-slate-200/40 bg-white/45 backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
        }`}
      >
        <nav className="flex h-14 items-center justify-between pl-6 pr-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={shortName} className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
            )}
            <div className="leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">SMK</div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight">{shortName}</div>
            </div>
          </Link>

          {/* Links (Pill-like active state & hover) */}
          <div className="hidden items-center gap-1 md:flex">
            {nav.map((item) =>
              isGroup(item) ? (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-100/50 dark:hover:bg-white/5">
                    {item.label}
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="min-w-[190px] rounded-2xl border border-slate-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/5 dark:bg-[#0f0f17]/95">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
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
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-100/50 dark:hover:bg-white/5"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                Masuk
              </Button>
            </Link>
            <Link href="/ppdb">
              <Button size="sm" className="rounded-full bg-sky-600 px-5 text-xs font-extrabold text-white shadow-md shadow-sky-600/10 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-600/20 active:scale-95 transition-all h-9">
                Daftar PPDB
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />
            <ThemeToggle className="rounded-full h-8 w-8 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" />
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle className="rounded-full h-8 w-8 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" />
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu (with rounded bottom matching the header pill) */}
        {open && (
          <div className="border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-white/5 dark:bg-[#09090b]/95 rounded-b-3xl md:hidden">
            <div className="flex flex-col gap-1">
              {nav.map((item) =>
                isGroup(item) ? (
                  <div key={item.label} className="py-0.5">
                    <button
                      onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      {item.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openGroup === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {openGroup === item.label && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-100 pl-3 dark:border-white/5">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} onClick={() => setOpen(false)}
                            className="rounded-md py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                    {item.label}
                  </Link>
                )
              )}
              <div className="h-px bg-slate-100 dark:bg-white/5 my-2.5" />
              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full rounded-full border-slate-200 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-white">
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
