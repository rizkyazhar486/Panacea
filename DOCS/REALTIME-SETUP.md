# Panduan Mengaktifkan Fitur Realtime Multi-User (#9 & #10)

Dokumen ini menjelaskan **apa yang sudah dikerjakan di frontend** dan **apa yang
perlu Anda kerjakan di sisi server** agar fitur multi-user nyata (#9) dan
telemedicine realtime + video call (#10) aktif sepenuhnya.

Selama `VITE_API_URL` belum diisi, aplikasi berjalan dalam **mode lokal**
(data hanya tersimpan di browser, tidak ada user lain). Semua kode realtime
otomatis non-aktif dan aplikasi tetap berfungsi normal.

---

## Ringkasan: yang sudah ada di frontend

| Fitur | Status frontend | Sumber |
|---|---|---|
| Auth (Google/OTP), wallet, pembayaran | ✅ siap | `src/lib/api.ts` |
| Sinkronisasi data klinis (EMR/vital) | ✅ siap | `store.tsx` hydrate |
| **#9 Feed sosial multi-user (post + like)** | ✅ baru ditambahkan | `store.tsx`, `api.posts/createPost/likePost` |
| **#10 Konsultasi teks realtime** | ✅ sudah ada | `ConsultChat.tsx` (WebSocket) |
| **#10 Panggilan video/audio (WebRTC)** | ✅ baru ditambahkan | `ConsultChat.tsx` |

> Catatan: fitur komunitas yang lebih baru (Health Buddy, mood, tantangan,
> Circle of Care, gratitude wall, komunitas olahraga) masih **lokal**. Untuk
> menjadikannya multi-user, lihat bagian "Endpoint tambahan (opsional)".

---

## LANGKAH 1 — Sediakan & deploy backend

Aplikasi mengharapkan sebuah server HTTP + WebSocket. Endpoint yang **wajib**
sudah dipakai frontend (lihat `src/lib/api.ts`). Minimal untuk #9 & #10:

### Endpoint HTTP (REST, JSON)

```
GET    /api/health                 -> { ok, features, tokenToIdr, ... }
POST   /api/auth/google            -> { user, token }     (login Google)
GET    /api/auth/me                -> { user }
POST   /api/auth/logout            -> { ok }

# #9 — feed sosial multi-user
GET    /api/posts                  -> { posts: BackendPost[] }
POST   /api/posts                  -> { post: BackendPost }    (body: Partial<BackendPost>)
POST   /api/posts/:id/like         -> { post: BackendPost }
```

Bentuk `BackendPost` (lihat `src/lib/api.ts`):

```ts
{ id, authorEmail, authorName, role, kind: 'image'|'video',
  activity, caption, mediaColor, durationSec?, likes, at }
```

Autentikasi memakai header `Authorization: Bearer <token>` (token didapat saat
login) **atau** cookie sesi — keduanya sudah dikirim oleh frontend.

### Endpoint WebSocket (untuk #10)

Satu endpoint: `wss://<host>/ws` (frontend menurunkannya otomatis dari
`VITE_API_URL`, lihat `wsUrl()`).

Server WebSocket cukup berperan sebagai **relay per-room** yang sederhana:

1. Saat menerima `{ type: 'join', room, from }` → masukkan socket ke room,
   lalu broadcast `{ type: 'presence', count }` ke semua peserta room.
2. Untuk **semua** pesan lain yang membawa `room` → teruskan apa adanya ke
   peserta lain di room yang sama (jangan pantulkan ke pengirim).

Ini penting: relay **harus meneruskan tipe pesan apa pun**, bukan hanya `msg`.
Frontend mengirim tipe berikut yang harus diteruskan tanpa diubah:

```
msg          (chat teks)
rtc-offer    (WebRTC SDP offer)   { type, room, from, sdp }
rtc-answer   (WebRTC SDP answer)  { type, room, from, sdp }
rtc-ice      (ICE candidate)      { type, room, from, candidate }
rtc-end      (akhiri panggilan)   { type, room, from }
```

Contoh relay minimal (Node + `ws`):

```js
import { WebSocketServer } from 'ws'
const rooms = new Map() // room -> Set<socket>
const wss = new WebSocketServer({ path: '/ws', server })

wss.on('connection', (sock) => {
  let room = null
  sock.on('message', (raw) => {
    let m; try { m = JSON.parse(raw) } catch { return }
    if (m.type === 'join') {
      room = m.room
      if (!rooms.has(room)) rooms.set(room, new Set())
      rooms.get(room).add(sock)
      const count = rooms.get(room).size
      for (const s of rooms.get(room)) s.send(JSON.stringify({ type: 'presence', count }))
      return
    }
    if (!m.room) return
    for (const s of rooms.get(m.room) ?? []) {
      if (s !== sock && s.readyState === 1) s.send(raw.toString()) // teruskan, jangan ke pengirim
    }
  })
  sock.on('close', () => {
    if (room && rooms.has(room)) {
      rooms.get(room).delete(sock)
      const count = rooms.get(room).size
      for (const s of rooms.get(room)) s.send(JSON.stringify({ type: 'presence', count }))
    }
  })
})
```

---

## LANGKAH 2 — Konfigurasi environment frontend

Buat berkas `.env` (atau set di dashboard hosting seperti Vercel/Netlify):

```bash
# WAJIB — mengaktifkan seluruh mode backend (#9 & #10 teks)
VITE_API_URL=https://api.domain-anda.com

# OPSIONAL — TURN server, WAJIB agar video (#10) tembus NAT/jaringan seluler.
# Tanpa TURN, panggilan video hanya berhasil di jaringan yang ramah (mis. Wi-Fi sama).
VITE_TURN_URL=turn:turn.domain-anda.com:3478
VITE_TURN_USER=username-turn
VITE_TURN_CRED=password-turn
```

Lalu build ulang: `npm run build` dan deploy folder `dist/`.

> Begitu `VITE_API_URL` terisi, `backendEnabled` menjadi `true` dan secara
> otomatis: feed menarik post dari server tiap 15 detik, post/like Anda
> terkirim ke server, dan tombol "Chat"/video muncul di halaman Konsultasi.

---

## LANGKAH 3 — Sediakan TURN server (untuk video #10)

WebRTC butuh server STUN (sudah memakai STUN publik Google) dan, untuk
sebagian besar jaringan nyata (4G/5G, kantor), **TURN server**. Pilihan:

- **coturn** (open-source, self-host) — paling murah jangka panjang.
- **Twilio Network Traversal Service** / **Metered TURN** / **Cloudflare Calls**
  — TURN terkelola, bayar sesuai pemakaian.

Isi kredensialnya ke `VITE_TURN_*` di Langkah 2.

---

## LANGKAH 4 — Verifikasi

1. **#9 feed:** buka aplikasi di dua browser/akun berbeda. Buat post di akun A
   → dalam ≤15 detik muncul di feed akun B. Like dari B → jumlah like ikut naik.
2. **#10 teks:** dua akun membuka ruang konsultasi yang sama → indikator
   "2 online", pesan terkirim dua arah.
3. **#10 video:** salah satu menekan tombol 📹 → izinkan kamera/mikrofon →
   video kedua pihak tampil. Uji di jaringan berbeda untuk memastikan TURN bekerja.

---

## Endpoint tambahan (opsional) — menjadikan fitur komunitas multi-user

Fitur berikut saat ini lokal. Untuk multi-user, tambahkan endpoint CRUD lalu
hubungkan di `store.tsx` mengikuti pola `api.posts()` (hydrate + polling):

```
GET/POST  /api/communities          (komunitas olahraga)
GET/POST  /api/challenges           (tantangan kelompok + progress)
GET/POST  /api/gratitudes           (dinding terima kasih)
GET/POST  /api/support-messages     (pesan dukungan)
GET/POST  /api/moods                (mood check-in publik)
GET/POST  /api/presence             (status online — atau pakai WebSocket)
```

Pola implementasi di frontend sudah dicontohkan oleh sinkronisasi feed (#9) di
`src/lib/store.tsx` (cari komentar berawalan `#9:`).

---

## Catatan keamanan & kepatuhan

- Konsultasi medis = data sensitif. Pastikan TLS (HTTPS/WSS) di semua endpoint,
  enkripsi data at-rest, dan kepatuhan terhadap regulasi (mis. UU PDP / SATUSEHAT).
- Verifikasi STR dokter tetap melalui alur owner-approval yang sudah ada —
  jangan beri akses konsultasi ke akun dokter yang belum terverifikasi.
- Rekaman video sebaiknya **tidak** disimpan tanpa persetujuan eksplisit pasien.
