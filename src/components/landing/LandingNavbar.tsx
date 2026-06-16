"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { label: "Beranda", href: "/" },
  { label: "Program Keahlian", href: "/jurusan" },
  { label: "Berita", href: "/berita" },
  { label: "Kontak", href: "/kontak" },
];

export function LandingNavbar({ logoUrl, shortName }: { logoUrl?: string | null; shortName: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-light shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={shortName} className="h-10 w-10 object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="leading-tight">
            <div className={`text-[10px] uppercase tracking-wide ${scrolled ? "text-slate-500" : "text-blue-100"}`}>
              Sekolah Menengah Kejuruan
            </div>
            <div className={`text-sm font-bold ${scrolled ? "text-slate-900" : "text-white"}`}>{shortName}</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                scrolled ? "text-slate-700 hover:bg-slate-100" : "text-blue-50 hover:bg-white/10"
              }`}>
              {item.label}
            </Link>
          ))}
          <Link href="/ppdb">
            <Button variant={scrolled ? "outline" : "ghost"} size="sm" className={scrolled ? "ml-2" : "ml-2 text-white hover:bg-white/10"}>
              Daftar PPDB
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="ml-1 gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700">
              <LogIn className="h-4 w-4" />Login CBT
            </Button>
          </Link>
          <ThemeToggle className={scrolled ? "" : "text-white hover:text-white hover:bg-white/10"} />
        </div>

        <button
          className={`inline-flex items-center justify-center rounded-md p-1.5 md:hidden ${scrolled ? "text-slate-700" : "text-white"}`}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="glass-light border-t border-white/40 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="rounded-lg py-2 text-sm font-medium text-slate-700 hover:bg-white/50">
                {item.label}
              </Link>
            ))}
            <Link href="/ppdb" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="mt-2 w-full">Daftar PPDB</Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button size="sm" className="mt-1 w-full gap-1.5 bg-blue-600 hover:bg-blue-700">
                <LogIn className="h-4 w-4" />Login CBT
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
