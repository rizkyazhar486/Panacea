# Fitur Realtime (Multi-User & Konsultasi Video) — Penjelasan Singkat

> 👨‍⚕️ **Untuk Dokter/Pemilik (bukan IT):** Anda **tidak perlu** mengerti isi
> berkas ini. Cukup ikuti **PANDUAN-SETUP.md → bagian "Aktifkan Fitur Realtime"**.
> Berkas ini hanya catatan teknis bila suatu saat ada developer membantu Anda.

## Apa yang sudah otomatis berfungsi

Begitu backend Anda hidup (sudah disiapkan lewat tombol deploy di Render) dan
alamatnya dipasang (`VITE_API_URL`), berikut **langsung aktif tanpa kode tambahan**:

- **#9 Feed multi-user** — postingan & "suka" dari semua pengguna saling terlihat
  (feed menyegarkan diri tiap 15 detik).
- **#10 Konsultasi teks realtime** — dokter & pasien di ruang yang sama chat langsung.
- **#10 Panggilan video/audio** — tombol 📹 di ruang konsultasi.

## Catatan teknis (untuk developer)

- Endpoint feed: `GET/POST /api/posts`, `POST /api/posts/:id/like` — sudah ada di `server/`.
- Sinkronisasi feed di frontend: `src/lib/store.tsx` (cari komentar `#9:`).
- Sinyal panggilan video memakai WebSocket `/ws` yang sama dengan chat. Server
  meneruskan pesan tipe `rtc-offer / rtc-answer / rtc-ice / rtc-end` ke peserta
  lain di room (`server/src/realtime.ts`).
- Video butuh **TURN server** agar tembus jaringan seluler. Set variabel
  `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED` (lihat PANDUAN-SETUP.md).
