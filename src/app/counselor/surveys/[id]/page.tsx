import { getSurveyDetail, getSurveyResults } from "../../survey-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SurveyDetailClient } from "./SurveyDetailClient";

export const dynamic = "force-dynamic";

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [survey, results] = await Promise.all([
    getSurveyDetail(id),
    getSurveyResults(id),
  ]);
  if (!survey) notFound();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Link href="/counselor/surveys" className="mb-4 inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Kembali ke Angket
      </Link>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">{survey.title}</h1>
        {survey.description && <p className="text-sm text-gray-500">{survey.description}</p>}
      </div>
      <SurveyDetailClient survey={survey} results={results} />
    </div>
  );
}
