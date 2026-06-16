import { getLandingContent } from "@/lib/landing-data";
import { Phone, Mail, MapPin, Globe, MessageCircle } from "lucide-react";
import { RevealContainer, RevealItem, RevealCard } from "@/components/landing/Reveal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kontak – SMK Hutama" };

export default async function KontakPage() {
  const { profile } = await getLandingContent().catch(() => ({ profile: null }));
  const p = profile as Record<string, unknown> | null;

  const address = p?.address as string | null;
  const phone = p?.phone as string | null;
  const whatsapp = p?.whatsapp as string | null;
  const email = p?.email as string | null;
  const officialUrl = p?.officialUrl as string | null;

  // Buat link yang bisa diklik langsung
  const contacts = [
    {
      icon: MapPin, label: "Alamat", value: address,
      href: address ? `https://www.google.com/maps/search/${encodeURIComponent(address)}` : null,
      action: "Buka di Google Maps",
    },
    {
      icon: Phone, label: "Telepon", value: phone,
      href: phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : null,
      action: "Hubungi sekarang",
    },
    {
      icon: MessageCircle, label: "WhatsApp", value: whatsapp,
      href: whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}` : null,
      action: "Chat via WhatsApp",
    },
    {
      icon: Mail, label: "Email", value: email,
      href: email ? `mailto:${email}` : null,
      action: "Kirim email",
    },
    {
      icon: Globe, label: "Website Resmi", value: officialUrl,
      href: officialUrl,
      action: "Kunjungi website",
    },
  ].filter((c) => c.value);

  return (
    <>
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <Phone className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Hubungi Kami</h1>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Jangan ragu untuk menghubungi kami terkait informasi sekolah, pendaftaran, atau kerja sama.
          </p>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <RevealContainer className="grid gap-5 md:grid-cols-2">
            {contacts.map((c, i) => (
              <RevealCard key={i} className="">
                <a
                  href={c.href ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow transition-transform group-hover:scale-110">
                    <c.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{c.value}</p>
                    <p className="mt-2 text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                      {c.action} →
                    </p>
                  </div>
                </a>
              </RevealCard>
            ))}
          </RevealContainer>

          <RevealContainer className="mt-12 text-center">
            <RevealItem>
              <p className="text-sm text-slate-500">
                Jam operasional: Senin – Jumat, 07:00 – 15:00 WIB
              </p>
            </RevealItem>
          </RevealContainer>
        </div>
      </section>
    </>
  );
}
