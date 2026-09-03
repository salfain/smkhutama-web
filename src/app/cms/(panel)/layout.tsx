import { CmsSidebar } from "@/components/layouts/CmsSidebar";
import { requireCmsAuth } from "@/lib/session";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCmsAuth();
  return (
    <div className="genesis-app flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#111113]">
      <CmsSidebar name={user.name} />
      <main className="flex-1 min-w-0 overflow-y-auto pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
