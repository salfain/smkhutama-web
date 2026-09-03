import { CounselorSidebar } from "@/components/layouts/CounselorSidebar";
import { requireCounselorAuth } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function CounselorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCounselorAuth();
  return (
    <div className="genesis-app bk-scope flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#111113]">
      <CounselorSidebar user={{ name: user.name }} />
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pb-24 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
