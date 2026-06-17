import { HomeMajors } from "@/components/landing/HomeSections";
import { PageHero } from "@/components/landing/PageHero";
import { getLandingContent } from "@/lib/landing-data";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Program Keahlian – SMK Hutama" };

export default async function JurusanPage() {
  const { majors } = await getLandingContent().catch(() => ({ majors: [] }));

  return (
    <>
      <PageHero
        icon={GraduationCap}
        title="Program Keahlian Unggulan"
        subtitle="Link & match dengan kebutuhan industri dan perguruan tinggi. Siap kerja, siap kuliah."
      />
      <HomeMajors majors={majors} />
    </>
  );
}
