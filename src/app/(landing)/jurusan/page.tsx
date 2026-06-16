import { HomeMajors } from "@/components/landing/HomeSections";
import { getLandingContent } from "@/lib/landing-data";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Program Keahlian – SMK Hutama" };

export default async function JurusanPage() {
  const { majors } = await getLandingContent().catch(() => ({ majors: [] }));

  return (
    <>
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Program Keahlian Unggulan</h1>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Link & match dengan kebutuhan industri dan perguruan tinggi. Siap kerja, siap kuliah.
          </p>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>
      <HomeMajors majors={majors} />
    </>
  );
}
