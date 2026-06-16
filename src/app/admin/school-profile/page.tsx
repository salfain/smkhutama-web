import { School } from "lucide-react";
import { getSchoolProfile } from "./actions";
import { SchoolProfileForm } from "./SchoolProfileForm";

export const dynamic = "force-dynamic";

export default async function SchoolProfilePage() {
  const profile = await getSchoolProfile().catch(() => null);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <School className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Profil Sekolah</h1>
          <p className="text-sm text-gray-500">
            {profile ? "Edit identitas sekolah" : "Belum ada profil – isi data sekolah sekarang"}
          </p>
        </div>
      </div>
      <SchoolProfileForm profile={profile} />
    </div>
  );
}
