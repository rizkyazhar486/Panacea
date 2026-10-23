# D8 — Dua permintaan atestasi untuk Product Owner

**Status: D8 tetap REPORTED.** Dokumen ini tidak mengubah ledger dan **bukan** pernyataan kepemilikan atau lisensi. Pernyataan kepemilikan hanya sah bila ditulis dan ditandatangani pemilik; AI tidak membuatnya (aturan di `docs/alpha/D8_PUBLIC_ASSET_PROVENANCE_GAPS.md`).

Tersisa dua aset tanpa jejak provenance (`governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json`). Di bawah ini fakta yang **dapat diamati mesin** untuk masing-masing, pertanyaan yang hanya bisa dijawab pemilik, dan kolom jawaban yang sengaja kosong. Hash di bawah dijaga `scripts/qa/d8-attestation-facts.test.mjs`: bila berkas berubah, tes gagal dan atestasi harus diulang untuk berkas yang baru.

Reproduksi fakta: `sha256sum public/logo-mark.png public/media/tutorial-video.mp4`.

---

## Permintaan 1 — `public/logo-mark.png`

| Fakta teramati | Nilai |
|---|---|
| Ukuran | 19.867 byte; PNG 442 × 441 |
| SHA-256 | `e2509054be68890ca0aa142bb7eb68f55e9c4eaadd9f059f6e11bdf942852601` |
| Metadata tertanam | Blok XMP hanya berisi `tiff:Orientation = 1`. **Tidak ada** nama pencipta, hak cipta, atau lisensi di dalam berkas |
| Riwayat git | Satu commit: `e3e098316`, akun `rizkyazhar486`, 2026-06-19, pesan "Add files via upload" (diunggah lewat web GitHub) |
| Dipakai | 6 berkas `src/` (10 kemunculan): logo merek, kartu bagikan, notifikasi; juga ikon situs |

Yang **tidak** dapat dibuktikan dari repositori: siapa yang membuat karya ini dan atas dasar hak apa ia dipakai.

**Pertanyaan untuk pemilik**
1. Siapa pencipta logo ini (orang atau entitas), dan kapan dibuat?
2. Apa dasar hak Anda untuk memakainya dan mendistribusikannya secara publik (karya sendiri, kontrak kerja, lisensi pihak ketiga)?
3. Apakah ada unsur pihak ketiga di dalamnya (ikon, huruf, ilustrasi yang berlisensi)?
4. Teks atribusi apa yang harus ditampilkan, jika ada?

| Jawaban pemilik | |
|---|---|
| Pencipta / asal | ______________________________ |
| Dasar hak / lisensi | ______________________________ |
| Unsur pihak ketiga (ya/tidak, sebutkan) | ______________________________ |
| Teks atribusi | ______________________________ |
| Nama, jabatan, tanggal, tanda tangan | ______________________________ |

---

## Permintaan 2 — `public/media/tutorial-video.mp4`

| Fakta teramati | Nilai |
|---|---|
| Ukuran | 11.347.057 byte; kontainer MP4 (`isom`), **dua trek: video dan audio** |
| SHA-256 | `b13d8fbb9781456e2eaef66100a3a8250e4eb1d2a07adc6ac6bdd4fa0380f450` |
| Tag tertanam | `Made with Remotion 4.0.487`; `Lavf61.7.100`; pengode video x264 |
| Kesamaan alat | `brand-intro.mp4` dan `history.mp4` (yang sudah tercatat di `public/media/ASSET_SOURCES.md`) membawa tag yang sama dengan Remotion `4.0.484`. Ini **konsisten dengan**, tetapi bukan bukti, metode produksi yang sama |
| Riwayat git | Ditambahkan commit `dfc302653`, akun `rizkyazhar486`, 2026-07-11 (PR #54, "Embed the tutorial video in first-run onboarding and Settings") |
| Status pemakaian | **Tidak lagi dirujuk kode aplikasi.** Pemakaiannya dibuang di commit `603639da0` (PR #102, "drop video explainers"). Berkasnya **tetap terbit** di `public/media/` sehingga tetap dapat diunduh dan tetap masuk cakupan D8 |
| Sumber komposisi | Tidak ditemukan di repositori (hanya hasil render yang di-commit), sehingga video tidak dapat dibangun ulang dari repositori |

Yang **tidak** dapat dibuktikan dari repositori: siapa pembuat naskah dan visual, asal trek audio (musik, suara, efek), dan lisensi komponen yang dipakai di komposisi.

**Pertanyaan untuk pemilik**
1. Siapa yang membuat video ini, dengan naskah dan visual dari mana?
2. Dari mana trek audionya (musik, narasi, efek suara)? Apa lisensinya?
3. Remotion memiliki syarat lisensinya sendiri; mohon periksa dan catat syarat mana yang berlaku untuk organisasi Anda. Apakah komposisi memakai huruf, gambar, atau aset pihak ketiga lain?
4. Keputusan Anda: **(a)** pertahankan dan atestasi, atau **(b)** tarik dari `public/` karena tidak lagi dipakai. Pilihan (b) hanya dikerjakan setelah Anda memutuskan; AI tidak menghapus aset.

| Jawaban pemilik | |
|---|---|
| Pembuat / asal naskah dan visual | ______________________________ |
| Asal dan lisensi audio | ______________________________ |
| Syarat lisensi Remotion yang berlaku | ______________________________ |
| Aset pihak ketiga lain (ya/tidak, sebutkan) | ______________________________ |
| Keputusan (a) pertahankan / (b) tarik | ______________________________ |
| Nama, jabatan, tanggal, tanda tangan | ______________________________ |

---

## Setelah pemilik menjawab (pekerjaan engineering, bukan keputusan)

1. Catat jawaban yang ditandatangani di `public/media/ASSET_SOURCES.md` (video) dan berkas kredit untuk logo, mengutip pernyataan pemilik apa adanya.
2. Bila ada atribusi, tampilkan di halaman resmi (`public/bodyexposure/provenance.html` atau halaman aplikasi) dan tambahkan ke gerbang atribusi.
3. Hapus entri yang tertutup dari `governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json` (baseline hanya boleh menyusut). `scripts/qa/d8-attestation-facts.test.mjs` sengaja gagal begitu daftar itu tidak lagi sama dengan dua aset di dokumen ini; perbarui atau hapus permintaan yang sudah terjawab dan tesnya dalam PR yang sama.
4. Perbarui bukti ledger; **D8 baru boleh VERIFIED** bila syarat di `D8_PUBLIC_ASSET_PROVENANCE_GAPS.md` terpenuhi seluruhnya, termasuk verifikasi lisensi CC0-1.0 atlas janin dan ICRP terhadap sumber primer, dan halaman atribusi yang menamai sumber.

## Di luar cakupan inventaris D8, tetapi terlihat

Beberapa berkas kode merujuk video yang di-host di luar repositori (mis. `src/lib/peregangan.ts` dan `src/lib/teknikLari.ts` yang memuat URL `https://d8j0ntlcm91z4.cloudfront.net/...mp4`). Inventaris D8 hanya mengukur `public/`, jadi video itu tidak tercakup. Syarat lisensinya (asal-usul dan hak pakai konten yang dihasilkan) perlu dicatat terpisah bila D8 akan diperluas.
