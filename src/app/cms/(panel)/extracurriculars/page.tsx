import { getExtracurriculars } from "../content-actions";
import { ExtracurricularsClient } from "./ExtracurricularsClient";

export const dynamic = "force-dynamic";

export default async function ExtracurricularsPage() {
  const items = await getExtracurriculars().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Ekstrakurikuler</h1>
        <p className="text-sm text-gray-500">Kelola ekstrakurikuler yang tampil di halaman /ekstrakurikuler</p>
      </div>
      <ExtracurricularsClient
        items={items.map((e) => ({
          id: e.id, name: e.name, category: e.category, description: e.description,
          schedule: e.schedule ?? "", icon: e.icon, color: e.color, imageUrl: e.imageUrl ?? "",
        }))}
      />
    </div>
  );
}
