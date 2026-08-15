import { Inbox } from "lucide-react";
import { listRequests } from "../actions";
import { RequestsClient } from "./RequestsClient";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await listRequests().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <Inbox className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Permohonan Konseling</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Permohonan konseling yang diajukan siswa.</p>
        </div>
      </div>
      <RequestsClient requests={requests} />
    </div>
  );
}
