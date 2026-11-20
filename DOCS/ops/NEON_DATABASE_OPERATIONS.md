# Operasional Neon Postgres (Migrasi, RLS, Pooling & Pemulihan)

## 1. Skema & Migrasi Berversi
- Folder `sql/` memakai urutan versi deterministik:
  - `sql/001_panaceamed_neon_os.sql`: tabel kanonik profil, Digital Twin, fascia, wearable, encounter, outbox, audit.
  - `sql/002_panaceamed_migrations_and_rls_hardening.sql`: tabel ledger `panacea_schema_migrations`, tabel UU PDP (`panacea_privacy_consents`, `panacea_data_requests`), role aplikasi `panacea_rls_app` (`NOBYPASSRLS`), dan `ENABLE + FORCE ROW LEVEL SECURITY`.
- Runner migrasi: `node scripts/db/migrate-neon.mjs` (checksum SHA-256, fail-closed jika riwayat diubah).

## 2. Isolasi RLS & Pooling
- **Role aplikasi:** `panacea_rls_app` (`NOLOGIN NOSUPERUSER NOBYPASSRLS`) dipanggil di dalam transaksi lewat `SET LOCAL ROLE panacea_rls_app` dan `SELECT set_config('app.current_profile_key', $1, true)`.
- **Pooling & Batas Koneksi:** `DATABASE_URL` menggunakan endpoint PgBouncer Neon (`-pooler...aws.neon.tech`), `max = 10` koneksi per proses server, `idleTimeoutMillis = 15000`, `connectionTimeoutMillis = 10000`, `statement_timeout = 15000ms` (Neon `max_connections` server-side: 901).

## 3. Target RPO / RTO & Uji Pemulihan Terisolasi
- **RPO Target:** <= 1 menit via Neon WAL / Point-in-Time Restore (PITR; jendela retensi mengikuti tier Neon: Free 24 jam, Launch/Scale 7–30 hari) + dump logis terjadwal.
- **RTO Target:** <= 5 menit (branch restore Neon) atau < 10 detik (restore skema terisolasi via `scripts/db/verify-neon-rls-and-restore.mjs`).
- **Uji Pemulihan Mandiri:** `node scripts/db/verify-neon-rls-and-restore.mjs` mencadangkan seluruh tabel `public.panacea_*` ke direktori sementara, memulihkan ke skema terisolasi `panacea_restore_verify_*`, memverifikasi kesamaan jumlah baris & hash SHA-256 100%, lalu membersihkan skema uji.

## 4. Transparansi Penyimpanan Produksi Saat Ini
- Server Render live saat ini melaporkan `"penyimpanan": "mongo"` pada `/api/health`. Postgres Neon aktif dan siap menampung tabel longitudinal & UU PDP, tetapi cutover penuh state auth/session Express dari MongoDB ke Neon masih memerlukan implementasi adapter store Postgres di backend sebelum trafik penuh dipindahkan.
