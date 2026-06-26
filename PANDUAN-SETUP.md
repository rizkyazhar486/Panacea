# 📋 Panduan Setup Panaceamed.id (untuk Pemilik)

Panduan ini berisi hal-hal yang **perlu Anda lakukan sendiri** karena butuh akun/izin
di luar kode. Urut dari yang **paling mudah & gratis** ke yang butuh verifikasi bisnis.

> 💡 **Yang paling sering dipakai:** menambah "Environment Variable" di Render.
> Caranya sama untuk semua, lihat **Bagian 0** di bawah — dipakai berulang.

---

## Bagian 0 — Cara menambah "Environment Variable" di Render (WAJIB tahu)

Banyak langkah di bawah hanya minta Anda menempel sebuah "kunci" ke Render. Caranya:

1. Buka **https://dashboard.render.com** lalu login.
2. Klik **service backend** Panaceamed Anda (yang bertipe *Web Service*).
3. Di menu kiri, klik tab **Environment**.
4. Klik tombol **+ Add Environment Variable**.
5. Isi dua kotak:
   - **Key** = nama kunci (mis. `RESEND_API_KEY`) — tulis persis, huruf besar semua.
   - **Value** = isinya (kode yang Anda salin).
6. Klik **Save Changes**.
7. Render otomatis **redeploy** (1–3 menit). Selesai.

✅ Setiap kali panduan bilang "set `XXX` di Render", artinya ulangi langkah di atas.

---

## Bagian 1 — Aktifkan OTP Email (GRATIS) ✉️

Supaya pengguna bisa "Masuk dengan Email" (kode dikirim ke email mereka).

### Langkah A — Buat akun Resend (penyedia email gratis)
1. Buka **https://resend.com** → klik **Sign Up** (boleh pakai akun Google).
2. Verifikasi email Anda (cek inbox dari Resend).

### Langkah B — Verifikasi domain panaceamed.id (agar bisa kirim ke siapa pun)
1. Di dashboard Resend, menu kiri → **Domains** → **Add Domain**.
2. Ketik `panaceamed.id` → **Add**.
3. Resend menampilkan beberapa baris **DNS (TXT/MX/CNAME)**. Salin semuanya.
4. Buka pengaturan domain Anda (tempat beli domain / Vercel DNS) → tambahkan
   baris-baris DNS itu **persis**.
5. Kembali ke Resend → klik **Verify**. Tunggu sampai status hijau **Verified**
   (bisa beberapa menit–jam).

> Tanpa verifikasi domain, Resend hanya bisa kirim ke email Anda sendiri (mode tes).

### Langkah C — Ambil API Key & pasang di Render
1. Di Resend, menu kiri → **API Keys** → **Create API Key**.
2. Nama: `panaceamed` · Permission: **Sending access** → **Create**.
3. **Salin** kode yang muncul (diawali `re_...`). ⚠️ Hanya muncul sekali!
4. Di **Render** (lihat Bagian 0), tambahkan:
   - Key: `RESEND_API_KEY` · Value: kode `re_...` tadi.
5. (Opsional, jika domain sudah verified) tambahkan juga:
   - Key: `EMAIL_FROM` · Value: `Panaceamed.id <no-reply@panaceamed.id>`
6. Save. Setelah redeploy, opsi **"Masuk cepat dengan Email"** muncul otomatis di
   halaman login. 🎉

---

## Bagian 2 — Perbaiki Login Google di HP 🔑

Masalahnya **bukan di kode**, tapi di pengaturan Google. Aplikasi memakai Client ID:

```
271592823595-bsseftegtunc8hh4cn8dm0ljqga7t5oc.apps.googleusercontent.com
```

Anda hanya perlu mengizinkan alamat `panaceamed.id` pada client itu.

1. Buka **https://console.cloud.google.com** (login dengan akun Google pembuat project).
2. Pastikan **project yang benar** terpilih (dropdown di kiri atas).
3. Menu kiri → **APIs & Services** → **Credentials**.
4. Di bagian **OAuth 2.0 Client IDs**, cari & klik client yang **diawali**
   `271592823595-bsseftegtunc8...`
   ⚠️ **PENTING:** harus yang `bsseftegtunc8...`, **bukan** yang `...o1pfhh...`.
5. Pada bagian **Authorized JavaScript origins** → klik **+ Add URI**, tambahkan dua:
   - `https://panaceamed.id`
   - `https://www.panaceamed.id`
6. Klik **Save**.
7. Tunggu **5 menit–beberapa jam** (propagasi). Lalu coba login di HP — bersihkan
   cache/coba mode Incognito dulu.

> **Alternatif** (kalau Anda sudah terlanjur menyetel origin di client `...o1pfhh...`):
> cukup ganti Environment Variable `GOOGLE_CLIENT_ID` di Render menjadi Client ID
> `o1pfhh...` itu. Pastikan client tsb juga punya origin `panaceamed.id`.

---

## Bagian 3 — Pembayaran Midtrans Produksi (uang asli) 💳

Butuh akun Midtrans bisnis yang **terverifikasi** (KTP/NPWP/rekening).
**Tidak perlu ubah kode** — cukup ganti kunci di Render.

### Langkah A — Ambil kunci Production
1. Buka **https://dashboard.midtrans.com**.
2. Di kiri atas, pastikan **Environment = Production** (bukan Sandbox).
3. Menu **Settings → Access Keys**. Salin:
   - **Server Key** (diawali `Mid-server-...`)
   - **Client Key** (diawali `Mid-client-...`)
   > ⚠️ Kunci Sandbox biasanya diawali `SB-Mid-...`. Pastikan Anda menyalin yang
   > dari Environment **Production**.

### Langkah B — Pasang di Render
Di **Render** (Bagian 0), isi/ubah **3 kunci** ini:
- `MIDTRANS_SERVER_KEY` = (Server Key production)
- `MIDTRANS_CLIENT_KEY` = (Client Key production)
- `MIDTRANS_IS_PRODUCTION` = `true`

Save → tunggu redeploy.

### Langkah C — Set URL Notifikasi (Webhook)
1. Di Midtrans → **Settings → Configuration**.
2. **Payment Notification URL** =
   `https://panaceamed-backend.onrender.com/api/payments/webhook`
   (ganti `panaceamed-backend` bila nama service Render Anda berbeda).
3. **Finish / Unfinish / Error Redirect URL** = `https://panaceamed.id`
4. Simpan.

### Langkah D — Verifikasi
1. Buka `https://panaceamed-backend.onrender.com/api/health`.
2. Pastikan `"payments":true` dan `midtransClientKey` **bukan** `SB-...`.
3. Coba top-up nominal kecil (mis. 1 PNC) lalu bayar sungguhan.

> **Catatan penting:**
> - Setiap metode (QRIS Dinamis, VA, GoPay, dll) harus **disetujui Midtrans**
>   dulu. Bila statusnya "sedang diproses", metode itu belum aktif walau
>   production sudah menyala.
> - **QRIS Dinamis** muncul otomatis lewat Midtrans Snap (channel `qris`/`gopay`)
>   begitu disetujui — **tidak perlu QRIS statis**.
> - Tiap transaksi sukses kena biaya Midtrans (mis. QRIS ±0,7%). Top-up Manual
>   (transfer bank) tetap tersedia sebagai alternatif gratis.

---

## Bagian 4 — Pencairan Otomatis ke Bank (Iris Payout) 🏦

Agar penarikan saldo langsung cair ke rekening pengguna secara otomatis.
Butuh akun Midtrans produktif (lihat Bagian 3) + saldo Iris.

1. Login **https://dashboard.midtrans.com**.
2. Buka produk **Iris / Payouts** (aktifkan bila belum).
3. Menu **Settings** → **Access Keys** → salin **Iris API Key** (Creator key).
4. Di **Render** (Bagian 0), tambahkan:
   - `IRIS_API_KEY` = (Iris API Key)
   - `IRIS_IS_PRODUCTION` = `true` (jika sudah produksi)
   - (Opsional) `IRIS_APPROVER_KEY` jika akun Anda butuh persetujuan ganda.
5. Save. Setelah aktif, penarikan dicairkan otomatis. Jika belum diisi, penarikan
   tetap berjalan dalam mode **"manual"** (saldo terpotong, dicairkan oleh tim).

---

## Bagian 5 — Jadikan Aplikasi (GRATIS, tanpa toko) 📲

Tidak perlu bayar App Store/Play Store. Aplikasi sudah bisa "dipasang":

- **Di HP/Laptop:** buka panaceamed.id → menu **Pengaturan** → kartu
  **"Pasang sebagai Aplikasi"** → ikuti tombolnya.
- **Android/Chrome:** ada tombol **"Pasang Sekarang"**.
- **iPhone/Safari:** tombol **Bagikan** → **Tambahkan ke Layar Utama**.

Kalau nanti mau benar-benar masuk **Google Play Store**: biayanya **~Rp400rb sekali
seumur hidup** (daftar Google Play Console). Bungkus PWA ini pakai *Bubblewrap/TWA*.
Minta bantuan saya jika ingin dipandu.

---

## Bagian 6 — Briefing Bisnis Harian via Email (GRATIS) 📨

AI Operator bisa mengirim **briefing bisnis tiap pagi** ke email Anda otomatis.

1. Di **Render** (Bagian 0), tambah env: `CRON_SECRET` = (kata sandi acak bebas, mis. `pmd-rahasia-123`).
2. Di Render → **New +** → **Cron Job** (gratis):
   - **Schedule**: `0 1 * * *` (tiap 08:00 WIB ≈ 01:00 UTC)
   - **Command**: `curl -s "https://panaceamed-backend.onrender.com/api/cron/daily-briefing?key=pmd-rahasia-123"`
   (ganti `pmd-rahasia-123` dengan CRON_SECRET Anda)
3. Pastikan `RESEND_API_KEY` aktif (Bagian 1) agar email terkirim.

Setiap pagi Anda terima ringkasan: pertumbuhan, pendapatan, antrean persetujuan, & rekomendasi.

---

## Bagian 7 — Ganti AI ke OpenRouter (Gemini + GLM) 🤖

AI bisa dipindah dari Anthropic ke **OpenRouter** (1 kunci, banyak model). Chatbot
pasien pakai model cepat (Gemini Flash); AI-EMR/Vision pakai GLM. **Tanpa ubah kode.**

1. Daftar di **https://openrouter.ai** → menu **Keys** → **Create Key** → salin (diawali `sk-or-...`).
2. (Isi saldo sedikit di OpenRouter → Credits, mis. $5, untuk membayar pemakaian.)
3. Di **Render** (Bagian 0), tambah env:
   - `OPENROUTER_API_KEY` = `sk-or-...`
   - `AI_CHAT_MODEL` = `google/gemini-2.0-flash-001` (chatbot pasien — cepat & murah)
   - `AI_EMR_MODEL` = `z-ai/glm-4.6` (AI-EMR/analisa — GLM, open & murah)
4. Save → redeploy. Begitu `OPENROUTER_API_KEY` ada, **semua AI otomatis lewat OpenRouter**
   (Anthropic diabaikan). Hapus `ANTHROPIC_API_KEY` bila tak dipakai lagi.

> Nama model bisa Anda ganti sesuai katalog di **openrouter.ai/models** (cari "gemini"
> atau "glm"). Pakai ID **persis** seperti di OpenRouter. Untuk membaca **gambar**,
> pilih model yang mendukung *vision* (mis. Gemini Flash).

---

## Bagian 6 — Aktifkan Fitur Realtime (Feed multi-user & Konsultasi Video) 🎥

Fitur ini membuat **postingan/like saling terlihat antar pengguna** (#9) dan
**konsultasi dokter–pasien secara langsung, termasuk panggilan video** (#10).

> 💚 **Kabar baik:** kode-nya **sudah selesai semua**. Anda hanya perlu memastikan
> backend hidup dan alamatnya terpasang. Tidak ada yang perlu Anda program.

### Langkah A — Pastikan backend sudah hidup (sekali saja)
Jika Anda **sudah** pernah deploy backend di Render (lihat Bagian 0, service
bertipe *Web Service*), lewati langkah ini. Jika **belum**:
1. Buka **https://dashboard.render.com** → **New** → **Blueprint**.
2. Pilih repository **Panacea** Anda → **Apply**. Render membaca berkas
   `render.yaml` dan membuat backend otomatis (1–3 menit).
3. Setelah jadi, **salin alamat** service-nya (mis. `https://panaceamed-backend.onrender.com`).

### Langkah B — Sambungkan aplikasi ke backend (sekali saja)
1. Buka repo **Panacea** di GitHub → **Settings** → **Secrets and variables**
   → **Actions** → tab **Variables** → **New repository variable**.
2. **Name** = `VITE_API_URL`
   **Value** = alamat backend dari Langkah A (tanpa garis miring di akhir).
3. **Add variable**. Selesai — saat aplikasi otomatis ter-update, **#9 dan
   konsultasi teks #10 langsung aktif.**

✅ Sampai sini: feed antar-pengguna jalan, dan tombol Chat di halaman Konsultasi muncul.

### Langkah C (opsional) — Agar Panggilan VIDEO lancar di paket data/HP 📹
Panggilan video butuh "server perantara" bernama **TURN**. Tanpa ini, video
sering hanya berhasil di Wi-Fi yang sama. Cara termudah (terkelola, bayar pakai):
1. Daftar penyedia TURN, mis. **https://www.metered.ca/tools/openrelay** (ada paket gratis)
   atau **Twilio**. Anda akan mendapat 3 informasi: **alamat (URL)**, **username**, **password**.
2. Di GitHub (cara sama seperti Langkah B), tambah **3 variable**:
   - `VITE_TURN_URL` = alamat TURN (mis. `turn:standard.relay.metered.ca:80`)
   - `VITE_TURN_USER` = username dari penyedia
   - `VITE_TURN_CRED` = password dari penyedia
3. Simpan. Setelah aplikasi ter-update, **panggilan video tembus jaringan seluler.**

> Tanpa Langkah C, video **tetap berfungsi** untuk uji coba di jaringan yang sama —
> hanya kurang andal di jaringan seluler.

### Cara menguji
1. Buka aplikasi di **dua HP/akun berbeda**. Buat postingan di akun A →
   muncul di akun B dalam ±15 detik. ✅ (#9)
2. Dua akun buka **ruang konsultasi yang sama** → terlihat "2 online", chat dua arah,
   dan tombol 📹 untuk mulai video. ✅ (#10)

---

## ✅ Ringkasan prioritas

| Prioritas | Apa | Biaya | Hasil |
|-----------|-----|-------|-------|
| 1 | Resend (Bagian 1) | Gratis | Login OTP Email aktif |
| 2 | Google OAuth (Bagian 2) | Gratis | Login Google di HP jalan |
| 3 | Pasang PWA (Bagian 5) | Gratis | Jadi "aplikasi" |
| 4 | Midtrans (Bagian 3) | Perlu NPWP | Pembayaran asli |
| 5 | Iris (Bagian 4) | Perlu Midtrans | Pencairan otomatis |
| 6 | Realtime (Bagian 6) | Gratis* | Feed multi-user + konsultasi video |

\* TURN untuk video (Langkah C) ada paket gratis; untuk skala besar berbayar sesuai pakai.
