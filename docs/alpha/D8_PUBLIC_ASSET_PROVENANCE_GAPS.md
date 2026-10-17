# D8 — Celah provenance aset terpublikasi

**Status: D8 tetap REPORTED** (dokumen ini tidak mengubah ledger). Syarat D8: "Setiap aset publik punya sumber, lisensi, dan atribusi terbaca dari halaman resmi".

`scripts/qa/public-asset-inventory.mjs` + gerbang `scripts/uji/public-asset-provenance.mts` mengukur **seluruh aset biner di `public/`**. Mengukur ADA-nya jejak, bukan KEABSAHAN lisensi.

## Aturan penutupan (jejak), sesudah perbaikan alat
1. GLB: setiap node membawa lisensi dan sumber, atau hak cipta tertanam dengan lisensi dikenali.
2. Berkas kredit (CREDITS/PROVENANCE/LICENSE/NOTICE, ≥ 40 byte) di **direktori yang sama**.
3. Berkas kredit di **direktori induk** (bukan akar `public/`) yang **menyebut nama berkas aset itu** secara utuh.
4. `ASSET_SOURCES*` yang menyebut nama berkas aset itu. Berkas ini hanya menutup aset yang disebut; tetangganya tetap celah (tidak ada tebakan "semua di sini sama asalnya").

## Perubahan pada pengukuran (2026-10-17)
Alat lama hanya mencari berkas kredit di direktori yang sama, sehingga 36 WebP organ dilaporkan tanpa jejak padahal `public/organs/CREDITS.txt` sudah menyebut `<organ>/organ.webp`, `location.webp`, `microscopic.webp`, `compare.webp`. Itu celah palsu dari alat, bukan dari aset; aturan 3 memperbaikinya. `thumb.webp` (9 berkas) sebelumnya tidak tercantum di CREDITS; kini dicatat (ditambahkan di commit impor yang sama, `42a3ed3ad`; turunannya dari `organ.webp` dicatat, bukan diverifikasi).

Catatan baru, semuanya ditulis dari manifest/riwayat git, tanpa mengarang:
- `public/bodyexposure/dataset-inspection/fetal-parcels/PROVENANCE.md` dan `.../mri/PROVENANCE.md` (28 aset): sumber atlas MRI janin, revisi terpin, lisensi CC0-1.0 **sebagaimana tercatat di manifest proyek** (belum diverifikasi ulang terhadap repositori dataset dari lingkungan ini), sidik SHA256, kelas kebenaran populasi-rujukan.
- `public/images/ASSET_SOURCES.md` (5 SVG): penulis dan commit awal dari git; pemeriksaan mekanis menemukan tidak ada `<image>`, `href` eksternal, atau `foreignObject`.
- `public/media/ASSET_SOURCES.md` (`brand-intro.mp4`, `history.mp4`): video berbasis kode (Remotion) dirender lokal; **kode komposisi tidak ikut di-commit**, jadi tidak dapat dibangun ulang dari repositori.

## Celah yang tersisa: 2 aset (baseline `governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json`)
| Aset | Yang diketahui | Yang dibutuhkan |
|---|---|---|
| `public/logo-mark.png` | diunggah akun pemilik lewat web GitHub, commit `e3e098316` (2026-06-19) | pernyataan pemilik bahwa ini karya asli (penulis tidak dapat dibuktikan dari git) |
| `public/media/tutorial-video.mp4` | ditambahkan akun pemilik, PR #54 (commit `dfc302653`, 2026-07-11) | asal pembuatan video dan hak atas isinya |

Tidak dihapus dan tidak dipindahkan: kedua aset tetap dipakai aplikasi. Mengisi catatan tanpa dasar akan menjadi klaim palsu, jadi keduanya tetap tercatat sebagai celah.

## Syarat sebelum D8 boleh VERIFIED
1. Daftar celah di atas kosong dengan pernyataan yang benar dari pemilik.
2. Lisensi yang tercatat dari manifest/riwayat (CC0-1.0 atlas janin, tipografi video) diverifikasi terhadap sumber primernya.
3. Halaman atribusi resmi aplikasi menamai sumber untuk kelompok aset di atas (saat ini hanya sebagian yang tampil).
