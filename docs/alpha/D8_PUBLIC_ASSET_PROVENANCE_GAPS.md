# D8 — Celah provenance aset terpublikasi (menunggu pernyataan pemilik)

**Status: D8 tetap REPORTED.** Syarat D8: "Setiap aset publik punya sumber, lisensi, dan atribusi terbaca dari halaman resmi". Bukti sebelumnya hanya mencakup GLB di `public/bodyexposure/`. Inventaris baru (`scripts/qa/public-asset-inventory.mjs`, gerbang `scripts/uji/public-asset-provenance.mts`) mengukur **seluruh aset biner di `public/`**:

| Kelas | Jumlah |
|---|---|
| per-node (setiap node membawa lisensi dan sumber) | 2 |
| hak cipta tertanam di GLB (sumber + lisensi dikenali) | 36 |
| berkas kredit di direktori (CREDITS/PROVENANCE/LICENSE/NOTICE, >= 40 byte) | 520 |
| **tanpa jejak provenance** | **82** |
| total | 640 |

Gerbang mengukur ADA-nya jejak, bukan KEABSAHAN lisensi, dan berkas kredit direktori tidak membuktikan tiap aset di dalamnya. Aset baru tanpa jejak menggagalkan gerbang; daftar 82 aset di bawah hanya boleh menyusut (`governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json`).

## Aset tanpa jejak, per kelompok

| Kelompok | Jumlah | Tipe |
|---|---|---|
| `public/bodyexposure/dataset-inspection` | 28 | 27 png, 1 glb |
| `public/images` | 5 | 5 svg |
| `public/logo-mark.png` | 1 | 1 png |
| `public/media` | 3 | 3 mp4 |
| `public/organs` | 45 | 45 webp |

## Yang dibutuhkan dari pemilik (tidak boleh diisi dengan tebakan)
1. **`public/bodyexposure/dataset-inspection/fetal-parcels`** (dari nama jalurnya tampak turunan dataset MRI janin; isinya belum saya periksa): sumber dataset, lisensi dan izin redistribusinya. Bila memang data medis turunan, tanpa catatan sumber publikasinya berisiko.
2. **`public/organs`** (gambar WebP organ): dibuat sendiri atau berasal dari sumber luar; bila luar, sumber dan lisensinya.
3. **`public/images`, `public/media`, `public/logo-mark.png`** (SVG, MP4, logo): pernyataan "karya asli pemilik" atau sumber dan lisensinya.

Setelah pernyataan ada, tulis ke berkas CREDITS/PROVENANCE di direktori terkait (>= 40 byte) lalu buang entri dari baseline. D8 baru dapat VERIFIED bila daftar itu kosong dan halaman atribusi resmi menamai sumbernya.
