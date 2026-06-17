import { HomeHero } from "@/components/landing/HomeHero";
import { HomeStats } from "@/components/landing/HomeSections";
import { LandingCTA } from "@/components/landing/LandingFooter";
import { getLandingContent } from "@/lib/landing-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, heroImages, stats } = await getLandingContent().catch(() => ({
    profile: null, heroImages: [], stats: [],
  }));
  const p = profile as Record<string, unknown> | null;

  return (
    <>
      <HomeHero
        badge={p?.heroBadge as string | null}
        title={p?.heroTitle as string | null}
        subtitle={p?.heroSubtitle as string | null}
        images={heroImages}
        stats={stats}
      />
      <HomeStats stats={stats} />
      <LandingCTA ppdbOpen={(p?.ppdbOpen as boolean) ?? true} />
    </>
  );
}
