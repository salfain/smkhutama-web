import { requireAuth } from "@/lib/session";
import { cookies } from "next/headers";

import { StudentHeaderWrapper } from "@/components/layouts/StudentHeaderWrapper";
import { PageTransition } from "@/components/PageTransition";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("STUDENT");
  const cookieStore = await cookies();
  const system = cookieStore.get("student-system")?.value === "SIBIKONS" ? "SIBIKONS" : "CBT";

  return (
    <div className={`genesis-app ${system === "CBT" ? "cbt-scope" : "bk-scope"} min-h-screen bg-[#FAFAFA] dark:bg-[#111113]`}>
      {/* Header tampil di semua halaman siswa kecuali halaman test (sudah punya top-bar sendiri) */}
      <StudentHeaderWrapper user={{
        name: user.name,
        nis: user.student?.nis ?? null,
        className: user.student?.class?.name ?? null,
      }} system={system} />
      <main className="flex-1 flex flex-col pb-24 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
