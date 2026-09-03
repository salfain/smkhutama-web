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
    <section className="bg-canvas px-4 py-16">
      {/* Kartu memakai --anchor: navy di mode terang, cokelat-arang di mode gelap.
          Di kanvas hitam hangat, kartu navy terbaca sebagai warna asing. */}
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-br from-anchor to-anchor-soft px-6 py-14 text-center text-white shadow-2xl ring-1 ring-brand/20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/15 blur-[100px]" />
          <div className="animate-float-slower absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-brand-strong/10 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-[#E5DED0] md:text-4xl">
            {ppdbOpen ? "Bergabung Bersama Kami" : "Sistem Ujian Digital"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#B8AF9F]">
            {ppdbOpen
              ? "Pendaftaran peserta didik baru telah dibuka. Daftar online sekarang, mudah dan cepat."
              : "Akses sistem ujian CBT kapan saja, di mana saja."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ppdbOpen && (
              <Link href="/ppdb">
                <Button size="lg" className="group gap-2 rounded-full bg-brand px-8 font-semibold text-brand-ink hover:bg-brand-strong shine">
                  Daftar PPDB Online
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 bg-white/5 px-8 text-white hover:bg-white/15">
                <LogIn className="h-4 w-4" />Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ profile }: { profile: Profile }) {
  // Tanpa penjaga ini, judul "Kontak" tetap tampil di atas kolom kosong saat
  // profil sekolah belum diisi.
  const hasContact = Boolean(profile.address || profile.phone || profile.email || profile.instagram);

  return (
    // Footer selalu gelap di kedua mode, jadi warnanya dipatok - bukan token
    // yang ikut berbalik. Emas dipakai versi terang (#FBBF24) karena
    // --brand-text di mode terang terlalu gelap untuk latar sepekat ini.
    // pb di mobile = tinggi bar mengambang (64px + jarak 12px) + area aman,
    // supaya konten terakhir tidak tertutup bar tanpa menyisakan ruang kosong.
    <footer
      id="kontak"
      className="bg-[#0E0C08] text-[#A69E90] pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0"
    >
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 md:pb-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              {profile.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={profile.shortName} className="h-12 w-12 object-contain" />
              )}
              <div>
                <p className="font-heading text-lg font-bold text-[#E5DED0]">{profile.schoolName}</p>
                {profile.tagline && <p className="text-xs text-[#8C8579]">{profile.tagline}</p>}
              </div>
            </div>
          </div>

          {hasContact && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#E5DED0]">Kontak</p>
              {profile.address && (
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" />{profile.address}</p>
              )}
              {profile.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#FBBF24]" />{profile.phone}</p>}
              {profile.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#FBBF24]" />{profile.email}</p>}
              {profile.instagram && (
                <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#FBBF24] hover:text-[#FCD34D]">
                  <Globe className="h-4 w-4" />Instagram
                </a>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="font-semibold text-[#E5DED0]">Tautan</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/ppdb" className="hover:text-[#E5DED0]">Pendaftaran Online (PPDB)</Link>
              <Link href="/login" className="hover:text-[#E5DED0]">Login Sistem CBT</Link>
              {profile.officialUrl && (
                <a href={profile.officialUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#E5DED0]">Website Resmi</a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#7C7568]">
          {"© 2026 Muhammad Sya'ban Alfain. Hak Cipta Dilindungi"}
        </div>
      </div>
    </footer>
  );
}
