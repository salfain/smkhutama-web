"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, FileText, IdCard, Printer, Loader2 } from "lucide-react";
import { getExamPrintData } from "./actions";
import { AttendanceSheet, ExamReport, ParticipantCards } from "./PrintDocuments";

type ExamOpt = { id: string; title: string; subject: { code: string }; examType: string };
type DocType = "attendance" | "report" | "cards";

export function PrintClient({ exams }: { exams: ExamOpt[] }) {
  const [examId, setExamId] = useState("");
  const [docType, setDocType] = useState<DocType>("attendance");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [pending, startTransition] = useTransition();

  function loadData(id: string) {
    setExamId(id);
    if (!id) { setData(null); return; }
    startTransition(async () => {
      const d = await getExamPrintData(id);
      setData(d);
    });
  }

  function handlePrint() {
    window.print();
  }

  const docs = [
    { key: "attendance" as const, label: "Daftar Hadir", desc: "Absensi offline + tanda tangan", icon: ClipboardList },
    { key: "report" as const, label: "Berita Acara", desc: "Laporan resmi pelaksanaan ujian", icon: FileText },
    { key: "cards" as const, label: "Kartu Peserta", desc: "Kartu identitas peserta ujian", icon: IdCard },
  ];

  return (
    <>
      {/* Controls — hidden saat print */}
      <div className="print:hidden space-y-5">
        <Card className="border shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Pilih Ujian</label>
              <Select value={examId} onValueChange={loadData}>
                <SelectTrigger><SelectValue placeholder="Pilih ujian untuk dicetak dokumennya..." /></SelectTrigger>
                <SelectContent>
                  {exams.length === 0 ? (
                    <div className="p-3 text-xs text-gray-400">Belum ada ujian</div>
                  ) : exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.subject.code} – {e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Jenis Dokumen</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {docs.map((d) => (
                  <button key={d.key} type="button" onClick={() => setDocType(d.key)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      docType === d.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <d.icon className={`mb-2 h-6 w-6 ${docType === d.key ? "text-blue-600" : "text-gray-400"}`} />
                    <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                    <p className="text-xs text-gray-500">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handlePrint} disabled={!data || pending} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak Dokumen
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {data && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">Preview ({data.students.length} peserta):</p>
            <div className="overflow-auto rounded-xl border bg-gray-100 p-4">
              <div className="mx-auto max-w-[800px] shadow-lg">
                {docType === "attendance" && <AttendanceSheet school={data.school} exam={data.exam} students={data.students} />}
                {docType === "report" && <ExamReport school={data.school} exam={data.exam} students={data.students} />}
                {docType === "cards" && <ParticipantCards school={data.school} exam={data.exam} students={data.students} />}
              </div>
            </div>
          </div>
        )}
        {!data && !pending && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <Printer className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Pilih ujian untuk melihat preview dokumen</p>
          </div>
        )}
      </div>

      {/* Print area — hanya muncul saat print */}
      {data && (
        <div className="hidden print:block">
          {docType === "attendance" && <AttendanceSheet school={data.school} exam={data.exam} students={data.students} />}
          {docType === "report" && <ExamReport school={data.school} exam={data.exam} students={data.students} />}
          {docType === "cards" && <ParticipantCards school={data.school} exam={data.exam} students={data.students} />}
        </div>
      )}
    </>
  );
}
