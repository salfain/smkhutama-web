import { getCaseDetail } from "../../../actions";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const statusLabel: Record<string, string> = { OPEN: "Terbuka", IN_PROGRESS: "Dalam Proses", RESOLVED: "Selesai", REFERRED: "Dirujuk" };

export default async function CasePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCaseDetail(id);
  if (!c) notFound();

  const tgl = new Date(c.sessionDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <PrintButton />

      <div className="print-doc mx-auto max-w-3xl bg-white p-10 shadow-lg print:max-w-none print:shadow-none print:p-0">
        {/* Kop */}
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-lg font-bold uppercase">SMK Hutama Pondok Gede</h1>
          <p className="text-sm">Bimbingan Konseling (BK)</p>
          <p className="text-xs text-gray-600">Jl. Raya Hankam No.37, Jatirahayu, Pondok Melati, Kota Bekasi</p>
        </div>

        <h2 className="mt-6 text-center text-base font-bold uppercase underline">Laporan Sesi Konseling</h2>

        {/* Identitas */}
        <table className="mt-6 w-full text-sm">
          <tbody>
            <Row label="Nama Siswa" value={c.studentName} />
            <Row label="NIS" value={c.studentNis || "-"} />
            <Row label="Kelas" value={c.className} />
            <Row label="Jenis Konseling" value={typeLabel[c.type] ?? c.type} />
            <Row label="Tanggal Sesi" value={tgl} />
            <Row label="Status" value={statusLabel[c.status] ?? c.status} />
            <Row label="Guru BK" value={c.counselorName} />
          </tbody>
        </table>

        {/* Isi */}
        <Section title="Topik / Permasalahan" content={c.title} />
        {c.description && <Section title="Uraian Permasalahan" content={c.description} />}
        {c.notes && <Section title="Catatan Konseling" content={c.notes} />}
        {c.followUp && <Section title="Tindak Lanjut" content={c.followUp} />}

        {/* Tanda tangan */}
        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p>Bekasi, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p>Guru Bimbingan Konseling</p>
            <div className="h-20" />
            <p className="font-semibold underline">{c.counselorName}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400 print:hidden">
          Dokumen ini bersifat rahasia dan hanya untuk keperluan bimbingan konseling.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-40 py-1 align-top font-medium">{label}</td>
      <td className="w-3 py-1 align-top">:</td>
      <td className="py-1 align-top">{value}</td>
    </tr>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p>
    </div>
  );
}
