import { getHomeVisitDetail } from "../../../bk-actions";
import { notFound } from "next/navigation";
import { PrintButton } from "../../../cases/[id]/print/PrintButton";

export const dynamic = "force-dynamic";

export default async function HomeVisitPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getHomeVisitDetail(id);
  if (!h) notFound();

  const tgl = new Date(h.visitDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <PrintButton />
      <div className="print-doc mx-auto max-w-3xl bg-white p-10 shadow-lg print:max-w-none print:shadow-none print:p-0">
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-lg font-bold uppercase">SMK Hutama Pondok Gede</h1>
          <p className="text-sm">Bimbingan Konseling (BK)</p>
          <p className="text-xs text-gray-600">Jl. Raya Hankam No.37, Jatirahayu, Pondok Melati, Kota Bekasi</p>
        </div>
        <h2 className="mt-6 text-center text-base font-bold uppercase underline">Laporan Kunjungan Rumah</h2>
        <table className="mt-6 w-full text-sm">
          <tbody>
            <Row label="Nama Siswa" value={h.studentName} />
            <Row label="NIS" value={h.studentNis || "-"} />
            <Row label="Kelas" value={h.className} />
            <Row label="Tanggal Kunjungan" value={tgl} />
            <Row label="Alamat" value={h.address || "-"} />
          </tbody>
        </table>
        <Section title="Tujuan Kunjungan" content={h.purpose} />
        {h.findings && <Section title="Temuan / Kondisi" content={h.findings} />}
        {h.result && <Section title="Hasil / Kesepakatan" content={h.result} />}
        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p>Bekasi, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p>Guru Bimbingan Konseling</p>
            <div className="h-20" />
            <p className="font-semibold underline">{h.counselorName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (<tr><td className="w-40 py-1 align-top font-medium">{label}</td><td className="w-3 py-1 align-top">:</td><td className="py-1 align-top">{value}</td></tr>);
}
function Section({ title, content }: { title: string; content: string }) {
  return (<div className="mt-5"><p className="text-sm font-bold">{title}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p></div>);
}
