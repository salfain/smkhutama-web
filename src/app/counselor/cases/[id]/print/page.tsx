import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Sesi Konseling" };

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const typeLabel: Record<string, string> = {
  PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir",
};
const statusLabel: Record<string, string> = {
  OPEN: "Terbuka", IN_PROGRESS: "Dalam Proses", RESOLVED: "Selesai", REFERRED: "Dirujuk",
};

export default async function CasePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCounselorAuth();
  const { id } = await params;

  const c = await prisma.counselingCase.findUnique({
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

  if (!c) notFound();

  const school = await prisma.schoolProfile.findFirst();
  const nomorSurat = `KONS-${new Date(c.sessionDate).getFullYear()}-${id.slice(-4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button id="back-btn" className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50">
          ← Kembali
        </button>
        <button id="print-btn" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700">
          🖨️ Cetak / PDF
        </button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn').onclick = function() { window.print(); };
        document.getElementById('back-btn').onclick = function() { window.history.back(); };
      ` }} />

      <div className="mx-auto max-w-2xl bg-white p-12 shadow-lg print:max-w-none print:shadow-none print:p-8">
        {/* Kop */}
        <div className="flex items-start gap-4 border-b-2 border-black pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/school/logo" alt="Logo" className="h-16 w-16 object-contain shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="flex-1 text-center">
            <p className="text-lg font-extrabold uppercase tracking-wide">{school?.name ?? "SMK Hutama Pondok Gede"}</p>
            <p className="text-xs text-gray-600 mt-0.5">Sekolah Menengah Kejuruan</p>
            {school?.address && <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>}
            {school?.npsn && <p className="text-xs text-gray-500 mt-0.5">NPSN: {school.npsn}</p>}
          </div>
        </div>

        {/* Judul */}
        <div className="mt-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">Laporan Sesi Bimbingan Konseling</h2>
          <p className="text-xs text-gray-500 mt-1">No: {nomorSurat}</p>
        </div>

        {/* Data */}
        <table className="mt-6 w-full text-sm">
          <tbody>
            <tr><td className="w-44 py-1 font-medium">Nama Siswa</td><td className="w-3 py-1">:</td><td className="py-1 font-semibold">{c.student.user.name}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Kelas</td><td className="w-3 py-1">:</td><td className="py-1">{c.student.class?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Jurusan</td><td className="w-3 py-1">:</td><td className="py-1">{c.student.major?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Tanggal Sesi</td><td className="w-3 py-1">:</td><td className="py-1">{fmtDate(c.sessionDate)}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Topik</td><td className="w-3 py-1">:</td><td className="py-1">{c.title}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Jenis Konseling</td><td className="w-3 py-1">:</td><td className="py-1">{typeLabel[c.type] ?? c.type}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Status</td><td className="w-3 py-1">:</td><td className="py-1">{statusLabel[c.status] ?? c.status}</td></tr>
          </tbody>
        </table>

        {c.description && (
          <>
            <p className="mt-5 text-sm font-semibold">Deskripsi Permasalahan:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700">{c.description}</p>
          </>
        )}

        {c.notes && (
          <>
            <p className="mt-4 text-sm font-semibold">Catatan Konseling:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700">{c.notes}</p>
          </>
        )}

        {c.followUp && (
          <>
            <p className="mt-4 text-sm font-semibold">Tindak Lanjut:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700">{c.followUp}</p>
          </>
        )}

        {/* TTD */}
        <div className="mt-10 flex justify-between text-sm">
          <div className="text-center w-52">
            <p>Siswa,</p>
            <div className="h-20" />
            <p className="font-semibold">( {c.student.user.name} )</p>
          </div>
          <div className="text-center w-52">
            <p>{school?.address ? school.address.split(",").slice(-1)[0]?.trim() : "Bekasi"}, {fmtDate(c.sessionDate)}</p>
            <p className="mt-1">Guru Bimbingan Konseling,</p>
            <div className="h-16" />
            <p className="font-semibold underline">{c.counselor.user.name}</p>
            <p className="text-xs text-gray-500">Guru BK</p>
          </div>
        </div>

        <div className="mt-8 border-t border-dashed border-gray-300 pt-3">
          <p className="text-[10px] text-gray-400 text-center">
            Dokumen ini dicetak oleh sistem SIBIKONS SMK Hutama · {new Date().toLocaleString("id-ID")}
            {c.isConfidential && " · RAHASIA"}
          </p>
        </div>
      </div>

      <style>{`@media print { @page { size: A4; margin: 15mm; } body { -webkit-print-color-adjust: exact; } }`}</style>
    </div>
  );
}
