import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getMajorOptions } from "@/lib/landing-data";
import { PpdbForm } from "./PpdbForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pendaftaran Online (PPDB) – SMK Hutama",
  description: "Formulir pendaftaran peserta didik baru SMK Hutama Pondok Gede.",
};

export default async function PpdbPage() {
  const majors = await getMajorOptions().catch(() => []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-60 w-60 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pt-10 pb-16 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" />Kembali ke beranda
          </Link>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Pendaftaran Peserta Didik Baru
          </h1>
          <p className="mx-auto mt-3 max-w-md text-blue-100">
            Isi formulir di bawah ini dengan lengkap. Proses cepat dan mudah, sepenuhnya online.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto -mt-8 max-w-3xl px-4 pb-20">
        <PpdbForm majors={majors} />
      </div>
    </div>
  );
}
