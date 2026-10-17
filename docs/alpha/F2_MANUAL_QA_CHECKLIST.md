# F2 — Daftar QA manual terarah (aksesibilitas, keyboard, UX)

**Status: F2 tetap REPORTED.** Dokumen ini tidak mengubah ledger dan **bukan** hasil uji manual. Semua kolom hasil sengaja kosong: hanya penguji yang benar-benar menjalankan langkahnya yang boleh mengisinya (nama, perangkat, tanggal). AI tidak mengisi atau menyetujui kolom itu.

Syarat F2 menuntut "hasil audit aksesibilitas otomatis **ditambah pemeriksaan manual terarah**". Audit otomatis sudah ada dan digerbang di CI; pemeriksaan di bawah ini adalah bagian yang **tidak dapat** dicakup alat.

## 1. Bukti otomatis yang sudah ada (jangan diulang manual)

Angka diambil dari log CI job `ux-audit` pada main (17 Okt 2026). **Cek CI terbaru sebelum memakai angka ini**; baseline di `governance/` adalah sumber yang berlaku.

| Pemeriksaan | Skrip | Hasil CI | Gerbang |
|---|---|---|---|
| Overflow, target sentuh mobile, nama aksesibel, animasi saat reduced-motion | `scripts/qa/ux-audit.mjs` | 36 pengukuran: overflow 0, target kecil mobile 0, tanpa nama 0, animasi berjalan 0 | `UX_AUDIT_BASELINE.json` |
| Kontras WCAG AA (teks) | `scripts/qa/kontras-wcag.mjs` | 3.250 teks terukur; 2 gagal (artefak pengukur, lihat catatan), 0 gagal di kelas oklch/color | `KONTRAS_BASELINE.json` |
| axe-core | `scripts/qa/axe-audit.mjs` | 36 pengukuran: serius/kritis 0, `incomplete` 0 | `AXE_BASELINE.json` |
| Keyboard otomatis | `scripts/qa/keyboard-audit.mjs` | 18 pengukuran: tanpa indikator 0, tak terlihat 0, jebakan 0, tanpa stop fokus 0 | `KEYBOARD_BASELINE.json` |
| Paritas tema | `scripts/qa/theme-parity.mjs` | 18 halaman × viewport: teks beda 0, bergeser 0 | `THEME_PARITY_BASELINE.json` |
| Regresi screenshot | `scripts/qa/screenshot-regresi.mjs` | 36 kombinasi viewport × tema × rute | `SCREENSHOT_GRID_BASELINE.json` |
| Anggaran muatan awal | `scripts/qa/bundle-budget.mjs` | 15 stylesheet pemblokir, CSS 111.813 B + JS 248.975 B gzip | `BUNDLE_BUDGET_BASELINE.json` |
| Performa runtime (build produksi) | `scripts/qa/perf-audit.mjs` | LCP/CLS/TBT median, cache dingin (laporan, belum digerbang) | — |

**Yang TIDAK tercakup alat (alasan daftar ini ada):**
- `keyboard-audit` menyatakan sendiri: tidak mencakup **Escape pada dialog, urutan fokus yang bermakna, dan pemulihan fokus setelah aksi**.
- **1.504 elemen** berlatar gradien/gambar tidak dapat diukur kontrasnya (dihitung terpisah, bukan dianggap lulus).
- 2 temuan kontras yang tersisa adalah **artefak pengukur**: link tab zona aktif memakai bentuk bersama (`.pmd-one-shape`, elemen saudara berposisi absolut di belakang teks), jadi latar dibaca `rgb(67,69,72)` padahal teks hitam berada di atas bentuk putih atau hijau. Penguji **perlu memastikan secara visual** bahwa tab aktif terbaca di kedua tema.
- Pembaca layar, zoom 200%/reflow 320 px, dan penilaian visual lintas perangkat tidak otomatis.
- Web Vitals pada perangkat nyata (RUM) tidak ada; angka performa adalah bukti lab.

## 2. Cara mengisi

Rute berikut sama dengan rute yang diaudit otomatis (`PAGES` di `keyboard-audit.mjs`): `#/`, `#/harian`, `#/chatbot`, `#/settings`, `#/profile`, `#/clinical-hub`, `#/fitness-hub`, `#/health-data`, `#/all-features`.

Isi satu lembar per penguji dan perangkat. Tulis **LULUS**, **GAGAL (catatan)**, atau **TIDAK DAPAT DINILAI (alasan)**. Kosong = belum diuji. Temuan kritis harus diselesaikan atau F2 tetap belum VERIFIED.

| Penguji | Perangkat / OS / peramban | Teknologi bantu | Tanggal |
|---|---|---|---|
| ____________ | ____________________ | ____________ | ________ |

## 3. Keyboard dan fokus (bukan cakupan alat)

Gunakan hanya keyboard: Tab, Shift+Tab, Enter, Spasi, Escape, panah. Uji di tema terang **dan** gelap.

| # | Pemeriksaan | Cara menilai | Hasil |
|---|---|---|---|
| K1 | Urutan fokus mengikuti urutan baca visual di tiap rute | Tab dari atas ke bawah; fokus tidak melompat mundur atau ke area tersembunyi | ______ |
| K2 | Indikator fokus selalu terlihat dan kontras pada tiap kontrol | Lihat cincin fokus di tema terang dan gelap | ______ |
| K3 | Dialog, lembar, dan menu (pencarian, notifikasi, menu profil, dan yang lain yang terbuka dari rute di atas): fokus masuk ke dalamnya | Buka dengan Enter; tekan Tab | ______ |
| K4 | **Escape menutup** dialog/lembar/menu yang dibuka | Tekan Escape | ______ |
| K5 | **Fokus kembali** ke pemicu setelah dialog ditutup | Tutup lalu perhatikan elemen terfokus | ______ |
| K6 | Fokus tidak terjebak di dalam dialog tanpa jalan keluar, dan tidak keluar ke latar saat modal terbuka | Tab berulang dalam modal | ______ |
| K7 | Tab aktif pada navigasi zona terbaca di kedua tema (artefak pengukur, lihat bagian 1) | Lihat visual | ______ |
| K8 | Semua fungsi yang dapat dilakukan dengan mouse dapat dilakukan dengan keyboard (mis. carousel/slider, kartu yang dapat diklik) | Coba tiap interaksi | ______ |
| K9 | Pemulihan fokus setelah aksi yang mengubah isi (kirim formulir, simpan, hapus) | Lakukan aksi; periksa letak fokus | ______ |

## 4. Pembaca layar

Minimal satu kombinasi: VoiceOver + Safari (iOS/macOS) atau NVDA + Firefox/Chrome atau TalkBack + Chrome.

| # | Pemeriksaan | Hasil |
|---|---|---|
| S1 | Judul halaman dan landmark (`main`, navigasi) diumumkan benar di tiap rute | ______ |
| S2 | Setiap tombol dan tautan punya nama yang bermakna (bukan "tombol" atau URL) | ______ |
| S3 | Status dinamis (memuat, galat, berhasil) diumumkan tanpa memindahkan fokus | ______ |
| S4 | Grafik dan visual penting punya alternatif teks atau ringkasan | ______ |
| S5 | Formulir: label, petunjuk, dan pesan galat terhubung ke kolomnya | ______ |

## 5. Visual lintas perangkat dan elemen yang tak terukur

| # | Pemeriksaan | Hasil |
|---|---|---|
| V1 | Kontras teks di atas gambar/gradien (kartu hero, kartu berlatar gambar) terbaca di tema terang dan gelap; catat elemen yang meragukan | ______ |
| V2 | Zoom 200% dan lebar 320 px (reflow): tanpa pemotongan atau scroll horizontal pada 9 rute | ______ |
| V3 | Reduced motion aktif di sistem: tidak ada gerakan yang mengganggu | ______ |
| V4 | Target sentuh ≥ 44 px pada perangkat nyata (bukan emulasi) di rute utama | ______ |
| V5 | Landscape ponsel dan tablet: tata letak tetap utuh | ______ |
| V6 | State kosong, memuat, galat, dan pemulihan terbaca dan dapat dipakai | ______ |

## 6. Hasil dan keputusan

| Ringkasan temuan kritis (nomor pemeriksaan) | Ditangani? | Referensi PR |
|---|---|---|
| ______________________________ | ______ | ______ |

Keputusan akhir F2 (hanya manusia): ______________________  Nama/jabatan/tanggal/tanda tangan: ______________________

> Catatan: bukti di sini tidak menyatakan validasi pengguna dan tidak menggantikan penilaian pemilik atas kualitas UX.
