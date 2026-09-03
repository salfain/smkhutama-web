import { listFaq } from "@/server/modules/landing/content";
import { HelpCircle } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";
import { FaqAccordion } from "./FaqAccordion";

export const dynamic = "force-dynamic";

export const metadata = { title: "FAQ - SMK Hutama" };

export default async function FaqPage() {
  const faqs = await listFaq();

  return (
    <>
      <PageHero
        icon={HelpCircle}
        title="Pertanyaan Umum (FAQ)"
        subtitle="Jawaban atas pertanyaan yang sering diajukan seputar PPDB, ujian, dan sekolah."
      />

      <section className="bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-16">
          {faqs.length === 0 ? (
            <p className="text-center text-ink-soft">Belum ada FAQ.</p>
          ) : (
            <FaqAccordion items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          )}
        </div>
      </section>
    </>
  );
}
