import { getMajors } from "../content-actions";
import { MajorsClient } from "./MajorsClient";

export const dynamic = "force-dynamic";

export default async function MajorsPage() {
  const majors = await getMajors().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Program Keahlian</h1>
        <p className="text-sm text-gray-500">Kelola jurusan yang tampil di beranda & pilihan PPDB</p>
      </div>
      <MajorsClient majors={majors.map((m) => ({ id: m.id, code: m.code, name: m.name, description: m.description }))} />
    </div>
  );
}
