import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { getLandingContent } from "@/lib/landing-data";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getLandingContent().catch(() => ({ profile: null }));
  const p = profile as Record<string, unknown> | null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar logoUrl={p?.logoUrl as string | null} shortName={(p?.shortName as string) ?? "SMK Hutama"} />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter profile={{
        schoolName: (p?.schoolName as string) ?? "SMK Hutama Pondok Gede",
        shortName: (p?.shortName as string) ?? "SMK Hutama",
        tagline: p?.tagline as string | null,
        logoUrl: p?.logoUrl as string | null,
        address: p?.address as string | null,
        phone: p?.phone as string | null,
        whatsapp: p?.whatsapp as string | null,
        email: p?.email as string | null,
        officialUrl: p?.officialUrl as string | null,
        instagram: p?.instagram as string | null,
      }} />
    </div>
  );
}
