import { getSettings } from "./actions";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings().catch(() => null);

  if (!settings) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <p className="text-sm text-red-600">Database belum tersambung. Pastikan koneksi Postgres sudah benar di .env.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Pengaturan Aplikasi</h1>
        <p className="text-sm text-gray-500">Konfigurasi sistem CBT SMK HUTAMA</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
