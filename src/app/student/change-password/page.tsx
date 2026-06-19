import { ChangePasswordForm } from "@/app/profile/change-password/ChangePasswordForm";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ganti Password — Siswa" };

export default async function StudentChangePasswordPage() {
  await requireAuth("STUDENT");
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-md mx-auto space-y-4">
      <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard
      </Link>
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Profil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ganti password akun siswa Anda</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
