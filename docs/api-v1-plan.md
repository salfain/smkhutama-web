# Rencana API v1 — Pemecahan 4 Modul dalam 1 API

Dokumen ini menjelaskan cara memecah backend SMK Hutama menjadi empat modul
(**landing**, **cbt**, **bk**, **piket**) tanpa memecah repo, aplikasi, maupun
database. Satu Next.js app, satu deployment, satu Prisma schema — yang dipecah
adalah **struktur internal dan permukaan API**, bukan infrastrukturnya.

---

## 1. Kenapa tetap satu aplikasi

| Alasan | Bukti di kode |
| --- | --- |
| Datanya saling terkait | `Student` dipakai CBT (`StudentExamAttempt`), BK (`CounselingCase`, `ViolationRecord`), dan piket (`StudentTardiness`, `StudentPermit`). `Teacher` dipakai CBT dan `PiketSchedule`. |
| Autentikasi tunggal | `User` + `Role` + JWT (`src/lib/jwt.ts`) dipakai semua modul. |
| Deployment tunggal | `docker-compose.yml` menjalankan satu container app + satu Postgres. |
| Skala sekolah | Tidak ada kebutuhan scaling per-modul yang membenarkan biaya operasional multi-service. |

Memecah jadi service terpisah akan memutus relasi Prisma dan menggantinya
dengan panggilan HTTP antar-service — lebih lambat, lebih rapuh, tanpa manfaat
nyata pada skala ini. Yang dipakai di sini adalah pola **modular monolith**.

---

## 2. Struktur folder

```
src/
├─ app/
│  ├─ api/                       ← permukaan HTTP
│  │  ├─ v1/                     ← API baru, per modul
│  │  │  ├─ auth/                   login, logout, me (lintas modul)
│  │  │  ├─ landing/                konten publik sekolah
│  │  │  ├─ cbt/                    ujian: student / teacher / admin
│  │  │  ├─ bk/                     bimbingan konseling   ✅ sudah jalan
│  │  │  └─ piket/                  guru piket            ✅ sudah jalan
│  │  └─ ...                     ← route lama, dibiarkan hidup
│  ├─ (landing)/ cms/ admin/ teacher/ student/ counselor/ piket/   ← halaman web
└─ server/                       ← logika backend, bebas dari HTTP
   ├─ http.ts                       envelope response, ApiError, CORS
   ├─ auth.ts                       guard: Bearer token atau cookie sesi
   ├─ date-range.ts                 helper rentang tanggal
   └─ modules/
      ├─ auth/service.ts            ✅
      ├─ piket/{service,dto}.ts     ✅
      ├─ bk/                        ✅ service, surveys, follow-up, dto
      ├─ cbt/                       ⏳
      └─ landing/                   ⏳
```

Pembagian tanggung jawabnya:

- **`src/server/modules/<modul>/service.ts`** — satu-satunya tempat query
  Prisma dan aturan bisnis modul itu. Tidak tahu apa pun soal HTTP, cookie,
  `FormData`, atau `revalidatePath`.
- **`src/server/modules/<modul>/dto.ts`** — memetakan record Prisma ke bentuk
  JSON yang dikirim ke klien.
- **`src/app/api/**/route.ts`** — tipis: autentikasi, baca parameter, panggil
  service, bungkus response.
- **`src/app/<halaman>/actions.ts`** — server action untuk halaman web,
  memanggil **service yang sama**.

Aturan ini menghilangkan duplikasi yang ada sekarang: sebelum refactor,
`src/app/api/piket/izin/route.ts` dan `src/app/piket/actions.ts` menyimpan dua
salinan query yang sama dan sudah mulai berbeda (route menyertakan `major`,
server action tidak).

---

## 3. Kontrak API v1

**Base URL:** `/api/v1`

**Bentuk response** — seragam di semua modul:

```jsonc
// sukses
{ "success": true, "data": { ... } }

// gagal
{ "success": false, "error": { "code": "PIKET_NOT_SCHEDULED", "message": "Anda tidak terjadwal piket hari ini" } }
```

**Autentikasi** — `src/server/auth.ts` menerima dua cara, dicoba berurutan:

1. `Authorization: Bearer <jwt>` — dipakai aplikasi mobile.
2. Cookie sesi `cbt-session` — dipakai halaman web yang memanggil API lewat
   `fetch`, tanpa perlu token terpisah.

**Kode error yang dipakai:**

| HTTP | `code` | Kapan |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR`, `BAD_REQUEST` | Field wajib kosong atau tidak valid |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS` | Tidak ada/salah kredensial |
| 403 | `FORBIDDEN`, `ROLE_MISMATCH`, `ACCOUNT_INACTIVE`, `PIKET_NOT_SCHEDULED`, `PIKET_REQUIRES_TEACHER` | Sudah login, tapi tidak berhak |
| 404 | `NOT_FOUND` | Record tidak ada |
| 500 | `INTERNAL_ERROR` | Error tak terduga; detail hanya masuk log server |

**CORS** — sudah diterapkan global untuk `/api/:path*` lewat `next.config.ts`,
jadi route tidak perlu menyetel header sendiri. Route v1 hanya menyediakan
handler `OPTIONS` (`preflight()`) agar preflight menjawab `204`.

---

## 4. Strategi migrasi: v1 berdampingan, bukan menggantikan

Aplikasi mobile yang sudah beredar memakai path lama (lihat commit
`9c99e59` "Fix mobile API compatibility"). Karena itu:

- Route lama di `/api/*` **tidak dipindah dan tidak diubah bentuk
  response-nya**. Isinya diganti jadi pemanggilan service modul, sehingga
  logikanya sama persis dengan v1 tapi kontrak lamanya utuh.
- Route baru dibangun di `/api/v1/*`.
- Tidak ada alias, tidak ada redirect, tidak ada breaking change.
- Klien pindah ke v1 kapan pun siap. Route lama baru dihapus setelah tidak ada
  lagi klien yang memakainya.

---

## 5. Peta endpoint per modul

Legenda: ✅ sudah ada · ⏳ belum dikerjakan

### 5.1 Auth (lintas modul)

| v1 | Lama | Status |
| --- | --- | --- |
| `POST /api/v1/auth/login` | `POST /api/auth/login` | ✅ |
| `POST /api/v1/auth/logout` | `POST /api/auth/logout` | ✅ |
| `GET /api/v1/auth/me` | `GET /api/auth/me` | ✅ |

Login menerima `system: "PIKET"` untuk menerapkan syarat jadwal piket.

### 5.2 Modul Piket ✅

| v1 | Lama |
| --- | --- |
| `GET /api/v1/piket/dashboard?date=` | `GET /api/piket/dashboard` |
| `GET /api/v1/piket/terlambat?date=` | `GET /api/piket/terlambat` |
| `POST /api/v1/piket/terlambat` | `POST /api/piket/terlambat` |
| `DELETE /api/v1/piket/terlambat/{id}` | `DELETE /api/piket/terlambat?id=` |
| `GET /api/v1/piket/izin?date=` | `GET /api/piket/izin` |
| `POST /api/v1/piket/izin` | `POST /api/piket/izin` |
| `DELETE /api/v1/piket/izin/{id}` | `DELETE /api/piket/izin?id=` |
| `PATCH /api/v1/piket/izin/{id}/kembali` | `PATCH\|POST /api/piket/izin/{id}/kembali` |
| `GET /api/v1/piket/guru?date=` | `GET /api/piket/guru` |
| `POST /api/v1/piket/guru` | `POST /api/piket/guru` |
| `DELETE /api/v1/piket/guru/{id}` | `DELETE /api/piket/guru?id=` |

Perubahan bentuk di v1: penghapusan memakai path parameter (`/{id}`), bukan
query string, dan mengembalikan `404` kalau record tidak ada.

### 5.3 Modul CBT ⏳

| v1 | Lama |
| --- | --- |
| `GET /api/v1/cbt/student/dashboard` | `/api/student/dashboard` |
| `GET /api/v1/cbt/student/exams` | `/api/student/exams` |
| `POST /api/v1/cbt/student/exams/validate-token` | `/api/student/exams/validate-token` |
| `POST /api/v1/cbt/student/exams/start` | `/api/student/exams/start` |
| `GET /api/v1/cbt/student/exams/{id}/questions` | `/api/student/exams/[id]/questions` |
| `GET /api/v1/cbt/student/exams/{id}/status` | `/api/student/exams/[id]/status` |
| `POST /api/v1/cbt/student/exams/{id}/resume` | `/api/student/exams/[id]/resume` |
| `POST /api/v1/cbt/student/exams/{id}/heartbeat` | `/api/student/exams/[id]/heartbeat` |
| `POST /api/v1/cbt/student/exams/{id}/violation` | `/api/student/exams/[id]/violation` |
| `POST /api/v1/cbt/student/exams/{id}/submit` | `/api/student/exams/[id]/submit` |
| `POST /api/v1/cbt/student/answers` | `/api/student/answers/save` |
| `POST /api/v1/cbt/student/answers/sync` | `/api/student/answers/sync` |
| `GET /api/v1/cbt/student/results` | `/api/student/results` |
| `GET /api/v1/cbt/attempts/{attemptId}/answers` | `/api/answers/[attemptId]` |
| `GET /api/v1/cbt/teacher/dashboard` | `/api/teacher/dashboard` |
| `GET /api/v1/cbt/teacher/exams` | `/api/teacher/exams` |
| `GET /api/v1/cbt/teacher/exams/{id}/token` | `/api/teacher/exams/[id]/token` |
| `GET /api/v1/cbt/teacher/questions` | `/api/teacher/questions` |
| `GET /api/v1/cbt/teacher/monitoring/{examId}` | `/api/teacher/monitoring/[examId]` |
| `GET /api/v1/cbt/teacher/essay-grading` | `/api/teacher/essay-grading` |
| `PATCH /api/v1/cbt/teacher/essay-grading/{id}` | `/api/teacher/essay-grading/[id]` |
| `GET /api/v1/cbt/admin/exams/{id}/print-questions` | `/api/admin/exams/[id]/print-questions` |

Aturan bisnis yang harus pindah ke `src/server/modules/cbt/`:
`src/lib/exam-scoring.ts`, `exam-permissions.ts`, `exam-lock.ts`,
`exam-types.ts`, `mobile-exam.ts`, `question-set-import.ts`.

### 5.4 Modul BK ✅

| v1 | Lama |
| --- | --- |
| `GET /api/v1/bk/counselor/dashboard` | `GET /api/counselor/dashboard` |
| `GET /api/v1/bk/counselor/students` | `GET /api/counselor/students` |
| `GET /api/v1/bk/counselor/students/book` | `GET /api/counselor/students/book` |
| `GET /api/v1/bk/counselor/students/book/{id}` | `GET /api/counselor/students/book/[id]` |
| `GET\|POST /api/v1/bk/counselor/cases` | `GET /api/counselor/cases` |
| `GET\|PATCH /api/v1/bk/counselor/cases/{id}` | `GET\|PATCH /api/counselor/cases/[id]` |
| `GET\|POST /api/v1/bk/counselor/violations` | `GET\|POST /api/counselor/violations` |
| `GET\|POST /api/v1/bk/counselor/achievements` | `GET\|POST /api/counselor/achievements` |
| `GET /api/v1/bk/counselor/requests` | `GET /api/counselor/requests` |
| `PATCH /api/v1/bk/counselor/requests/{id}` | `POST /api/counselor/requests/[id]` |
| `GET\|POST /api/v1/bk/counselor/surveys` | `GET\|POST /api/counselor/surveys` |
| `GET /api/v1/bk/counselor/surveys/{id}` | `GET /api/counselor/surveys/[id]` |
| `POST /api/v1/bk/counselor/surveys/{id}/questions` | `POST /api/counselor/surveys/[id]/questions` |
| `GET /api/v1/bk/counselor/surveys/{id}/results` | `GET /api/counselor/surveys/[id]/results` |
| `GET /api/v1/bk/student/summary` | `GET /api/student/bk` |
| `POST /api/v1/bk/student/requests` | `POST /api/student/bk/request` |
| `GET /api/v1/bk/student/surveys` | `GET /api/student/surveys` |
| `GET\|POST /api/v1/bk/student/surveys/{id}` | `GET\|POST /api/student/surveys/[id]` |

Yang berbeda di v1, semuanya bersifat menambah:

- **Dashboard** ikut memuat `topStudents` (lima siswa dengan poin pelanggaran
  tertinggi), sama seperti yang dilihat halaman web guru BK.
- **`POST /cases`** membuat sesi konseling — sebelumnya hanya bisa lewat
  halaman web.
- **`PATCH /requests/{id}`** menerima `{ convertToCase: true }` untuk sekaligus
  membuat sesi konseling dari permohonan, jalur yang juga sebelumnya hanya ada
  di web.
- **`GET /violations` dan `/achievements`** menerima `?take=`; tanpa parameter
  tetap 50 seperti endpoint lama, `take=0` berarti seluruh catatan.
- **Rekap angket** ikut memuat daftar responden.
- **Hak akses** mengikuti web: guru BK **atau** admin. Endpoint lama tetap
  hanya untuk peran `COUNSELOR`.

Ambang poin → rekomendasi SP (`src/lib/bk-points.ts`) **tetap di `src/lib/`**,
bukan dipindah ke `src/server/modules/bk/` seperti rencana awal: aturan itu
dipakai juga oleh komponen client `FollowUpClient.tsx`, sedangkan `src/server/`
khusus kode yang hanya berjalan di server.

Server action halaman web yang kini memakai service yang sama:
`src/app/counselor/{actions,bk-actions,survey-actions,reports-actions}.ts`,
`src/app/student/bk/{actions,survey-actions}.ts`, dan
`src/app/teacher/bk/actions.ts`.

### 5.5 Modul Landing ⏳

Modul ini **belum punya API sama sekali**. Halaman publik mengambil data
langsung lewat `src/lib/landing-data.ts` di server component, dan CMS memakai
server action `src/app/cms/(panel)/content-actions.ts`.

| v1 | Sumber sekarang |
| --- | --- |
| `GET /api/v1/landing/profile` | `getLandingProfile()` |
| `GET /api/v1/landing/stats` | `LandingStat` |
| `GET /api/v1/landing/hero-images` | `LandingHeroImage` |
| `GET /api/v1/landing/majors` | `LandingMajor` |
| `GET /api/v1/landing/news`, `.../news/{slug}` | `LandingNews` |
| `GET /api/v1/landing/teachers` | `LandingTeacher` |
| `GET /api/v1/landing/extracurriculars` | `LandingExtracurricular` |
| `GET /api/v1/landing/gallery` | `LandingGallery` |
| `GET /api/v1/landing/faq` | `LandingFaq` |
| `POST /api/v1/landing/ppdb` | `src/app/(landing)/ppdb/actions.ts` |
| `GET /api/v1/landing/ppdb/{registrationNumber}` | halaman `/ppdb/status` |
| `GET /api/v1/landing/logo` | `/api/school/logo` |

Catatan penting: halaman publik **tetap** memanggil service langsung di server
component, bukan lewat HTTP ke API sendiri — memanggil API sendiri hanya
menambah satu round-trip tanpa manfaat. Endpoint landing gunanya untuk klien
luar (aplikasi mobile, layar informasi, integrasi pihak ketiga).

### 5.6 Endpoint bersama ⏳

| v1 | Lama |
| --- | --- |
| `GET /api/v1/config` | `/api/mobile/config` |
| `GET /api/v1/media/{key}` | `/api/r2-proxy` |

---

## 6. Urutan pengerjaan

1. **Fondasi + modul piket** ✅ — `src/server/{http,auth,date-range}.ts`,
   `modules/auth`, `modules/piket`, route `/api/v1/piket/*`, route lama
   disambungkan ke service, server action halaman piket ikut memakai service.
2. **Modul BK** ✅ — `modules/bk/{service,surveys,follow-up,dto}.ts`, 18 route
   `/api/v1/bk/*`, 18 route lama disambungkan ke service, dan tujuh file
   server action halaman web ikut memakai service yang sama.
3. **Modul CBT** — paling berisiko (dipakai aplikasi mobile saat ujian
   berlangsung). Kerjakan setelah pola terbukti di dua modul.
4. **Modul landing** — endpoint baru sepenuhnya, tidak ada klien lama yang
   perlu dijaga.
5. **Endpoint bersama** (`config`, `media`).
6. **Pensiunkan route lama** setelah aplikasi mobile rilis versi yang memakai
   v1, dengan tenggat yang disepakati.

Setiap langkah dikerjakan dalam PR terpisah supaya mudah direview dan
di-rollback.

---

## 7. Utang teknis yang ditemukan (bukan bagian dari refactor)

Ditemukan saat memindahkan modul piket, sengaja **tidak** diperbaiki di sini
supaya refactor tidak sekaligus mengubah perilaku:

1. **Batas hari memakai timezone proses, bukan WIB.** `dayRange()` memakai
   `setHours(0,0,0,0)`; di container produksi TZ-nya UTC, jadi pencatatan
   sebelum pukul 07:00 WIB terhitung sebagai hari sebelumnya. Perbaikannya:
   pakai offset WIB seperti `src/lib/date.ts` dan `getJakartaDayOfWeek()`.
2. **`TeacherAttendance.status` bertipe `String`,** bukan enum, padahal
   nilainya terbatas (`HADIR`, `TIDAK_HADIR`, `DIGANTIKAN`, `TUGAS_LUAR`).
   Sama untuk `StudentPermit.status` dan `.type`. Kandidat enum Prisma.
3. **Belum ada validasi skema request.** Validasi masih manual per field.
   Kalau nanti dipakai, `zod` bisa dipasang di lapisan route agar seragam.
4. **Belum ada test.** Repo belum punya test runner sama sekali; lapisan
   service sekarang berupa fungsi murni terhadap Prisma, jadi jauh lebih
   mudah diuji daripada route handler.
5. **Nilai jawaban angket 0 masih diterima dari web.** Form web menyimpan
   pertanyaan yang dilewati sebagai `0`, sementara API menolak nilai di luar
   1–4. Akibatnya rata-rata per pertanyaan bisa tertarik ke bawah oleh
   jawaban kosong. Perbaikannya: wajibkan semua pertanyaan terisi di form,
   lalu samakan validasinya di service.
6. **`CounselingRequest.urgency` bertipe `String`,** bukan enum, padahal
   nilainya terbatas. Sama seperti `ParentSummon.level`. Kandidat enum Prisma.

Satu perbedaan yang justru **diperbaiki** saat migrasi: nomor urut pertanyaan
angket. Halaman web memberi nomor dari *jumlah* pertanyaan (`count`, mulai 0)
sedangkan API dari nomor terbesar + 1. Setelah ada pertanyaan yang dihapus,
cara pertama menghasilkan nomor urut kembar. Keduanya kini memakai nomor
terbesar + 1.
