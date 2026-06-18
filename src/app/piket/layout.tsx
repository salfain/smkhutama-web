import { PiketSidebar } from "@/components/layouts/PiketSidebar";
import { requirePiketAuth } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function PiketLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePiketAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <PiketSidebar user={{ name: user.name }} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
