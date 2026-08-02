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
│  │  │  ├─ landing/                konten publik sekolah  ✅
│  │  │  ├─ cbt/                    ujian: student / teacher / admin  ✅
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
      ├─ cbt/                       ✅ exam-session, student, teacher,
      │                               monitoring, analysis, review,
      │                               exam-print, dto
      ├─ landing/                   ✅ content, ppdb, dto
      └─ shared/                    ✅ config, assets, school
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

### 5.3 Modul CBT — inti ujian siswa ✅

Bagian ini yang dipakai aplikasi mobile **saat ujian berlangsung**, jadi
dikerjakan terpisah dari sisi guru/admin supaya perubahannya kecil dan mudah
ditelusuri.

| v1 | Lama |
| --- | --- |
| `GET /api/v1/cbt/student/dashboard` | `GET /api/student/dashboard` |
| `GET /api/v1/cbt/student/exams` | `GET /api/student/exams` |
| `POST /api/v1/cbt/student/exams/validate-token` | `POST /api/student/exams/validate-token` |
| `POST /api/v1/cbt/student/exams/start` | `POST /api/student/exams/start` |
| `GET /api/v1/cbt/student/exams/{id}/questions` | `GET /api/student/exams/[id]/questions` |
| `GET /api/v1/cbt/student/exams/{id}/status` | `GET /api/student/exams/[id]/status` |
| `GET /api/v1/cbt/student/exams/{id}/resume` | `GET /api/student/exams/[id]/resume` |
| `POST /api/v1/cbt/student/exams/{id}/heartbeat` | `POST /api/student/exams/[id]/heartbeat` |
| `POST /api/v1/cbt/student/exams/{id}/violation` | `POST /api/student/exams/[id]/violation` |
| `POST /api/v1/cbt/student/exams/{id}/submit` | `POST /api/student/exams/[id]/submit` |
| `POST /api/v1/cbt/student/answers` | `POST /api/student/answers/save` |
| `POST /api/v1/cbt/student/answers/sync` | `POST /api/student/answers/sync` |
| `GET /api/v1/cbt/student/results` | `GET /api/student/results` |
| `GET /api/v1/cbt/attempts/{attemptId}/answers` | `GET /api/answers/[attemptId]` |

Aturan yang sekarang jadi satu di `src/server/modules/cbt/exam-session.ts`:
jendela waktu ujian, keanggotaan kelas, token, siklus attempt, heartbeat,
penghitungan pelanggaran + penguncian, penyimpanan jawaban, dan penilaian.
Kegagalan dikembalikan sebagai **kode** (`TOKEN_EXPIRED`, `NOT_PARTICIPANT`,
…), bukan kalimat — route lama dan halaman web memetakan kode itu ke pesan
masing-masing, sehingga teks yang sudah dikenal pengguna tidak berubah.

Dua hal yang perlu dicatat:

- **Token hanya diminta saat ujian dimulai.** Attempt yang sudah berjalan bisa
  dilanjutkan tanpa token baru — perilaku yang sudah berlaku di endpoint lama
  dan sengaja dipertahankan di v1, supaya siswa yang aplikasinya tertutup di
  tengah ujian tidak perlu meminta token ulang ke pengawas.
- **`/api/answers/[attemptId]` sebelumnya tanpa autentikasi sama sekali.**
  Siapa pun yang tahu `attemptId` bisa membaca lembar jawaban lengkap dengan
  kunci jawabannya. Sekarang wajib terautentikasi (cookie sesi atau Bearer
  token) dan siswa hanya boleh membuka attempt miliknya sendiri. Ini satu-
  satunya perubahan perilaku pada endpoint lama di seluruh migrasi, dan
  dilakukan karena sifatnya lubang keamanan.

### 5.3b Modul CBT — sisi guru & admin ✅

| v1 | Lama |
| --- | --- |
| `GET /api/v1/cbt/teacher/dashboard` | `GET /api/teacher/dashboard` |
| `GET /api/v1/cbt/teacher/exams` | `GET /api/teacher/exams` |
| `GET /api/v1/cbt/teacher/questions` | `GET /api/teacher/questions` |
| `GET /api/v1/cbt/teacher/monitoring/{examId}` | `GET /api/teacher/monitoring/[examId]` |
| `POST /api/v1/cbt/teacher/attempts/{id}/unlock` | — (baru) |
| `POST /api/v1/cbt/teacher/attempts/{id}/force-submit` | — (baru) |
| `GET /api/v1/cbt/teacher/essay-grading` | `GET /api/teacher/essay-grading` |
| `PATCH /api/v1/cbt/teacher/essay-grading/{id}` | `POST /api/teacher/essay-grading/[id]` |
| `GET /api/v1/cbt/admin/exams/{id}/print-questions` | `GET /api/admin/exams/[id]/print-questions` |

Catatan:

- **Buka kunci dan kumpulkan paksa** sebelumnya hanya ada di halaman web,
  sehingga pengawas yang memantau dari ponsel tidak bisa menolong siswa yang
  terkunci. Sekarang tersedia lewat API, memakai service yang sama dengan
  versi web. Guru hanya boleh mengendalikan attempt pada ujian miliknya.
- **`/api/teacher/exams/[id]/token` tidak punya padanan v1.** Endpoint lama itu
  hanya menjawab 403 "dikelola admin"; membuat endpoint baru yang selalu
  gagal tidak ada gunanya. Pembuatan token tetap lewat halaman admin.
- **Pengetatan kecil pada cetak soal:** endpoint lama meloloskan akun berperan
  `TEACHER` yang tidak punya record guru untuk mencetak ujian mana pun.
  Sekarang akun seperti itu ditolak. Akun tanpa record guru adalah akun rusak,
  jadi ini penutupan celah, bukan pengurangan fitur.

Kendali attempt (buka kunci, kumpulkan paksa, reset login) sebelumnya ditulis
dua kali — di `admin/monitoring/actions.ts` dan `teacher/monitoring/actions.ts`
— dengan perbedaan pada nama aksi audit. Sekarang satu implementasi, nama aksi
audit diserahkan ke pemanggil sehingga jejak audit lama tetap terbaca.

**Yang sengaja belum dipindah ke modul:** CRUD ujian admin
(`admin/exams/actions.ts`), token (`admin/tokens`), impor paket bank soal
(`admin/question-sets`, `teacher/question-sets`), rekap & ekspor Excel
(`admin/reports`), dan daftar hadir cetak (`admin/print`). Semuanya operasi
admin lewat web tanpa padanan API, jadi tidak ada duplikasi yang perlu
dihilangkan — memindahkannya sekarang hanya menambah risiko tanpa manfaat.
Aturan `src/lib/exam-permissions.ts` dan `question-set-import.ts` ikut menunggu
di sana.

`src/lib/exam-scoring.ts`, `exam-lock.ts`, dan `mobile-exam.ts` **tetap di
`src/lib/`** dan dipanggil dari modul CBT: ketiganya fungsi murni tanpa
sentuhan Prisma, jadi lebih mudah diuji di tempatnya sekarang.
`exam-types.ts` juga tetap karena berisi label dan warna yang dipakai
komponen client.

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

### 5.5 Modul Landing ✅

Satu-satunya modul yang sebelumnya **tidak punya API sama sekali** — halaman
publik mengambil datanya langsung di server component. Karena itu tidak ada
bentuk lama yang perlu dipertahankan; semuanya endpoint baru.

Semua endpoint di bawah **publik**, tanpa autentikasi.

| v1 | Isi |
| --- | --- |
| `GET /api/v1/landing/profile` | identitas, kontak, tautan, status PPDB |
| `GET /api/v1/landing/about` | visi, misi, sejarah, sambutan kepala sekolah |
| `GET /api/v1/landing/stats` | angka ringkas sekolah |
| `GET /api/v1/landing/hero-images` | gambar carousel beranda |
| `GET /api/v1/landing/majors` | program keahlian aktif |
| `GET /api/v1/landing/news?take=` | berita terbit, terbaru dulu |
| `GET /api/v1/landing/news/{slug}` | satu berita + isinya + berita terkait |
| `GET /api/v1/landing/teachers` | guru & tenaga pendidik |
| `GET /api/v1/landing/extracurriculars` | kegiatan ekstrakurikuler |
| `GET /api/v1/landing/gallery` | foto galeri |
| `GET /api/v1/landing/faq` | pertanyaan yang sering diajukan |
| `POST /api/v1/landing/ppdb` | kirim pendaftaran, balas nomor pendaftaran |
| `GET /api/v1/landing/ppdb/{registNumber}` | status pendaftaran |
| `GET /api/v1/landing/logo` | logo sekolah (gambar, bukan JSON) |

Tiga keputusan yang perlu dicatat:

- **Halaman publik tetap memanggil service langsung** di server component,
  bukan lewat HTTP ke API sendiri. Memanggil API sendiri hanya menambah satu
  perjalanan jaringan tanpa manfaat. Endpoint ini untuk klien luar: aplikasi
  mobile, layar informasi sekolah, integrasi pihak ketiga.
- **Nilai bawaan ikut pindah ke service.** Saat tabelnya masih kosong, situs
  menampilkan konten cadangan (profil, statistik, jurusan, guru, ekskul).
  Karena API dan situs kini memakai fungsi yang sama, keduanya menampilkan isi
  yang sama persis — termasuk saat basis data kosong.
- **Status PPDB hanya mengirim nama, jurusan, dan status.** Nomor pendaftaran
  bisa ditebak, jadi endpoint ini tidak boleh jadi jalan membocorkan alamat,
  email, atau nomor telepon pendaftar. Halaman `/ppdb/status` memang tidak
  menampilkannya, tapi sebelumnya data itu ikut terkirim ke browser.

**Panel CMS sengaja TIDAK memakai service ini.** Fungsi `getX()` di
`src/app/cms/(panel)/content-actions.ts` membaca tabel apa adanya — pengelola
konten harus melihat apa yang benar-benar tersimpan, bukan tampilan
cadangannya. Perbedaan ini disengaja, bukan duplikasi yang terlewat.

### 5.6 Endpoint bersama ✅

| v1 | Lama |
| --- | --- |
| `GET /api/v1/config` | `GET /api/mobile/config` |
| `GET /api/v1/media/{key}` | `GET /api/r2-proxy?key=` |

`/api/v1/config` publik dan tanpa autentikasi — dipanggil sebelum login,
karena klien justru perlu tahu mode pemeliharaan dan versi minimum saat belum
bisa masuk. `/api/v1/media/{key}` menerima key bersegmen, mis.
`/api/v1/media/soal/2026/gambar.png`, dan mengalirkan byte apa adanya
sehingga tidak memakai amplop v1; hanya kegagalannya yang berbentuk JSON.

---

## 6. Urutan pengerjaan

1. **Fondasi + modul piket** ✅ — `src/server/{http,auth,date-range}.ts`,
   `modules/auth`, `modules/piket`, route `/api/v1/piket/*`, route lama
   disambungkan ke service, server action halaman piket ikut memakai service.
2. **Modul BK** ✅ — `modules/bk/{service,surveys,follow-up,dto}.ts`, 18 route
   `/api/v1/bk/*`, 18 route lama disambungkan ke service, dan tujuh file
   server action halaman web ikut memakai service yang sama.
3. **Modul CBT — inti ujian siswa** ✅ — `modules/cbt/{exam-session,student,
   review,dto,http-errors}.ts`, 14 route `/api/v1/cbt`, 14 route lama
   disambungkan, dan server action halaman ujian web ikut memakai service yang
   sama. Diuji lewat simulasi ujian utuh terhadap PostgreSQL sementara.
4. **Modul CBT — sisi guru & admin** ✅ — `modules/cbt/{teacher,monitoring,
   exam-print}.ts`, 9 route `/api/v1/cbt/{teacher,admin}`, 6 route lama
   disambungkan, dan enam file server action halaman guru/admin ikut memakai
   service yang sama. CRUD ujian, token, impor bank soal, dan ekspor rekap
   sengaja dibiarkan di server action — lihat catatan di bagian 5.3b.
5. **Modul landing** ✅ — `modules/landing/{content,ppdb,dto}.ts`, 14 route
   `/api/v1/landing/*`, dan dua belas halaman publik ikut memakai service yang
   sama. `src/lib/landing-data.ts` dihapus, isinya pindah ke modul.
6. **Endpoint bersama** ✅ — `modules/shared/{config,assets}.ts`,
   `/api/v1/config` dan `/api/v1/media/{key}`, tiga route lama disambungkan
   (`/api/mobile/config`, `/api/r2-proxy`, `/api/school/logo`).
7. **Pensiunkan route lama** setelah aplikasi mobile rilis versi yang memakai
   v1, dengan tenggat yang disepakati.

Setiap langkah dikerjakan dalam PR terpisah supaya mudah direview dan
di-rollback.

---

## 7. Yang sudah selesai dan yang sengaja ditinggalkan

**Tidak ada satu pun route API yang masih menulis query Prisma sendiri.**
Seluruh `src/app/api/**` kini memanggil modul. Halaman web yang query-nya
sama dengan modul juga sudah disambungkan: beranda & daftar ujian siswa,
hasil siswa, konfirmasi/token/selesai ujian, rekap nilai guru, analisis butir
soal, serta lima halaman cetak (konseling, pemanggilan, kunjungan rumah, izin
piket, naskah soal).

Login pun sudah satu aturan: `checkCredentials()` di
`modules/auth/service.ts` dipakai `/api/auth/login`, `/api/v1/auth/login`, dan
form login web. Kalimat kesalahannya tetap berbeda — versi web diakhiri titik —
karena yang dibagi aturannya, bukan teksnya.

### Sengaja masih memakai query sendiri

Bagian di bawah ini **tidak** punya padanan API, jadi tidak ada duplikasi yang
perlu dihilangkan. Memindahkannya sekarang hanya menambah risiko tanpa manfaat.

| Berkas | Alasan |
| --- | --- |
| `admin/{classes,students,subjects,teachers,majors,academic-years,settings,school-profile,piket-schedules,dashboard}/actions.ts` | CRUD data induk, hanya lewat panel admin |
| `admin/{exams,tokens,question-sets}/actions.ts`, `teacher/question-sets/actions.ts` | Penyusunan ujian, token, dan impor bank soal — semuanya operasi admin lewat web |
| `admin/{reports,print}/actions.ts` | Rekap dan ekspor Excel; keluarannya berkas, bukan JSON |
| `cms/(panel)/content-actions.ts`, `cms/actions.ts` | Panel CMS harus membaca tabel apa adanya, bukan nilai bawaan — perbedaan yang disengaja |
| `profile/change-password/actions.ts`, `piket/laporan/actions.ts` | Berdiri sendiri, tidak dipakai modul lain |
| `admin/audit-logs`, `admin/question-sets/[id]`, `teacher/question-sets/[id]`, `cms/(panel)/dashboard` (halaman) | Mengikuti area admin/CMS di atas |

Kalau nanti admin perlu mengelola ujian atau bank soal dari aplikasi mobile,
barulah pemindahan itu berbayar — polanya sudah terbukti di empat modul.

### Belum dikerjakan sama sekali

1. **Route lama belum dipensiunkan.** Menunggu aplikasi mobile rilis versi yang
   memakai `/api/v1`. Sampai itu terjadi keduanya hidup berdampingan.
2. **Belum ada test otomatis.** Repo belum punya test runner. Verifikasi
   selama ini dilakukan manual terhadap PostgreSQL sementara di setiap tahap.
3. **Dokumen migrasi untuk tim mobile** belum ditulis.

---

## 8. Utang teknis yang ditemukan (bukan bagian dari refactor)

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
6. **Kunci jawaban ikut terkirim meski `showResult` mati.** Endpoint
   pembahasan selalu menyertakan `isCorrect` dan `correctOptionLabel`;
   yang menyembunyikannya hanya tampilan (`showCorrectAnswers` di
   `AnswerReviewDialog`). Siswa yang membuka tab jaringan peramban tetap bisa
   melihatnya. Perbaikannya: saring di server berdasarkan `exam.showResult`
   saat yang meminta adalah siswa.
7. **`notFound()` mengembalikan status 200, bukan 404.** Terlihat di
   `/berita/{slug}` untuk slug yang tidak ada maupun berita yang belum terbit:
   isinya benar-benar tidak bocor, tapi status HTTP-nya 200. Akibatnya mesin
   pencari bisa mengindeks halaman kosong. Perilaku ini sudah ada sebelum
   migrasi — alur kodenya tidak berubah — dan berlaku untuk semua halaman yang
   memakai `notFound()`.
8. **`CounselingRequest.urgency` bertipe `String`,** bukan enum, padahal
   nilainya terbatas. Sama seperti `ParentSummon.level`. Kandidat enum Prisma.

Satu perbedaan yang justru **diperbaiki** saat migrasi: nomor urut pertanyaan
angket. Halaman web memberi nomor dari *jumlah* pertanyaan (`count`, mulai 0)
sedangkan API dari nomor terbesar + 1. Setelah ada pertanyaan yang dihapus,
cara pertama menghasilkan nomor urut kembar. Keduanya kini memakai nomor
terbesar + 1.
