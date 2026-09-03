import { ShieldCheck } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { AccessControlClient } from "./AccessControlClient";
import { getAccessControlData } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akses & Penugasan" };

export default async function AccessControlPage() {
  await requireAuth("ADMIN");
  const data = await getAccessControlData();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Akses & Penugasan</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pilih satu pengguna, lalu beri tanggung jawab tambahan, atur pengecualian izin, atau kirim pesan.</p>
        </div>
      </div>
      <AccessControlClient data={data} />
    </div>
  );
}
