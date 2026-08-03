import { HomeHero } from "@/components/landing/HomeHero";
import { HomeMajors, HomeNews } from "@/components/landing/HomeSections";
import { LandingCTA } from "@/components/landing/LandingFooter";
import { getLandingContent } from "@/server/modules/landing/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, heroImages, stats, majors, news } = await getLandingContent().catch(() => ({
    profile: null, heroImages: [], stats: [], majors: [], news: [],
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
      <HomeMajors majors={majors} moreHref="/jurusan" />
      <HomeNews news={news} />
      <LandingCTA ppdbOpen={(p?.ppdbOpen as boolean) ?? true} />
    </>
  );
}
