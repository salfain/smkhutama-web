import { ChangePasswordForm } from "@/app/profile/change-password/ChangePasswordForm";
import { requirePiketAuth } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ganti Password — Guru Piket" };

export default async function PiketChangePasswordPage() {
  await requirePiketAuth();
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Profil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ganti password akun guru piket</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
