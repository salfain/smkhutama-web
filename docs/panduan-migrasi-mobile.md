# Panduan Migrasi Aplikasi Mobile ke API v1

Untuk tim pengembang aplikasi mobile SMK Hutama.

Server sekarang menyediakan **dua** kumpulan endpoint yang berjalan
berdampingan:

- `/api/...` — yang dipakai aplikasi sekarang. **Tetap hidup, tidak berubah.**
- `/api/v1/...` — yang baru.

Keduanya memanggil kode yang sama di server, jadi datanya identik. Perpindahan
bisa dilakukan bertahap, satu layar demi satu layar, tanpa mengejar tenggat.
Endpoint lama baru akan dihapus setelah disepakati bersama.

---

## 1. Tiga hal yang berubah bentuknya

### a. Semua response dibungkus amplop

Dulu:

```jsonc
// berhasil
[{ "id": "…", "title": "…" }]
// gagal
{ "error": "Token tidak valid" }
```

Sekarang:

```jsonc
// berhasil
{ "success": true, "data": [{ "id": "…", "title": "…" }] }
// gagal
{ "success": false, "error": { "code": "TOKEN_INVALID", "message": "Token tidak valid" } }
```

Isi `data` **sama persis** dengan response lama — sudah dibandingkan satu per
satu dan identik. Jadi biasanya cukup membuka amplopnya:

```dart
// Contoh Dart
final body = jsonDecode(response.body);
if (body['success'] == true) {
  final data = body['data'];        // bentuknya sama seperti dulu
} else {
  final code = body['error']['code'];       // untuk logika program
  final message = body['error']['message']; // untuk ditampilkan ke pengguna
}
```

Dua endpoint **tidak** memakai amplop karena isinya berkas, bukan JSON:
`/api/v1/media/{key}` dan `/api/v1/landing/logo`. Keduanya mengirim byte apa
adanya; hanya kegagalannya yang berbentuk JSON.

### b. Kegagalan punya kode, bukan cuma kalimat

Sebelumnya aplikasi harus mencocokkan teks pesan untuk tahu apa yang salah —
rapuh, karena kalimatnya bisa berubah sewaktu-waktu. Sekarang pakai `code`.

| `code` | HTTP | Artinya |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Ada field wajib yang kosong atau nilainya tidak sah |
| `UNAUTHORIZED` | 401 | Token tidak ada, kedaluwarsa, atau tidak sah |
| `INVALID_CREDENTIALS` | 401 | Username atau kata sandi salah |
| `FORBIDDEN` | 403 | Sudah login, tapi tidak berhak |
| `ROLE_MISMATCH` | 403 | Login dengan peran yang tidak sesuai |
| `ACCOUNT_INACTIVE` | 403 | Akun dinonaktifkan admin |
| `STUDENT_PROFILE_MISSING` | 403 | Akun siswa belum terhubung ke data siswa |
| `TEACHER_PROFILE_MISSING` | 403 | Akun guru belum terhubung ke data guru |
| `PIKET_REQUIRES_TEACHER` | 403 | Login piket harus memakai akun guru |
| `PIKET_NOT_SCHEDULED` | 403 | Guru tidak terjadwal piket hari ini |
| `NOT_FOUND` | 404 | Data tidak ada |
| `EXAM_NOT_FOUND` | 404 | Ujian tidak ada |
| `ATTEMPT_NOT_FOUND` | 404 | Siswa belum punya attempt untuk ujian ini |
| `EXAM_NOT_ACTIVE` | 400 | Ujian masih draf atau sudah ditutup |
| `EXAM_NOT_STARTED` | 400 | Belum masuk waktu mulai |
| `EXAM_ENDED` | 400 | Sudah lewat waktu berakhir |
| `NOT_PARTICIPANT` | 403 | Siswa bukan peserta ujian ini |
| `TOKEN_REQUIRED` | 400 | Token ujian belum diisi |
| `TOKEN_INVALID` | 400 | Token ujian salah |
| `TOKEN_EXPIRED` | 400 | Token ujian kedaluwarsa |
| `ALREADY_SUBMITTED` | 409 | Ujian sudah dikumpulkan |
| `ALREADY_ANSWERED` | 409 | Angket sudah pernah diisi |
| `ATTEMPT_LOCKED` | 423 | Ujian terkunci karena pelanggaran |
| `BATCH_TOO_LARGE` | 400 | Lebih dari 100 jawaban dalam satu sync |
| `MEDIA_NOT_CONFIGURED` | 503 | Penyimpanan media belum diatur di server |
| `INTERNAL_ERROR` | 500 | Kesalahan server |

Perhatikan **`ALREADY_SUBMITTED` kini 409**, dulu 400. Begitu juga
`ALREADY_ANSWERED` untuk angket.

### c. Beberapa method dan path dirapikan

| Lama | v1 | Catatan |
| --- | --- | --- |
| `DELETE /api/piket/terlambat?id=X` | `DELETE /api/v1/piket/terlambat/X` | id pindah ke path |
| `DELETE /api/piket/izin?id=X` | `DELETE /api/v1/piket/izin/X` | id pindah ke path |
| `DELETE /api/piket/guru?id=X` | `DELETE /api/v1/piket/guru/X` | id pindah ke path |
| `POST /api/counselor/requests/X` | `PATCH /api/v1/bk/counselor/requests/X` | method berubah |
| `POST /api/teacher/essay-grading/X` | `PATCH /api/v1/cbt/teacher/essay-grading/X` | method berubah |
| `GET /api/r2-proxy?key=a/b.png` | `GET /api/v1/media/a/b.png` | key pindah ke path |

Penghapusan yang datanya tidak ada kini menjawab **404**, dulu tetap sukses.

---

## 2. Peta lengkap endpoint

### Autentikasi

| Lama | v1 |
| --- | --- |
| `POST /api/auth/login` | `POST /api/v1/auth/login` |
| `POST /api/auth/logout` | `POST /api/v1/auth/logout` |
| `GET /api/auth/me` | `GET /api/v1/auth/me` |

Body login tidak berubah: `{ username, password, role?, system? }`.
Kirim `system: "PIKET"` untuk login guru piket.

### Ujian — sisi siswa

| Lama | v1 |
| --- | --- |
| `GET /api/student/dashboard` | `GET /api/v1/cbt/student/dashboard` |
| `GET /api/student/exams` | `GET /api/v1/cbt/student/exams` |
| `POST /api/student/exams/validate-token` | `POST /api/v1/cbt/student/exams/validate-token` |
| `POST /api/student/exams/start` | `POST /api/v1/cbt/student/exams/start` |
| `GET /api/student/exams/{id}/questions` | `GET /api/v1/cbt/student/exams/{id}/questions` |
| `GET /api/student/exams/{id}/status` | `GET /api/v1/cbt/student/exams/{id}/status` |
| `GET /api/student/exams/{id}/resume` | `GET /api/v1/cbt/student/exams/{id}/resume` |
| `POST /api/student/exams/{id}/heartbeat` | `POST /api/v1/cbt/student/exams/{id}/heartbeat` |
| `POST /api/student/exams/{id}/violation` | `POST /api/v1/cbt/student/exams/{id}/violation` |
| `POST /api/student/exams/{id}/submit` | `POST /api/v1/cbt/student/exams/{id}/submit` |
| `POST /api/student/answers/save` | `POST /api/v1/cbt/student/answers` |
| `POST /api/student/answers/sync` | `POST /api/v1/cbt/student/answers/sync` |
| `GET /api/student/results` | `GET /api/v1/cbt/student/results` |
| `GET /api/answers/{attemptId}` | `GET /api/v1/cbt/attempts/{attemptId}/answers` |

Perbedaan isi pada v1:

- **`/start`** membalas `{ attemptId, resumed }`. `resumed: true` berarti
  attempt-nya sudah ada sebelumnya, bukan baru dibuat.
- **`/heartbeat`** selalu membalas bentuk yang sama:
  `{ locked, finished, lockReason }`. Dulu bentuknya berbeda-beda tergantung
  keadaan (`{finished:true}`, `{locked:true,…}`, atau `{ok:true,…}`).
- **`/violation`** selalu menyertakan `finished`, `violationCount`,
  `threshold`, dan `lockReason`.
- **`/submit`** membalas `{ score, alreadySubmitted }`. Submit kedua tetap
  berhasil dengan nilai yang sama dan `alreadySubmitted: true` — aman
  dipanggil ulang saat koneksi tidak jelas.
- **`/answers/sync`** membalas `{ synced, failed, errors, serverTime }`.
  Jawaban yang lolos tetap tersimpan meski ada entri lain yang ditolak.

### Ujian — sisi guru & admin

| Lama | v1 |
| --- | --- |
| `GET /api/teacher/dashboard` | `GET /api/v1/cbt/teacher/dashboard` |
| `GET /api/teacher/exams` | `GET /api/v1/cbt/teacher/exams` |
| `GET /api/teacher/questions` | `GET /api/v1/cbt/teacher/questions` |
| `GET /api/teacher/monitoring/{examId}` | `GET /api/v1/cbt/teacher/monitoring/{examId}` |
| `GET /api/teacher/essay-grading` | `GET /api/v1/cbt/teacher/essay-grading` |
| `POST /api/teacher/essay-grading/{id}` | `PATCH /api/v1/cbt/teacher/essay-grading/{id}` |
| `GET /api/admin/exams/{id}/print-questions` | `GET /api/v1/cbt/admin/exams/{id}/print-questions` |
| `POST /api/teacher/exams/{id}/token` | **tidak ada padanan** |

Dua endpoint **baru** yang sebelumnya hanya ada di web — berguna kalau
pengawas memantau dari ponsel:

- `POST /api/v1/cbt/teacher/attempts/{attemptId}/unlock` — buka kunci siswa
  yang terkunci anti-curang, sekaligus mereset hitungan pelanggarannya.
- `POST /api/v1/cbt/teacher/attempts/{attemptId}/force-submit` — kumpulkan
  paksa pekerjaan siswa yang belum menekan submit.

Keduanya hanya untuk guru pemilik ujian.

`POST /api/teacher/exams/{id}/token` selama ini hanya menjawab 403 "dikelola
admin", jadi tidak dibuatkan padanan. Pembuatan token tetap lewat panel admin.

### Bimbingan Konseling

| Lama | v1 |
| --- | --- |
| `GET /api/counselor/dashboard` | `GET /api/v1/bk/counselor/dashboard` |
| `GET /api/counselor/students` | `GET /api/v1/bk/counselor/students` |
| `GET /api/counselor/students/book` | `GET /api/v1/bk/counselor/students/book` |
| `GET /api/counselor/students/book/{id}` | `GET /api/v1/bk/counselor/students/book/{id}` |
| `GET /api/counselor/cases` | `GET /api/v1/bk/counselor/cases` |
| `GET\|PATCH /api/counselor/cases/{id}` | `GET\|PATCH /api/v1/bk/counselor/cases/{id}` |
| `GET\|POST /api/counselor/violations` | `GET\|POST /api/v1/bk/counselor/violations` |
| `GET\|POST /api/counselor/achievements` | `GET\|POST /api/v1/bk/counselor/achievements` |
| `GET /api/counselor/requests` | `GET /api/v1/bk/counselor/requests` |
| `POST /api/counselor/requests/{id}` | `PATCH /api/v1/bk/counselor/requests/{id}` |
| `GET\|POST /api/counselor/surveys` | `GET\|POST /api/v1/bk/counselor/surveys` |
| `GET /api/counselor/surveys/{id}` | `GET /api/v1/bk/counselor/surveys/{id}` |
| `POST /api/counselor/surveys/{id}/questions` | `POST /api/v1/bk/counselor/surveys/{id}/questions` |
| `GET /api/counselor/surveys/{id}/results` | `GET /api/v1/bk/counselor/surveys/{id}/results` |
| `GET /api/student/bk` | `GET /api/v1/bk/student/summary` |
| `POST /api/student/bk/request` | `POST /api/v1/bk/student/requests` |
| `GET /api/student/surveys` | `GET /api/v1/bk/student/surveys` |
| `GET\|POST /api/student/surveys/{id}` | `GET\|POST /api/v1/bk/student/surveys/{id}` |

Tambahan pada v1:

- **Dashboard** ikut memuat `topStudents` — lima siswa dengan poin pelanggaran
  tertinggi.
- **`POST /cases`** membuat sesi konseling lewat API.
- **`PATCH /requests/{id}`** menerima `{ convertToCase: true }` untuk
  sekaligus membuat sesi konseling dari permohonan.
- **`/violations` dan `/achievements`** menerima `?take=`. Tanpa parameter
  tetap 50 seperti dulu; `take=0` berarti seluruh catatan.
- **Rekap angket** ikut memuat daftar responden.
- **Hak akses** kini guru BK **atau** admin. Endpoint lama tetap hanya
  `COUNSELOR`.

### Guru Piket

| Lama | v1 |
| --- | --- |
| `GET /api/piket/dashboard?date=` | `GET /api/v1/piket/dashboard?date=` |
| `GET\|POST /api/piket/terlambat` | `GET\|POST /api/v1/piket/terlambat` |
| `DELETE /api/piket/terlambat?id=X` | `DELETE /api/v1/piket/terlambat/X` |
| `GET\|POST /api/piket/izin` | `GET\|POST /api/v1/piket/izin` |
| `DELETE /api/piket/izin?id=X` | `DELETE /api/v1/piket/izin/X` |
| `PATCH\|POST /api/piket/izin/{id}/kembali` | `PATCH /api/v1/piket/izin/{id}/kembali` |
| `GET\|POST /api/piket/guru` | `GET\|POST /api/v1/piket/guru` |
| `DELETE /api/piket/guru?id=X` | `DELETE /api/v1/piket/guru/X` |

### Konten sekolah — semuanya baru, tanpa login

Belum pernah ada padanannya. Berguna untuk layar informasi, halaman "tentang
sekolah" di aplikasi, atau pendaftaran PPDB lewat ponsel.

| v1 | Isi |
| --- | --- |
| `GET /api/v1/landing/profile` | identitas, kontak, tautan, status PPDB |
| `GET /api/v1/landing/about` | visi, misi, sejarah, sambutan kepala sekolah |
| `GET /api/v1/landing/stats` | angka ringkas sekolah |
| `GET /api/v1/landing/hero-images` | gambar carousel |
| `GET /api/v1/landing/majors` | program keahlian |
| `GET /api/v1/landing/news?take=` | berita, terbaru dulu |
| `GET /api/v1/landing/news/{slug}` | satu berita + isinya + berita terkait |
| `GET /api/v1/landing/teachers` | guru & tenaga pendidik |
| `GET /api/v1/landing/extracurriculars` | ekstrakurikuler |
| `GET /api/v1/landing/gallery` | foto galeri |
| `GET /api/v1/landing/faq` | pertanyaan yang sering diajukan |
| `POST /api/v1/landing/ppdb` | kirim pendaftaran, balas nomor pendaftaran |
| `GET /api/v1/landing/ppdb/{registNumber}` | status pendaftaran |
| `GET /api/v1/landing/logo` | logo sekolah (gambar) |

### Lain-lain

| Lama | v1 |
| --- | --- |
| `GET /api/mobile/config` | `GET /api/v1/config` |
| `GET /api/r2-proxy?key=X` | `GET /api/v1/media/X` |
| `GET /api/school/logo` | `GET /api/v1/landing/logo` |

`/api/v1/config` tetap bisa diakses tanpa login — aplikasi perlu tahu mode
pemeliharaan dan versi minimum justru saat pengguna belum bisa masuk.

---

## 3. Satu perubahan yang menyentuh endpoint lama

**`GET /api/answers/{attemptId}` sekarang wajib menyertakan token.**

Sebelumnya endpoint ini tidak memeriksa siapa pun — siapa saja yang tahu
`attemptId` bisa membaca lembar jawaban siswa lengkap dengan kunci jawabannya.
Lubang itu ditutup.

**Yang perlu dicek tim mobile:** kalau aplikasi memanggil endpoint ini tanpa
header `Authorization`, panggilannya akan mulai dijawab **401**. Tambahkan
header seperti endpoint lain. Siswa hanya boleh membuka attempt miliknya
sendiri; guru, admin, dan guru BK boleh membuka milik siapa pun.

Ini satu-satunya endpoint lama yang perilakunya berubah.

---

## 4. Saran urutan perpindahan

Endpoint lama tidak akan hilang mendadak, jadi tidak perlu sekaligus.
Urutan yang paling aman:

1. **Layar konten & pengaturan** — `config`, profil sekolah, berita. Risikonya
   paling kecil, sekaligus jadi tempat mencoba pembacaan amplop `{success,data}`.
2. **Layar daftar & riwayat** — daftar ujian, hasil, dashboard. Hanya baca,
   gampang dibandingkan dengan versi lama.
3. **BK dan piket** — sudah ada operasi tulis, tapi tidak dipakai saat ujian
   berlangsung.
4. **Alur ujian** — paling akhir, dan sebaiknya diuji dulu dengan ujian
   percobaan di kelas kecil sebelum dipakai ujian sungguhan.

Selama masa peralihan, aplikasi boleh memakai campuran keduanya. Tidak ada
masalah memanggil `/api/v1/config` sambil masih memakai `/api/student/exams`.

---

## 5. Kalau ada yang tidak cocok

Isi `data` pada v1 sudah dibandingkan langsung dengan response endpoint lama
dan hasilnya identik untuk seluruh endpoint GET yang punya padanan. Kalau tim
mobile menemukan perbedaan, itu kemungkinan besar bug di sisi server — mohon
laporkan dengan menyertakan path, contoh response dari keduanya, dan token
peran yang dipakai.

Peta lengkap beserta alasan setiap keputusan ada di `docs/api-v1-plan.md`.
