import { StudentHeader } from "@/components/layouts/StudentHeader";
import { requireAuth } from "@/lib/session";

import { StudentHeaderWrapper } from "@/components/layouts/StudentHeaderWrapper";
import { PageTransition } from "@/components/PageTransition";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("STUDENT");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header tampil di semua halaman siswa kecuali halaman test (sudah punya top-bar sendiri) */}
      <StudentHeaderWrapper user={{
        name: user.name,
        nis: user.student?.nis ?? null,
        className: user.student?.class?.name ?? null,
      }} />
      <main className="flex-1 flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
