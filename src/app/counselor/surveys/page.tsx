import { ClipboardList } from "lucide-react";
import { listSurveys } from "../survey-actions";
import { SurveysClient } from "./SurveysClient";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const surveys = await listSurveys().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Angket / Asesmen (AKPD)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Buat angket kebutuhan siswa. Siswa mengisi lewat portal BK, hasil otomatis direkap.</p>
        </div>
      </div>
      <SurveysClient surveys={surveys} />
    </div>
  );
}
