# www.panaceamed.id menampilkan "Error 1033 — Cloudflare Tunnel error"

Dokumen operasional untuk pemilik. Tanpa rahasia: jangan pernah menaruh token tunnel, isi `~/.cloudflared/*.json`, atau kunci API di repo ini (repo publik).

## Gejala dan artinya

Semua perangkat (laptop, HP, jaringan seluler maupun Wi-Fi) melihat halaman Cloudflare "Error 1033" dengan HTTP 530.
Artinya nama host `www.panaceamed.id` diarahkan ke sebuah **Cloudflare Tunnel**, tetapi tidak ada proses `cloudflared` yang tersambung untuk tunnel itu.
Penyebabnya ada di sisi server, jadi membersihkan cache, mengganti jaringan, VPN, atau DNS di HP tidak membantu.

Bukti dari repo bahwa situs dilayani dari sebuah komputer lewat tunnel: `scripts/start-cockpit.mjs` dan `Dockerfile` memakai port 4040, `PRODUCTION_READINESS_AUDIT.md` menunjuk `http://127.0.0.1:4040`, dan `vite.config.ts` memakai `allowedHosts: true`.
Selama komputer itu tidur, mati, atau `cloudflared` berhenti, situs mati.

## Periksa dari perangkat mana saja

```
node scripts/ops/diagnose-public-site.mjs https://www.panaceamed.id/
```

Skrip membaca satu halaman dan tiga rekaman DNS, menyebut kode galat Cloudflare dan langkahnya, dan keluar dengan kode 0 bila aplikasi menjawab (1 bila tidak).
Skrip ini diuji pada fixture; ia tidak bisa melihat isi akun Cloudflare Anda.

## A. Hidupkan kembali (sekitar 5 menit)

Di komputer yang menjalankan tunnel:

1. Pastikan aplikasi menjawab secara lokal: `curl -sI http://127.0.0.1:4040/`. Bila tidak, jalankan server seperti biasa (mis. `node scripts/start-cockpit.mjs`).
2. Lihat tunnel: `cloudflared tunnel list`. Kolom CONNECTIONS kosong berarti tidak ada konektor.
3. Jalankan tunnel **bernama**: `cloudflared tunnel run <nama-tunnel>`. Bila tunnel dikelola dari dashboard, pakai token dari Zero Trust > Networks > Tunnels > tunnel Anda: `cloudflared tunnel run --token <TOKEN>`.
   Tunnel cepat (`cloudflared tunnel --url ...`) memberi alamat `*.trycloudflare.com` acak dan tidak pernah melayani `www.panaceamed.id`.
4. Di dashboard Zero Trust > Networks > Tunnels, status harus **HEALTHY** dan Public Hostname `www.panaceamed.id` harus menunjuk ke `http://localhost:4040`.
5. Ulangi skrip diagnosa di atas.

Agar tidak mati lagi sampai Anda pindah hosting: `sudo cloudflared service install <TOKEN>` (macOS/Linux) dan nonaktifkan tidur komputer.

## B. Solusi permanen: jangan layani produksi dari laptop

Repo sudah membangun bundel produksi di setiap push ke `main` (workflow **Deploy to GitHub Pages**: tes + build), tetapi **penerbitannya dimatikan**: langkah unggah hanya berjalan bila variabel repo `ENABLE_GITHUB_PAGES` bernilai `true`.
Aplikasi memakai `base: './'` dan HashRouter, jadi berjalan di hosting statis mana pun tanpa aturan penulisan ulang.

1. GitHub > repo > Settings > Pages > Build and deployment > Source: **GitHub Actions**.
2. Settings > Secrets and variables > Actions > **Variables**: tambah `ENABLE_GITHUB_PAGES` = `true`.
   Opsional: `VITE_API_URL` = alamat API di Render. Tanpa itu aplikasi berjalan tanpa sinkronisasi server (mode lokal).
   Di server Render, `CORS_ORIGINS` harus memuat `https://www.panaceamed.id`.
3. Actions > Deploy to GitHub Pages > Run workflow. Setelah job `deploy` hijau, situs hidup di `https://rizkyazhar486.github.io/Panacea/`.
4. Settings > Pages > Custom domain: isi `www.panaceamed.id`.
5. Cloudflare > DNS: hapus rekaman `www` yang menunjuk ke `*.cfargotunnel.com` (dan Public Hostname `www` di tunnel, bila ada, supaya tidak bentrok). Tambah `CNAME www` ke `rizkyazhar486.github.io` dengan awan **abu-abu (DNS only)**.
6. Tunggu pemeriksaan DNS di halaman Pages berhasil, lalu centang **Enforce HTTPS**. Setelah itu awan oranye boleh dinyalakan dengan SSL/TLS mode Full.
7. Domain tanpa `www` (`panaceamed.id`): buat Redirect Rule Cloudflare ke `https://www.panaceamed.id/`.

Alternatif di Cloudflare Pages: `.github/workflows/cloudflare-pages.yml` sudah ada dan menerbitkan `dist` ke proyek Pages bernama `panaceamed` bila secret `CLOUDFLARE_API_TOKEN` (izin Cloudflare Pages: Edit) dan `CLOUDFLARE_ACCOUNT_ID` terisi.
Per 2026-11-16 langkah publish itu gagal sebelum berjalan karena `cloudflare/pages-action` sudah tidak ada; perbaikannya ada di PR #3072 (belum digabung dan belum dicoba pada akun Anda).
Urutannya: buat proyek Pages `panaceamed` di dashboard (Workers & Pages > Create > Pages), isi kedua secret, tunggu workflow berhasil, lalu tambahkan custom domain `www.panaceamed.id` di proyek itu setelah rekaman tunnel `www` dihapus.
Jalur GitHub Pages di atas tidak butuh secret apa pun dan sudah punya alur kerja yang bekerja, jadi itu yang saya sarankan lebih dulu.

## Hal yang perlu dihindari

- Server `vite dev` atau `vite preview` bukan server produksi; `allowedHosts: true` mematikan pemeriksaan host.
- Titik akhir simulasi di `scripts/start-cockpit.mjs` (`/api/v1x/...`) bukan API produksi dan tidak boleh dipakai sebagai sumber data pengguna.
- Jangan membuka akses ke data pasien lewat tunnel pribadi tanpa autentikasi dan audit.
