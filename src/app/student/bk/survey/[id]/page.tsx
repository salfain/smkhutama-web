import { getSurveyForFill } from "../../survey-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SurveyFillClient } from "./SurveyFillClient";

export const dynamic = "force-dynamic";

export default async function StudentSurveyFillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurveyForFill(id);
  if (!survey) notFound();

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link href="/student/bk" className="mb-4 inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Kembali
      </Link>
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-gray-900">{survey.title}</h1>
        {survey.description && <p className="text-sm text-gray-500">{survey.description}</p>}
      </div>

      {survey.answered ? (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500" />
          <p className="font-semibold text-gray-900">Anda sudah mengisi angket ini.</p>
          <p className="text-sm text-gray-500">Terima kasih atas partisipasinya.</p>
        </div>
      ) : (
        <SurveyFillClient survey={survey} />
      )}
    </div>
  );
}
