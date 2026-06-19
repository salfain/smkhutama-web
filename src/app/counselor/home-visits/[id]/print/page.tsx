import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { notFound } from "next/navigation";
import { PrintButtonsPurple, SchoolLogo } from "@/components/print/PrintButtons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Kunjungan Rumah" };

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default async function HomeVisitPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCounselorAuth();
  const { id } = await params;

  const visit = await prisma.homeVisit.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
          major: { select: { name: true } },
        },
      },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });

  if (!visit) notFound();

  const school = await prisma.schoolProfile.findFirst();
  const nomorSurat = `KR-${new Date(visit.visitDate).getFullYear()}-${id.slice(-4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <PrintButtonsPurple />

      <div className="mx-auto max-w-2xl bg-white p-12 shadow-lg print:max-w-none print:shadow-none print:p-8">
        {/* Kop */}
        <div className="flex items-start gap-4 border-b-2 border-black pb-4">
          <SchoolLogo />
          <div className="flex-1 text-center">
            <p className="text-lg font-extrabold uppercase tracking-wide">{school?.name ?? "SMK Hutama Pondok Gede"}</p>
            <p className="text-xs text-gray-600 mt-0.5">Sekolah Menengah Kejuruan</p>
            {school?.address && <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>}
            {school?.npsn && <p className="text-xs text-gray-500 mt-0.5">NPSN: {school.npsn}</p>}
          </div>
        </div>

        {/* Judul */}
        <div className="mt-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">Laporan Kunjungan Rumah (Home Visit)</h2>
          <p className="text-xs text-gray-500 mt-1">No: {nomorSurat}</p>
        </div>

        <p className="mt-6 text-sm leading-7">
          Dengan ini melaporkan hasil kunjungan rumah yang telah dilaksanakan oleh Guru Bimbingan Konseling {school?.name ?? "SMK Hutama"} dengan data sebagai berikut:
        </p>

        {/* Data */}
        <table className="mt-4 w-full text-sm">
          <tbody>
            <tr><td className="w-44 py-1 font-medium">Nama Siswa</td><td className="w-3 py-1">:</td><td className="py-1 font-semibold">{visit.student.user.name}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Kelas</td><td className="w-3 py-1">:</td><td className="py-1">{visit.student.class?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Jurusan</td><td className="w-3 py-1">:</td><td className="py-1">{visit.student.major?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Tanggal Kunjungan</td><td className="w-3 py-1">:</td><td className="py-1">{fmtDate(visit.visitDate)}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Alamat</td><td className="w-3 py-1">:</td><td className="py-1">{visit.address ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Tujuan Kunjungan</td><td className="w-3 py-1">:</td><td className="py-1">{visit.purpose}</td></tr>
          </tbody>
        </table>

        {visit.findings && (
          <>
            <p className="mt-5 text-sm font-semibold">Temuan / Kondisi di Lapangan:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700 border-l-2 border-gray-200 pl-3">{visit.findings}</p>
          </>
        )}

        {visit.result && (
          <>
            <p className="mt-4 text-sm font-semibold">Hasil & Kesepakatan:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700 border-l-2 border-gray-200 pl-3">{visit.result}</p>
          </>
        )}

        <p className="mt-6 text-sm leading-7">
          Demikian laporan kunjungan rumah ini dibuat sebagai dokumentasi pelaksanaan layanan bimbingan konseling.
        </p>

        {/* TTD */}
        <div className="mt-10 flex justify-between text-sm">
          <div className="text-center w-52">
            <p>Orang Tua / Wali,</p>
            <div className="h-20" />
            <p className="font-semibold">( ________________________ )</p>
          </div>
          <div className="text-center w-52">
            <p>{school?.address ? school.address.split(",").slice(-1)[0]?.trim() : "Bekasi"}, {fmtDate(visit.visitDate)}</p>
            <p className="mt-1">Guru Bimbingan Konseling,</p>
            <div className="h-16" />
            <p className="font-semibold underline">{visit.counselor.user.name}</p>
            <p className="text-xs text-gray-500">Guru BK</p>
          </div>
        </div>

        <div className="mt-8 border-t border-dashed border-gray-300 pt-3">
          <p className="text-[10px] text-gray-400 text-center">
            Dokumen ini dicetak oleh sistem SIBIKONS SMK Hutama · {new Date().toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <style>{`@media print { @page { size: A4; margin: 15mm; } body { -webkit-print-color-adjust: exact; } }`}</style>
    </div>
  );
}
