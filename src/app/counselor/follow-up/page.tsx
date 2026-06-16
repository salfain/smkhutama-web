import { getFollowUpData, listSummons } from "../reports-actions";
import { FollowUpClient } from "./FollowUpClient";

export const dynamic = "force-dynamic";

export default async function FollowUpPage() {
  const [students, summons] = await Promise.all([
    getFollowUpData().catch(() => []),
    listSummons().catch(() => []),
  ]);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Tindak Lanjut Poin</h1>
        <p className="text-sm text-gray-500">Rekomendasi SP otomatis berdasarkan poin pelanggaran & surat pemanggilan orang tua.</p>
      </div>
      <FollowUpClient students={students} summons={summons} />
    </div>
  );
}
