import { CounselorSidebar } from "@/components/layouts/CounselorSidebar";
import { requireCounselorAuth } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function CounselorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCounselorAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <CounselorSidebar user={{ name: user.name }} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
