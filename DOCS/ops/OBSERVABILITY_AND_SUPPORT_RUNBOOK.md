# Observabilitas, Alerting, Status & Jalur Dukungan Pengguna

## 1. Log Terstruktur Tanpa PHI
- Middleware `server/src/domains/observability/observabilitas.ts` menghasilkan log JSON hanya untuk request `5xx` dan lambat (`>= 1500 ms`), mencantumkan `id` (`X-Request-Id`), metode, templat rute (tanpa URL mentah/query/body), status, dan durasi.
- Korelasi dukungan akun memakai HMAC `u:<hash>` (`penandaLog`), tanpa email/nama/MRN/data klinis (`server/uji/logPrivacyHttp.uji.ts` memverifikasi 70+ rute).

## 2. Endpoint Status & Ambang Alert Otomatis
- **Lightweight uptime probe:** `GET /healthz` (`200 ok`, 2 byte, `Cache-Control: no-store`).
- **Status publik terstruktur:** `GET /api/status` (tanpa PHI) mengembalikan `status` (`operational` | `degraded` | `maintenance`), `uptimeSec`, `storageMode`, `storageHealthy`, `http` (`total`, `s2xx`, `s4xx`, `s5xx`, `p50Ms`, `p95Ms`, `errorRate5xxPct`), `alerts[]`, status rollout, dan kontak dukungan.
- **Ambang alert (`evaluateServiceAlerts`):**
  1. `storage_unhealthy` (critical): `storageHealthy === false`
  2. `save_failures_consecutive` (critical): gagal simpan beruntun >= 3
  3. `high_5xx_rate` (critical): rasio 5xx >= 1.0% (minimum 20 request)
  4. `high_p95_latency` (warn -> degraded): p95 >= 1500 ms

## 3. Monitor Eksternal & Jalur Dukungan
- Monitor uptime eksternal (UptimeRobot / Better Stack / Cloudflare Health Check) perlu diarahkan ke `https://panaceamed-backend.onrender.com/api/status` (interval 60 detik) dengan aturan alert jika HTTP != 200 atau `status !== "operational"` (butuh kredensial dashboard monitor eksternal oleh pemilik).
- **Jalur dukungan pengguna:** email `support@panaceamed.id` (atau env `PANACEA_SUPPORT_EMAIL`), form in-app `POST /api/feedback`, dan `X-Request-Id` header untuk pelacakan insiden tanpa PHI.
