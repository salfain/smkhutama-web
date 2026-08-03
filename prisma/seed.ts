import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import {
  AssignmentType,
  AttemptStatus,
  CasePriority,
  CounselingSessionMode,
  CounselingStatus,
  CounselingType,
  Difficulty,
  ExamStatus,
  ExamType,
  Gender,
  NotificationType,
  PrismaClient,
  QuestionSetSource,
  QuestionSetStatus,
  QuestionType,
  ReferralStatus,
  RegistrationStatus,
  RequestStatus,
  RiskLevel,
  Role,
  Semester,
  SensitiveAccessAction,
  SummonStatus,
  ViolationCategory,
} from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL wajib diisi sebelum menjalankan seed.");
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Seed demo di production diblokir. Jalankan dengan ALLOW_DEMO_SEED=true jika memang disengaja.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });
const now = new Date();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

function shift(milliseconds: number) {
  return new Date(now.getTime() + milliseconds);
}

async function upsertUser(input: {
  id: string;
  name: string;
  username: string;
  email?: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.upsert({
    where: { username: input.username },
    update: {
      name: input.name,
      email: input.email ?? null,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    create: {
      id: input.id,
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
    },
  });
}

async function main() {
  console.log("\n🌱 Menyiapkan data demo SMK Hutama...\n");

  await prisma.schoolProfile.upsert({
    where: { id: "school-1" },
    update: {
      name: "SMK HUTAMA",
      address: "Jl. Raya Hankam No. 37, Jatirahayu, Pondok Melati, Kota Bekasi",
      npsn: "20271234",
      principalName: "Dra. Sufida Ambarwati",
    },
    create: {
      id: "school-1",
      name: "SMK HUTAMA",
      address: "Jl. Raya Hankam No. 37, Jatirahayu, Pondok Melati, Kota Bekasi",
      npsn: "20271234",
      principalName: "Dra. Sufida Ambarwati",
    },
  });

  const existingActiveYear = await prisma.academicYear.findFirst({
    where: { isActive: true, id: { not: "ay-2025-genap" } },
    orderBy: { createdAt: "desc" },
  });
  let academicYear = existingActiveYear;
  if (!academicYear) {
    await prisma.academicYear.updateMany({ where: { id: "ay-2025-genap" }, data: { isActive: false } });
    academicYear = await prisma.academicYear.upsert({
      where: { id: "demo-ay-2026-ganjil" },
      update: { year: "2026/2027", semester: Semester.GANJIL, isActive: true },
      create: { id: "demo-ay-2026-ganjil", year: "2026/2027", semester: Semester.GANJIL, isActive: true },
    });
  }
  await prisma.academicYear.upsert({
    where: { id: "demo-ay-2025-genap" },
    update: { year: "2025/2026", semester: Semester.GENAP, isActive: false },
    create: { id: "demo-ay-2025-genap", year: "2025/2026", semester: Semester.GENAP, isActive: false },
  });

  const majorData = [
    ["TKJ", "Teknik Komputer dan Jaringan"],
    ["RPL", "Rekayasa Perangkat Lunak"],
    ["AKL", "Akuntansi dan Keuangan Lembaga"],
    ["TKRO", "Teknik Kendaraan Ringan Otomotif"],
  ] as const;
  const majors = new Map<string, { id: string; code: string }>();
  for (const [code, name] of majorData) {
    const record = await prisma.major.upsert({
      where: { code },
      update: { name },
      create: { id: `major-${code.toLowerCase()}`, code, name },
    });
    majors.set(code, record);
  }

  const classRecords: { id: string; name: string; grade: string; majorCode: string }[] = [];
  for (const grade of ["X", "XI", "XII"]) {
    for (const [majorCode] of majorData) {
      const id = `class-${grade.toLowerCase()}-${majorCode.toLowerCase()}-1`;
      const name = `${grade} ${majorCode} 1`;
      const record = await prisma.class.upsert({
        where: { id },
        update: { name, grade, majorId: majors.get(majorCode)!.id },
        create: { id, name, grade, majorId: majors.get(majorCode)!.id },
      });
      classRecords.push({ ...record, majorCode });
    }
  }

  const subjectData = [
    { code: "MTK", name: "Matematika", majorCode: null },
    { code: "BIN", name: "Bahasa Indonesia", majorCode: null },
    { code: "BIG", name: "Bahasa Inggris", majorCode: null },
    { code: "IPAS", name: "Ilmu Pengetahuan Alam dan Sosial", majorCode: null },
    { code: "PAI", name: "Pendidikan Agama Islam", majorCode: null },
    { code: "PTKJ", name: "Produktif Teknik Komputer dan Jaringan", majorCode: "TKJ" },
    { code: "PRPL", name: "Produktif Rekayasa Perangkat Lunak", majorCode: "RPL" },
    { code: "PAKL", name: "Produktif Akuntansi", majorCode: "AKL" },
    { code: "PTKRO", name: "Produktif Teknik Kendaraan Ringan", majorCode: "TKRO" },
  ] as const;
  const subjects = new Map<string, { id: string; code: string; name: string }>();
  for (const item of subjectData) {
    const record = await prisma.subject.upsert({
      where: { code: item.code },
      update: { name: item.name, majorId: item.majorCode ? majors.get(item.majorCode)!.id : null },
      create: {
        id: `subject-${item.code.toLowerCase()}`,
        code: item.code,
        name: item.name,
        majorId: item.majorCode ? majors.get(item.majorCode)!.id : null,
      },
    });
    subjects.set(item.code, record);
  }

  const admin = await upsertUser({ id: "user-admin", name: "Administrator Sekolah", username: "admin", email: "admin@smkhutama.sch.id", password: "admin123", role: Role.ADMIN });
  const curriculum = await upsertUser({ id: "user-kurikulum", name: "Wakil Kepala Kurikulum", username: "kurikulum.hutama", email: "kurikulum@smkhutama.sch.id", password: "kurikulum123", role: Role.KURIKULUM });
  const studentAffairs = await upsertUser({ id: "user-kesiswaan", name: "Wakil Kepala Kesiswaan", username: "kesiswaan.hutama", email: "kesiswaan@smkhutama.sch.id", password: "kesiswaan123", role: Role.KESISWAAN });
  const cbtAdmin = await upsertUser({ id: "user-admin-cbt", name: "Admin CBT", username: "admincbt.hutama", email: "admincbt@smkhutama.sch.id", password: "admincbt123", role: Role.ADMIN_CBT });
  const cmsAdmin = await upsertUser({ id: "user-cms", name: "Admin Landing Page", username: "cms", email: "cms@smkhutama.sch.id", password: "cms123", role: Role.LANDING_ADMIN });
  const counselorUser = await upsertUser({ id: "user-counselor-1", name: "Fitri Handayani, S.Pd", username: "bk.hutama", email: "bk@smkhutama.sch.id", password: "bk123", role: Role.COUNSELOR });
  const counselor = await prisma.counselor.upsert({
    where: { userId: counselorUser.id },
    update: { nip: "198706122012012004", phone: "081234567890" },
    create: { id: "counselor-1", userId: counselorUser.id, nip: "198706122012012004", phone: "081234567890" },
  });

  const teacherData = [
    { username: "sari.dewi", name: "Sari Dewi, S.Pd", nip: "198505012010012001", subject: "MTK", password: "guru123", role: Role.TEACHER },
    { username: "ratna.amanda", name: "Ratna Amanda, S.Pd", nip: "198804172011012003", subject: "BIN", password: "guru123", role: Role.TEACHER },
    { username: "agus.hermawan", name: "Agus Hermawan, S.Pd", nip: "198203092008011002", subject: "BIG", password: "guru123", role: Role.TEACHER },
    { username: "piket.hutama", name: "Dedi Suharyanto, S.Pd", nip: "198911232014011005", subject: "IPAS", password: "piket123", role: Role.TEACHER },
    { username: "nur.aini", name: "Nur Aini, S.Ag", nip: "198112102007012006", subject: "PAI", password: "guru123", role: Role.TEACHER },
    { username: "budi.santoso", name: "Budi Santoso, S.Kom", nip: "198601152012011003", subject: "PTKJ", password: "guru123", role: Role.TEACHER },
    { username: "rina.marlina", name: "Rina Marlina, S.Kom", nip: "199001202015012002", subject: "PRPL", password: "guru123", role: Role.TEACHER },
    { username: "wulan.sari", name: "Wulan Sari, S.E", nip: "198709172013012004", subject: "PAKL", password: "guru123", role: Role.TEACHER },
    { username: "eko.prasetyo", name: "Eko Prasetyo, S.T", nip: "198304052009011004", subject: "PTKRO", password: "guru123", role: Role.TEACHER },
  ];
  const teachers = new Map<string, { id: string; userId: string; name: string }>();
  for (const item of teacherData) {
    const user = await upsertUser({
      id: `user-${item.username.replaceAll(".", "-")}`,
      name: item.name,
      username: item.username,
      email: `${item.username}@smkhutama.sch.id`,
      password: item.password,
      role: item.role,
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: { nip: item.nip, subjectId: subjects.get(item.subject)!.id },
      create: { id: `teacher-${item.username.replaceAll(".", "-")}`, userId: user.id, nip: item.nip, subjectId: subjects.get(item.subject)!.id },
    });
    teachers.set(item.subject, { id: teacher.id, userId: user.id, name: item.name });
  }

  for (let index = 0; index < classRecords.length; index += 1) {
    const homeroom = Array.from(teachers.values())[index % teachers.size];
    await prisma.class.update({ where: { id: classRecords[index].id }, data: { homeroomTeacherId: homeroom.id } });
  }

  const studentNames = [
    "Ahmad Fauzan", "Siti Rahayu", "Bima Pratama", "Dewi Lestari", "Rizky Ramadhan", "Aulia Putri",
    "Fajar Maulana", "Nabila Zahra", "Dimas Saputra", "Citra Maharani", "Farhan Akbar", "Nadya Safitri",
  ];
  const students: { id: string; userId: string; name: string; classId: string }[] = [];
  for (let index = 0; index < studentNames.length; index += 1) {
    const nis = `2600${String(index + 1).padStart(2, "0")}`;
    const targetClass = classRecords[index % classRecords.length];
    const user = await upsertUser({
      id: `demo-user-student-${index + 1}`,
      name: studentNames[index],
      username: nis,
      password: "siswa123",
      role: Role.STUDENT,
    });
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        nis,
        nisn: `0062600${String(index + 1).padStart(3, "0")}`,
        classId: targetClass.id,
        majorId: majors.get(targetClass.majorCode)!.id,
        gender: index % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      },
      create: {
        id: `demo-student-${index + 1}`,
        userId: user.id,
        nis,
        nisn: `0062600${String(index + 1).padStart(3, "0")}`,
        classId: targetClass.id,
        majorId: majors.get(targetClass.majorCode)!.id,
        gender: index % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      },
    });
    students.push({ id: student.id, userId: user.id, name: studentNames[index], classId: targetClass.id });
  }

  const roleAssignments = [
    ["demo-assignment-kurikulum", curriculum.id, AssignmentType.KURIKULUM, "Koordinator kurikulum"],
    ["demo-assignment-kesiswaan", studentAffairs.id, AssignmentType.KESISWAAN, "Koordinator kesiswaan"],
    ["demo-assignment-cbt", cbtAdmin.id, AssignmentType.ADMIN_CBT, "Pengelola CBT"],
    ["demo-assignment-counselor", counselorUser.id, AssignmentType.COUNSELOR, "Guru BK"],
    ["demo-assignment-piket", teachers.get("IPAS")!.userId, AssignmentType.PIKET, "Koordinator piket harian"],
    ["demo-assignment-cms", cmsAdmin.id, AssignmentType.CMS, "Pengelola landing page"],
  ] as const;
  for (const [id, userId, type, note] of roleAssignments) {
    await prisma.userAssignment.upsert({
      where: { id },
      update: { userId, type, academicYearId: academicYear.id, isActive: true, note, createdById: admin.id },
      create: { id, userId, type, academicYearId: academicYear.id, isActive: true, note, createdById: admin.id },
    });
  }

  const scheduleSubjectCodes = ["MTK", "BIN"];
  const lessonTimes = [["07:00", "07:40"], ["07:40", "08:20"], ["08:20", "09:00"]] as const;
  for (let classIndex = 0; classIndex < classRecords.length; classIndex += 1) {
    const targetClass = classRecords[classIndex];
    const productiveCode = `P${targetClass.majorCode}`;
    const codes = [...scheduleSubjectCodes, productiveCode];
    for (let subjectIndex = 0; subjectIndex < codes.length; subjectIndex += 1) {
      const subjectCode = codes[subjectIndex];
      const teacher = teachers.get(subjectCode)!;
      const subject = subjects.get(subjectCode)!;
      await prisma.teachingAssignment.upsert({
        where: {
          academicYearId_teacherId_subjectId_classId: {
            academicYearId: academicYear.id,
            teacherId: teacher.id,
            subjectId: subject.id,
            classId: targetClass.id,
          },
        },
        update: { weeklyPeriods: subjectIndex === 2 ? 6 : 2, isActive: true, note: subjectIndex === 2 ? "Mapel produktif" : null },
        create: {
          id: `demo-teaching-${classIndex}-${subjectCode.toLowerCase()}`,
          academicYearId: academicYear.id,
          teacherId: teacher.id,
          subjectId: subject.id,
          classId: targetClass.id,
          weeklyPeriods: subjectIndex === 2 ? 6 : 2,
          isActive: true,
          note: subjectIndex === 2 ? "Mapel produktif" : null,
        },
      });

      const sequence = classIndex + subjectIndex;
      const dayOfWeek = (sequence % 6) + 1;
      const [startTime, endTime] = lessonTimes[Math.floor(sequence / 6) % lessonTimes.length];
      await prisma.lessonSchedule.upsert({
        where: { id: `demo-lesson-${classIndex}-${subjectIndex}` },
        update: { academicYearId: academicYear.id, classId: targetClass.id, subjectId: subject.id, teacherId: teacher.id, dayOfWeek, startTime, endTime, isActive: true },
        create: {
          id: `demo-lesson-${classIndex}-${subjectIndex}`,
          academicYearId: academicYear.id,
          classId: targetClass.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          dayOfWeek,
          startTime,
          endTime,
          room: subjectIndex === 2 ? `Lab ${targetClass.majorCode}` : targetClass.name,
          isActive: true,
        },
      });
    }
  }

  const piketTeacher = teachers.get("IPAS")!;
  for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek += 1) {
    await prisma.piketSchedule.upsert({
      where: { academicYearId_teacherId_dayOfWeek: { academicYearId: academicYear.id, teacherId: piketTeacher.id, dayOfWeek } },
      update: { isActive: true, note: "Koordinator piket" },
      create: { id: `demo-piket-${dayOfWeek}`, academicYearId: academicYear.id, teacherId: piketTeacher.id, dayOfWeek, isActive: true, note: "Koordinator piket" },
    });
  }

  const questionSet = await prisma.questionSet.upsert({
    where: { id: "demo-question-set-mtk" },
    update: { title: "Bank Soal Matematika Ganjil", status: QuestionSetStatus.APPROVED, totalQuestions: 6, multipleChoiceCount: 5, essayCount: 1 },
    create: {
      id: "demo-question-set-mtk",
      title: "Bank Soal Matematika Ganjil",
      description: "Paket demo untuk pengujian alur CBT.",
      subjectId: subjects.get("MTK")!.id,
      ownerTeacherId: teachers.get("MTK")!.id,
      createdByUserId: teachers.get("MTK")!.userId,
      createdByRole: Role.TEACHER,
      source: QuestionSetSource.TEACHER_IMPORT,
      examType: ExamType.UTS,
      grade: "XII",
      status: QuestionSetStatus.APPROVED,
      totalQuestions: 6,
      multipleChoiceCount: 5,
      essayCount: 1,
    },
  });
  const questionData = [
    { text: "Hasil dari 15 × 8 adalah...", options: ["120", "115", "125", "130"], correct: 0, difficulty: Difficulty.EASY },
    { text: "Jika x + 5 = 12, nilai x adalah...", options: ["5", "6", "7", "8"], correct: 2, difficulty: Difficulty.EASY },
    { text: "Luas persegi dengan sisi 12 cm adalah...", options: ["24 cm²", "48 cm²", "124 cm²", "144 cm²"], correct: 3, difficulty: Difficulty.MEDIUM },
    { text: "Nilai √196 adalah...", options: ["12", "13", "14", "16"], correct: 2, difficulty: Difficulty.MEDIUM },
    { text: "Jumlah sudut dalam sebuah segitiga adalah...", options: ["90°", "180°", "270°", "360°"], correct: 1, difficulty: Difficulty.EASY },
  ];
  const questions: { id: string; correctOptionId?: string }[] = [];
  for (let index = 0; index < questionData.length; index += 1) {
    const item = questionData[index];
    const questionId = `demo-question-mtk-${index + 1}`;
    await prisma.question.upsert({
      where: { id: questionId },
      update: { questionText: item.text, difficulty: item.difficulty, questionSetId: questionSet.id, isActive: true },
      create: {
        id: questionId,
        subjectId: subjects.get("MTK")!.id,
        teacherId: teachers.get("MTK")!.id,
        questionSetId: questionSet.id,
        questionType: QuestionType.MULTIPLE_CHOICE,
        questionText: item.text,
        difficulty: item.difficulty,
        material: "Matematika Dasar",
        grade: "XII",
        scoreWeight: 1,
        isActive: true,
      },
    });
    for (let optionIndex = 0; optionIndex < item.options.length; optionIndex += 1) {
      const optionId = `${questionId}-option-${optionIndex + 1}`;
      await prisma.questionOption.upsert({
        where: { id: optionId },
        update: { optionText: item.options[optionIndex], isCorrect: optionIndex === item.correct, orderNumber: optionIndex + 1 },
        create: { id: optionId, questionId, optionLabel: String.fromCharCode(65 + optionIndex), optionText: item.options[optionIndex], isCorrect: optionIndex === item.correct, orderNumber: optionIndex + 1 },
      });
      if (optionIndex === item.correct) questions.push({ id: questionId, correctOptionId: optionId });
    }
  }
  const essayQuestion = await prisma.question.upsert({
    where: { id: "demo-question-mtk-essay" },
    update: { questionText: "Jelaskan langkah penyelesaian persamaan 2x + 6 = 20.", questionSetId: questionSet.id, isActive: true },
    create: {
      id: "demo-question-mtk-essay",
      subjectId: subjects.get("MTK")!.id,
      teacherId: teachers.get("MTK")!.id,
      questionSetId: questionSet.id,
      questionType: QuestionType.ESSAY,
      questionText: "Jelaskan langkah penyelesaian persamaan 2x + 6 = 20.",
      difficulty: Difficulty.MEDIUM,
      material: "Persamaan Linear",
      grade: "XII",
      scoreWeight: 1,
      isActive: true,
    },
  });
  questions.push({ id: essayQuestion.id });

  await prisma.exam.updateMany({ where: { id: "exam-1" }, data: { status: ExamStatus.CLOSED } });
  const exams = [
    { id: "demo-exam-active", title: "Latihan CBT Matematika Aktif", status: ExamStatus.ACTIVE, startAt: shift(-hour), endAt: shift(4 * hour), type: ExamType.TRYOUT },
    { id: "demo-exam-closed", title: "Ulangan Matematika Selesai", status: ExamStatus.CLOSED, startAt: shift(-7 * day), endAt: shift(-7 * day + 90 * 60 * 1000), type: ExamType.UH },
    { id: "demo-exam-draft", title: "PTS Matematika Mendatang", status: ExamStatus.DRAFT, startAt: shift(7 * day), endAt: shift(7 * day + 90 * 60 * 1000), type: ExamType.UTS },
  ];
  for (const item of exams) {
    await prisma.exam.upsert({
      where: { id: item.id },
      update: { title: item.title, startAt: item.startAt, endAt: item.endAt, status: item.status, academicYearId: academicYear.id },
      create: {
        id: item.id,
        title: item.title,
        subjectId: subjects.get("MTK")!.id,
        teacherId: teachers.get("MTK")!.id,
        questionSetId: questionSet.id,
        academicYearId: academicYear.id,
        durationMinutes: 90,
        startAt: item.startAt,
        endAt: item.endAt,
        randomizeQuestions: true,
        randomizeOptions: true,
        showResult: true,
        passingScore: 75,
        status: item.status,
        examType: item.type,
      },
    });
    for (let index = 0; index < questions.length; index += 1) {
      await prisma.examQuestion.upsert({
        where: { examId_questionId: { examId: item.id, questionId: questions[index].id } },
        update: { orderNumber: index + 1 },
        create: { id: `${item.id}-question-${index + 1}`, examId: item.id, questionId: questions[index].id, orderNumber: index + 1 },
      });
    }
    await prisma.examClass.upsert({
      where: { examId_classId: { examId: item.id, classId: classRecords[8].id } },
      update: {},
      create: { id: `${item.id}-class`, examId: item.id, classId: classRecords[8].id },
    });
    await prisma.examSession.upsert({
      where: { id: `${item.id}-session` },
      update: { startAt: item.startAt, endAt: item.endAt },
      create: { id: `${item.id}-session`, examId: item.id, sessionName: "Sesi 1", roomName: "Lab Komputer 1", startAt: item.startAt, endAt: item.endAt },
    });
  }
  await prisma.examToken.upsert({
    where: { token: "DEMO-2026" },
    update: { examId: "demo-exam-active", expiredAt: shift(4 * hour), isActive: true },
    create: { id: "demo-exam-token", examId: "demo-exam-active", token: "DEMO-2026", expiredAt: shift(4 * hour), isActive: true },
  });

  const examStudents = students.filter((student) => student.classId === classRecords[8].id);
  if (examStudents[0]) {
    await prisma.studentExamAttempt.upsert({
      where: { examId_studentId: { examId: "demo-exam-active", studentId: examStudents[0].id } },
      update: { status: AttemptStatus.IN_PROGRESS, startedAt: shift(-20 * 60 * 1000), loginStatus: true, score: null },
      create: { id: "demo-attempt-active", examId: "demo-exam-active", studentId: examStudents[0].id, status: AttemptStatus.IN_PROGRESS, startedAt: shift(-20 * 60 * 1000), loginStatus: true, ipAddress: "127.0.0.1" },
    });
  }
  const submittedStudent = examStudents[1] ?? examStudents[0];
  if (submittedStudent) {
    const attempt = await prisma.studentExamAttempt.upsert({
      where: { examId_studentId: { examId: "demo-exam-closed", studentId: submittedStudent.id } },
      update: { status: AttemptStatus.SUBMITTED, startedAt: shift(-7 * day), submittedAt: shift(-7 * day + hour), loginStatus: false, score: 80 },
      create: { id: "demo-attempt-closed", examId: "demo-exam-closed", studentId: submittedStudent.id, status: AttemptStatus.SUBMITTED, startedAt: shift(-7 * day), submittedAt: shift(-7 * day + hour), score: 80 },
    });
    for (const question of questions.filter((item) => item.correctOptionId).slice(0, 4)) {
      await prisma.studentAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: question.id } },
        update: { selectedOptionId: question.correctOptionId, isCorrect: true, score: 1 },
        create: { id: `${attempt.id}-${question.id}`, attemptId: attempt.id, questionId: question.id, selectedOptionId: question.correctOptionId, isCorrect: true, score: 1 },
      });
    }
  }

  const violationTypes = [
    { id: "demo-violation-late", name: "Terlambat tanpa keterangan", category: ViolationCategory.RINGAN, points: 5 },
    { id: "demo-violation-uniform", name: "Seragam tidak lengkap", category: ViolationCategory.RINGAN, points: 10 },
    { id: "demo-violation-fight", name: "Perkelahian", category: ViolationCategory.BERAT, points: 50 },
  ];
  for (const item of violationTypes) {
    await prisma.violationType.upsert({ where: { id: item.id }, update: { ...item, isActive: true }, create: { ...item, isActive: true } });
  }
  const bkCases = [
    { id: "demo-case-1", student: students[0], title: "Kesulitan adaptasi belajar", type: CounselingType.BELAJAR, status: CounselingStatus.IN_PROGRESS, priority: CasePriority.HIGH, risk: RiskLevel.MEDIUM },
    { id: "demo-case-2", student: students[3], title: "Konflik dengan teman sebaya", type: CounselingType.SOSIAL, status: CounselingStatus.OPEN, priority: CasePriority.MEDIUM, risk: RiskLevel.LOW },
    { id: "demo-case-3", student: students[8], title: "Perencanaan karier dan PKL", type: CounselingType.KARIR, status: CounselingStatus.RESOLVED, priority: CasePriority.LOW, risk: RiskLevel.NONE },
  ];
  for (let index = 0; index < bkCases.length; index += 1) {
    const item = bkCases[index];
    await prisma.counselingCase.upsert({
      where: { id: item.id },
      update: { academicYearId: academicYear.id, title: item.title, type: item.type, status: item.status, priority: item.priority, riskLevel: item.risk, sessionDate: shift(-(index + 1) * day), nextFollowUpAt: item.status === CounselingStatus.RESOLVED ? null : shift((index + 2) * day) },
      create: {
        id: item.id,
        studentId: item.student.id,
        counselorId: counselor.id,
        academicYearId: academicYear.id,
        title: item.title,
        description: "Data demo untuk melihat alur pendampingan siswa.",
        type: item.type,
        status: item.status,
        priority: item.priority,
        riskLevel: item.risk,
        riskNotes: item.risk === RiskLevel.NONE ? null : "Perlu pemantauan berkala dan komunikasi dengan wali kelas.",
        sessionDate: shift(-(index + 1) * day),
        nextFollowUpAt: item.status === CounselingStatus.RESOLVED ? null : shift((index + 2) * day),
        resolvedAt: item.status === CounselingStatus.RESOLVED ? shift(-day) : null,
      },
    });
    await prisma.counselingSession.upsert({
      where: { id: `${item.id}-session-1` },
      update: { summary: "Siswa menyampaikan kondisi dan menyepakati langkah tindak lanjut.", sessionDate: shift(-(index + 1) * day) },
      create: { id: `${item.id}-session-1`, caseId: item.id, counselorId: counselor.id, sessionDate: shift(-(index + 1) * day), durationMinutes: 45, mode: CounselingSessionMode.INDIVIDUAL, location: "Ruang BK", summary: "Siswa menyampaikan kondisi dan menyepakati langkah tindak lanjut.", intervention: "Konseling individual dan pemantauan wali kelas.", outcome: "Siswa kooperatif.", nextPlan: "Evaluasi pada pertemuan berikutnya." },
    });
  }
  await prisma.counselingReferral.upsert({
    where: { id: "demo-referral-1" },
    update: { status: ReferralStatus.PLANNED, followUpAt: shift(7 * day) },
    create: { id: "demo-referral-1", caseId: "demo-case-1", counselorId: counselor.id, referredTo: "Psikolog mitra sekolah", institution: "Puskesmas Jatirahayu", reason: "Asesmen lanjutan bila kondisi belajar tidak membaik.", status: ReferralStatus.PLANNED, followUpAt: shift(7 * day) },
  });
  for (let index = 0; index < 4; index += 1) {
    await prisma.violationRecord.upsert({
      where: { id: `demo-violation-record-${index + 1}` },
      update: { academicYearId: academicYear.id, date: shift(-(index + 1) * day) },
      create: { id: `demo-violation-record-${index + 1}`, studentId: students[index % 2].id, recordedById: studentAffairs.id, violationTypeId: violationTypes[index % violationTypes.length].id, academicYearId: academicYear.id, description: violationTypes[index % violationTypes.length].name, points: violationTypes[index % violationTypes.length].points, sanction: index === 2 ? "Pembinaan bersama orang tua" : "Teguran dan refleksi", date: shift(-(index + 1) * day) },
    });
  }
  for (let index = 0; index < 3; index += 1) {
    await prisma.achievementRecord.upsert({
      where: { id: `demo-achievement-${index + 1}` },
      update: { academicYearId: academicYear.id, date: shift(-(index + 2) * day) },
      create: { id: `demo-achievement-${index + 1}`, studentId: students[index + 4].id, recordedById: studentAffairs.id, academicYearId: academicYear.id, title: ["Juara 1 LKS Jaringan", "Finalis Debat Bahasa Inggris", "Juara Futsal Antar-SMK"][index], description: "Prestasi siswa pada kegiatan sekolah dan kompetisi.", points: [50, 30, 25][index], level: ["Kota", "Kota", "Kecamatan"][index], date: shift(-(index + 2) * day) },
    });
  }
  for (let index = 0; index < 2; index += 1) {
    await prisma.counselingRequest.upsert({
      where: { id: `demo-counseling-request-${index + 1}` },
      update: { academicYearId: academicYear.id, preferredDate: shift((index + 1) * day) },
      create: { id: `demo-counseling-request-${index + 1}`, studentId: students[index + 10].id, academicYearId: academicYear.id, topic: index === 0 ? "Konsultasi pilihan karier" : "Kesulitan mengatur waktu belajar", description: "Siswa mengajukan sesi melalui portal SIBIKONS.", urgency: index === 0 ? "SEDANG" : "TINGGI", preferredDate: shift((index + 1) * day), status: index === 0 ? RequestStatus.PENDING : RequestStatus.SCHEDULED, response: index === 0 ? null : "Dijadwalkan di ruang BK setelah jam pelajaran." },
    });
  }
  await prisma.parentSummon.upsert({
    where: { id: "demo-parent-summon-1" },
    update: { academicYearId: academicYear.id, meetingDate: shift(3 * day) },
    create: { id: "demo-parent-summon-1", studentId: students[0].id, counselorId: counselor.id, academicYearId: academicYear.id, level: "PANGGILAN", reason: "Koordinasi perkembangan belajar dan kedisiplinan.", totalPoints: 25, meetingDate: shift(3 * day), status: SummonStatus.SENT },
  });
  await prisma.homeVisit.upsert({
    where: { id: "demo-home-visit-1" },
    update: { academicYearId: academicYear.id, visitDate: shift(-5 * day) },
    create: { id: "demo-home-visit-1", studentId: students[3].id, counselorId: counselor.id, academicYearId: academicYear.id, visitDate: shift(-5 * day), purpose: "Koordinasi dukungan belajar di rumah.", address: "Jatirahayu, Kota Bekasi", findings: "Orang tua mendukung rencana pendampingan.", result: "Disepakati jadwal belajar dan pemantauan mingguan." },
  });

  const survey = await prisma.survey.upsert({
    where: { id: "demo-survey-akpd" },
    update: { academicYearId: academicYear.id, isActive: true },
    create: { id: "demo-survey-akpd", title: "Asesmen Kebutuhan Peserta Didik", academicYearId: academicYear.id, description: "Angket demo untuk memetakan kebutuhan pribadi, sosial, belajar, dan karier.", isActive: true },
  });
  const surveyQuestions = [
    ["Saya kesulitan mengatur waktu belajar.", "Belajar"],
    ["Saya membutuhkan informasi tentang pilihan karier.", "Karier"],
    ["Saya kesulitan berkomunikasi dengan teman.", "Sosial"],
    ["Saya sering merasa cemas menghadapi tugas sekolah.", "Pribadi"],
  ] as const;
  for (let index = 0; index < surveyQuestions.length; index += 1) {
    await prisma.surveyQuestion.upsert({
      where: { id: `demo-survey-question-${index + 1}` },
      update: { text: surveyQuestions[index][0], category: surveyQuestions[index][1], orderNumber: index + 1 },
      create: { id: `demo-survey-question-${index + 1}`, surveyId: survey.id, text: surveyQuestions[index][0], category: surveyQuestions[index][1], orderNumber: index + 1 },
    });
  }
  for (let studentIndex = 0; studentIndex < 5; studentIndex += 1) {
    const response = await prisma.surveyResponse.upsert({
      where: { surveyId_studentId: { surveyId: survey.id, studentId: students[studentIndex].id } },
      update: { submittedAt: shift(-studentIndex * day) },
      create: { id: `demo-survey-response-${studentIndex + 1}`, surveyId: survey.id, studentId: students[studentIndex].id, submittedAt: shift(-studentIndex * day) },
    });
    for (let questionIndex = 0; questionIndex < surveyQuestions.length; questionIndex += 1) {
      const questionId = `demo-survey-question-${questionIndex + 1}`;
      await prisma.surveyAnswer.upsert({
        where: { responseId_questionId: { responseId: response.id, questionId } },
        update: { value: ((studentIndex + questionIndex) % 5) + 1 },
        create: { id: `demo-survey-answer-${studentIndex}-${questionIndex}`, responseId: response.id, questionId, value: ((studentIndex + questionIndex) % 5) + 1 },
      });
    }
  }

  const todayOps = [
    prisma.teacherAttendance.upsert({ where: { id: "demo-attendance-1" }, update: { academicYearId: academicYear.id, date: now, status: "TIDAK_HADIR" }, create: { id: "demo-attendance-1", teacherId: teachers.get("BIN")!.id, classId: classRecords[0].id, academicYearId: academicYear.id, recordedBy: piketTeacher.userId, status: "TIDAK_HADIR", period: "Jam 1-2", note: "Sakit", date: now } }),
    prisma.teacherAttendance.upsert({ where: { id: "demo-attendance-2" }, update: { academicYearId: academicYear.id, date: now, status: "TUGAS_LUAR" }, create: { id: "demo-attendance-2", teacherId: teachers.get("BIG")!.id, classId: classRecords[1].id, academicYearId: academicYear.id, recordedBy: piketTeacher.userId, status: "TUGAS_LUAR", period: "Jam 3-4", substitute: "Sari Dewi, S.Pd", date: now } }),
    prisma.studentTardiness.upsert({ where: { id: "demo-tardiness-1" }, update: { academicYearId: academicYear.id, date: now, arrivalTime: shift(-hour) }, create: { id: "demo-tardiness-1", studentId: students[0].id, recordedBy: piketTeacher.userId, academicYearId: academicYear.id, arrivalTime: shift(-hour), reason: "Kendaraan umum terlambat", sanction: "Membuat refleksi kedisiplinan", date: now } }),
    prisma.studentTardiness.upsert({ where: { id: "demo-tardiness-2" }, update: { academicYearId: academicYear.id, date: now, arrivalTime: shift(-45 * 60 * 1000) }, create: { id: "demo-tardiness-2", studentId: students[2].id, recordedBy: piketTeacher.userId, academicYearId: academicYear.id, arrivalTime: shift(-45 * 60 * 1000), reason: "Bangun kesiangan", sanction: "Teguran", date: now } }),
    prisma.studentPermit.upsert({ where: { id: "demo-permit-active" }, update: { academicYearId: academicYear.id, date: now, exitTime: shift(-30 * 60 * 1000), returnTime: null, status: "KELUAR" }, create: { id: "demo-permit-active", studentId: students[4].id, recordedBy: piketTeacher.userId, academicYearId: academicYear.id, type: "KELUAR", reason: "Periksa kesehatan", exitTime: shift(-30 * 60 * 1000), status: "KELUAR", date: now } }),
    prisma.studentPermit.upsert({ where: { id: "demo-permit-returned" }, update: { academicYearId: academicYear.id, date: now, status: "SUDAH_KEMBALI" }, create: { id: "demo-permit-returned", studentId: students[6].id, recordedBy: piketTeacher.userId, academicYearId: academicYear.id, type: "KELUAR", reason: "Mengambil dokumen", exitTime: shift(-2 * hour), returnTime: shift(-hour), status: "SUDAH_KEMBALI", date: now } }),
  ];
  await Promise.all(todayOps);

  await prisma.landingProfile.upsert({
    where: { id: "demo-landing-profile" },
    update: { schoolName: "SMK Hutama", shortName: "SMK Hutama", ppdbOpen: true },
    create: {
      id: "demo-landing-profile",
      schoolName: "SMK Hutama",
      shortName: "SMK Hutama",
      tagline: "Kompeten, Berkarakter, Siap Kerja",
      heroBadge: "Penerimaan Peserta Didik Baru 2026/2027",
      heroTitle: "Membangun Generasi Kompeten untuk Masa Depan",
      heroSubtitle: "Sekolah vokasi dengan pembelajaran berbasis industri, karakter, dan teknologi.",
      address: "Jl. Raya Hankam No. 37, Jatirahayu, Pondok Melati, Kota Bekasi",
      phone: "(021) 8497 1234",
      whatsapp: "6281234567890",
      email: "info@smkhutama.sch.id",
      officialUrl: "https://smkhutama.sch.id",
      instagram: "@smkhutama",
      ppdbOpen: true,
      vision: "Menjadi sekolah kejuruan unggul yang menghasilkan lulusan kompeten, berkarakter, dan berdaya saing.",
      mission: "Menyelenggarakan pendidikan vokasi berkualitas; membangun budaya disiplin; memperkuat kemitraan industri; mengembangkan potensi siswa.",
      history: "SMK Hutama hadir untuk memenuhi kebutuhan pendidikan vokasi dan tenaga kerja terampil di Kota Bekasi.",
      principalName: "Dra. Sufida Ambarwati",
      principalWord: "Kami berkomitmen mendampingi setiap siswa agar berkembang sesuai potensi dan siap menghadapi dunia kerja.",
    },
  });
  const heroImages = [
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=85",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=85",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=85",
  ];
  for (let index = 0; index < heroImages.length; index += 1) {
    await prisma.landingHeroImage.upsert({ where: { id: `demo-hero-${index + 1}` }, update: { imageUrl: heroImages[index], orderNumber: index, isActive: true }, create: { id: `demo-hero-${index + 1}`, imageUrl: heroImages[index], caption: ["Pembelajaran kolaboratif", "Lingkungan sekolah", "Praktik berbasis kompetensi"][index], orderNumber: index, isActive: true } });
  }
  const landingStats = [["Akreditasi", "A"], ["Peserta Didik", "900+"], ["Mitra Industri", "25+"], ["Program Keahlian", "4"]] as const;
  for (let index = 0; index < landingStats.length; index += 1) {
    await prisma.landingStat.upsert({ where: { id: `demo-stat-${index + 1}` }, update: { label: landingStats[index][0], value: landingStats[index][1], orderNumber: index }, create: { id: `demo-stat-${index + 1}`, label: landingStats[index][0], value: landingStats[index][1], orderNumber: index } });
  }
  for (let index = 0; index < majorData.length; index += 1) {
    await prisma.landingMajor.upsert({ where: { id: `demo-landing-major-${majorData[index][0].toLowerCase()}` }, update: { code: majorData[index][0], name: majorData[index][1], isActive: true, orderNumber: index }, create: { id: `demo-landing-major-${majorData[index][0].toLowerCase()}`, code: majorData[index][0], name: majorData[index][1], description: `Program keahlian ${majorData[index][1]} dengan pembelajaran teori, praktik, dan proyek industri.`, orderNumber: index, isActive: true } });
  }
  const news = [
    ["ppdb-2026-smk-hutama", "PPDB SMK Hutama Tahun Ajaran 2026/2027", "Pendaftaran peserta didik baru telah dibuka."],
    ["siswa-hutama-juara-lks", "Siswa SMK Hutama Raih Juara LKS", "Prestasi membanggakan kembali diraih pada kompetisi tingkat kota."],
    ["sinkronisasi-kurikulum-industri", "Sinkronisasi Kurikulum Bersama Mitra Industri", "Sekolah memperkuat kesesuaian kompetensi lulusan dengan kebutuhan industri."],
  ] as const;
  for (let index = 0; index < news.length; index += 1) {
    await prisma.landingNews.upsert({ where: { slug: news[index][0] }, update: { title: news[index][1], excerpt: news[index][2], isPublished: true, publishedAt: shift(-index * day) }, create: { id: `demo-news-${index + 1}`, slug: news[index][0], title: news[index][1], excerpt: news[index][2], content: `${news[index][2]} Informasi lebih lanjut dapat diperoleh melalui kanal resmi sekolah.`, imageUrl: heroImages[index], isPublished: true, publishedAt: shift(-index * day) } });
  }
  for (let index = 0; index < teacherData.slice(0, 6).length; index += 1) {
    const item = teacherData[index];
    await prisma.landingTeacher.upsert({ where: { id: `demo-landing-teacher-${index + 1}` }, update: { name: item.name, subject: subjects.get(item.subject)!.name, isActive: true, orderNumber: index }, create: { id: `demo-landing-teacher-${index + 1}`, name: item.name, position: index === 5 ? "Kepala Program Keahlian" : "Guru", subject: subjects.get(item.subject)!.name, photoUrl: `https://i.pravatar.cc/400?img=${index + 20}`, orderNumber: index, isActive: true } });
  }
  const extracurriculars = [
    ["Pramuka", "Wajib", "Jumat, 14.00–16.00", "Tent"],
    ["Futsal", "Olahraga", "Selasa, 15.30–17.00", "Trophy"],
    ["Paskibra", "Kedisiplinan", "Sabtu, 08.00–11.00", "Flag"],
    ["English Club", "Akademik", "Senin, 15.30–17.00", "Languages"],
  ] as const;
  for (let index = 0; index < extracurriculars.length; index += 1) {
    const item = extracurriculars[index];
    await prisma.landingExtracurricular.upsert({ where: { id: `demo-extracurricular-${index + 1}` }, update: { name: item[0], category: item[1], schedule: item[2], icon: item[3], isActive: true, orderNumber: index }, create: { id: `demo-extracurricular-${index + 1}`, name: item[0], category: item[1], description: `Kegiatan ${item[0]} untuk mengembangkan karakter, keterampilan, dan kerja sama siswa.`, schedule: item[2], icon: item[3], color: "from-blue-500 to-indigo-600", imageUrl: heroImages[index % heroImages.length], orderNumber: index, isActive: true } });
  }
  for (let index = 0; index < 3; index += 1) {
    await prisma.registration.upsert({ where: { registNumber: `PPDB-2026-${String(index + 1).padStart(4, "0")}` }, update: { status: [RegistrationStatus.PENDING, RegistrationStatus.VERIFIED, RegistrationStatus.ACCEPTED][index] }, create: { id: `demo-registration-${index + 1}`, registNumber: `PPDB-2026-${String(index + 1).padStart(4, "0")}`, fullName: ["Muhammad Arkan", "Zahra Amelia", "Kevin Pratama"][index], nisn: `00987654${index + 1}`, gender: index === 1 ? Gender.FEMALE : Gender.MALE, birthPlace: "Bekasi", birthDate: new Date(`2010-0${index + 1}-15T00:00:00Z`), address: "Kota Bekasi", phone: `0812345600${index}`, parentName: ["Hendra", "Sulastri", "Bambang"][index], parentPhone: `0812987600${index}`, originSchool: `SMP Negeri ${index + 1} Bekasi`, selectedMajor: majorData[index][0], status: [RegistrationStatus.PENDING, RegistrationStatus.VERIFIED, RegistrationStatus.ACCEPTED][index] } });
  }
  for (let index = 0; index < 3; index += 1) {
    await prisma.landingGallery.upsert({ where: { id: `demo-gallery-${index + 1}` }, update: { imageUrl: heroImages[index], isActive: true, orderNumber: index }, create: { id: `demo-gallery-${index + 1}`, imageUrl: heroImages[index], caption: ["Kegiatan belajar mengajar", "Lingkungan sekolah", "Praktik siswa"][index], orderNumber: index, isActive: true } });
  }
  const faqs = [
    ["Bagaimana cara mendaftar di SMK Hutama?", "Pendaftaran dilakukan melalui halaman PPDB. Isi formulir dan simpan nomor pendaftaran untuk mengecek status."],
    ["Program keahlian apa saja yang tersedia?", "Tersedia TKJ, RPL, AKL, dan TKRO dengan pembelajaran berbasis praktik dan industri."],
    ["Bagaimana siswa mengakses CBT?", "Siswa membuka portal Login Siswa lalu masuk menggunakan NIS dan password yang diberikan sekolah."],
  ] as const;
  for (let index = 0; index < faqs.length; index += 1) {
    await prisma.landingFaq.upsert({ where: { id: `demo-faq-${index + 1}` }, update: { question: faqs[index][0], answer: faqs[index][1], isActive: true, orderNumber: index }, create: { id: `demo-faq-${index + 1}`, question: faqs[index][0], answer: faqs[index][1], orderNumber: index, isActive: true } });
  }

  const settings = [
    ["school_timezone", "Asia/Jakarta", "Umum"],
    ["lesson_period_minutes", "40", "Kurikulum"],
    ["minimum_teaching_periods", "24", "Kurikulum"],
    ["exam_default_passing_score", "75", "CBT"],
  ] as const;
  for (const [key, value, category] of settings) {
    await prisma.systemSetting.upsert({ where: { key }, update: { value, category }, create: { id: `demo-setting-${key}`, key, value, category } });
  }
  const notifications = [
    [curriculum.id, NotificationType.ACTION_REQUIRED, "Lengkapi pembagian mengajar", "Periksa alokasi JP dan jadwal kelas untuk periode aktif.", "/admin/teaching-assignments"],
    [counselorUser.id, NotificationType.WARNING, "Tindak lanjut kasus", "Ada kasus prioritas yang perlu ditinjau.", "/counselor/cases"],
    [cbtAdmin.id, NotificationType.INFO, "Ujian demo aktif", "Monitoring ujian demo tersedia.", "/admin/monitoring"],
    [students[0].userId, NotificationType.INFO, "Jadwal ujian", "Latihan CBT Matematika sedang tersedia.", "/student/exams"],
  ] as const;
  for (let index = 0; index < notifications.length; index += 1) {
    const item = notifications[index];
    await prisma.notification.upsert({ where: { id: `demo-notification-${index + 1}` }, update: { userId: item[0], type: item[1], title: item[2], message: item[3], href: item[4], readAt: null }, create: { id: `demo-notification-${index + 1}`, userId: item[0], type: item[1], title: item[2], message: item[3], href: item[4] } });
  }
  await prisma.sensitiveAccessLog.upsert({
    where: { id: "demo-sensitive-log" },
    update: { userId: counselorUser.id, action: SensitiveAccessAction.VIEW, resourceType: "counseling_case", resourceId: "demo-case-1" },
    create: { id: "demo-sensitive-log", userId: counselorUser.id, action: SensitiveAccessAction.VIEW, resourceType: "counseling_case", resourceId: "demo-case-1", purpose: "Data demo audit akses sensitif", ipAddress: "127.0.0.1" },
  });
  await prisma.auditLog.upsert({
    where: { id: "demo-audit-log" },
    update: { userId: admin.id, action: "DEMO_DATA_SEEDED", entity: "system", details: JSON.stringify({ academicYear: academicYear.year }) },
    create: { id: "demo-audit-log", userId: admin.id, action: "DEMO_DATA_SEEDED", entity: "system", details: JSON.stringify({ academicYear: academicYear.year }), ipAddress: "127.0.0.1" },
  });

  const summary = await Promise.all([
    prisma.user.count(), prisma.teacher.count(), prisma.student.count(), prisma.class.count(),
    prisma.teachingAssignment.count(), prisma.lessonSchedule.count(), prisma.exam.count(),
    prisma.counselingCase.count(), prisma.landingNews.count(),
  ]);
  console.log("✅ Data demo selesai dibuat/diperbarui.");
  console.log(`   ${summary[0]} akun · ${summary[1]} guru · ${summary[2]} siswa · ${summary[3]} kelas`);
  console.log(`   ${summary[4]} pembagian mengajar · ${summary[5]} jadwal · ${summary[6]} ujian`);
  console.log(`   ${summary[7]} kasus BK · ${summary[8]} berita landing\n`);
  console.log("Akun demo:");
  console.log("  Admin       admin / admin123");
  console.log("  Kurikulum  kurikulum.hutama / kurikulum123");
  console.log("  Kesiswaan  kesiswaan.hutama / kesiswaan123");
  console.log("  Admin CBT  admincbt.hutama / admincbt123");
  console.log("  Guru       sari.dewi / guru123");
  console.log("  Guru Piket piket.hutama / piket123");
  console.log("  Guru BK    bk.hutama / bk123");
  console.log("  Siswa      260001 / siswa123");
  console.log("  CMS        cms / cms123");
  console.log("  Token CBT  DEMO-2026\n");
}

main()
  .catch((error) => {
    console.error("❌ Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
