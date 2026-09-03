import { PiketSidebar } from "@/components/layouts/PiketSidebar";
import { requirePiketAuth } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function PiketLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePiketAuth();
  return (
    <div className="genesis-app piket-scope flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#111113]">
      <PiketSidebar user={{ name: user.name }} />
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pb-24 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
