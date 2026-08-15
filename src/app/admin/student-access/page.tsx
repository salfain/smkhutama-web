import { LogIn } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getStudentAccess } from "./actions";
import { StudentAccessForm } from "./StudentAccessForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akses Login Siswa" };

export default async function StudentAccessPage() {
  await requireAuth("ADMIN_CBT");
  const access = await getStudentAccess().catch(() => null);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Akses Login Siswa
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atur dari mana siswa boleh masuk ke sistem CBT.
          </p>
        </div>
      </div>
      {access ? (
        <StudentAccessForm access={access} />
      ) : (
        <p className="text-sm text-red-600 dark:text-red-300">
          Database belum tersambung. Pastikan koneksi Postgres sudah benar di .env.
        </p>
      )}
    </div>
  );
}
