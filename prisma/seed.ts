import { PrismaClient, Role, Gender, Semester, QuestionType, Difficulty, ExamStatus } from "../src/generated/prisma";
import * as bcryptModule from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcryptModule.hash(password, 10);
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. School Profile
  await prisma.schoolProfile.upsert({
    where: { id: "school-1" },
    update: {},
    create: {
      id: "school-1",
      name: "SMK HUTAMA",
      address: "Jl. Raya Bekasi No. 123, Bekasi Utara, Kota Bekasi, Jawa Barat 17131",
      npsn: "20271234",
      principalName: "Drs. H. Ahmad Subagyo, M.Pd",
    },
  });

  // 2. Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { id: "ay-2025-genap" },
    update: {},
    create: {
      id: "ay-2025-genap",
      year: "2025/2026",
      semester: Semester.GENAP,
      isActive: true,
    },
  });

  // 3. Majors
  const tkj = await prisma.major.upsert({
    where: { code: "TKJ" },
    update: {},
    create: { id: "major-tkj", name: "Teknik Komputer & Jaringan", code: "TKJ" },
  });
  const rpl = await prisma.major.upsert({
    where: { code: "RPL" },
    update: {},
    create: { id: "major-rpl", name: "Rekayasa Perangkat Lunak", code: "RPL" },
  });
  const akl = await prisma.major.upsert({
    where: { code: "AKL" },
    update: {},
    create: { id: "major-akl", name: "Akuntansi & Keuangan Lembaga", code: "AKL" },
  });

  // 4. Classes
  const classXIITKJ1 = await prisma.class.upsert({
    where: { id: "class-xii-tkj-1" },
    update: {},
    create: { id: "class-xii-tkj-1", name: "XII TKJ 1", grade: "XII", majorId: tkj.id },
  });
  const classXIRPL1 = await prisma.class.upsert({
    where: { id: "class-xi-rpl-1" },
    update: {},
    create: { id: "class-xi-rpl-1", name: "XI RPL 1", grade: "XI", majorId: rpl.id },
  });
  const classXTKJ1 = await prisma.class.upsert({
    where: { id: "class-x-tkj-1" },
    update: {},
    create: { id: "class-x-tkj-1", name: "X TKJ 1", grade: "X", majorId: tkj.id },
  });

  // 5. Subjects
  const matematika = await prisma.subject.upsert({
    where: { code: "MTK" },
    update: {},
    create: { id: "subj-mtk", name: "Matematika", code: "MTK" },
  });
  const bIndo = await prisma.subject.upsert({
    where: { code: "BIN" },
    update: {},
    create: { id: "subj-bin", name: "Bahasa Indonesia", code: "BIN" },
  });
  const bIng = await prisma.subject.upsert({
    where: { code: "BIG" },
    update: {},
    create: { id: "subj-big", name: "Bahasa Inggris", code: "BIG" },
  });
  const subjTKJ = await prisma.subject.upsert({
    where: { code: "PTKJ" },
    update: {},
    create: { id: "subj-ptkj", name: "Produktif TKJ", code: "PTKJ", majorId: tkj.id },
  });

  // 6. Admin User
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "user-admin",
      name: "Administrator",
      username: "admin",
      email: "admin@smkhutama.sch.id",
      passwordHash: await hashPassword("admin123"),
      role: Role.ADMIN,
    },
  });

  // 7. Teacher
  const teacherUser = await prisma.user.upsert({
    where: { username: "sari.dewi" },
    update: {},
    create: {
      id: "user-teacher-1",
      name: "Ibu Sari Dewi, S.Pd",
      username: "sari.dewi",
      email: "sari.dewi@smkhutama.sch.id",
      passwordHash: await hashPassword("guru123"),
      role: Role.TEACHER,
    },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      id: "teacher-1",
      userId: teacherUser.id,
      nip: "198505012010012001",
      subjectId: matematika.id,
    },
  });

  // 8. Students
  const students = [
    { id: "user-s1", name: "Ahmad Fauzan", username: "2324001", nis: "2324001", nisn: "0061234567", gender: Gender.MALE },
    { id: "user-s2", name: "Siti Rahayu", username: "2324002", nis: "2324002", nisn: "0061234568", gender: Gender.FEMALE },
    { id: "user-s3", name: "Budi Santoso", username: "2324003", nis: "2324003", nisn: "0061234569", gender: Gender.MALE },
    { id: "user-s4", name: "Dewi Lestari", username: "2324004", nis: "2324004", nisn: "0061234570", gender: Gender.FEMALE },
    { id: "user-s5", name: "Rizky Pratama", username: "2324005", nis: "2324005", nisn: "0061234571", gender: Gender.MALE },
  ];

  for (const s of students) {
    const user = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        username: s.username,
        passwordHash: await hashPassword("siswa123"),
        role: Role.STUDENT,
      },
    });
    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: `student-${s.nis}`,
        userId: user.id,
        nis: s.nis,
        nisn: s.nisn,
        classId: classXIITKJ1.id,
        majorId: tkj.id,
        gender: s.gender,
      },
    });
  }

  // 9. Sample Questions
  const questions = [
    { id: "q1", text: "Tentukan nilai dari lim(x→2) (x² - 4) / (x - 2).", type: QuestionType.MULTIPLE_CHOICE, diff: Difficulty.EASY },
    { id: "q2", text: "Hasil dari ∫(2x + 3) dx adalah...", type: QuestionType.MULTIPLE_CHOICE, diff: Difficulty.MEDIUM },
    { id: "q3", text: "Turunan pertama dari f(x) = 3x³ - 2x² + 5x - 1 adalah...", type: QuestionType.MULTIPLE_CHOICE, diff: Difficulty.MEDIUM },
    { id: "q4", text: "Nilai dari sin 30° + cos 60° adalah...", type: QuestionType.MULTIPLE_CHOICE, diff: Difficulty.EASY },
    { id: "q5", text: "Jelaskan konsep limit dalam matematika dan berikan contoh penerapannya.", type: QuestionType.ESSAY, diff: Difficulty.HARD },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        subjectId: matematika.id,
        teacherId: teacher.id,
        questionType: q.type,
        questionText: q.text,
        difficulty: q.diff,
        grade: "XII",
        material: "Limit Fungsi",
      },
    });
  }

  // Options for MCQ questions
  const optionsData = [
    { questionId: "q1", options: [
      { label: "A", text: "2", correct: false },
      { label: "B", text: "4", correct: true },
      { label: "C", text: "0", correct: false },
      { label: "D", text: "Tidak ada", correct: false },
    ]},
    { questionId: "q2", options: [
      { label: "A", text: "x² + 3x + C", correct: true },
      { label: "B", text: "2x² + 3 + C", correct: false },
      { label: "C", text: "x + 3 + C", correct: false },
      { label: "D", text: "2 + C", correct: false },
    ]},
    { questionId: "q3", options: [
      { label: "A", text: "9x² - 4x + 5", correct: true },
      { label: "B", text: "3x² - 4x + 5", correct: false },
      { label: "C", text: "9x² - 2x + 5", correct: false },
      { label: "D", text: "9x - 4 + 5", correct: false },
    ]},
    { questionId: "q4", options: [
      { label: "A", text: "1", correct: true },
      { label: "B", text: "½", correct: false },
      { label: "C", text: "√2", correct: false },
      { label: "D", text: "√3/2", correct: false },
    ]},
  ];

  for (const qOpt of optionsData) {
    for (let i = 0; i < qOpt.options.length; i++) {
      const opt = qOpt.options[i];
      await prisma.questionOption.upsert({
        where: { id: `${qOpt.questionId}-opt-${opt.label}` },
        update: {},
        create: {
          id: `${qOpt.questionId}-opt-${opt.label}`,
          questionId: qOpt.questionId,
          optionLabel: opt.label,
          optionText: opt.text,
          isCorrect: opt.correct,
          orderNumber: i + 1,
        },
      });
    }
  }

  // 10. Sample Exam
  await prisma.exam.upsert({
    where: { id: "exam-1" },
    update: {},
    create: {
      id: "exam-1",
      title: "UTS Matematika XII TKJ 1",
      subjectId: matematika.id,
      teacherId: teacher.id,
      academicYearId: academicYear.id,
      durationMinutes: 90,
      startAt: new Date("2026-06-15T01:00:00Z"), // 08:00 WIB
      endAt: new Date("2026-06-15T02:30:00Z"),   // 09:30 WIB
      randomizeQuestions: true,
      randomizeOptions: true,
      showResult: true,
      passingScore: 75,
      status: ExamStatus.ACTIVE,
    },
  });

  // Link questions to exam
  for (let i = 0; i < questions.length; i++) {
    await prisma.examQuestion.upsert({
      where: { id: `eq-1-${questions[i].id}` },
      update: {},
      create: {
        id: `eq-1-${questions[i].id}`,
        examId: "exam-1",
        questionId: questions[i].id,
        orderNumber: i + 1,
      },
    });
  }

  // Link class to exam
  await prisma.examClass.upsert({
    where: { id: "ec-1" },
    update: {},
    create: {
      id: "ec-1",
      examId: "exam-1",
      classId: classXIITKJ1.id,
    },
  });

  // Create token
  await prisma.examToken.upsert({
    where: { token: "MTK-7842" },
    update: {},
    create: {
      id: "token-1",
      examId: "exam-1",
      token: "MTK-7842",
      expiredAt: new Date("2026-06-15T02:30:00Z"),
      isActive: true,
    },
  });

  // 11. CMS / Landing Admin
  await prisma.user.upsert({
    where: { username: "cms" },
    update: {},
    create: {
      id: "user-cms",
      name: "Admin Landing",
      username: "cms",
      email: "cms@smkhutama.sch.id",
      passwordHash: await hashPassword("cms123"),
      role: "LANDING_ADMIN",
    },
  });

  console.log("✅ Seeding selesai!");
  console.log("");
  console.log("📋 Akun Login:");
  console.log("   Admin    → username: admin       password: admin123");
  console.log("   Guru     → username: sari.dewi   password: guru123");
  console.log("   Siswa    → username: 2324001     password: siswa123");
  console.log("   CMS      → username: cms         password: cms123");
  console.log("");
  console.log("🎫 Token Ujian: MTK-7842");
  console.log("🌐 CMS Landing: /cms/login");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
