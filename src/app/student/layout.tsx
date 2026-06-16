import { StudentHeader } from "@/components/layouts/StudentHeader";
import { requireAuth } from "@/lib/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("STUDENT");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header tampil di semua halaman siswa kecuali halaman test (sudah punya top-bar sendiri) */}
      <StudentHeaderWrapper user={{
        name: user.name,
        nis: user.student?.nis ?? null,
        className: user.student?.class?.name ?? null,
      }} />
      <main>{children}</main>
    </div>
  );
}

import { StudentHeaderWrapper } from "@/components/layouts/StudentHeaderWrapper";
