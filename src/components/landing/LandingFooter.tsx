import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight, Phone, Mail, MapPin, Globe } from "lucide-react";

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
  return (
    <section className="bg-white px-4 py-16">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] mesh-bg px-6 py-14 text-center text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="animate-float-slower absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {ppdbOpen ? "Bergabung Bersama Kami" : "Sistem Ujian Digital"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-blue-100">
            {ppdbOpen
              ? "Pendaftaran peserta didik baru telah dibuka. Daftar online sekarang, mudah dan cepat."
              : "Akses sistem ujian CBT kapan saja, di mana saja."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ppdbOpen && (
              <Link href="/ppdb">
                <Button size="lg" className="group gap-2 rounded-full bg-white px-8 font-semibold text-blue-700 hover:bg-blue-50 shine">
                  Daftar PPDB Online
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 glass px-8 text-white hover:bg-white/15">
                <LogIn className="h-4 w-4" />Login CBT
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ profile }: { profile: Profile }) {
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
                {profile.tagline && <p className="text-xs text-slate-400">{profile.tagline}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Kontak</p>
            {profile.address && (
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />{profile.address}</p>
            )}
            {profile.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" />{profile.phone}</p>}
            {profile.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-400" />{profile.email}</p>}
            {profile.instagram && (
              <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                <Globe className="h-4 w-4" />Instagram
              </a>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white">Tautan</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/ppdb" className="hover:text-white">Pendaftaran Online (PPDB)</Link>
              <Link href="/login" className="hover:text-white">Login Sistem CBT</Link>
              {profile.officialUrl && (
                <a href={profile.officialUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">Website Resmi</a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {profile.schoolName}. Sistem CBT & Landing Page.
        </div>
      </div>
    </footer>
  );
}
