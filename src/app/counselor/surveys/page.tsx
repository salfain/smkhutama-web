import { listSurveys } from "../survey-actions";
import { SurveysClient } from "./SurveysClient";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const surveys = await listSurveys().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Angket / Asesmen (AKPD)</h1>
        <p className="text-sm text-gray-500">Buat angket kebutuhan siswa. Siswa mengisi lewat portal BK, hasil otomatis direkap.</p>
      </div>
      <SurveysClient surveys={surveys} />
    </div>
  );
}
