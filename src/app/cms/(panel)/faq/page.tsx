import { getFaqs } from "../content-actions";
import { FaqClient } from "./FaqClient";

export const dynamic = "force-dynamic";

export default async function FaqCmsPage() {
  const faqs = await getFaqs().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">FAQ</h1>
        <p className="text-sm text-gray-500">Kelola pertanyaan umum yang tampil di halaman /faq</p>
      </div>
      <FaqClient faqs={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
    </div>
  );
}
