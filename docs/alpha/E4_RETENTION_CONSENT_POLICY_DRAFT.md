# E4 — Perlindungan data pasien: draf keputusan retensi, penghapusan, dan consent

**Status: DRAF UNTUK PERSETUJUAN PEMILIK. Belum disetujui, belum berlaku.**
Dokumen ini bukan nasihat hukum dan tidak menyatakan kepatuhan terhadap regulasi mana pun. Penerapan UU Pelindungan Data Pribadi dan aturan data kesehatan Indonesia pada Panacea harus dikonfirmasi penasihat hukum; tidak ada pasal yang dikutip di sini karena tidak diverifikasi dari sumber primer dalam sesi ini.
Kriteria E4 (`governance/ALPHA_ACCEPTANCE_LEDGER.json`): "Tidak ada PHI di log/repo; retensi dan consent sesuai kebijakan". Status ledger: **NOT_CHECKED — tidak diubah oleh dokumen ini.**

## 1. Yang sudah ada dan terbukti (fakta dari kode dan gerbang CI)

| Bagian kriteria | Bukti | Cakupan dan batas |
|---|---|---|
| Tanpa PHI di log | `server/uji/logPrivacyHttp.uji.ts` (gerbang `server-validate`): perjalanan klinis tidak menulis nama, email, MRN, teks atau nilai klinis ke log server | Hanya jalur yang diuji; log infrastruktur pihak ketiga (Render/Vercel) di luar jangkauan |
| Tanpa PHI di repo | `scripts/qa/phi-repo-scan.mjs` + `governance/PHI_SCAN_ALLOWLIST.json` (#2577) | Pola yang dikenal; bukan jaminan bebas PHI |
| Consent berbatas waktu atas data lab | `server/src/domains/clinical-records/labFhir.ts`: izin pasien→dokter bernama, `HARI_MAKS = 90`, kedaluwarsa dan pencabutan dihormati (`izinBerlaku`) | Dicabut = berhenti dilihat; baris izin tetap disimpan (lihat 2.3) |
| Pencabutan consent verifikasi (Connect) | `server/src/connect.ts` `tarikPersetujuan`: menghapus data verifikasi dan melepas ikatan nomor; catatan persetujuan disimpan dengan tanggal pencabutan sebagai bukti | Hanya data modul Connect |
| Token sesi dicabut saat logout | `server/src/store.ts` `cabutToken`: hanya hash disimpan, dipangkas setelah token kedaluwarsa | — |
| Audit lab/perawatan tidak dibuang saat melewati batas ukuran | `server/src/store.ts` `arsipkan()`: `labAudit`, `labReviews`, `careReports` yang tergeser dipindah append-only ke `PANACEA_ARCHIVE_DIR/*.jsonl` atau koleksi `arsip_*` (uji `server/uji/arsipKlinis.uji.ts`) | Hanya tiga koleksi itu; audit umum tidak diarsipkan (lihat 2.2) |

## 2. Celah yang ditemukan (belum ada kebijakan atau mekanisme)

1. **Tidak ada jalur penghapusan akun/data oleh pemilik data.** Rute `DELETE` yang ada hanya untuk entitas tertentu (`posts`, `meets`, `clubs`, `clinical/link/:id`, `lab-log/shares/:id`, `health-series`, `reminders`). Tidak ada `/api/account` hapus/ekspor. Hak penghapusan dan portabilitas belum terpenuhi secara teknis.
2. **Audit umum (`addAudit`) dibatasi 5000 entri dan entri tertua dibuang tanpa arsip** (`store.ts`), sedangkan `labAudit`/`labReviews`/`careReports` diarsipkan append-only tanpa aturan masa simpan. Tidak ada keputusan berapa lama masing-masing disimpan.
3. **Pencabutan = penandaan** (`dicabut`), bukan penghapusan: izin lab, rencana perawatan, dan laporan harian tetap tersimpan setelah dicabut atau kedaluwarsa tanpa jadwal penghapusan.
4. **Tidak ada pekerjaan retensi terjadwal** untuk data kesehatan (seri kesehatan, lab, anamnesis, laporan harian, rekam klinis, arsip audit).
5. **Cadangan dan arsip** (`PANACEA_ARCHIVE_DIR`, penyimpanan berkas/Mongo) belum punya aturan masa simpan atau penghapusan yang disepakati.
6. **Consent eksplisit** hanya terdokumentasi untuk modul Connect dan izin lab; belum ada inventaris tujuan pemrosesan lain (AI, analitik, notifikasi) beserta dasar pemrosesannya.

## 3. Keputusan yang dibutuhkan dari pemilik

Setiap baris menyebut opsi dan usulan bawaan yang **belum berlaku sampai disetujui**.

| # | Keputusan | Opsi | Usulan (belum disetujui) | Bukti untuk menutup |
|---|---|---|---|---|
| D1 | Penanggung jawab pemrosesan dan kontak pelindungan data | nama dan kanal resmi | pemilik menunjuk | nama tercatat di dokumen final |
| D2 | Masa simpan data klinis (rekam, anamnesis, lab, rencana, laporan) | menurut ketentuan rekam medis yang berlaku vs. lebih singkat bila bukan fasilitas layanan | tentukan setelah penasihat hukum menyatakan Panacea berperan sebagai apa | pernyataan hukum tertulis + angka tahun |
| D3 | Masa simpan data swa-catat (seri kesehatan, catatan harian) | selama akun aktif / N bulan setelah tidak aktif | selama akun aktif, hapus N bulan setelah penghapusan akun | angka N disetujui |
| D4 | Masa simpan audit umum dan audit klinis | 5000 entri (saat ini) / berdasarkan waktu | audit klinis diarsipkan sesuai D2; audit umum berdasarkan waktu, bukan jumlah | angka disetujui |
| D5 | Penghapusan akun dan ekspor data | segera / tertunda sekian hari (masa tenang) | permintaan pemilik data dipenuhi dalam batas waktu yang ditetapkan pemilik; pengecualian retensi hukum dicatat | batas waktu disetujui |
| D6 | Perlakuan data yang dicabut/kedaluwarsa | tandai saja / hapus setelah N hari | hapus isi, simpan jejak minimal (siapa, kapan, apa) | angka N disetujui |
| D7 | Inventaris tujuan pemrosesan dan dasar pemrosesan | daftar tujuan + consent terpisah per tujuan | consent terpisah, dapat ditarik, tanpa menahan layanan inti | daftar tujuan disetujui |
| D8 | Cadangan | masa simpan, penghapusan ikut jadwal retensi | cadangan mengikuti D2/D3 | aturan disetujui |

## 4. Harness engineering dan pekerjaan produksi yang masih tertunda

T-E4-02 / ENG-E4-03 menambahkan harness sintetis yang dijalankan oleh `cd server && npm run uji` (`uji/privacy/retentionHarness.uji.ts`). Kebijakan dibaca dari berkas, jam disuntik, hasil sweep ditulis atomik ke JSON sementara lalu dibaca ulang. Record pada atau melewati ambang tidak boleh terbaca; audit mempunyai ambang sendiri dan jejak penghapusan tidak menyalin payload. Kasus negatif memastikan kebijakan/jam/input invalid tidak menulis perubahan. Menonaktifkan penghapusan menggagalkan assertion `expired synthetic record still readable after sweep`.

Angka 1000/3000 ms di `server/uji/fixtures/privacy/retention-policy.test.json` hanya nilai uji, bukan usulan masa simpan. `governance/RETENTION_POLICY.json` mempertahankan kedua periode produksi sebagai `null`; memakainya menghasilkan `retention-policy-unset`, tanpa default. Mengubah angka pada berkas kebijakan mengubah perilaku harness tanpa perubahan kode. Modul murni `server/src/modules/privacy/domain/retention.ts` belum disambungkan ke store, endpoint, arsip, backup, atau scheduler produksi. Harness bukan bukti penghapusan data nyata maupun kepatuhan hukum.

EXT-E4-A tetap **DEFERRED_FINAL_STAGE**. Sesuai governance v2, engineering sintetis tidak menunggu keputusan manusia; penerapan kebijakan produksi tetap tertunda. Pekerjaan produksi yang belum ada:

- Rute hapus akun dan ekspor data dengan uji positif dan negatif (identitas, otorisasi, tanpa efek samping pada penolakan, tidak menyentuh data pasien lain).
- Pekerjaan retensi yang deterministik (jam disuntik) dengan uji batas tepat di ambang.
- Arsip audit berbasis waktu menggantikan batas 5000 entri.
- Gerbang CI yang membaca angka retensi dari satu berkas kebijakan dan gagal bila kode menyimpang.

## 5. Syarat sebelum E4 boleh berstatus VERIFIED

1. Pemilik menyetujui D1–D8 secara tertulis (tanggal dan nama tercatat di dokumen final).
2. Pernyataan hukum atas D2 tersedia.
3. Mekanisme pada bagian 4 ada, diuji, dan hijau di CI pada SHA yang sama.
4. Gerbang PHI log/repo tetap hijau.

Sampai semuanya terpenuhi E4 tetap **NOT_CHECKED**; mengisi bukti sebelum itu akan menjadi klaim tanpa dasar.
