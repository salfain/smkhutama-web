"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight, Phone, Mail, MapPin, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Profile = {
  schoolName: string;
  shortName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  officialUrl?: string | null;
  instagram?: string | null;
};

export function LandingCTA({ ppdbOpen }: { ppdbOpen: boolean }) {
  const { t } = useLanguage();
  return (
    <section className="bg-[#f8fafc] px-4 py-16 dark:bg-[#0a0a0f]">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-14 text-center text-white shadow-2xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/25 blur-[100px]" />
          <div className="animate-float-slower absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {ppdbOpen ? t("cta.title") : (t("language" as any) === "EN" ? "Digital Examination System" : "Sistem Ujian Digital")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-300">
            {ppdbOpen
              ? t("cta.subtitle")
              : (t("language" as any) === "EN" ? "Access the CBT exam system anytime, anywhere." : "Akses sistem ujian CBT kapan saja, di mana saja.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ppdbOpen && (
              <Link href="/ppdb">
                <Button size="lg" className="group gap-2 rounded-full bg-sky-400 px-8 font-semibold text-slate-900 hover:bg-sky-300 shine">
                  {t("cta.button")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 bg-white/5 px-8 text-white hover:bg-white/15">
                <LogIn className="h-4 w-4" />{t("hero.cta.login")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  return (
    <footer id="kontak" className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              {profile.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={profile.shortName} className="h-12 w-12 object-contain" />
              )}
              <div>
                <p className="font-heading text-lg font-bold text-white">{profile.schoolName}</p>
                <p className="text-xs text-slate-400">
                  {t("footer.tagline")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">{t("nav.contact")}</p>
            {profile.address && (
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />{profile.address}</p>
            )}
            {profile.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-sky-400" />{profile.phone}</p>}
            {profile.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-400" />{profile.email}</p>}
            {profile.instagram && (
              <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-400 hover:text-sky-300">
                <Globe className="h-4 w-4" />Instagram
              </a>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white">{t("footer.links.explore")}</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/ppdb" className="hover:text-white">{t("nav.ppdb")}</Link>
              <Link href="/login" className="hover:text-white">Login CBT</Link>
              {profile.officialUrl && (
                <a href={profile.officialUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">Website Resmi</a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {profile.schoolName}. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
