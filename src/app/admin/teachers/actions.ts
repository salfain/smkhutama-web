"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  return prisma.teacher.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, username: true, email: true, isActive: true } },
      subject: { select: { name: true, code: true } },
      _count: { select: { questions: true, exams: true } },
    },
  });
}

export async function getSubjectsForSelect() {
  return prisma.subject.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });
}

export async function createTeacher(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const nip = String(formData.get("nip") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  if (!name || !username || !password) {
    return { error: "Nama, username, dan password wajib diisi" };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  try {
    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        passwordHash,
        role: "TEACHER",
        teacher: {
          create: {
            nip: nip || null,
            subjectId: subjectId || null,
          },
        },
      },
      include: { teacher: { select: { id: true } } },
    });
    await logAudit({
      action: "CREATE_TEACHER",
      entity: "teacher",
      entityId: created.teacher?.id ?? created.id,
      details: { name, username, email: email || null, nip: nip || null, subjectId: subjectId || null },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "Username, email, atau NIP sudah digunakan" };
    return { error: "Gagal menambah guru" };
  }
}

export async function updateTeacher(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const nip = String(formData.get("nip") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !username) return { error: "Nama dan username wajib diisi" };
  if (password && password.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { username: true } } },
    });
    if (!teacher) return { error: "Guru tidak ditemukan" };

    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        name,
        username,
        email: email || null,
        ...(password && { passwordHash: await hashPassword(password) }),
      },
    });
    await prisma.teacher.update({
      where: { id },
      data: { nip: nip || null, subjectId: subjectId || null },
    });
    await logAudit({
      action: "UPDATE_TEACHER",
      entity: "teacher",
      entityId: id,
      details: {
        previousUsername: teacher.user.username,
        username,
        name,
        email: email || null,
        nip: nip || null,
        passwordChanged: Boolean(password),
      },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "Username, email, atau NIP sudah digunakan" };
    return { error: "Gagal memperbarui guru" };
  }
}

export async function toggleTeacherStatus(id: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher) return { error: "Guru tidak ditemukan" };
    const updated = await prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: !teacher.user.isActive },
    });
    await logAudit({
      action: "TOGGLE_TEACHER_STATUS",
      entity: "teacher",
      entityId: id,
      details: { username: updated.username, isActive: updated.isActive },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status guru" };
  }
}

export async function resetTeacherPassword(id: string, newPassword: string = "guru123") {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { username: true } } },
    });
    if (!teacher) return { error: "Guru tidak ditemukan" };
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { passwordHash },
    });
    await logAudit({
      action: "RESET_TEACHER_PASSWORD",
      entity: "teacher",
      entityId: id,
      details: { username: teacher.user.username },
    });
    revalidatePath("/admin/teachers");
    return { success: true, password: newPassword };
  } catch {
    return { error: "Gagal reset password" };
  }
}

export async function deleteTeacher(id: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { username: true, name: true } } },
    });
    if (!teacher) return { error: "Guru tidak ditemukan" };
    await prisma.user.delete({ where: { id: teacher.userId } });
    await logAudit({
      action: "DELETE_TEACHER",
      entity: "teacher",
      entityId: id,
      details: { username: teacher.user.username, name: teacher.user.name },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Guru masih memiliki soal/ujian." };
  }
}

export async function exportTeachersExcel() {
  const { generateExcel } = await import("@/lib/excel");
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, username: true, email: true, isActive: true } },
      subject: { select: { name: true, code: true } },
    },
  });

  const rows = teachers.map((t, i) => ({
    no: i + 1,
    nama: t.user.name,
    username: t.user.username,
    nip: t.nip ?? "",
    email: t.user.email ?? "",
    mapel: t.subject ? `${t.subject.code} – ${t.subject.name}` : "",
    status: t.user.isActive ? "Aktif" : "Nonaktif",
  }));

  const buf = await generateExcel("Data Guru", [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lengkap", key: "nama", width: 30 },
    { header: "Username", key: "username", width: 18 },
    { header: "NIP/NUPTK", key: "nip", width: 20 },
    { header: "Email", key: "email", width: 28 },
    { header: "Mata Pelajaran", key: "mapel", width: 24 },
    { header: "Status", key: "status", width: 10 },
  ], rows);

  return { data: Array.from(buf), filename: "data-guru.xlsx" };
}

// ---- TEMPLATE IMPORT GURU ----
export async function getTeacherImportTemplate() {
  const { generateExcel } = await import("@/lib/excel");
  const buf = await generateExcel("Template Guru", [
    { header: "Nama Lengkap", key: "nama", width: 30 },
    { header: "Username",     key: "username", width: 18 },
    { header: "Password",     key: "password", width: 16 },
    { header: "NIP/NUPTK",   key: "nip", width: 22 },
    { header: "Email",        key: "email", width: 28 },
    { header: "Kode Mapel",   key: "mapel", width: 14 },
  ], [
    {
      nama: "Ibu Sari Dewi, S.Pd (contoh)",
      username: "sari.dewi",
      password: "guru123",
      nip: "198505012010012001",
      email: "sari.dewi@smkhutama.sch.id",
      mapel: "MTK",
    },
  ]);
  return { data: Array.from(buf), filename: "template-import-guru.xlsx" };
}

// ---- IMPORT GURU DARI EXCEL ----
export async function importTeachersExcel(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "File wajib dipilih" };

  const { parseExcel } = await import("@/lib/excel");
  const bytes = await file.arrayBuffer();
  const rows = await parseExcel(bytes);

  if (rows.length === 0) return { error: "File kosong atau format tidak valid" };

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2; // row 1 = header
    const name     = (row["Nama Lengkap"] ?? row["nama"] ?? "").trim();
    const username = (row["Username"]     ?? row["username"] ?? "").trim();
    const password = (row["Password"]     ?? row["password"] ?? "").trim() || "guru123";
    const nip      = (row["NIP/NUPTK"]   ?? row["nip"] ?? "").trim();
    const email    = (row["Email"]        ?? row["email"] ?? "").trim();
    const mapelCode = (row["Kode Mapel"]  ?? row["mapel"] ?? "").trim().toUpperCase();

    if (!name || !username) {
      errors.push(`Baris ${rowNum}: Nama Lengkap dan Username wajib diisi`);
      continue;
    }
    if (password.length < 6) {
      errors.push(`Baris ${rowNum}: Password "${username}" minimal 6 karakter`);
      continue;
    }

    try {
      const passwordHash = await hashPassword(password);

      // Cari subject berdasarkan kode
      let subjectId: string | null = null;
      if (mapelCode) {
        const subj = await prisma.subject.findFirst({
          where: { code: { equals: mapelCode, mode: "insensitive" } },
        });
        subjectId = subj?.id ?? null;
      }

      await prisma.user.create({
        data: {
          name,
          username,
          email: email || null,
          passwordHash,
          role: "TEACHER",
          teacher: {
            create: {
              nip: nip || null,
              subjectId,
            },
          },
        },
      });
      created++;
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "P2002") {
        errors.push(`Baris ${rowNum}: Username/NIP "${username}" sudah digunakan`);
      } else {
        errors.push(`Baris ${rowNum}: Gagal import "${name}"`);
      }
    }
  }

  revalidatePath("/admin/teachers");
  await logAudit({
    action: "IMPORT_TEACHERS",
    entity: "teacher",
    details: { created, failed: errors.length },
  });
  return {
    success: true,
    created,
    errors: errors.length > 0 ? errors : undefined,
    message: `${created} guru berhasil diimport${errors.length > 0 ? `, ${errors.length} baris gagal` : ""}`,
  };
}
