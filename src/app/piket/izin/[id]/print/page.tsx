import { prisma } from "@/lib/prisma";
import { requirePiketAuth } from "@/lib/session";
import { notFound } from "next/navigation";
import { PrintButtons, SchoolLogoSmall } from "@/components/print/PrintButtons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Surat Izin Keluar" };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
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
  const piketUser = await prisma.user.findUnique({
    where: { id: permit.recordedBy },
    select: { name: true },
  }).catch(() => null);

  const nomorSurat = `IZIN-${new Date(permit.date).getFullYear()}${String(new Date(permit.date).getMonth() + 1).padStart(2, "0")}${String(new Date(permit.date).getDate()).padStart(2, "0")}-${id.slice(-4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-200 py-6 print:bg-white print:py-0">
      <PrintButtons />

      {/* Pilihan ukuran — disembunyikan saat print */}
      <div className="print:hidden mb-4 flex justify-center gap-3 text-xs text-gray-500">
        <span className="font-medium">Format: Struk Thermal (80mm)</span>
      </div>

      {/* Struk thermal — lebar 80mm */}
      <div
        className="mx-auto bg-white print:mx-0 print:shadow-none"
        style={{ width: "80mm", padding: "4mm 5mm", fontFamily: "monospace, sans-serif" }}
      >
        {/* Header sekolah */}
        <div style={{ textAlign: "center", marginBottom: "3mm" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2mm" }}>
            <SchoolLogoSmall />
          </div>
          <p style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
            {school?.name ?? "SMK Hutama"}
          </p>
          {school?.address && (
            <p style={{ fontSize: "7pt", color: "#555", margin: "0.5mm 0 0" }}>
              {school.address}
            </p>
          )}
          {school?.npsn && (
            <p style={{ fontSize: "7pt", color: "#777", margin: "0.5mm 0 0" }}>
              NPSN: {school.npsn}
            </p>
          )}
        </div>

        {/* Garis pemisah */}
        <div style={{ borderTop: "1.5px solid black", margin: "2mm 0" }} />

        {/* Judul */}
        <div style={{ textAlign: "center", margin: "2mm 0" }}>
          <p style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
            SURAT IZIN KELUAR
          </p>
          <p style={{ fontSize: "7pt", color: "#666", margin: "0.5mm 0 0" }}>
            No: {nomorSurat}
          </p>
        </div>

        <div style={{ borderTop: "1px dashed #999", margin: "2mm 0" }} />

        {/* Data siswa */}
        <table style={{ width: "100%", fontSize: "8pt", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Nama", permit.student.user.name],
              ["Kelas", permit.student.class?.name ?? "—"],
              ["Jurusan", permit.student.major?.name ?? "—"],
              ["Keperluan", permit.reason],
              ["Tanggal", formatDate(permit.date)],
              ["Jam Keluar", formatTime(permit.exitTime)],
              ["Jam Kembali", "____________"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ paddingBottom: "1.5mm", width: "22mm", verticalAlign: "top", color: "#555" }}>
                  {label}
                </td>
                <td style={{ paddingBottom: "1.5mm", width: "3mm", verticalAlign: "top" }}>:</td>
                <td style={{ paddingBottom: "1.5mm", fontWeight: label === "Nama" ? "bold" : "normal", verticalAlign: "top" }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #999", margin: "2mm 0" }} />

        {/* Tanda tangan */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7.5pt", marginTop: "2mm" }}>
          <div style={{ textAlign: "center", width: "35mm" }}>
            <p style={{ margin: 0 }}>Siswa,</p>
            <div style={{ height: "12mm" }} />
            <p style={{ margin: 0, fontWeight: "bold" }}>
              ({permit.student.user.name.split(" ").slice(0, 2).join(" ")})
            </p>
          </div>
          <div style={{ textAlign: "center", width: "35mm" }}>
            <p style={{ margin: 0 }}>Guru Piket,</p>
            <div style={{ height: "12mm" }} />
            <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>
              ({piketUser?.name ?? "Guru Piket"})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px dashed #999", margin: "3mm 0 1mm" }} />
        <p style={{ fontSize: "6pt", textAlign: "center", color: "#999", margin: 0 }}>
          Wajib kembali tepat waktu
        </p>
        <p style={{ fontSize: "6pt", textAlign: "center", color: "#bbb", margin: "0.5mm 0 0" }}>
          {new Date().toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            /* Format thermal 80mm — tinggi otomatis sesuai konten */
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
