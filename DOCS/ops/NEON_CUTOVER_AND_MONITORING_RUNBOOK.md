# Cutover Neon Postgres & Monitor Alert Produksi

## 1. Cutover Penyimpanan Backend ke Neon Postgres (`server/src/postgresStore.ts`)
- **Aktivasi di Render Dashboard:** Pastikan secret `DATABASE_URL` diisi connection string Neon `-pooler` (`?sslmode=require`), lalu setel env `PANACEA_STORAGE_BACKEND=postgres` (dan opsional `PANACEA_PG_SCHEMA=public`, `PG_POOL_MAX=10`).
- **Perilaku Boot & Ketahanan:** Saat `initStore()` berjalan dengan backend `postgres`, seluruh slice akun, dompet, profil kesehatan, consent UU PDP, konfigurasi rollout/kill-switch (`rolloutConfig`), dan rekaman klinis dimuat & disimpan ke `panacea_kv_state` + `panacea_app_accounts` dengan diff SHA-256 dalam satu transaksi atomik (`statement_timeout=15000ms`), tanpa bergantung pada cakram lokal Render.
- **Verifikasi Pasca-Cutover:** `GET /api/health` harus melaporkan `"penyimpanan": "postgres"` dan `"penyimpananSehat": true`.

## 2. Monitor Uptime, Latensi & Alert Otomatis (15 Menit)
- Workflow `.github/workflows/production-status-monitor.yml` menjalankan `scripts/ops/check-production-status.mjs` tiap 15 menit:
  - Cek `critical`: `/healthz != 200`, `/api/health != 200`, `x-render-routing: suspend*`, `penyimpananSehat === false`, gagal simpan beruntun `>= 3`, latensi `>= 5000 ms`, atau `frontend` unreachable (`!= 403`). Exit code `1` memicu notifikasi kegagalan GitHub Actions.
  - Tambahan webhook eksternal opsional (Slack/Discord/Telegram relay): tambahkan GitHub Actions Secret `ALERT_WEBHOOK_URL` agar payload JSON bebas-PHI terkirim otomatis saat status `degraded` atau `critical`.
