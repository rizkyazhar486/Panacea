# F1 — Audit akses klinisi (dokter) ke data pasien

**Status: F1 tetap REPORTED.** Dokumen ini hanya **memetakan** perilaku saat ini dan menyiapkan keputusan. Ia **tidak** mengubah akses produksi, tidak memutuskan kebijakan produk, dan tidak mengubah ledger. Mengubah akses tanpa keputusan pemilik dan uji migrasi yang aman dilarang (peta Human–AI 17 Okt 2026, F1).

Dibaca dari kode di main saat dokumen ini ditulis; rujukan memakai nama simbol, bukan nomor baris (nomor baris bergeser). Tes `scripts/qa/f1-clinician-access-audit.test.mjs` memastikan kutipan di bawah masih ada di sumbernya, sehingga dokumen tidak bisa basi diam-diam.

## 1. Ringkasan temuan

| # | Temuan (teramati di kode) | Dampak |
|---|---|---|
| T1 | Peran `dokter` dipetakan ke aktor `clinician` **tanpa `patientIds`**; perawat dan lab dibatasi per penugasan. | Dokter terverifikasi dapat membaca data semua pasien di praktik ("model satu praktik", sebagaimana dikomentari kodenya sendiri). |
| T2 | Pemilik diperlakukan **berbeda antar modul**: di `/api/clinical`, `klinisiAtauPemilik` memberi pemilik akses penuh baca/tulis; di `labResults`, pemilik dipetakan ke `admin` yang tidak boleh meninjau ("Owner BUKAN klinisi"). | Aturan yang sama (owner bukan jalan pintas kontrol klinis) dipakai tidak konsisten. |
| T3 | `GET /api/clinical` mencatat audit generik `clinical.read` **tanpa identitas pasien** untuk pembacaan seluruh simpanan. | Tidak dapat dijawab "dokter X membaca pasien Y kapan" dari audit rute ini. |
| T4 | Daftar second opinion tertunda dikembalikan ke dokter **dan owner** tanpa membuang `aiDraft`; jalur pasien membuangnya (`aiDraft: undefined`). | Cakupan baca di luar penugasan; draf AI terlihat oleh owner. |
| T5 | `/api/clinician/lab-shares` memakai **izin dari pasien** yang menyebut email dokter, belum kedaluwarsa, belum dicabut. | Sudah ada model akses berbasis persetujuan yang bisa menjadi acuan. |
| T6 | `TENANT_PRAKTIK = 'praktik'` adalah satu konstanta yang dipakai untuk semua aktor; kode tidak memisahkan data per praktik/klinik. | "Dalam tenant" berarti seluruh data yang diakses lewat konstanta itu; belum ada pemisahan per praktik di jalur ini. |

## 2. Inventaris akses (hanya yang diaudit)

| Permukaan | Siapa dan lingkupnya | Sumber (simbol) | Tes terkait (belum tentu mematok lingkup) |
|---|---|---|---|
| Baca simpanan klinis `GET /api/clinical` | Dokter atau owner: seluruh simpanan (tanpa `hasilLab`, `rujukanKlinis`, kode tautan); lainnya: disaring per pasien | `klinisiAtauPemilik`, `saringKlinis` (`domains/clinical-records/aksesKlinis.ts`), rute di `index.ts` | `server/uji/aksesKlinis.uji.ts` (mematok dokter → akses `p-clinic-001`), `rbacKlinis.uji.ts` |
| Tulis rekam `POST /api/clinical/record` | `bolehAksesPasien`: dokter atau owner untuk patientId apa pun; pasien hanya rekam dirinya/tertaut | `bolehAksesPasien` | `aksesKlinis.uji.ts` |
| Baca hasil lab | `clinician` dan `admin`: seluruh tenant; `nurse`/`lab-staff`/`patient`: hanya `patientIds` | `bolehBaca`, `STAFF_READ_ROLES` (`modules/labResults`) | `hasilLab.uji.ts` |
| Tulis hasil lab | `clinician` dan `admin` tanpa batas pasien; `nurse`/`lab-staff` hanya yang ditugaskan | `bolehTulisPasien` | `hasilLab.uji.ts` |
| Peran owner di lab | dipetakan ke `admin`, tidak boleh meninjau | `aktorDariPengguna` (`labResults/http/aktor.ts`) | `hasilLab.uji.ts` |
| Second opinion tertunda `GET /api/second-opinion` | dokter atau owner: semua; pasien: miliknya (tanpa `aiDraft`) | rute di `index.ts` | `secondOpinionHttpRbac.uji.ts` |
| Tautan lab oleh pasien `GET /api/clinician/lab-shares` | dokter: hanya izin yang menyebut emailnya, berlaku, belum dicabut | `izinBerlaku`, rute di `index.ts` | `labShareHttpRbac.uji.ts` |
| Perawat dan lab | hanya pasien yang ditugaskan pemilik; tanpa penugasan = tidak melihat apa pun | `aktorDariPengguna`, `pasienDitugaskan` | `staffRbacHttp.uji.ts` |

**Belum diaudit di dokumen ini** (jangan dianggap aman atau tidak aman): rencana perawatan (`/api/care/*`), kunjungan dan Visit OS, rute EMR lain selain `/api/clinical`, data pribadi, SATUSEHAT, admin. Audit lanjutan perlu per rute.

## 3. Opsi keputusan (netral; dokumen ini tidak memilih)

| Opsi | Arti | Yang harus disiapkan sebelum diterapkan |
|---|---|---|
| A. Tetap praktik-luas | Dokter terverifikasi melihat seluruh praktik (perilaku sekarang) | Audit per pasien (T3), kebijakan untuk owner (T2), dokumentasi dasar hukum oleh penasihat hukum |
| B. Berbasis penugasan | Seperti perawat/lab: hanya pasien yang ditugaskan; tanpa penugasan, daftar kosong | UI/aturan penugasan dokter, **rencana migrasi** (dokter yang ada kehilangan akses bila tidak diisi ulang), tes isolasi dan pencabutan, jalur darurat bila ditetapkan |
| C. Berbasis persetujuan pasien | Seperti `lab-shares`: izin dari pasien dengan kedaluwarsa dan pencabutan | Perluasan model izin ke data klinis lain, uji kedaluwarsa/cabut, UX pasien |
| D. Hibrida | Pasien ditugaskan + izin pasien + akses darurat yang diaudit | Gabungan B dan C, definisi "darurat", pencatatan alasan |

Pertimbangan nonteknis yang dibawa ke penasihat hukum dan pemilik: dasar hukum, retensi audit, perlakuan owner/admin, konsekuensi bagi dokter yang bekerja lintas pasien.

## 4. Rekam keputusan (diisi manusia)

| Keputusan | Pilihan | Catatan |
|---|---|---|
| Lingkup baca dokter (A/B/C/D) | ______ | ______ |
| Perlakuan owner dan admin terhadap data klinis (T2) | ______ | ______ |
| Deny-by-default untuk peran klinis baru? | ______ | ______ |
| Peran kontributor (saat ini tanpa kapabilitas backend) | ______ | ______ |
| Cakupan login/OAuth (OAuth nyata belum diuji; pengujian tidak boleh memalsukan auth produksi) | ______ | ______ |
| Aturan pengecualian (darurat, lintas praktik) | ______ | ______ |
| Tanggal berlaku, versi, penanda tangan | ______ | ______ |

## 5. Yang AI tidak lakukan di sini

Tidak membuka atau membatasi akses apa pun, tidak menulis kebijakan, tidak memalsukan alur OAuth, dan tidak menandai F1 VERIFIED. Setelah keputusan ditetapkan, pekerjaan engineering adalah: tes negatif/positif per opsi, migrasi data penugasan, dan bukti E2E; barulah ledger dapat ditinjau.
