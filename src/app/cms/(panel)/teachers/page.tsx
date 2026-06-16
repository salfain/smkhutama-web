import { getTeachers } from "../content-actions";
import { TeachersClient } from "./TeachersClient";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await getTeachers().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Data Guru</h1>
        <p className="text-sm text-gray-500">Kelola data guru & tenaga pendidik yang tampil di halaman /guru</p>
      </div>
      <TeachersClient
        teachers={teachers.map((t) => ({
          id: t.id, name: t.name, position: t.position,
          subject: t.subject ?? "", photoUrl: t.photoUrl ?? "",
        }))}
      />
    </div>
  );
}
