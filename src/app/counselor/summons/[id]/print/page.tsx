import { getSummonDetail } from "../../../reports-actions";
import { notFound } from "next/navigation";
import { PrintButton } from "../../../cases/[id]/print/PrintButton";
import { SP_LABEL } from "@/lib/bk-points";

export const dynamic = "force-dynamic";

export default async function SummonPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSummonDetail(id);
  if (!s) notFound();

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const meeting = s.meetingDate
    ? new Date(s.meetingDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "(akan dikonfirmasi)";
  const isPanggilan = s.level === "PANGGILAN";
  const title = isPanggilan ? "SURAT PEMANGGILAN ORANG TUA / WALI" : `SURAT PERINGATAN (${s.level})`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <PrintButton />
      <div className="print-doc mx-auto max-w-3xl bg-white p-10 shadow-lg print:max-w-none print:shadow-none print:p-0">
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-lg font-bold uppercase">SMK Hutama Pondok Gede</h1>
          <p className="text-sm">Bimbingan Konseling (BK)</p>
          <p className="text-xs text-gray-600">Jl. Raya Hankam No.37, Jatirahayu, Pondok Melati, Kota Bekasi</p>
        </div>

        <h2 className="mt-6 text-center text-base font-bold uppercase underline">{title}</h2>

        <p className="mt-6 text-sm">Kepada Yth.</p>
        <p className="text-sm font-medium">Orang Tua / Wali dari siswa:</p>

        <table className="mt-4 w-full text-sm">
          <tbody>
            <Row label="Nama Siswa" value={s.studentName} />
            <Row label="NIS" value={s.studentNis || "-"} />
            <Row label="Kelas" value={s.className} />
            <Row label="Total Poin Pelanggaran" value={`${s.totalPoints} poin`} />
            <Row label="Tingkat" value={SP_LABEL[s.level] ?? s.level} />
          </tbody>
        </table>

        <p className="mt-5 text-sm leading-relaxed text-justify">
          Dengan hormat, sehubungan dengan {SP_LABEL[s.level]?.toLowerCase() ?? "tindak lanjut"} terhadap siswa tersebut di atas
          dengan alasan: <span className="font-medium">{s.reason}</span>.
          {isPanggilan
            ? " Kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali untuk hadir ke sekolah guna membahas perkembangan dan pembinaan putra/putri Bapak/Ibu."
            : " Kami menyampaikan peringatan ini sebagai bagian dari pembinaan kedisiplinan siswa di sekolah."}
        </p>

        {isPanggilan && (
          <table className="mt-4 w-full text-sm">
            <tbody>
              <Row label="Hari / Tanggal" value={meeting} />
              <Row label="Tempat" value="Ruang Bimbingan Konseling SMK Hutama" />
            </tbody>
          </table>
        )}

        <p className="mt-5 text-sm leading-relaxed text-justify">
          Demikian surat ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
        </p>

        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p>Bekasi, {today}</p>
            <p>Guru Bimbingan Konseling</p>
            <div className="h-20" />
            <p className="font-semibold underline">{s.counselorName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-52 py-1 align-top font-medium">{label}</td>
      <td className="w-3 py-1 align-top">:</td>
      <td className="py-1 align-top">{value}</td>
    </tr>
  );
}
