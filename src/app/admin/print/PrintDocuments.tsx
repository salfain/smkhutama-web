"use client";

type School = {
  name: string;
  address: string | null;
  npsn: string | null;
  principalName: string | null;
  logo: string | null;
} | null;

type ExamInfo = {
  title: string;
  examType: string;
  subject: { name: string; code: string };
  teacherName: string;
  durationMinutes: number;
  startAt: Date | string;
  endAt: Date | string;
  academicYear: { year: string; semester: string } | null;
  classNames: string[];
  token: string | null;
};

type Student = {
  no: number; name: string; nis: string | null; nisn: string | null;
  className: string; present: boolean; status: string;
};

const examTypeLabel: Record<string, string> = {
  UH: "Ulangan Harian", UTS: "Ujian Tengah Semester", UAS: "Ujian Akhir Semester",
  US: "Ujian Sekolah", TRYOUT: "Tryout", LAINNYA: "Ujian",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/* ===== KOP SURAT ===== */
function Letterhead({ school }: { school: School }) {
  return (
    <div className="flex items-center gap-4 border-b-4 border-double border-black pb-3">
      {school?.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={school.logo} alt="Logo" className="h-20 w-20 object-contain" />
      )}
      <div className="flex-1 text-center">
        <h1 className="text-xl font-bold uppercase leading-tight">{school?.name ?? "SMK HUTAMA"}</h1>
        <p className="text-xs leading-tight">{school?.address ?? ""}</p>
        {school?.npsn && <p className="text-xs">NPSN: {school.npsn}</p>}
      </div>
    </div>
  );
}

/* ===== DAFTAR HADIR ===== */
export function AttendanceSheet({ school, exam, students }: { school: School; exam: ExamInfo; students: Student[] }) {
  return (
    <div className="print-doc bg-white p-8 text-black" style={{ fontFamily: "Times New Roman, serif" }}>
      <Letterhead school={school} />
      <h2 className="mt-5 text-center text-base font-bold uppercase underline">Daftar Hadir Peserta Ujian</h2>

      <table className="mt-4 w-full text-sm">
        <tbody>
          <tr><td className="w-40 py-0.5">Jenis Ujian</td><td>: {examTypeLabel[exam.examType] ?? exam.examType}</td></tr>
          <tr><td className="py-0.5">Mata Pelajaran</td><td>: {exam.subject.name}</td></tr>
          <tr><td className="py-0.5">Kelas</td><td>: {exam.classNames.join(", ") || "—"}</td></tr>
          <tr><td className="py-0.5">Hari / Tanggal</td><td>: {fmtDate(exam.startAt)}</td></tr>
          <tr><td className="py-0.5">Waktu</td><td>: {fmtTime(exam.startAt)} – {fmtTime(exam.endAt)} WIB</td></tr>
          <tr><td className="py-0.5">Pengawas</td><td>: {exam.teacherName}</td></tr>
        </tbody>
      </table>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-1 w-10">No</th>
            <th className="border border-black px-2 py-1">Nama Siswa</th>
            <th className="border border-black px-2 py-1 w-28">NIS</th>
            <th className="border border-black px-2 py-1 w-24">Kelas</th>
            <th className="border border-black px-2 py-1 w-40">Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.no}>
              <td className="border border-black px-2 py-1.5 text-center">{s.no}</td>
              <td className="border border-black px-2 py-1.5">{s.name}</td>
              <td className="border border-black px-2 py-1.5">{s.nis ?? "—"}</td>
              <td className="border border-black px-2 py-1.5 text-center">{s.className}</td>
              <td className="border border-black px-2 py-1.5 text-center">{s.no % 2 === 1 ? `${s.no}.` : `${s.no}.`}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr><td colSpan={5} className="border border-black px-2 py-3 text-center text-gray-500">Tidak ada peserta</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-8 flex justify-end">
        <div className="text-center text-sm">
          <p>Pengawas Ujian,</p>
          <div className="h-16" />
          <p className="font-semibold underline">{exam.teacherName}</p>
        </div>
      </div>
    </div>
  );
}

/* ===== BERITA ACARA ===== */
export function ExamReport({ school, exam, students }: { school: School; exam: ExamInfo; students: Student[] }) {
  const present = students.filter((s) => s.present).length;
  const absent = students.length - present;

  return (
    <div className="print-doc bg-white p-8 text-black" style={{ fontFamily: "Times New Roman, serif" }}>
      <Letterhead school={school} />
      <h2 className="mt-5 text-center text-base font-bold uppercase underline">Berita Acara Pelaksanaan Ujian</h2>
      <p className="mt-1 text-center text-sm">{examTypeLabel[exam.examType] ?? exam.examType}{exam.academicYear ? ` — Tahun Ajaran ${exam.academicYear.year}` : ""}</p>

      <div className="mt-5 space-y-3 text-sm leading-relaxed">
        <p className="text-justify">
          Pada hari ini <strong>{fmtDate(exam.startAt)}</strong>, telah dilaksanakan ujian dengan rincian sebagai berikut:
        </p>

        <table className="w-full text-sm">
          <tbody>
            <tr><td className="w-44 py-0.5 align-top">Mata Pelajaran</td><td className="align-top">: {exam.subject.name} ({exam.subject.code})</td></tr>
            <tr><td className="py-0.5 align-top">Kelas / Peserta</td><td className="align-top">: {exam.classNames.join(", ") || "—"}</td></tr>
            <tr><td className="py-0.5 align-top">Waktu Pelaksanaan</td><td className="align-top">: {fmtTime(exam.startAt)} – {fmtTime(exam.endAt)} WIB ({exam.durationMinutes} menit)</td></tr>
            <tr><td className="py-0.5 align-top">Pengawas</td><td className="align-top">: {exam.teacherName}</td></tr>
            <tr><td className="py-0.5 align-top">Jumlah Peserta Terdaftar</td><td className="align-top">: {students.length} siswa</td></tr>
            <tr><td className="py-0.5 align-top">Hadir</td><td className="align-top">: {present} siswa</td></tr>
            <tr><td className="py-0.5 align-top">Tidak Hadir</td><td className="align-top">: {absent} siswa</td></tr>
          </tbody>
        </table>

        <p className="text-justify mt-2">
          Pelaksanaan ujian berlangsung secara <strong>tertib dan lancar</strong>. Catatan khusus selama pelaksanaan ujian:
        </p>
        <div className="border border-black p-2 min-h-[60px]">
          <p className="text-gray-400">....................................................................................................................</p>
          <p className="text-gray-400 mt-3">....................................................................................................................</p>
        </div>

        <p className="text-justify mt-2">
          Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
        </p>
      </div>

      <div className="mt-10 flex justify-between text-sm">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-20" />
          <p className="font-semibold underline">{school?.principalName ?? "(...........................)"}</p>
        </div>
        <div className="text-center">
          <p>Pengawas Ujian</p>
          <p>&nbsp;</p>
          <div className="h-20" />
          <p className="font-semibold underline">{exam.teacherName}</p>
        </div>
      </div>
    </div>
  );
}

/* ===== KARTU PESERTA ===== */
export function ParticipantCards({ school, exam, students }: { school: School; exam: ExamInfo; students: Student[] }) {
  return (
    <div className="print-doc bg-white p-6 text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="grid grid-cols-2 gap-4">
        {students.map((s) => (
          <div key={s.no} className="break-inside-avoid rounded-lg border-2 border-black p-3">
            {/* Header kartu */}
            <div className="flex items-center gap-2 border-b border-gray-400 pb-2">
              {school?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={school.logo} alt="" className="h-10 w-10 object-contain" />
              )}
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase leading-tight">{school?.name ?? "SMK HUTAMA"}</p>
                <p className="text-[9px] leading-tight">Kartu Peserta Ujian</p>
              </div>
            </div>

            {/* Body */}
            <div className="mt-2 flex gap-3">
              <div className="flex h-20 w-16 shrink-0 items-center justify-center border border-gray-400 text-[8px] text-gray-400 text-center">
                Foto<br />3×4
              </div>
              <table className="flex-1 text-[10px]">
                <tbody>
                  <tr><td className="py-0.5 align-top w-16">Nama</td><td className="align-top font-semibold">: {s.name}</td></tr>
                  <tr><td className="py-0.5 align-top">NIS</td><td className="align-top">: {s.nis ?? "—"}</td></tr>
                  <tr><td className="py-0.5 align-top">Kelas</td><td className="align-top">: {s.className}</td></tr>
                  <tr><td className="py-0.5 align-top">Ujian</td><td className="align-top">: {examTypeLabel[exam.examType] ?? exam.examType}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-2 border-t border-gray-400 pt-1.5 text-[9px]">
              <p>Mapel: {exam.subject.name}</p>
              <p>Tanggal: {fmtDate(exam.startAt)}</p>
              <p>Waktu: {fmtTime(exam.startAt)} – {fmtTime(exam.endAt)} WIB</p>
            </div>
          </div>
        ))}
        {students.length === 0 && <p className="col-span-2 text-center text-sm text-gray-500">Tidak ada peserta</p>}
      </div>
    </div>
  );
}
