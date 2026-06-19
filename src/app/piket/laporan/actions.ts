"use server";

import { prisma } from "@/lib/prisma";
import { requirePiketAuth } from "@/lib/session";
import { generateExcel } from "@/lib/excel";

function dateRange(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end   = new Date(d); end.setHours(23, 59, 59, 999);
  return { start, end, label: d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
}

// ─── Data laporan harian ─────────────────────────────────────────────────────

export async function getLaporanData(dateStr?: string) {
  await requirePiketAuth();
  const { start, end, label } = dateRange(dateStr);

  const [tardiness, permits, teacherAttendances] = await Promise.all([
    prisma.studentTardiness.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { arrivalTime: "asc" },
    }),
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { exitTime: "asc" },
    }),
    prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Trend 7 hari terakhir
  const trend: { date: string; tardiness: number; permits: number; absences: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const s = new Date(d); s.setHours(0, 0, 0, 0);
    const e = new Date(d); e.setHours(23, 59, 59, 999);
    const [t, p, a] = await Promise.all([
      prisma.studentTardiness.count({ where: { date: { gte: s, lte: e } } }),
      prisma.studentPermit.count({ where: { date: { gte: s, lte: e } } }),
      prisma.teacherAttendance.count({ where: { date: { gte: s, lte: e }, status: { not: "HADIR" } } }),
    ]);
    trend.push({
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      tardiness: t, permits: p, absences: a,
    });
  }

  return {
    dateLabel: label,
    summary: {
      totalTardiness: tardiness.length,
      totalPermits: permits.length,
      totalAbsences: teacherAttendances.filter(a => a.status !== "HADIR").length,
      notReturned: permits.filter(p => p.status === "KELUAR").length,
    },
    tardiness: tardiness.map(r => ({
      id: r.id,
      studentName: r.student.user.name,
      className: r.student.class?.name ?? "—",
      arrivalTime: r.arrivalTime,
      reason: r.reason ?? "—",
      sanction: r.sanction ?? "—",
    })),
    permits: permits.map(r => ({
      id: r.id,
      studentName: r.student.user.name,
      className: r.student.class?.name ?? "—",
      reason: r.reason,
      exitTime: r.exitTime,
      returnTime: r.returnTime,
      status: r.status,
    })),
    teacherAttendances: teacherAttendances.map(r => ({
      id: r.id,
      teacherName: r.teacher.user.name,
      className: r.class.name,
      status: r.status,
      period: r.period ?? "—",
      substitute: r.substitute ?? "—",
    })),
    trend,
  };
}

// ─── Export Excel laporan harian ─────────────────────────────────────────────

export async function exportLaporanPiket(dateStr?: string) {
  await requirePiketAuth();
  const { start, end, label } = dateRange(dateStr);

  const [tardiness, permits, teacherAttendances] = await Promise.all([
    prisma.studentTardiness.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      },
      orderBy: { arrivalTime: "asc" },
    }),
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      },
      orderBy: { exitTime: "asc" },
    }),
    prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { teacher: { user: { name: "asc" } } },
    }),
  ]);

  // Sheet 1: Keterlambatan
  const rowsTard = tardiness.map((r, i) => ({
    no: i + 1,
    nama: r.student.user.name,
    kelas: r.student.class?.name ?? "—",
    waktu_tiba: r.arrivalTime ? new Date(r.arrivalTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—",
    alasan: r.reason ?? "—",
    sanksi: r.sanction ?? "—",
  }));

  // Sheet 2: Izin keluar
  const statusLabel: Record<string, string> = {
    KELUAR: "Sedang Keluar", SUDAH_KEMBALI: "Kembali", TIDAK_KEMBALI: "Tidak Kembali",
  };
  const rowsPermit = permits.map((r, i) => ({
    no: i + 1,
    nama: r.student.user.name,
    kelas: r.student.class?.name ?? "—",
    alasan: r.reason,
    jam_keluar: r.exitTime ? new Date(r.exitTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—",
    jam_kembali: r.returnTime ? new Date(r.returnTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—",
    status: statusLabel[r.status] ?? r.status,
  }));

  // Sheet 3: Kehadiran guru
  const attendanceLabel: Record<string, string> = {
    HADIR: "Hadir", TIDAK_HADIR: "Tidak Hadir", DIGANTIKAN: "Digantikan", TUGAS_LUAR: "Tugas Luar",
  };
  const rowsGuru = teacherAttendances.map((r, i) => ({
    no: i + 1,
    nama_guru: r.teacher.user.name,
    kelas: r.class.name,
    jam_ke: r.period ?? "—",
    status: attendanceLabel[r.status] ?? r.status,
    pengganti: r.substitute ?? "—",
  }));

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Piket SMK Hutama";

  // Helper buat sheet
  function makeSheet(sheetName: string, columns: { header: string; key: string; width: number }[], rows: Record<string, string | number>[]) {
    const ws = wb.addWorksheet(sheetName);
    ws.addRow([`LAPORAN PIKET — ${sheetName.toUpperCase()}`]);
    ws.addRow([`Tanggal: ${label}`]);
    ws.addRow([]);

    const colRow = ws.addRow(columns.map(c => c.header));
    colRow.font = { bold: true };
    colRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBBF24" } };

    ws.columns = columns.map(c => ({ key: c.key, width: c.width }));
    rows.forEach(r => ws.addRow(r));
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        row.eachCell(cell => {
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" },
          };
        });
      }
    });
  }

  makeSheet("Keterlambatan", [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Siswa", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 14 },
    { header: "Waktu Tiba", key: "waktu_tiba", width: 12 },
    { header: "Alasan", key: "alasan", width: 30 },
    { header: "Sanksi", key: "sanksi", width: 25 },
  ], rowsTard);

  makeSheet("Izin Keluar", [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Siswa", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 14 },
    { header: "Alasan", key: "alasan", width: 30 },
    { header: "Jam Keluar", key: "jam_keluar", width: 12 },
    { header: "Jam Kembali", key: "jam_kembali", width: 12 },
    { header: "Status", key: "status", width: 16 },
  ], rowsPermit);

  makeSheet("Kehadiran Guru", [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Guru", key: "nama_guru", width: 28 },
    { header: "Kelas", key: "kelas", width: 14 },
    { header: "Jam Ke-", key: "jam_ke", width: 10 },
    { header: "Status", key: "status", width: 16 },
    { header: "Pengganti", key: "pengganti", width: 20 },
  ], rowsGuru);

  const buf = await wb.xlsx.writeBuffer();
  const dateForFile = (dateStr ?? new Date().toISOString()).slice(0, 10);
  return { data: Array.from(new Uint8Array(buf as ArrayBuffer)), filename: `laporan-piket-${dateForFile}.xlsx` };
}
