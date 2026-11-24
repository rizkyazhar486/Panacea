# Hosting, Env & Canonical Deploy Runbook

## 1. Jalur Deploy Kanonik (Satu Jalur Utama)
- **Frontend Production:** Cloudflare Workers Static Assets (`wrangler.toml`, worker `panacea`, `directory = "./dist"`, `not_found_handling = "single-page-application"`) melayani `https://panaceamed.id` dan `https://www.panaceamed.id`.
- **Backend Production:** Render Web Service (`render.yaml`, `panaceamed-backend` di `https://panaceamed-backend.onrender.com`, health check `/healthz`, auto-restart + `autoDeploy: true`).
- **Status jalur lain:**
  - `.github/workflows/deploy.yml` (GitHub Pages): opsional, nonaktif kecuali `vars.ENABLE_GITHUB_PAGES == 'true'`.
  - `.github/workflows/cloudflare-pages.yml`: belum aktif tanpa secret `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID`.
  - `.github/workflows/vercel-prebuilt-production.yml`: sekunder, diblokir oleh `vercel-release-gate.mjs` selama `stabilization-acceptance` di `main` merah.

## 2. Konfigurasi Variabel & Google OAuth
| Variabel / Konsol | Nilai Kanonik | Lokasi |
| --- | --- | --- |
| `VITE_API_URL` | `https://panaceamed-backend.onrender.com` | GitHub Actions Variables + Cloudflare Workers Build Env |
| `GOOGLE_CLIENT_ID` | `271592823595-bsseftegtunc8hh4cn8dm0ljqga7t5oc.apps.googleusercontent.com` | `render.yaml` / Render Env |
| `CORS_ORIGINS` | `https://panaceamed.id,https://www.panaceamed.id,https://panaceamed.vercel.app,https://rizkyazhar486.github.io,http://localhost:5173` | `render.yaml` / Render Env |
| Authorized JavaScript origins | `https://panaceamed.id` dan `https://www.panaceamed.id` | Google Cloud Console → OAuth 2.0 Client |

## 3. Verifikasi & Blokir Dashboard Pemilik (Tidak Dapat Dikerjakan Agen)
1. **Upgrade Render (`starter`):** `render.yaml` telah diubah ke `plan: starter`, namun aktivasi billing di dashboard Render wajib dilakukan oleh pemilik akun. Selama masih `free`, instans dapat tidur setelah 15 menit idle (dengan workaround sementara workflow `Bangunkan server`).
2. **Cloudflare `Workers Builds: panacea`:** Di `main` (`13f6b68e5`) build Cloudflare sukses (Version `ddac3d78`), sedangkan PR preview selalu gagal. Agen tidak memiliki token/akses dashboard Cloudflare untuk melihat log PR build maupun mengatur aturan WAF/Bot Fight Mode yang saat ini mengembalikan `HTTP 403` ke runner GitHub `Production browser check`.
3. **Google Cloud Console:** Verifikasi manual Authorized JavaScript origins (`https://panaceamed.id`, `https://www.panaceamed.id`) dan layar OAuth consent (Publishing status: In production agar tidak dibatasi 100 test users) harus diperiksa pemilik di Google Console.
4. **Build SHA (`build.json`):** Diperbaiki lewat `scripts/vite/buildMarker.mjs` agar membaca `WORKERS_CI_COMMIT_SHA` dan `CF_PAGES_COMMIT_SHA` sehingga `https://panaceamed.id/build.json` tidak lagi mengembalikan `{"commit":null}` setelah deploy berikutnya.
