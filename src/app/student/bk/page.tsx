import { getMyBkData } from "./actions";
import { listAvailableSurveys } from "./survey-actions";
import { StudentBkClient } from "./StudentBkClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentBkPage() {
  const c = await cookies();
  const system = c.get("student-system")?.value || "CBT";
  if (system === "CBT") redirect("/student/dashboard");

  const [data, surveys] = await Promise.all([
    getMyBkData(),
    listAvailableSurveys().catch(() => []),
  ]);
  if (!data) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-gray-500">Data siswa tidak ditemukan.</div>;
  }
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-gray-900">Bimbingan Konseling</h1>
        <p className="text-sm text-gray-500">Poin, riwayat konseling, angket, dan ajukan permohonan konseling.</p>
      </div>
      <StudentBkClient data={data} surveys={surveys} />
    </div>
  );
}
