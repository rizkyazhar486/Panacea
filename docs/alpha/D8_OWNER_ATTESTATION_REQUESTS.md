# D8 — dua permintaan pernyataan untuk Product Owner

**Status: PERMINTAAN, bukan pernyataan.** Dokumen ini disiapkan oleh AI dari fakta yang dapat diamati mesin. AI **tidak** menyatakan kepemilikan, penulis, atau lisensi apa pun; semua kolom pernyataan sengaja kosong dan hanya Product Owner (atau pihak yang berhak) yang dapat mengisinya. D8 tetap **REPORTED** sampai pernyataan bertanda tangan ada dan diverifikasi terhadap sumber primernya. Referensi: `docs/alpha/D8_PUBLIC_ASSET_PROVENANCE_GAPS.md`, `governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json` (tanpaJejak = 2).

## D8-1 — `public/logo-mark.png`

| Fakta yang dapat diamati | Nilai |
|---|---|
| SHA-256 | `e2509054be68890ca0aa142bb7eb68f55e9c4eaadd9f059f6e11bdf942852601` |
| Ukuran / format | 19.867 byte; PNG 442 × 441, RGBA |
| Riwayat git | ditambahkan commit `e3e098316` (2026-06-18) oleh akun `rizkyazhar486`, pesan "Add files via upload" (unggahan web) |
| Pemakaian di aplikasi | komponen `src/components/ui/Logo.tsx` ("official logo artwork") dan ikon/lencana notifikasi `SmartNotificationOrchestrator.tsx`; 19 baris rujukan `logo-mark` di `src` / konfigurasi |
| Metadata tertanam | tidak ada informasi penulis atau hak cipta yang dapat dibaca mesin |

Pertanyaan yang harus dijawab pemilik (jawaban ditulis oleh manusia):
1. Siapa pembuat karya ini, dan apakah pemilik (atau badan hukum pemilik produk) berhak penuh memakainya secara komersial? ______________________
2. Dibuat dengan alat apa (editor grafis, generator AI, templat, font, ikon pihak ketiga)? Jika ada alat/aset pihak ketiga, lampirkan ketentuan lisensinya. ______________________
3. Apakah ada pihak lain (desainer, agensi) yang memiliki sebagian hak? Lampirkan perjanjian bila ada. ______________________
4. Apakah logo sudah/akan didaftarkan sebagai merek? (informasi, bukan syarat D8) ______________________

Pernyataan bertanda tangan (diisi manusia): "_____________________________________________"  Nama: ____________  Jabatan: ____________  Tanggal: ____________  Tanda tangan: ____________

## D8-2 — `public/media/tutorial-video.mp4`

| Fakta yang dapat diamati | Nilai |
|---|---|
| SHA-256 | `b13d8fbb9781456e2eaef66100a3a8250e4eb1d2a07adc6ac6bdd4fa0380f450` |
| Ukuran | 11.347.057 byte (± 10,8 MiB) |
| Riwayat git | ditambahkan sebagai `public/tutorial-video.mp4` oleh akun `rizkyazhar486` pada PR #54, commit `dfc302653` (2026-07-11, "Embed the tutorial video in first-run onboarding and Settings"); dipindah ke `public/media/` oleh refactor `6c9534941` (2026-10-14) |
| Metadata tertanam (dibaca dari berkas) | "Made with Remotion 4.0.487"; pembungkus `isom/mp41`; penulis aliran `Lavf61.7.100`; memiliki trek video DAN audio |
| Pemakaian di aplikasi | **tidak ada rujukan ke berkas ini di `src/` atau `index.html`** pada main saat ini (pencarian `tutorial-video` di luar `docs/` dan `governance/` kosong). Perubahan #54 menanamnya di onboarding dan Pengaturan, tetapi rujukan itu tidak lagi ada: berkas tampaknya yatim. |

Pertanyaan yang harus dijawab pemilik (jawaban ditulis oleh manusia):
1. Siapa pembuat video, naskah, dan narasi/suara? Jika suara sintetis, layanan apa dan apa ketentuan komersialnya? ______________________
2. Musik, efek suara, gambar, tangkapan layar, ikon, dan font apa yang ada di dalamnya, dari sumber dan lisensi apa? Lampirkan bukti lisensi/izin. ______________________
3. Video dibuat dengan Remotion (terbaca dari metadata). Apakah penggunaan Remotion untuk keperluan ini sesuai ketentuan lisensinya? **Penasihat hukum perlu menilai**; AI tidak menyimpulkan. ______________________
4. Kode komposisi sumber video (Remotion) tidak ada di repositori, sehingga video tidak dapat dibangun ulang dari kode. Di mana kode itu disimpan, atau apakah hanya berkas jadi yang ada? ______________________
5. **Keputusan produk:** karena tidak ada kode yang merujuknya, apakah berkas ini (a) dipertahankan dan dirujuk kembali (butuh pernyataan di atas), atau (b) dihapus dari `public/`? AI tidak akan menghapus aset tanpa keputusan ini. Pilihan: ______________________

Pernyataan bertanda tangan (diisi manusia): "_____________________________________________"  Nama: ____________  Jabatan: ____________  Tanggal: ____________  Tanda tangan: ____________

## Yang dilakukan engineer SETELAH pernyataan bertanda tangan ada (bukan sebelumnya)

1. Simpan pernyataan (atau tautan ke berkas yang ditandatangani) di repositori dan rujuk dari `public/images/ASSET_SOURCES.md` / `public/media/ASSET_SOURCES.md` dengan nama berkas aset utuh (aturan penutupan 4 pada dokumen celah).
2. Hapus entri aset dari `governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json` (ratchet hanya boleh menyusut) dan jalankan `scripts/uji/public-asset-provenance.mts`.
3. Pastikan halaman atribusi resmi menamai sumber/hak untuk aset tersebut.
4. D8 baru boleh dipertimbangkan VERIFIED bila syarat lain pada dokumen celah juga terpenuhi (lisensi tercatat diverifikasi terhadap sumber primer; halaman atribusi lengkap). Keputusan menaikkan status tetap pada pemilik ledger.
