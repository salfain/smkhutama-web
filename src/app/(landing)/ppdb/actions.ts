"use server";

import { prisma } from "@/lib/prisma";

function genRegistNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PPDB-${year}-${rand}`;
}

export async function submitRegistration(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const nisn = String(formData.get("nisn") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const birthPlace = String(formData.get("birthPlace") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const parentName = String(formData.get("parentName") ?? "").trim();
  const parentPhone = String(formData.get("parentPhone") ?? "").trim();
  const originSchool = String(formData.get("originSchool") ?? "").trim();
  const selectedMajor = String(formData.get("selectedMajor") ?? "").trim();

  if (!fullName || !phone || !selectedMajor) {
    return { error: "Nama, no. HP, dan pilihan jurusan wajib diisi" };
  }

  try {
    let registNumber = genRegistNumber();
    let tries = 0;
    while (tries < 10) {
      const exists = await prisma.registration.findUnique({ where: { registNumber } });
      if (!exists) break;
      registNumber = genRegistNumber();
      tries++;
    }

    await prisma.registration.create({
      data: {
        registNumber,
        fullName,
        nisn: nisn || null,
        gender: gender === "MALE" ? "MALE" : gender === "FEMALE" ? "FEMALE" : null,
        birthPlace: birthPlace || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        originSchool: originSchool || null,
        selectedMajor: selectedMajor || null,
        status: "PENDING",
      },
    });

    return { success: true, registNumber };
  } catch {
    return { error: "Gagal menyimpan pendaftaran. Coba lagi." };
  }
}
