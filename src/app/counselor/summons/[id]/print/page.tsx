import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Surat Pemanggilan Orang Tua" };

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const levelLabel: Record<string, string> = {
  SP1: "Surat Pemberitahuan I (SP-1)",
  SP2: "Surat Pemberitahuan II (SP-2)",
  SP3: "Surat Pemberitahuan III (SP-3)",
  PANGGILAN: "Surat Pemanggilan Orang Tua",
};

export default async function SummonPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCounselorAuth();
  const { id } = await params;

  const summon = await prisma.parentSummon.findUnique({
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

  if (!summon) notFound();

  const school = await prisma.schoolProfile.findFirst();
  const nomorSurat = `${summon.level}/${new Date(summon.createdAt).getFullYear()}/${id.slice(-4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button id="back-btn" className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50">
          ← Kembali
        </button>
        <button id="print-btn" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700">
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

        {/* Nomor & judul */}
        <div className="mt-6">
          <div className="flex justify-between text-sm">
            <p>Nomor: {nomorSurat}</p>
            <p>Perihal: {levelLabel[summon.level] ?? summon.level}</p>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest">{levelLabel[summon.level] ?? summon.level}</h2>
          </div>
        </div>

        {/* Kepada */}
        <div className="mt-6 text-sm leading-7">
          <p>Kepada Yth.</p>
          <p>Bapak/Ibu Orang Tua/Wali Murid:</p>
          <p className="font-semibold ml-4">{summon.student.user.name}</p>
          <p className="ml-4">Kelas {summon.student.class?.name ?? "—"} — {summon.student.major?.name ?? "—"}</p>
        </div>

        <p className="mt-4 text-sm leading-7">
          Dengan hormat, kami dari pihak {school?.name ?? "SMK Hutama Pondok Gede"} memberitahukan
          {summon.level === "PANGGILAN"
            ? " dan mengundang Bapak/Ibu untuk hadir di sekolah guna membicarakan permasalahan putra/putri Bapak/Ibu."
            : " bahwa putra/putri Bapak/Ibu telah mencapai akumulasi poin pelanggaran yang memerlukan perhatian serius."
          }
        </p>

        <table className="mt-4 w-full text-sm">
          <tbody>
            <tr><td className="w-44 py-1 font-medium">Nama Siswa</td><td className="w-3 py-1">:</td><td className="py-1 font-semibold">{summon.student.user.name}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Kelas</td><td className="w-3 py-1">:</td><td className="py-1">{summon.student.class?.name ?? "—"}</td></tr>
            <tr><td className="w-44 py-1 font-medium">Total Poin Pelanggaran</td><td className="w-3 py-1">:</td><td className="py-1 font-semibold text-red-600">{summon.totalPoints} poin</td></tr>
            <tr><td className="w-44 py-1 font-medium">Alasan</td><td className="w-3 py-1">:</td><td className="py-1">{summon.reason}</td></tr>
            {summon.meetingDate && (
              <tr><td className="w-44 py-1 font-medium">Rencana Pertemuan</td><td className="w-3 py-1">:</td><td className="py-1">{fmtDate(summon.meetingDate)}</td></tr>
            )}
          </tbody>
        </table>

        {summon.notes && (
          <>
            <p className="mt-4 text-sm font-semibold">Catatan Tambahan:</p>
            <p className="mt-1 text-sm leading-7 text-gray-700">{summon.notes}</p>
          </>
        )}

        <p className="mt-5 text-sm leading-7">
          Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
        </p>

        {/* TTD */}
        <div className="mt-10 flex justify-between text-sm">
          <div className="text-center w-52">
            <p>Orang Tua / Wali,</p>
            <div className="h-20" />
            <p className="font-semibold">( ________________________ )</p>
          </div>
          <div className="text-center w-52">
            <p>{school?.address ? school.address.split(",").slice(-1)[0]?.trim() : "Bekasi"}, {fmtDate(new Date())}</p>
            <p className="mt-1">Guru Bimbingan Konseling,</p>
            <div className="h-16" />
            <p className="font-semibold underline">{summon.counselor.user.name}</p>
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
