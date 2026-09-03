import { IdCard } from "lucide-react";
import { getMyProfile } from "./actions";
import { ProfileForm, type MyProfile } from "./ProfileForm";

export const dynamic = "force-dynamic";

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function StudentProfilePage() {
  const s = await getMyProfile();
  if (!s) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-gray-500">Data siswa tidak ditemukan.</div>;
  }

  const profile: MyProfile = {
    name: s.user.name,
    nis: s.nis ?? "",
    nisn: s.nisn ?? "",
    className: s.class?.name ?? "-",
    major: s.major?.name ?? "-",
    birthPlace: s.birthPlace ?? "",
    birthDate: isoDate(s.birthDate),
    address: s.address ?? "",
    parentPhone: s.parentPhone ?? "",
    medicalHistory: s.medicalHistory ?? "",
    photoUrl: s.photoUrl ?? "",
    status: s.profileStatus,
    note: s.profileNote ?? "",
    verifiedBy: s.profileVerifiedBy?.name ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <IdCard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-white">Biodata Saya</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lengkapi data diri untuk Buku Siswa BK.</p>
        </div>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
