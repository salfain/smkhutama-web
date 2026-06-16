"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { generateExcel, parseExcel } from "@/lib/excel";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  return prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, username: true, isActive: true } },
      class: { select: { name: true } },
      major: { select: { name: true, code: true } },
    },
  });
}

export async function getClassesAndMajors() {
  const [classes, majors] = await Promise.all([
    prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true, grade: true, majorId: true },
    }),
    prisma.major.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);
  return { classes, majors };
}

export async function createStudent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const nis = String(formData.get("nis") ?? "").trim();
  const nisn = String(formData.get("nisn") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const majorId = String(formData.get("majorId") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim() || "siswa123";

  if (!name || !username) return { error: "Nama dan username wajib diisi" };

  try {
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: "STUDENT",
        student: {
          create: {
            nis: nis || null,
            nisn: nisn || null,
            gender: gender === "MALE" ? "MALE" : gender === "FEMALE" ? "FEMALE" : undefined,
            classId: classId || null,
            majorId: majorId || null,
          },
        },
      },
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "Username, NIS, atau NISN sudah digunakan" };
    return { error: "Gagal menambah siswa" };
  }
}

export async function updateStudent(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const nis = String(formData.get("nis") ?? "").trim();
  const nisn = String(formData.get("nisn") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const majorId = String(formData.get("majorId") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !username) return { error: "Nama dan username wajib diisi" };
  if (password && password.length < 6) return { error: "Password minimal 6 karakter" };

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return { error: "Siswa tidak ditemukan" };

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name,
        username,
        ...(password && { passwordHash: await hashPassword(password) }),
      },
    });
    await prisma.student.update({
      where: { id },
      data: {
        nis: nis || null,
        nisn: nisn || null,
        gender: gender === "MALE" ? "MALE" : gender === "FEMALE" ? "FEMALE" : null,
        classId: classId || null,
        majorId: majorId || null,
      },
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "Username, NIS, atau NISN sudah digunakan" };
    return { error: "Gagal memperbarui siswa" };
  }
}

export async function toggleStudentStatus(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id }, include: { user: true },
    });
    if (!student) return { error: "Siswa tidak ditemukan" };
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: !student.user.isActive },
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status siswa" };
  }
}

export async function resetStudentPassword(id: string) {
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return { error: "Siswa tidak ditemukan" };
    const passwordHash = await hashPassword("siswa123");
    await prisma.user.update({ where: { id: student.userId }, data: { passwordHash } });
    revalidatePath("/admin/students");
    return { success: true, password: "siswa123" };
  } catch {
    return { error: "Gagal reset password" };
  }
}

export async function deleteStudent(id: string) {
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return { error: "Siswa tidak ditemukan" };
    await prisma.user.delete({ where: { id: student.userId } });
    revalidatePath("/admin/students");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus siswa" };
  }
}

// ---- EXPORT ----
export async function exportStudentsExcel(): Promise<{ data: number[]; filename: string }> {
  const students = await prisma.student.findMany({
    orderBy: [{ class: { name: "asc" } }],
    include: {
      user: { select: { name: true, username: true, isActive: true } },
      class: { select: { name: true } },
      major: { select: { code: true } },
    },
  });

  const rows = students.map((s, i) => ({
    no: i + 1,
    nama: s.user.name,
    username: s.user.username,
    nis: s.nis ?? "",
    nisn: s.nisn ?? "",
    kelas: s.class?.name ?? "",
    jurusan: s.major?.code ?? "",
    gender: s.gender === "MALE" ? "L" : s.gender === "FEMALE" ? "P" : "",
    status: s.user.isActive ? "Aktif" : "Nonaktif",
  }));

  const buf = await generateExcel("Data Siswa", [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lengkap", key: "nama", width: 30 },
    { header: "Username", key: "username", width: 18 },
    { header: "NIS", key: "nis", width: 14 },
    { header: "NISN", key: "nisn", width: 14 },
    { header: "Kelas", key: "kelas", width: 16 },
    { header: "Jurusan", key: "jurusan", width: 10 },
    { header: "L/P", key: "gender", width: 6 },
    { header: "Status", key: "status", width: 10 },
  ], rows);

  return { data: Array.from(buf), filename: "data-siswa.xlsx" };
}

// ---- IMPORT ----
export async function importStudentsExcel(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "File wajib dipilih" };

  const bytes = await file.arrayBuffer();
  const rows = await parseExcel(bytes);

  if (rows.length === 0) return { error: "File kosong atau format tidak valid" };

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const name     = (row["Nama Lengkap"] ?? row["nama"]     ?? "").trim();
    const username = (row["Username"]     ?? row["username"] ?? row["NIS"] ?? row["nis"] ?? "").trim();
    const nis      = (row["NIS"]          ?? row["nis"]      ?? "").trim();
    const nisn     = (row["NISN"]         ?? row["nisn"]     ?? "").trim();
    // Kolom Password — jika kosong, default ke username/NIS
    const password = (row["Password"]     ?? row["password"] ?? "").trim() || username;
    const genderRaw = (row["L/P"] ?? row["Gender"] ?? row["gender"] ?? "").trim().toUpperCase();
    const gender    = genderRaw === "L" ? "MALE" : genderRaw === "P" ? "FEMALE" : null;
    const className = (row["Kelas"] ?? row["kelas"] ?? "").trim();

    if (!name || !username) {
      errors.push(`Baris ${rowNum}: Nama Lengkap dan Username/NIS wajib diisi`);
      continue;
    }
    if (password.length < 6) {
      errors.push(`Baris ${rowNum}: Password "${username}" minimal 6 karakter`);
      continue;
    }

    try {
      const passwordHash = await hashPassword(password);

      let classId: string | null = null;
      let majorId: string | null = null;
      if (className) {
        const cls = await prisma.class.findFirst({
          where: { name: { contains: className, mode: "insensitive" } },
        });
        if (cls) { classId = cls.id; majorId = cls.majorId; }
      }

      await prisma.user.create({
        data: {
          name, username, passwordHash, role: "STUDENT",
          student: {
            create: {
              nis: nis || null,
              nisn: nisn || null,
              gender: gender ?? undefined,
              classId, majorId,
            },
          },
        },
      });
      created++;
    } catch {
      errors.push(`Baris ${rowNum}: Username/NIS "${username}" sudah digunakan`);
    }
  }

  revalidatePath("/admin/students");
  return {
    success: true,
    created,
    errors: errors.length > 0 ? errors : undefined,
    message: `${created} siswa berhasil diimport${errors.length > 0 ? `, ${errors.length} baris gagal` : ""}`,
  };
}

// ---- TEMPLATE ----
export async function getImportTemplate() {
  const buf = await generateExcel("Template Siswa", [
    { header: "Nama Lengkap", key: "nama",     width: 30 },
    { header: "Username",     key: "username", width: 18 },
    { header: "Password",     key: "password", width: 16 },
    { header: "NIS",          key: "nis",      width: 14 },
    { header: "NISN",         key: "nisn",     width: 14 },
    { header: "Kelas",        key: "kelas",    width: 16 },
    { header: "L/P",          key: "gender",   width: 6  },
  ], [
    {
      nama: "Ahmad Fauzan (contoh)",
      username: "2324001",
      password: "siswa123",
      nis: "2324001",
      nisn: "0012345678",
      kelas: "XII TKJ 1",
      gender: "L",
    },
  ]);
  return { data: Array.from(buf), filename: "template-import-siswa.xlsx" };
}
