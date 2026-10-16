# F1 — Peran perawat dan laboratorium: temuan dan usulan RBAC (menunggu keputusan pemilik)

**Status (diperbarui): backend R2–R6 DIIMPLEMENTASI dengan usulan bawaan sebagai keputusan agen atas arahan pemilik "semua di tangan AI"; UI dan perjalanan E2E belum ada, F1 tetap REPORTED.**
Yang dikerjakan: peran `perawat` dan `lab` (dapat didaftarkan sendiri, diperlakukan sebagai pasien sampai owner memverifikasi lewat alur STR yang sama dengan dokter, R2); akses hasil lab hanya untuk pasien yang ditugaskan dokter terverifikasi atau owner, dapat dicabut (R3); kapabilitas sesuai matriks domain (R4, R5); penugasan, pencabutan dan penolakan masuk audit (R6). Uji: `server/uji/penugasanStaf.uji.ts`, `server/uji/staffAksesLab.uji.ts`. Pemilik tetap dapat mengubah keputusan R1–R6 di bawah; bagian 1–2 di bawah adalah kondisi SEBELUM perubahan ini.
Kriteria F1 meminta perjalanan perawat dan laboratorium "sesuai kapabilitas yang benar-benar tersedia" dan menyatakan peran yang belum tersedia **tidak dianggap lulus**. Dokumen ini menjelaskan kenapa peran itu belum tersedia, apa yang sudah ada di model domain, dan keputusan privasi yang harus dibuat sebelum peran apa pun dibuka.

## 1. Fakta dari kode (diperiksa pada main)

1. `server/src/store.ts`: `Role = 'pasien' | 'dokter' | 'kontributor' | 'verifikator' | 'admin' | 'owner'`. Tidak ada `perawat` atau `lab`.
2. Model domain hasil lab sudah mendefinisikan aktor `nurse` dan `lab-staff` (`server/src/modules/labResults/domain/lifecycle.ts` `ActorRole`; `definitions.ts` matriks transisi; `labResultsService.ts` `BOLEH_INTAKE = ['lab-staff','nurse','clinician','admin']`; `STAFF_READ_ROLES = ['clinician','nurse','lab-staff','admin']`). Matriks transisi dan uji siklus hidup sudah ada.
3. Namun pemetaan HTTP `server/src/modules/labResults/http/aktor.ts` `aktorDariPengguna` hanya memetakan `dokter`→`clinician`, `admin`/owner→`admin`, `pasien`→`patient`; peran lain mengembalikan `null` (ditolak 403). **Jadi tidak ada akun yang dapat menjadi `nurse` atau `lab-staff`.**
4. `server/src/domains/identity/accessControl.ts`: peran yang dapat dipilih sendiri hanya `pasien|dokter|kontributor|verifikator`; dokter/verifikator tanpa `strStatus: 'verified'` diperlakukan sebagai pasien; `admin`/`owner` tidak dapat di-self-assign. Pola verifikasi profesional ini adalah model yang wajar untuk dilanjutkan.
5. Gerbang `server/uji/routeAccessDecisions.uji.ts` mewajibkan setiap rute terdaftar punya tepat satu keputusan akses (public / handler-auth / session / clinician / data-gated / owner) dan memeriksa anonim, pasien, dokter tanpa STR, dokter terverifikasi terhadap server nyata. Peran baru harus masuk ke sini (deny-by-default sudah dijaga mesin).

## 2. Risiko privasi yang harus diputuskan lebih dulu

Di `labResultsService.ts` `bolehBaca`: untuk peran **non-pasien**, akses hanya dibatasi oleh `tenantId` (`TENANT_PRAKTIK`), **tanpa penugasan pasien**. Artinya klinisi hari ini dapat membaca hasil lab dan rujukan semua pasien di tenant. Menambahkan akun `nurse`/`lab-staff` dengan aturan yang sama akan memberi mereka akses ke seluruh pasien tenant, bukan hanya pasien yang mereka layani. Itu melanggar prinsip hak akses minimum dan harus diputuskan, bukan diwarisi diam-diam.

## 3. Keputusan yang dibutuhkan dari pemilik

| # | Keputusan | Opsi | Usulan (belum disetujui) |
|---|---|---|---|
| R1 | Apakah peran perawat dan laboratorium dibuka sekarang | ya / tunda sampai ada tenant dan operasional nyata | tunda sampai ada pengguna nyata; F1 tidak mengharuskannya |
| R2 | Cara verifikasi identitas profesional (STR perawat, izin laboratorium) | meniru alur dokter (`strStatus`) / verifikasi manual pemilik / pihak ketiga | meniru alur dokter, diputuskan penerima verifikasi |
| R3 | Lingkup data staf | seluruh tenant (saat ini untuk klinisi) / hanya pasien yang ditugaskan atau berizin | hanya pasien yang ditugaskan atau berizin (hak akses minimum); penugasan dicatat dan dapat dicabut |
| R4 | Kapabilitas perawat | baca; catat intake; ubah status `communicated`/`closed` seperti matriks domain | sesuai matriks domain yang sudah ada, tanpa tanda tangan klinis dan tanpa persetujuan rencana |
| R5 | Kapabilitas staf lab | intake hasil dan ubah ke `pending_review` saja | sesuai matriks domain; tanpa baca rekam di luar hasil yang ditugaskan |
| R6 | Audit akses staf | tiap baca/tulis tercatat dengan aktor, pasien, waktu server | wajib |

## 4. Pekerjaan teknis setelah keputusan (tidak dikerjakan di sini)

- Tambah `Role` `perawat` dan `lab` (atau satu `staf` dengan subperan) **tanpa jalur self-assign**; verifikasi lewat alur R2.
- Petakan ke aktor `nurse`/`lab-staff` di `aktorDariPengguna`; tambahkan penugasan pasien sesuai R3 ke `bolehBaca`.
- Perluas `routeAccessDecisions.uji.ts` dengan peran baru: anonim, pasien, perawat/lab tanpa verifikasi, perawat/lab terverifikasi **tidak ditugaskan** (harus ditolak), terverifikasi ditugaskan (diizinkan), plus pasien lain tidak terbaca.
- Uji positif dan negatif berpasangan per aturan penolakan (tanpa efek samping pada penolakan; audit tercatat).
- Jalur UI minimal dan E2E browser (390x844 dan 1440x900) setelah kontrak backend stabil.

## 5. Syarat sebelum F1 boleh VERIFIED

Peran perawat dan laboratorium tersedia, aman (hak akses minimum, deny-by-default, teruji), dan perjalanan UI-nya lulus di CI pada SHA yang sama; ATAU pemilik memutuskan secara tertulis bahwa peran itu bukan bagian dari lingkup F1, dengan kriteria diubah melalui proses ledger yang berlaku. Sampai salah satunya terjadi F1 tetap **REPORTED**.
