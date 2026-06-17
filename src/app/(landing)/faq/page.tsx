import { prisma } from "@/lib/prisma";
import { HelpCircle } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";
import { FaqAccordion } from "./FaqAccordion";

export const dynamic = "force-dynamic";

export const metadata = { title: "FAQ – SMK Hutama" };

export default async function FaqPage() {
  const faqs = await prisma.landingFaq
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);

  return (
    <>
      <PageHero
        icon={HelpCircle}
        title="Pertanyaan Umum (FAQ)"
        subtitle="Jawaban atas pertanyaan yang sering diajukan seputar PPDB, ujian, dan sekolah."
      />

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-16">
          {faqs.length === 0 ? (
            <p className="text-center text-slate-400">Belum ada FAQ.</p>
          ) : (
            <FaqAccordion items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          )}
        </div>
      </section>
    </>
  );
}
