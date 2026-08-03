# Panduan Pengerjaan: Pemisahan Peran Admin

Dokumen ini untuk dikerjakan bertahap. **Kerjakan fase secara berurutan.** Jangan lompat — setiap fase mengandalkan fase sebelumnya.

Setiap fase punya bagian **"Selesai kalau"**. Jangan lanjut ke fase berikutnya sebelum semua poin di situ tercentang.

---

## Gambaran Besar

Sekarang sistem punya satu peran `ADMIN` yang memegang seluruh 20 halaman di `/admin`. Kita pecah jadi empat peran, ditambah penyesuaian di modul BK.

### Peran setelah selesai

| Peran | Pegang apa | Halaman |
|---|---|---|
| `ADMIN` (superadmin) | Data induk & sistem | Profil Sekolah, Data Siswa, Data Guru, Jurusan, Audit Log, Pengaturan |
| `KURIKULUM` (baru) | Perangkat pembelajaran | Kelas, Mata Pelajaran, Tahun Ajaran, Jadwal Piket |
| `ADMIN_CBT` (baru) | Operasional ujian | Jadwal Ujian, Paket Soal, Token Ujian, Monitoring, Laporan, Cetak Dokumen |
| `KESISWAAN` (baru) | Pembinaan siswa | Pelanggaran, Prestasi, Rekap Terlambat, Rekap Izin |
| `COUNSELOR` (BK) | Pendampingan | Kasus konseling, home visit, panggilan ortu, angket, **master jenis pelanggaran** |
| `PIKET` | Input harian | Tidak berubah sama sekali |
| `LANDING_ADMIN` | Konten website | Tidak berubah sama sekali |

### Keputusan desain yang sudah final

Ini sudah disepakati. **Jangan diubah sendiri** — kalau menurutmu ada yang salah, tanya dulu.

1. **Peran dipisah tegas.** Superadmin **tidak** melihat menu ujian. Admin CBT **tidak** melihat menu data siswa. Tidak ada peran yang otomatis "bisa semua".
2. **Data Siswa milik superadmin**, bukan kesiswaan.
3. **Master jenis pelanggaran tetap milik BK.** Yang menetapkan bobot poin (BK) berbeda dari yang mencatat pelanggaran (kesiswaan). Ini disengaja — jangan disatukan.
4. **BK jadi read-only untuk catatan pelanggaran & prestasi.** BK tetap bisa melihat semuanya, tapi tombol tambah/ubah/hapus dihilangkan. Yang mencatat cuma kesiswaan.
5. **Kesiswaan tidak boleh mengubah/menghapus catatan piket** (keterlambatan & izin). Kesiswaan hanya membaca dan merekap.
6. **Jadwal pelajaran TIDAK dikerjakan di sini.** Di luar cakupan. Jangan mulai.
7. **Peran pembina OSIS tidak dibuat.** Di luar cakupan.

### Yang perlu dipahami dulu

Peran admin baru tetap memakai kerangka `/admin` yang sudah ada (`src/app/admin/layout.tsx` + `src/components/layouts/AdminSidebar.tsx`). Kita **tidak** membuat kerangka baru per peran. Yang berubah: menu disaring sesuai peran, dan tiap halaman menjaga dirinya sendiri.

BK (`/counselor`) dan piket (`/piket`) tetap punya kerangka masing-masing seperti sekarang.

---

## Fase 0 — Persiapan

**Jangan menulis kode di fase ini.** Ini memastikan kamu mulai dari kondisi yang benar.

### Langkah

1. **Pastikan PR #1 sudah di-merge dan sudah di-deploy ke server.** Kalau belum, berhenti dan tanya dulu. Seluruh panduan ini dibangun di atas kode PR #1.

2. Tarik kode terbaru dan buat branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/pemisahan-peran-admin
   ```

3. Pastikan aplikasi jalan di laptopmu:
   ```bash
   npm install
   npm test          # harus lolos semua
   npm run build     # harus tanpa error
   npm run dev
   ```

4. **Backup database produksi.** Fase 4 nanti mengubah tabel yang sudah berisi data asli. Script-nya sudah ada:
   ```bash
   ./scripts/backup-db.sh
   ```
   Simpan hasilnya di tempat aman. Jangan kerjakan Fase 4 sebelum backup ini ada.

5. Baca sekilas tiga file ini supaya paham struktur penjagaan akses:
   - `src/lib/session.ts` — penjaga untuk halaman web (server component & server action)
   - `src/server/auth.ts` — penjaga untuk API (dipakai aplikasi mobile)
   - `src/app/admin/layout.tsx` — gerbang area admin sekarang

### Selesai kalau

- [ ] PR #1 sudah ada di `main` dan sudah jalan di server
- [ ] `npm test` dan `npm run build` lolos di laptopmu
- [ ] Backup database produksi sudah ada
- [ ] Branch `feat/pemisahan-peran-admin` sudah dibuat

---

## Fase 1 — Tutup lubang keamanan di server action

> **Fase ini berdiri sendiri.** Kalau nanti rencana pemisahan peran dibatalkan, fase ini tetap harus dikerjakan. Buat PR terpisah untuk fase ini dan minta di-merge duluan.

### Kenapa ini wajib duluan

Di Next.js, **server action bisa dipanggil langsung lewat POST**, tidak harus lewat tombol di halaman. Pengecekan akses di `layout.tsx` **tidak** melindungi server action.

Ini bukan tafsiran. Dokumentasi Next.js yang ikut terpasang di repo ini menyatakannya:

> *"A page-level authentication check does not extend to the Server Actions defined within it. Always re-verify inside the action."*
> — `node_modules/next/dist/docs/01-app/02-guides/data-security.md:333`

Sekarang ada **14 file** `actions.ts` di `/admin` yang sama sekali tidak mengecek siapa pemanggilnya. Mereka aman untuk saat ini hanya karena cuma ada satu peran admin. Begitu Fase 2 menambah peran baru, admin CBT langsung bisa memanggil `deleteStudent` lewat POST — walaupun menunya disembunyikan.

**Kalau fase ini dilewati, seluruh pemisahan peran cuma menyembunyikan menu, bukan membatasi wewenang.**

### File yang harus diperbaiki

Keempat belas file ini belum punya pengecekan sama sekali:

```
src/app/admin/academic-years/actions.ts
src/app/admin/classes/actions.ts
src/app/admin/dashboard/actions.ts
src/app/admin/exams/actions.ts
src/app/admin/majors/actions.ts
src/app/admin/monitoring/actions.ts
src/app/admin/print/actions.ts
src/app/admin/reports/actions.ts
src/app/admin/school-profile/actions.ts
src/app/admin/settings/actions.ts
src/app/admin/students/actions.ts
src/app/admin/subjects/actions.ts
src/app/admin/teachers/actions.ts
src/app/admin/tokens/actions.ts
```

Dua file ini **sudah** benar — pakai sebagai contoh:
- `src/app/admin/piket-schedules/actions.ts`
- `src/app/admin/question-sets/actions.ts`

### Langkah

Untuk **setiap fungsi yang diekspor** di keempat belas file di atas, tambahkan `await requireAuth("ADMIN")` sebagai baris pertama.

```ts
"use server";

import { requireAuth } from "@/lib/session";

export async function deleteStudent(id: string) {
  await requireAuth("ADMIN");   // ← tambahkan baris ini
  // ... sisa kode yang sudah ada, jangan diubah
}
```

**Perhatikan:**

- Tambahkan di **setiap** fungsi `export async function`, bukan cuma satu per file. Satu fungsi terlewat = satu lubang tersisa.
- Kalau fungsi butuh tahu siapa yang login, tampung hasilnya: `const user = await requireAuth("ADMIN");`
- Di fase ini **semua** pakai `"ADMIN"`. Belum ada peran baru. Penyesuaian peran dilakukan di Fase 3.
- **Jangan ubah logika apa pun selain menambah baris ini.** Fase ini murni menambah penjagaan.

Untuk memastikan tidak ada yang terlewat, daftar fungsi per file bisa dilihat dengan:

```bash
grep -n "^export async function" src/app/admin/*/actions.ts
```

Setiap baris yang muncul harus punya `requireAuth` di dalamnya.

### Cara menguji

1. Login sebagai admin, buka semua halaman `/admin`, coba tambah/ubah/hapus di masing-masing. Semua harus tetap berjalan normal — tidak boleh ada yang rusak.
2. Logout, lalu coba buka `/admin/students` langsung. Harus dilempar ke `/login`.
3. Login sebagai guru (`TEACHER`), coba buka `/admin/students`. Harus dilempar ke `/login`.

### Selesai kalau

- [ ] Keempat belas file sudah punya `requireAuth("ADMIN")` di **setiap** fungsi ekspor
- [ ] `npm run build` lolos
- [ ] Seluruh halaman admin masih berfungsi normal saat login sebagai admin
- [ ] Sudah dibuat PR terpisah dengan judul: `fix(security): verifikasi peran di seluruh server action admin`

---

## Fase 2 — Tambah peran baru & fondasi penjagaan

Mulai fase ini, kerjakan di branch `feat/pemisahan-peran-admin`.

### Langkah 2.1 — Tambah nilai enum

Buka `prisma/schema.prisma` baris 17, tambahkan tiga nilai:

```prisma
enum Role {
  ADMIN
  TEACHER
  STUDENT
  LANDING_ADMIN
  COUNSELOR
  PIKET
  KURIKULUM      // baru
  KESISWAAN      // baru
  ADMIN_CBT      // baru
}
```

Terapkan ke database lokal:

```bash
npx prisma db push
npx prisma generate
```

> **Aman.** Menambah nilai enum itu operasi aditif di PostgreSQL — tidak ada data yang hilang, tidak ada kolom yang berubah. Akun `ADMIN` yang sudah ada tetap jalan apa adanya.

### Langkah 2.2 — Perluas tipe peran

**`src/lib/session.ts`** — fungsi `requireAuth` sekarang cuma menerima satu peran (baris 46). Ubah supaya bisa menerima beberapa:

```ts
type AppRole =
  | "ADMIN" | "TEACHER" | "STUDENT" | "LANDING_ADMIN"
  | "COUNSELOR" | "PIKET" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";

export async function requireAuth(...roles: AppRole[]) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role as AppRole)) redirect("/login");
  return user;
}
```

> Bentuk lama `requireAuth("ADMIN")` tetap jalan dengan tanda tangan baru ini, jadi tidak ada pemanggilan lama yang perlu diubah. Pastikan `npm run build` lolos setelah perubahan ini.

**`src/server/auth.ts`** baris 37 — tambahkan tiga peran baru ke `ActorRole`:

```ts
export type ActorRole =
  | "ADMIN" | "TEACHER" | "STUDENT" | "LANDING_ADMIN"
  | "COUNSELOR" | "PIKET" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";
```

### Langkah 2.3 — Buat helper area admin

Masih di `src/lib/session.ts`, tambahkan satu fungsi. Ini yang akan dipakai `layout.tsx` supaya keempat peran admin bisa masuk ke kerangka `/admin`:

```ts
/**
 * Gerbang kerangka /admin. Hanya memastikan penggunanya salah satu peran
 * keluarga admin — TIDAK menentukan halaman mana yang boleh dibuka.
 * Pembatasan per halaman dilakukan di masing-masing page.tsx dan actions.ts.
 */
export async function requireAdminArea() {
  return requireAuth("ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT");
}
```

Lalu ubah `src/app/admin/layout.tsx` baris 6:

```ts
const user = await requireAdminArea();
```

> ⚠️ **Titik paling rawan di seluruh panduan ini.** Begitu baris ini diubah, gerbang `/admin` jadi longgar. Yang menjaga halaman sekarang adalah pengecekan di masing-masing halaman — dan itu baru dipasang di Fase 3. **Jangan berhenti di tengah antara Fase 2 dan Fase 3.** Kerjakan sampai Fase 3 selesai sebelum push.

### Langkah 2.4 — Script pembuat akun

Di sistem ini akun admin dibuat lewat script, bukan lewat UI. Buat tiga file baru dengan meniru `scripts/create-piket.ts` — salin isinya, ganti tiga hal saja: `username`, `name`, dan `role`.

| File baru | username | name | role |
|---|---|---|---|
| `scripts/create-kurikulum.ts` | `kurikulum.hutama` | `Waka Kurikulum` | `KURIKULUM` |
| `scripts/create-kesiswaan.ts` | `kesiswaan.hutama` | `Waka Kesiswaan` | `KESISWAAN` |
| `scripts/create-admin-cbt.ts` | `admincbt.hutama` | `Admin CBT` | `ADMIN_CBT` |

Jalankan ketiganya di laptopmu — akun-akun ini yang akan kamu pakai untuk menguji fase berikutnya:

```bash
npx tsx scripts/create-kurikulum.ts
npx tsx scripts/create-kesiswaan.ts
npx tsx scripts/create-admin-cbt.ts
```

### Langkah 2.5 — Arahkan setelah login

**`src/app/login/actions.ts`** — di fungsi `destinationFor` (sekitar baris 41), tambahkan tiga peran baru. Semuanya masuk ke dashboard admin:

```ts
function destinationFor(role: string, system?: System) {
  if (system === "PIKET") return "/piket/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "KURIKULUM") return "/admin/dashboard";     // baru
  if (role === "KESISWAAN") return "/admin/dashboard";     // baru
  if (role === "ADMIN_CBT") return "/admin/dashboard";     // baru
  if (role === "TEACHER") return "/teacher/dashboard";
  // ... sisanya tetap
}
```

Periksa juga `src/app/login/page.tsx` baris 12 dan 30 — di situ ada daftar peran untuk tab pilihan login. Sesuaikan supaya akun baru bisa dipilih saat login. Ikuti pola yang sudah ada di file itu.

### Cara menguji

Login pakai `kurikulum.hutama` / `kurikulum123`. Harus berhasil masuk dan mendarat di `/admin/dashboard`. Menunya masih lengkap semua — itu **normal**, penyaringan menu baru dikerjakan di Fase 3.

### Selesai kalau

- [ ] Tiga nilai enum sudah ada di schema dan sudah masuk database lokal
- [ ] `requireAuth` menerima banyak peran, `npm run build` lolos
- [ ] `requireAdminArea()` sudah ada dan sudah dipakai di `admin/layout.tsx`
- [ ] Tiga script pembuat akun sudah ada dan sudah dijalankan
- [ ] Ketiga akun baru bisa login dan mendarat di `/admin/dashboard`

---

## Fase 3 — Pisahkan halaman admin per peran

Ini fase inti. Kerjakan sampai tuntas — jangan tinggalkan setengah jalan.

### Langkah 3.1 — Kunci setiap halaman

Sekarang **15 dari 20** halaman admin tidak punya penjagaan sendiri; mereka hanya mengandalkan `layout.tsx`. Setelah Fase 2, itu tidak cukup lagi.

Tambahkan `requireAuth` di **setiap** `page.tsx` sesuai tabel ini:

| Halaman | Baris yang ditambahkan |
|---|---|
| `admin/school-profile/page.tsx` | `await requireAuth("ADMIN");` |
| `admin/students/page.tsx` | `await requireAuth("ADMIN");` |
| `admin/teachers/page.tsx` | `await requireAuth("ADMIN");` |
| `admin/majors/page.tsx` | `await requireAuth("ADMIN");` |
| `admin/audit-logs/page.tsx` | `await requireAuth("ADMIN");` *(sudah ada)* |
| `admin/settings/page.tsx` | `await requireAuth("ADMIN");` |
| `admin/classes/page.tsx` | `await requireAuth("KURIKULUM");` |
| `admin/subjects/page.tsx` | `await requireAuth("KURIKULUM");` |
| `admin/academic-years/page.tsx` | `await requireAuth("KURIKULUM");` |
| `admin/piket-schedules/page.tsx` | `await requireAuth("KURIKULUM");` |
| `admin/exams/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/exams/[id]/print-questions/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/question-sets/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/question-sets/[id]/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/tokens/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/monitoring/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/reports/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/print/page.tsx` | `await requireAuth("ADMIN_CBT");` |
| `admin/dashboard/page.tsx` | `await requireAdminArea();` — dibuka semua peran admin |
| `admin/change-password/page.tsx` | `await requireAdminArea();` — dibuka semua peran admin |

### Langkah 3.2 — Samakan penjagaan di server action

**Ini bagian yang paling gampang terlewat, dan paling berbahaya kalau terlewat.**

Di Fase 1 semua `actions.ts` diberi `requireAuth("ADMIN")`. Sekarang ubah supaya **cocok dengan peran halamannya**:

| File actions.ts | Ganti jadi |
|---|---|
| `admin/school-profile/actions.ts` | `requireAuth("ADMIN")` — tetap |
| `admin/students/actions.ts` | `requireAuth("ADMIN")` — tetap |
| `admin/teachers/actions.ts` | `requireAuth("ADMIN")` — tetap |
| `admin/majors/actions.ts` | `requireAuth("ADMIN")` — tetap |
| `admin/settings/actions.ts` | `requireAuth("ADMIN")` — tetap |
| `admin/classes/actions.ts` | `requireAuth("KURIKULUM")` |
| `admin/subjects/actions.ts` | `requireAuth("KURIKULUM")` |
| `admin/academic-years/actions.ts` | `requireAuth("KURIKULUM")` |
| `admin/piket-schedules/actions.ts` | `requireAuth("KURIKULUM")` |
| `admin/exams/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/question-sets/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/tokens/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/monitoring/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/reports/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/print/actions.ts` | `requireAuth("ADMIN_CBT")` |
| `admin/dashboard/actions.ts` | `requireAdminArea()` |

Aturannya sederhana: **peran di `actions.ts` harus sama dengan peran di `page.tsx` yang memakainya.** Kalau berbeda, itu bug.

> **Catatan penting.** `admin/exams/actions.ts` membaca data induk milik peran lain — `prisma.academicYear`, `prisma.class`, `prisma.subject`, `prisma.teacher`. **Itu wajar dan harus dibiarkan.** Admin CBT memang perlu membaca kelas dan mapel untuk menyusun jadwal ujian. Yang dipisah adalah wewenang **mengubah**, bukan **membaca**. Jangan buang query itu.

### Langkah 3.3 — Saring menu di sidebar

Buka `src/components/layouts/AdminSidebar.tsx`. Daftar menu ada di baris 32–48. Tambahkan penanda peran di setiap item:

```ts
const menuItems = [
  { href: "/admin/dashboard",       icon: LayoutDashboard, label: "Dashboard",       roles: ["ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT"] },
  { href: "/admin/school-profile",  icon: School,          label: "Profil Sekolah",  roles: ["ADMIN"] },
  { href: "/admin/students",        icon: Users,           label: "Data Siswa",      roles: ["ADMIN"] },
  { href: "/admin/teachers",        icon: GraduationCap,   label: "Data Guru",       roles: ["ADMIN"] },
  { href: "/admin/majors",          icon: Building2,       label: "Jurusan",         roles: ["ADMIN"] },
  { href: "/admin/audit-logs",      icon: ScrollText,      label: "Audit Log",       roles: ["ADMIN"] },
  { href: "/admin/settings",        icon: Settings,        label: "Pengaturan",      roles: ["ADMIN"] },

  { href: "/admin/classes",         icon: Building2,       label: "Kelas",           roles: ["KURIKULUM"] },
  { href: "/admin/subjects",        icon: BookOpen,        label: "Mata Pelajaran",  roles: ["KURIKULUM"] },
  { href: "/admin/academic-years",  icon: CalendarDays,    label: "Tahun Ajaran",    roles: ["KURIKULUM"] },
  { href: "/admin/piket-schedules", icon: CalendarDays,    label: "Jadwal Piket",    roles: ["KURIKULUM"] },

  { href: "/admin/exams",           icon: UserCog,         label: "Jadwal Ujian",    roles: ["ADMIN_CBT"] },
  { href: "/admin/question-sets",   icon: ClipboardList,   label: "Paket Soal",      roles: ["ADMIN_CBT"] },
  { href: "/admin/tokens",          icon: KeyRound,        label: "Token Ujian",     roles: ["ADMIN_CBT"] },
  { href: "/admin/monitoring",      icon: MonitorCheck,    label: "Monitoring",      roles: ["ADMIN_CBT"] },
  { href: "/admin/reports",         icon: BarChart3,       label: "Laporan",         roles: ["ADMIN_CBT"] },
  { href: "/admin/print",           icon: Printer,         label: "Cetak Dokumen",   roles: ["ADMIN_CBT"] },
];
```

Komponen ini menerima prop `user`. Tambahkan `role` ke prop itu (dikirim dari `admin/layout.tsx`), lalu saring sebelum dirender:

```tsx
{menuItems
  .filter((item) => item.roles.includes(user.role))
  .map((item) => { /* render seperti sebelumnya */ })}
```

Menu kesiswaan belum ada di daftar ini — ditambahkan di Fase 4.

> **Ingat:** menyaring menu itu untuk kenyamanan, **bukan** keamanan. Yang benar-benar menjaga adalah `requireAuth` di Langkah 3.1 dan 3.2. Jangan pernah mengandalkan sidebar sebagai pengaman.

### Langkah 3.4 — Sesuaikan sisi API

Karena superadmin tidak lagi memegang ujian, tiga tempat ini perlu disesuaikan:

| File | Sekarang | Jadi |
|---|---|---|
| `src/server/modules/cbt/exam-print.ts:43` | `actor.role === "ADMIN"` | `actor.role === "ADMIN_CBT"` |
| `src/server/modules/cbt/review.ts:51` | `"TEACHER" \|\| "ADMIN" \|\| "COUNSELOR"` | ganti `"ADMIN"` jadi `"ADMIN_CBT"` |
| `src/app/api/v1/cbt/admin/exams/[id]/print-questions/route.ts:15` | `requireRole(req, "ADMIN", "TEACHER")` | `requireRole(req, "ADMIN_CBT", "TEACHER")` |

Periksa juga `src/app/api/admin/exams/[id]/print-questions/route.ts:16` (versi lama yang masih dipakai aplikasi mobile) — samakan perlakuannya.

> **Jangan sentuh** `requirePiketAccess` di `src/server/auth.ts:87` dan `requireCounselorAccess` di baris 99. Keduanya masih benar apa adanya.

### Cara menguji

Login bergantian dengan keempat akun. Untuk setiap akun, periksa dua hal:

**A. Menu yang tampil sesuai tabel di atas.**

**B. Halaman milik peran lain benar-benar tertutup.** Ini yang wajib diuji — ketik URL-nya langsung di address bar, jangan lewat menu:

| Login sebagai | Ketik URL ini | Harus |
|---|---|---|
| `admincbt.hutama` | `/admin/students` | dilempar ke `/login` |
| `admincbt.hutama` | `/admin/settings` | dilempar ke `/login` |
| `kurikulum.hutama` | `/admin/exams` | dilempar ke `/login` |
| `kurikulum.hutama` | `/admin/students` | dilempar ke `/login` |
| `admin` (superadmin) | `/admin/exams` | dilempar ke `/login` |
| `kesiswaan.hutama` | `/admin/classes` | dilempar ke `/login` |

Kalau ada satu saja yang **tidak** dilempar, berarti `requireAuth` di halaman itu belum terpasang. Perbaiki sebelum lanjut.

### Selesai kalau

- [ ] Seluruh 20 `page.tsx` punya `requireAuth` sesuai tabel Langkah 3.1
- [ ] Seluruh 16 `actions.ts` sudah disesuaikan sesuai tabel Langkah 3.2
- [ ] Sidebar menyaring menu sesuai peran
- [ ] Tiga (atau empat) titik API di Langkah 3.4 sudah diubah
- [ ] Seluruh baris di tabel pengujian **B** memberi hasil yang benar
- [ ] `npm run build` dan `npm test` lolos

---

## Fase 4 — Modul kesiswaan & BK read-only

Fase ini menyentuh data produksi. **Pastikan backup dari Fase 0 sudah ada.**

### Langkah 4.1 — Migrasi kepemilikan catatan

**Masalahnya.** `ViolationRecord` dan `AchievementRecord` sekarang mewajibkan `counselorId` yang menunjuk ke tabel `Counselor`:

```prisma
model ViolationRecord {
  counselorId String    @map("counselor_id")   // wajib
  counselor   Counselor @relation(fields: [counselorId], references: [id])
}
```

Staf kesiswaan **bukan** konselor, jadi dengan bentuk ini dia tidak bisa mencatat apa pun.

**Solusinya.** Ganti jadi `recordedById` yang menunjuk ke `User`, supaya siapa pun yang punya akun bisa jadi pencatat dan perannya yang menentukan boleh atau tidak.

> ### ⚠️ JANGAN pakai `prisma db push` untuk langkah ini
>
> `prisma db push` akan **menghapus kolom `counselor_id` beserta isinya**, dan seluruh riwayat pelanggaran serta prestasi siswa hilang. Gunakan migrasi bertahap di bawah ini.

**Urutan yang benar:**

**1. Ubah schema** — di `prisma/schema.prisma`:

```prisma
model ViolationRecord {
  // ... field lain tetap
  recordedById String @map("recorded_by_id")
  recordedBy   User   @relation("ViolationRecorder", fields: [recordedById], references: [id])
  // hapus baris counselorId dan counselor
}

model AchievementRecord {
  // ... field lain tetap
  recordedById String @map("recorded_by_id")
  recordedBy   User   @relation("AchievementRecorder", fields: [recordedById], references: [id])
  // hapus baris counselorId dan counselor
}
```

Tambahkan relasi baliknya di `model User`:

```prisma
model User {
  // ... field lain tetap
  violationsRecorded   ViolationRecord[]   @relation("ViolationRecorder")
  achievementsRecorded AchievementRecord[] @relation("AchievementRecorder")
}
```

Hapus juga `violations` dan `achievements` dari `model Counselor` — dua relasi itu sudah tidak ada lagi.

**2. Buat file migrasi kosong:**

```bash
npx prisma migrate dev --create-only --name pindah_pencatat_ke_user
```

**3. Ganti isi file migrasi** yang baru dibuat di `prisma/migrations/..._pindah_pencatat_ke_user/migration.sql` dengan SQL berikut. **Perhatikan urutannya — kolom baru diisi dulu sebelum kolom lama dibuang:**

```sql
-- ViolationRecord
ALTER TABLE "violation_records" ADD COLUMN "recorded_by_id" TEXT;

UPDATE "violation_records" vr
SET "recorded_by_id" = c."user_id"
FROM "counselors" c
WHERE vr."counselor_id" = c."id";

-- Pengaman: kalau masih ada baris kosong, migrasi berhenti di sini.
-- Artinya ada catatan yang counselor-nya sudah terhapus. Lapor, jangan dipaksa.
ALTER TABLE "violation_records" ALTER COLUMN "recorded_by_id" SET NOT NULL;

ALTER TABLE "violation_records" DROP CONSTRAINT IF EXISTS "violation_records_counselor_id_fkey";
ALTER TABLE "violation_records" DROP COLUMN "counselor_id";
ALTER TABLE "violation_records"
  ADD CONSTRAINT "violation_records_recorded_by_id_fkey"
  FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id");

-- AchievementRecord
ALTER TABLE "achievement_records" ADD COLUMN "recorded_by_id" TEXT;

UPDATE "achievement_records" ar
SET "recorded_by_id" = c."user_id"
FROM "counselors" c
WHERE ar."counselor_id" = c."id";

ALTER TABLE "achievement_records" ALTER COLUMN "recorded_by_id" SET NOT NULL;

ALTER TABLE "achievement_records" DROP CONSTRAINT IF EXISTS "achievement_records_counselor_id_fkey";
ALTER TABLE "achievement_records" DROP COLUMN "counselor_id";
ALTER TABLE "achievement_records"
  ADD CONSTRAINT "achievement_records_recorded_by_id_fkey"
  FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id");
```

> Periksa dulu nama tabel `users` di `prisma/schema.prisma` (lihat `@@map` pada `model User`) dan sesuaikan kalau berbeda.

**4. Uji di database salinan sebelum menyentuh produksi.** Restore backup ke database terpisah, jalankan migrasi di situ, lalu pastikan jumlah barisnya tetap sama:

```sql
SELECT COUNT(*) FROM violation_records;
SELECT COUNT(*) FROM violation_records WHERE recorded_by_id IS NULL;  -- harus 0
```

**5. Jalankan migrasi:**

```bash
npx prisma migrate dev
npx prisma generate
```

**6. Perbaiki kode yang memakai `counselorId`.** Setelah `prisma generate`, `npm run build` akan gagal di setiap tempat yang masih menyebut field lama. Itu justru bagus — TypeScript menunjukkan persis mana yang harus diperbaiki. Cari juga dengan:

```bash
grep -rn "counselorId" src/ --include='*.ts' --include='*.tsx'
```

Sesuaikan di `src/server/modules/bk/service.ts` dan `src/app/counselor/actions.ts`. Isi `recordedById` dengan `user.id` orang yang sedang login.

### Langkah 4.2 — Halaman kesiswaan

Buat empat halaman baru di bawah `/admin`:

| Halaman baru | Isi | Wewenang |
|---|---|---|
| `admin/violations/page.tsx` | Catatan pelanggaran siswa | **tambah, ubah, hapus** |
| `admin/achievements/page.tsx` | Catatan prestasi siswa | **tambah, ubah, hapus** |
| `admin/tardiness/page.tsx` | Rekap keterlambatan | **baca saja** |
| `admin/permits/page.tsx` | Rekap izin keluar/masuk | **baca saja** |

Semuanya dijaga `await requireAuth("KESISWAAN");`.

Untuk dua halaman pertama, **jangan tulis dari nol.** Salin dan sesuaikan dari yang sudah ada dan sudah teruji:
- `src/app/counselor/violations/ViolationsClient.tsx`
- `src/app/counselor/achievements/AchievementsClient.tsx`

Logika servernya sudah tersedia di `src/server/modules/bk/service.ts` — pakai fungsi yang sama, jangan bikin query baru.

Untuk dua halaman rekap, bacalah `prisma.studentTardiness` dan `prisma.studentPermit`. Sediakan saringan per tanggal dan per kelas.

> ### Kesiswaan tidak boleh mengubah catatan piket
>
> Halaman rekap keterlambatan dan izin **murni baca**. Jangan buat tombol edit atau hapus, dan jangan buat server action apa pun yang menulis ke `studentTardiness` atau `studentPermit`.
>
> Catatan itu adalah kesaksian guru piket yang melihat langsung, lengkap dengan jam kedatangan. Kalau bisa diubah kantor lain, nilainya sebagai bukti hilang. Kalau ada salah input, guru piket yang membetulkan lewat halamannya sendiri.

**Yang boleh dilakukan kesiswaan** dari halaman rekap: melihat pola, lalu **membuat catatan pelanggaran baru** di `/admin/violations` kalau memang perlu. Keterlambatan tidak otomatis jadi poin — kesiswaan yang menimbang kapan pola itu layak dinaikkan.

Tambahkan keempatnya ke `AdminSidebar.tsx` dengan `roles: ["KESISWAAN"]`.

### Langkah 4.3 — Jadikan BK read-only

Di `/counselor`, ubah perlakuan pada dua halaman:

**`src/app/counselor/violations/`**

Halaman ini sekarang berisi **dua hal**. Perlakuannya berbeda:

| Bagian | Untuk BK |
|---|---|
| Daftar catatan pelanggaran siswa | **baca saja** — hilangkan tombol tambah/ubah/hapus |
| Master jenis pelanggaran + bobot poin | **tetap penuh** — BK boleh tambah/ubah/hapus |

> Ini disengaja dan bukan kekeliruan. Yang **menetapkan** bobot poin (BK) sengaja dipisahkan dari yang **mencatat** pelanggaran (kesiswaan), supaya tidak ada satu kantor yang memegang keduanya sekaligus.

**`src/app/counselor/achievements/`** — jadikan baca saja seluruhnya.

Di `src/app/counselor/actions.ts`, tiga fungsi ini harus **berhenti bisa dipanggil BK**. Ganti penjagaannya jadi `requireAuth("KESISWAAN")`:

- `saveViolation` (baris 136)
- `deleteViolation` (baris 161)
- `saveAchievement` (baris 176)
- `deleteAchievement` (baris 201)

Sedangkan tiga fungsi ini **tetap milik BK**:

- `listViolationTypes` (baris 102)
- `saveViolationType` (baris 107)
- `deleteViolationType` (baris 122)

> **Menghilangkan tombol saja tidak cukup.** Server action tetap bisa dipanggil lewat POST langsung. Penjagaan di `actions.ts` itu yang sesungguhnya membatasi — tombolnya cuma supaya tampilannya tidak membingungkan.

Yang **tidak berubah sama sekali** di modul BK: kasus konseling, home visit, panggilan orang tua, permohonan konseling, dan angket. BK tetap memegang penuh semuanya.

### Langkah 4.4 — Jaga kerahasiaan konseling

`CounselingCase` punya field `isConfidential` yang default-nya `true`, berisi `notes` (catatan sesi) dan `followUp`.

**Kesiswaan tidak boleh bisa membuka isi kasus konseling.** Boleh melihat poin dan riwayat pelanggaran siswa — itu memang bidangnya. Tapi catatan sesi konseling tidak.

Saat membuat halaman kesiswaan, pastikan tidak ada query yang menarik `CounselingCase`, `HomeVisit`, atau `ParentSummon`. Kalau butuh menampilkan ringkasan siswa, ambil hanya total poin dan daftar pelanggaran.

Ini bukan sekadar kerapian — siswa mau terbuka ke guru BK justru karena tahu isinya tidak menyebar.

### Cara menguji

| Login sebagai | Coba | Harus |
|---|---|---|
| `kesiswaan.hutama` | Tambah pelanggaran di `/admin/violations` | berhasil |
| `kesiswaan.hutama` | Buka `/admin/tardiness` | tampil, **tanpa** tombol ubah/hapus |
| `kesiswaan.hutama` | Buka `/counselor/cases` | dilempar ke `/login` |
| `bk` (COUNSELOR) | Buka daftar pelanggaran | tampil lengkap, tombol tambah/ubah/hapus **tidak ada** |
| `bk` (COUNSELOR) | Tambah/ubah jenis pelanggaran | berhasil |
| `bk` (COUNSELOR) | Kasus konseling, home visit, angket | berfungsi normal seperti sebelumnya |

Lalu periksa datanya: buka catatan pelanggaran lama yang dibuat sebelum migrasi. **Nama pencatatnya harus masih benar**, tidak kosong dan tidak berubah.

### Selesai kalau

- [ ] Migrasi sudah diuji di database salinan, jumlah baris tetap sama, tidak ada `recorded_by_id` yang kosong
- [ ] `npm run build` lolos (tidak ada sisa `counselorId`)
- [ ] Empat halaman kesiswaan sudah ada dan hanya bisa dibuka `KESISWAAN`
- [ ] Halaman rekap terlambat & izin tidak punya server action yang menulis
- [ ] BK tidak bisa lagi menambah/mengubah pelanggaran & prestasi, tapi masih bisa melihat semuanya
- [ ] BK masih penuh memegang master jenis pelanggaran
- [ ] Kesiswaan tidak bisa membuka `/counselor/*` mana pun
- [ ] Catatan lama masih menampilkan nama pencatat yang benar

---

## Fase 5 — Uji menyeluruh & rilis

### Langkah 5.1 — Matriks wewenang

Buat file `src/server/roles.test.ts`. Isi dengan pengujian yang memastikan setiap peran hanya bisa membuka miliknya. Ikuti gaya penulisan tes yang sudah ada di repo — lihat `src/server/http.test.ts` sebagai contoh.

Jalankan:

```bash
npm test
```

### Langkah 5.2 — Uji manual lengkap

Tabel ini harus dicoba **satu per satu**, dengan mengetik URL langsung di address bar. Beri centang kalau hasilnya sesuai.

| Peran | Boleh | Harus ditolak |
|---|---|---|
| `ADMIN` | Data Siswa, Data Guru, Jurusan, Profil Sekolah, Audit Log, Pengaturan | `/admin/exams`, `/admin/classes`, `/admin/violations` |
| `KURIKULUM` | Kelas, Mapel, Tahun Ajaran, Jadwal Piket | `/admin/students`, `/admin/exams`, `/admin/settings` |
| `ADMIN_CBT` | Jadwal Ujian, Paket Soal, Token, Monitoring, Laporan, Cetak | `/admin/students`, `/admin/classes`, `/admin/settings` |
| `KESISWAAN` | Pelanggaran, Prestasi, Rekap Terlambat, Rekap Izin | `/admin/students`, `/admin/exams`, `/counselor/cases` |
| `COUNSELOR` | Kasus, home visit, angket, master jenis pelanggaran | tambah/ubah pelanggaran & prestasi |
| `PIKET` | Semua fitur piket seperti sebelumnya | seluruh `/admin/*` |
| `TEACHER` | Fitur guru seperti sebelumnya | seluruh `/admin/*` |
| `STUDENT` | Fitur siswa seperti sebelumnya | seluruh `/admin/*` |

### Langkah 5.3 — Pastikan yang lama tidak rusak

Ini yang paling sering terlupa. **Aplikasi mobile sudah dipakai siswa dan guru** — jangan sampai rusak gara-gara perubahan ini.

- [ ] Siswa bisa login di aplikasi mobile dan mengerjakan ujian dari awal sampai kirim
- [ ] Guru BK bisa memakai aplikasi mobile seperti biasa
- [ ] Guru piket bisa mencatat kehadiran, keterlambatan, dan izin
- [ ] Halaman landing page terbuka normal tanpa login
- [ ] Guru mapel bisa mengoreksi esai

### Langkah 5.4 — Rilis

1. Push branch dan buat PR:
   ```bash
   git push -u origin feat/pemisahan-peran-admin
   ```

2. Di badan PR, tuliskan:
   - Tabel matriks wewenang dari Langkah 5.2
   - Peringatan bahwa PR ini **mengubah skema database** dan wajib backup sebelum deploy
   - Daftar akun uji beserta perannya

3. Setelah PR di-merge, di server:
   ```bash
   cd /var/www/cbt-smkhutama
   ./scripts/backup-db.sh        # WAJIB, jangan dilewati
   git pull origin main
   npx prisma migrate deploy     # BUKAN `db push`
   npm install && npm run build
   pm2 restart cbt-smkhutama
   ```

   > Sesuaikan dengan cara deploy yang dipakai server (pm2 atau Docker) — cek dengan `pm2 list` dan `docker ps`.

4. Buat akun sungguhan untuk masing-masing peran:
   ```bash
   npx tsx scripts/create-kurikulum.ts
   npx tsx scripts/create-kesiswaan.ts
   npx tsx scripts/create-admin-cbt.ts
   ```

5. **Ganti password bawaan** ketiga akun itu lewat halaman ganti password sebelum diserahkan ke guru.

### Selesai kalau

- [ ] `npm test` lolos, termasuk tes matriks wewenang yang baru
- [ ] Seluruh baris di tabel Langkah 5.2 sudah dicoba dan sesuai
- [ ] Seluruh poin di Langkah 5.3 sudah dipastikan tidak rusak
- [ ] Sudah di-deploy dan akun sungguhan sudah dibuat
- [ ] Password bawaan sudah diganti

---

## Ringkasan Aturan yang Gampang Dilanggar

Baca ulang bagian ini sebelum membuat PR.

1. **Menyembunyikan menu bukan keamanan.** Yang menjaga adalah `requireAuth` di `page.tsx` dan `actions.ts`. Sidebar cuma soal kenyamanan.

2. **Server action harus dijaga sendiri.** `layout.tsx` tidak melindunginya. Setiap `export async function` di file `actions.ts` butuh barisnya sendiri.

3. **Peran di halaman dan di action-nya harus sama.** Kalau `page.tsx` pakai `KURIKULUM` tapi `actions.ts` pakai `ADMIN`, itu bug.

4. **Jangan pakai `prisma db push` di Fase 4.** Datanya hilang. Pakai `prisma migrate`.

5. **Membaca ≠ mengubah.** Admin CBT wajib bisa membaca kelas dan mapel. Kesiswaan wajib bisa membaca data siswa. Yang dipisah cuma wewenang mengubah.

6. **Jangan tambah fitur di luar dokumen ini.** Jadwal pelajaran, ekstrakurikuler, dan peran pembina OSIS sudah dibahas dan sengaja **tidak** dikerjakan sekarang.

7. **Kalau ragu, tanya.** Terutama untuk apa pun yang menyentuh database produksi.

---

## Kalau Ada Yang Salah

| Gejala | Kemungkinan penyebab |
|---|---|
| Peran baru bisa buka halaman milik peran lain | `requireAuth` di `page.tsx` halaman itu belum ditambahkan |
| Menu sudah hilang tapi tombolnya masih bisa dipakai | `actions.ts` belum disesuaikan — ini lubang keamanan, bukan sekadar tampilan |
| `npm run build` gagal setelah migrasi | Masih ada kode yang menyebut `counselorId`. Cari dengan `grep -rn "counselorId" src/` |
| Setelah migrasi, nama pencatat jadi kosong | Ada catatan yang konselornya sudah terhapus. **Restore backup dan lapor** — jangan dipaksa lanjut |
| Aplikasi mobile jadi error | Cek Langkah 3.4 — kemungkinan ada peran di sisi API yang kelewat diubah |

---

## Yang Sengaja Tidak Dikerjakan

Sudah dibahas dan diputuskan **ditunda**. Jangan dimulai tanpa persetujuan:

- **Jadwal pelajaran** — belum ada modelnya sama sekali di database, dan butuh mengubah `Teacher.subjectId` dari satu mapel jadi banyak mapel. Model `Teacher` sudah dipakai bank soal dan ujian, jadi ini perubahan berisiko yang perlu perencanaan tersendiri.
- **Pembagian tugas mengajar** — satu paket dengan jadwal pelajaran.
- **Ekstrakurikuler dengan keanggotaan siswa** — yang ada sekarang (`LandingExtracurricular`) murni konten website.
- **Peran pembina OSIS** — belum ada layar untuk dibuka. Kalau nanti fitur OSIS dibangun, kemungkinan besar jadi submenu di kesiswaan, bukan peran tersendiri.
- **Alur "BK mengusulkan, kesiswaan menyetujui"** — dipakai dulu yang sederhana. Kalau ternyata mengganjal, baru dibangun.
