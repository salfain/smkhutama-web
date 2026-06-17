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
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <header
        className={`mx-auto max-w-6xl rounded-2xl border transition-all duration-300 ${
          scrolled
            ? "border-slate-200 bg-white/85 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/85 dark:shadow-black/30"
            : "border-slate-200/70 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
        }`}
      >
        <nav className="flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={shortName} className="h-9 w-9 object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400">
                <GraduationCap className="h-5 w-5 text-slate-900" />
              </div>
            )}
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300/80">SMK</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{shortName}</div>
            </div>
          </Link>

          {/* Center nav */}
          <div className="hidden items-center gap-1 md:flex">
            {nav.map((item) =>
              isGroup(item) ? (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="min-w-[210px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#0f0f17]">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-sky-400/10 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button size="sm" variant="outline" className="rounded-full border-slate-300 bg-transparent px-5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/ppdb">
              <Button size="sm" className="rounded-full bg-sky-400 px-5 font-semibold text-slate-900 hover:bg-sky-300">
                Daftar PPDB
              </Button>
            </Link>
            <ThemeToggle className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white dark:hover:bg-white/10 dark:hover:text-white" />
          </div>

          <button
            className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-700 dark:text-white md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-slate-200 dark:border-white/10 md:hidden">
            <div className="flex flex-col gap-1 px-4 py-3">
              {nav.map((item) =>
                isGroup(item) ? (
                  <div key={item.label}>
                    <button
                      onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}
                      className="flex w-full items-center justify-between rounded-lg py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      {item.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${openGroup === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {openGroup === item.label && (
                      <div className="ml-3 flex flex-col gap-1 border-l-2 border-sky-400/40 pl-3">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} onClick={() => setOpen(false)}
                            className="rounded-lg py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="rounded-lg py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                    {item.label}
                  </Link>
                )
              )}
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button size="sm" variant="outline" className="mt-2 w-full rounded-full border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                  <LogIn className="h-4 w-4" />Login
                </Button>
              </Link>
              <Link href="/ppdb" onClick={() => setOpen(false)}>
                <Button size="sm" className="mt-1 w-full rounded-full bg-sky-400 font-semibold text-slate-900 hover:bg-sky-300">
                  Daftar PPDB
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
