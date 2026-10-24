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
- `public/bodyexposure/dataset-inspection/fetal-parcels/PROVENANCE.md` dan `.../mri/PROVENANCE.md` (28 aset): sumber atlas MRI janin, revisi terpin, lisensi CC0-1.0 **sebagaimana tercatat di manifest proyek** (terverifikasi terhadap README dan LICENSE dataset pada revisi terpin, 2026-10-23; bukti di bawah), sidik SHA256, kelas kebenaran populasi-rujukan.
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
2. Lisensi yang tercatat dari manifest/riwayat diverifikasi terhadap sumber primernya. CC0-1.0 atlas janin terverifikasi 2026-10-23 (di bawah); izin ICRP dan versi tipografi video tetap terpisah.
3. Halaman atribusi resmi aplikasi menamai sumber untuk kelompok aset di atas (saat ini hanya sebagian yang tampil).

## Pembaruan verifikasi sumber primer (2026-10-17)

Pemilik menyatakan telah ACC inventaris lisensi dan pekerjaan legal internal PanaceaMed. Catat ACC tersebut tanpa memintanya mengulang pemeriksaan administratif. ACC inventaris **tidak membuktikan pencipta/pemegang hak pihak ketiga memberikan hak distribusi**.

- **Plus Jakarta Sans:** situs resmi pengembang https://github.com/tokotype/PlusJakartaSans dan teks lisensi resmi https://github.com/tokotype/PlusJakartaSans/blob/master/OFL.txt menyatakan SIL OFL 1.1. Detail pencatatan pada `public/media/ASSET_SOURCES.md` telah diperbaiki. Pembuktian versi binary terpakai tidak dimungkinkan karena source komposisi Remotion tidak tersimpan.
- **ICRP Publication 145 & 156:** https://www.icrp.org/publication.asp?id=ICRP+Publication+145 dan https://www.icrp.org/publication.asp?id=ICRP+Publication+156 mengonfirmasi publikasi; kebijakan hak cipta resmi di https://www.icrp.org/page.asp?id=5 menjelaskan bahwa ICRP mempertahankan hak cipta dan bahan gratis pun perlu izin untuk reuse. Catatan ACC internal pemilik atas inventaris **bukan** izin yang dikeluarkan ICRP; diperlukan bukti tertulis yang mencakup derivasi dan redistribusi mesh untuk menandai izin tersebut terverifikasi. Kontak resmi untuk izin terkait publikasi tercantum pada halaman kebijakan [ICRP](https://www.icrp.org/page.asp?id=5); gunakan alamat yang dipublikasikan di sana (jangan menyimpan email kontak dalam repositori). Jangan otomatis menyatakan mesh dapat dikomersialkan.
- **KCL fetal body MRI atlas:** halaman penulis/penerbit https://www.nature.com/articles/s41598-024-57087-x mengonfirmasi tempat repositori data https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas; pada 2026-10-23 sumber primer dataset berhasil dibaca pada revisi terpin `74f11a186c709078d712bb2fd827bfa2b36e3407`. [README](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas/src/74f11a186c709078d712bb2fd827bfa2b36e3407/README.md) menyatakan CC0 1.0 Universal untuk atlas MRI janin dan [LICENSE](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas/src/74f11a186c709078d712bb2fd827bfa2b36e3407/LICENSE) memuat CC0 1.0 Universal. Ini dataset tubuh janin yang dipakai Panacea, bukan atlas otak dHCP atau lisensi artikel. Celah verifikasi lisensi dataset ini tertutup; tidak mengubah status identitas label, batas klinis, izin ICRP, atau asal logo/video.
- **Lisensi turunan Z-Anatomy CC BY-SA 4.0:** persyaratan atribusi dan share-alike resmi: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en. Lisensi tidak perlu pembayaran, tetapi kewajiban atribusi, link, penandaan perubahan, dan lisensi turunan tetap berlaku.

**Dua pernyataan asal aset yang tetap tidak terkonfirmasi:** `public/logo-mark.png` dan `public/media/tutorial-video.mp4`. Rekaman unggah oleh akun pemilik membuktikan riwayat kontribusi, bukan siapa yang membuat karya atau hak atas footage, musik, template, dan font. Untuk menutupnya, diperlukan hanya sumber/provenance yang benar: misalnya metadata proyek asli, file sumber, atau pernyataan faktual pemilik tentang pencipta/izin. **Tidak perlu persetujuan umum lisensi baru**, tetapi jangan mengarang asal/izin yang tidak disebutkan. D8 tetap REPORTED sampai bukti lengkap dan halaman atribusi publik diuji.

