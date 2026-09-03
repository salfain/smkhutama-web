import { getLandingContent } from "@/server/modules/landing/content";
import { Phone, Mail, MapPin, Globe, MessageCircle } from "lucide-react";
import { RevealContainer, RevealItem, RevealCard } from "@/components/landing/Reveal";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kontak - SMK Hutama" };

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
      <PageHero
        icon={Phone}
        title="Hubungi Kami"
        subtitle="Jangan ragu untuk menghubungi kami terkait informasi sekolah, pendaftaran, atau kerja sama."
      />

      <section className="bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <RevealContainer className="grid gap-5 md:grid-cols-2">
            {contacts.map((c, i) => (
              <RevealCard key={i} className="">
                <a
                  href={c.href ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-3xl border border-hairline bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong shadow transition-transform group-hover:scale-110">
                    <c.icon className="h-5 w-5 text-slate-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{c.label}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{c.value}</p>
                    <p className="mt-2 text-xs font-semibold text-brand-text opacity-0 transition-opacity group-hover:opacity-100">
                      {c.action} →
                    </p>
                  </div>
                </a>
              </RevealCard>
            ))}
          </RevealContainer>

          <RevealContainer className="mt-12 text-center">
            <RevealItem>
              <p className="text-sm text-ink-soft">
                Jam operasional: Senin - Jumat, 07:00 - 15:00 WIB
              </p>
            </RevealItem>
          </RevealContainer>
        </div>
      </section>
    </>
  );
}
