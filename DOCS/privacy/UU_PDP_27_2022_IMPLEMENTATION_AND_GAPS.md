# Implementasi Teknis & Celah Hukum UU PDP No. 27 Tahun 2022

Dokumen ini membedakan kontrol teknis yang **sudah diimplementasikan dan diuji** dari kewajiban hukum/organisasi yang **belum selesai dan memerlukan penasihat hukum**.

## 1. Kontrol Teknis Terverifikasi (Server + Neon)
- **Persetujuan Eksplisit (Pasal 20–22):** `GET/POST /api/privacy/consent` mencatat `purpose`, `policyVersion`, `granted`, serta timestamp (`withdrawn` dicatat di ledger audit), + tabel Neon `panacea_privacy_consents` dengan RLS ketat.
- **Hak Akses & Portabilitas / Ekspor (Pasal 32 & 41):** `GET /api/privacy/export` mengekspor data pribadi milik pemanggil (`schema: panacea-uu-pdp-export-v1`) terisolasi ketat per akun.
- **Hak Penghapusan (Pasal 43):** `DELETE /api/privacy/account` (membutuhkan konfirmasi eksplisit `HAPUS_AKUN_SAYA`) mencabut sesi JWT aktif, menghapus akun dan data gaya hidup/kesehatan mandiri pengguna (termasuk profil Connect), serta mencatat entri audit anonim tanpa email/nama.
- **Jejak Audit Tanpa PHI (Permenkes 24/2022 & Pasal 39):** Aksi persetujuan, ekspor, dan penghapusan tercatat di audit; log HTTP tidak memuat email, nama, atau payload kesehatan (`server/uji/privacyPdpHttp.uji.ts`).
- **Isolasi Tenant DB:** Neon Postgres memakai role `panacea_rls_app` (`NOBYPASSRLS`) + `FORCE ROW LEVEL SECURITY` di 17 tabel pengguna.

## 2. Item Wajib Penasihat Hukum / Organisasi (BELUM DIKLAIM PATUH)
1. **Penunjukan DPO / Pejabat Pelindung Data (Pasal 53):** Pemrosesan data kesehatan termasuk kategori spesifik berskala sistematis; wajib evaluasi penunjukan DPO oleh konsultan hukum.
2. **Naskah Hukum Kebijakan Privasi & Informed Consent (Pasal 20–21):** Teks persetujuan pemrosesan data pribadi spesifik (kesehatan & biometrik/wajah) harus direview pengacara Indonesia sebelum klaim kepatuhan publik.
3. **Konflik Retensi Hapus Akun vs Permenkes 24/2022 (Pasal 43 vs Rekam Medis):** `DELETE /api/privacy/account` menghapus data akun & unggahan mandiri pengguna, tetapi rekam klinis yang dibuat dokter tetap ditahan sementara menunggu kebijakan retensi formal penasihat hukum.
4. **Transfer Data Lintas Batas (Pasal 56):** Server backend (Render), edge (Cloudflare), DB (Neon/MongoDB Atlas), dan OAuth (Google) memproses data di luar wilayah RI; perlu penilaian kecukupan/DPA/klausul kontrak standar dan persetujuan eksplisit khusus dari pengguna.
5. **SOP Notifikasi Insiden 3x24 Jam (Pasal 46):** Perlu prosedur tertulis pemberitahuan tertulis ke subjek data & lembaga PDP dalam <= 3x24 jam jika terjadi kegagalan pelindungan data.
6. **Sinkronisasi Mongo -> Neon:** Saat ini auth & profil aplikasi live masih memakai MongoDB (`modePenyimpanan: 'mongo'`), sehingga ekspor/hapus Neon terisolasi terpisah sampai adapter Postgres disatukan.
