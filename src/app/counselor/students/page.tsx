import { listStudentsWithPoints } from "../bk-actions";
import { StudentsBookClient } from "./StudentsBookClient";

export const dynamic = "force-dynamic";

export default async function StudentsBookPage() {
  const students = await listStudentsWithPoints().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Buku Siswa (BK)</h1>
        <p className="text-sm text-gray-500">Rekam jejak BK lengkap per siswa. Klik untuk lihat detail.</p>
      </div>
      <StudentsBookClient students={students} />
    </div>
  );
}
