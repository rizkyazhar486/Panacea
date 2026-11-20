# Peluncuran Bertahap (50 -> 200 -> 1000) & Kill Switch

## 1. Mekanisme Kill Switch Teknis (`server/src/modules/rollout/rolloutGuard.ts`)
- **Env default (`render.yaml`):** `PANACEA_ROLLOUT_STAGE=stage-50`, `PANACEA_MAX_ACCOUNTS=50`, `PANACEA_SIGNUP_KILL_SWITCH=false`, `PANACEA_READONLY_MODE=false`.
- **Kontrol runtime terverifikasi pemilik (`POST /api/owner/rollout`, khusus akun `owner` terautentikasi):**
  - `signupKillSwitch: true` -> menolak pendaftaran akun baru (`503 signup_paused`), pengguna lama & owner tetap dapat login.
  - `readOnlyMode: true` -> mengubah `/api/status` menjadi `maintenance`, memblokir seluruh operasi tulis `POST/PUT/PATCH/DELETE` (`503 service_read_only`), kecuali auth login/logout dan `/api/owner/rollout` agar pemulihan tetap bisa dilakukan.
  - `maxAccounts` (`50` / `200` / `1000`) -> memblokir akun baru di atas kapasitas dengan `503 beta_capacity_reached`.

## 2. Kriteria Lanjut (Go) / Tahan (Hold) / Berhenti (Kill Switch)
| Tahap | Kapasitas | Kriteria Lanjut (Go ke tahap berikutnya) | Kriteria Berhenti (Aktifkan Kill Switch) |
| --- | --- | --- | --- |
| **Tahap 1** | **50 pengguna** | Render `starter` aktif (tidak tidur), error 5xx < 1%, p95 < 1,5 dtk selama 48 jam, uji restore Neon lulus, nol laporan kebocoran lintas akun. | Error 5xx >= 2% selama 10 menit, kegagalan simpan Mongo/Neon >= 3x beruntun, atau indikasi kebocoran data/izin akses. |
| **Tahap 2** | **200 pengguna** | Error 5xx < 1% dan p95 < 1,5 dtk selama 72 jam, `GET /api/status` menunjukkan `operational`, proses dukungan & ekspor/hapus UU PDP berjalan tanpa tunggakan. | Latensi p95 > 2 dtk berkelanjutan, OOM/restart Render berulang, atau lonjakan `429`/kegagalan OAuth Google. |
| **Tahap 3** | **1000 pengguna** | Lolos uji beban bertahap `1000` (error < 1%, p95 < 1,5 dtk, nol data hilang), Neon PITR aktif, penasihat hukum meninjau klausul UU PDP data kesehatan spesifik. | Kenaikan biaya/kuota tak terkendali, galat persistensi, atau temuan keamanan/privasi kritikal -> setel `readOnlyMode=true` & `signupKillSwitch=true`. |
