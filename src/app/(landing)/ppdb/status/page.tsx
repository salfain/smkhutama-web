import { Search } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";
import { StatusChecker } from "./StatusChecker";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cek Status PPDB – SMK Hutama" };

export default function PpdbStatusPage() {
  return (
    <>
      <PageHero
        icon={Search}
        title="Cek Status Pendaftaran"
        subtitle="Masukkan nomor pendaftaran Anda untuk melihat status seleksi PPDB."
      />
      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-lg px-4 py-16">
          <StatusChecker />
        </div>
      </section>
    </>
  );
}
