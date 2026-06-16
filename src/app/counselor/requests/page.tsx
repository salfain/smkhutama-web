import { listRequests } from "../actions";
import { RequestsClient } from "./RequestsClient";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await listRequests().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Permohonan Konseling</h1>
        <p className="text-sm text-gray-500">Permohonan konseling yang diajukan siswa.</p>
      </div>
      <RequestsClient requests={requests} />
    </div>
  );
}
