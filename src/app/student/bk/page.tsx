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
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#9333EA] p-5 text-white shadow-[0_16px_40px_-20px_rgba(109,40,217,0.55)]">
        <p className="font-heading text-sm font-bold tracking-wide">SIBIKONS</p>
        <h1 className="genesis-heading mt-1 text-[22px] font-extrabold leading-tight">Bimbingan Konseling</h1>
        <p className="mt-1 text-[13px] text-white/80">Poin, riwayat konseling, angket, dan ajukan permohonan konseling.</p>
      </div>
      <StudentBkClient data={data} surveys={surveys} />
    </div>
  );
}
