import { getProfile } from "../content-actions";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function CmsProfilePage() {
  const profile = await getProfile().catch(() => null);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Profil & Hero</h1>
        <p className="text-sm text-gray-500">Atur identitas sekolah, banner utama, dan kontak</p>
      </div>
      <ProfileForm profile={profile as Record<string, unknown> | null} />
    </div>
  );
}
