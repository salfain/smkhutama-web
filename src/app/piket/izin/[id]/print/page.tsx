import { prisma } from "@/lib/prisma";
import { requirePiketAuth } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Surat Izin Keluar" };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function IzinPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePiketAuth();
  const { id } = await params;

  const permit = await prisma.studentPermit.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
          major: { select: { name: true } },
        },
      },
    },
  });

  if (!permit) notFound();

  const school = await prisma.schoolProfile.findFirst();

  // Ambil nama guru piket yang mencatat
  const piketUser = await prisma.user.findUnique({
    where: { id: permit.recordedBy },
    select: { name: true },
  }).catch(() => null);

  // Nomor surat format: IZIN-YYYYMMDD-XXXX (4 digit dari ID)
  const nomorSurat = `IZIN-${new Date(permit.date).getFullYear()}${String(new Date(permit.date).getMonth() + 1).padStart(2, "0")}${String(new Date(permit.date).getDate()).padStart(2, "0")}-${id.slice(-4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      {/* Tombol cetak — disembunyikan saat print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => {}}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50"
          id="back-btn"
        >
          ← Kembali
        </button>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          onClick={() => {}}
          id="print-btn"
        >
          🖨️ Cetak Surat
        </button>
      </div>

      {/* Script untuk tombol */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn').onclick = function() { window.print(); };
        document.getElementById('back-btn').onclick = function() { window.history.back(); };
      ` }} />

      {/* Dokumen surat */}
      <div className="mx-auto max-w-2xl bg-white p-12 shadow-lg print:max-w-none print:shadow-none print:p-8">

        {/* Kop surat */}
        <div className="flex items-start gap-4 border-b-2 border-black pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/school/logo"
            alt="Logo"
            className="h-16 w-16 object-contain shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="flex-1 text-center">
            <p className="text-lg font-extrabold uppercase tracking-wide">
              {school?.name ?? "SMK Hutama Pondok Gede"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">Sekolah Menengah Kejuruan</p>
            {school?.address && (
              <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>
            )}
            {school?.npsn && (
              <p className="text-xs text-gray-500 mt-0.5">NPSN: {school.npsn}</p>
            )}
          </div>
        </div>

        {/* Judul surat */}
        <div className="mt-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">Surat Izin Keluar Sekolah</h2>
          <p className="text-xs text-gray-500 mt-1">No: {nomorSurat}</p>
        </div>

        {/* Isi surat */}
        <p className="mt-6 text-sm leading-7">
          Yang bertanda tangan di bawah ini, Guru Piket {school?.name ?? "SMK Hutama Pondok Gede"},
          memberikan izin kepada siswa berikut untuk meninggalkan sekolah pada jam pelajaran:
        </p>

        {/* Data siswa */}
        <table className="mt-5 w-full text-sm">
          <tbody>
            <tr><td className="w-44 py-1 font-medium align-top">Nama Siswa</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top font-semibold">{permit.student.user.name}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Kelas</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{permit.student.class?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Jurusan</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{permit.student.major?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Keperluan / Alasan</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{permit.reason}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Tanggal</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{formatDate(permit.date)}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Jam Keluar</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{formatTime(permit.exitTime)}</td></tr>
            <tr><td className="w-44 py-1 font-medium align-top">Jam Kembali (rencana)</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top text-gray-500">__________ WIB</td></tr>
          </tbody>
        </table>

        <p className="mt-6 text-sm leading-7">
          Demikian surat izin ini dibuat untuk dipergunakan sebagaimana mestinya.
          Siswa wajib kembali ke sekolah sesuai waktu yang telah disepakati.
        </p>

        {/* Tanda tangan */}
        <div className="mt-10 flex justify-between text-sm">
          <div className="text-center w-52">
            <p>Siswa,</p>
            <div className="h-20" />
            <p className="font-semibold">( {permit.student.user.name} )</p>
          </div>
          <div className="text-center w-52">
            <p>
              {school?.address
                ? school.address.split(",").slice(-1)[0]?.trim()
                : "Bekasi"}
              , {formatDate(permit.date)}
            </p>
            <p className="mt-1">Guru Piket,</p>
            <div className="h-16" />
            <p className="font-semibold underline">{piketUser?.name ?? "Guru Piket"}</p>
            <p className="text-xs text-gray-500">Guru Piket</p>
          </div>
        </div>

        {/* Catatan kecil */}
        <div className="mt-8 border-t border-dashed border-gray-300 pt-4">
          <p className="text-[10px] text-gray-400 text-center">
            Dokumen ini dicetak oleh sistem piket digital SMK Hutama · {new Date().toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
