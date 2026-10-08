# Panaceamed — Standar UI, CSS, & Desain Antarmuka Frontend (v1)

> **Otoritas Dokumen:** Dokumen ini merupakan panduan dan standar resmi pengembangan antarmuka (UI), penataan gaya (CSS), dan interaksi frontend di repositori Panaceamed.id. Disusun berdasarkan hasil audit, evaluasi nyata, dan restrukturisasi pada halaman Landing dan Login.
>
> Setiap kontributor frontend (termasuk agen AI) wajib mematuhi aturan ini sebelum membuat atau mengubah komponen UI.

---

## 1. Filosofi Desain: Perangkat Lunak Medis vs Gimmick Teatrikal

Panaceamed adalah platform komputasi kesehatan presisi, rekam medis longitudinal (AI-EMR), dan *longevity medicine* berstandar klinis. Antarmuka harus mencerminkan karakter:
- **Tenang, Elegan, dan Dapat Dipercaya (*Calm & Authoritative*)**: Bukan situs game, bukan demo fiksi ilmiah, dan bukan showcase AI yang hiperaktif.
- **Kejelasan Hirarki (*Clarity Over Decoration*)**: Informasi klinis dan tindakan pengguna harus dapat dipahami dalam waktu < 2 detik tanpa kebingungan visual.
- **Aksessibilitas Tanpa Kompromi (*WCAG AAA Standard*)**: Rasio kontras tinggi, keterbacaan teks, dan state kendali yang jelas di setiap kondisi cahaya (Light & Dark Mode).

---

## 2. Aturan CSS & Penanganan Lapisan Bertumpuk (*Layer Safety*)

Repositori ini memiliki lapisan CSS warisan (`panacea-control-grading-v46.css`, `panacea-liquid-actions-v45.css`, dll.) yang memuat aturan global dengan `!important`. Untuk mencegah tabrakan dan bug sistemik:

### 2.1. Jangan Gunakan Utility Eksklusif yang Merusak Selector Induk
- **Hindari Utility Berpenanda Seru Seperti `!text-black`**:
  Tailwind menghasilkan selector `.\!text-black`. Aturan CSS pengecualian tema seperti:
  ```css
  .dark .bg-white:is(.text-black, .text-ink) { background-color: #fff !important; }
  ```
  tidak akan mencocokkan `.\!text-black`. Akibatnya, elemen berlatar putih berubah menjadi hitam arang `#17191c`, menghasilkan **teks hitam di atas tombol hitam (*black-on-black bug*)**.
- **Solusi**: Gunakan kelas semantik khusus terlingkup (*scoped class*) alih-alih menumpuk utility Tailwind dengan `!`.

### 2.2. Tombol Aksi di Atas Kanvas Gelap (*Dark Canvas CTA*)
- Elemen CTA yang sengaja diletakkan di atas kanvas gelap (seperti kartu 3D Body Atlas, Hero Scrim, atau Video Player) **DILARANG keras hanya menggunakan kelas `bg-white` bawaan**.
- Kelas `bg-white` akan otomatis ditimpa oleh pemetaan tema `.dark .bg-white { background-color: #17191c !important; }`.
- **Wajib Gunakan Kelas Semantik Khusus**:
  Gunakan kelas seperti `.cta-atlas-btn` di [index.css](file:///Users/vikaariyanti/Documents/panacea/v1/src/index.css) yang secara eksplisit menetapkan latar putih solid dan teks gelap tebal:
  ```css
  .cta-atlas-btn {
    background-color: #ffffff !important;
    color: #05140b !important;
  }
  .cta-atlas-btn :is(span, svg) {
    color: #05140b !important;
  }
  ```

### 2.3. Bahaya Menggabungkan `bg-white` dan `text-ink` pada Kontainer / Layout
- **Penyebab Masalah Halaman Login Terbalik (*White Panel Bug in Dark Mode*)**:
  Di `src/index.css` terdapat aturan penyelamat tombol:
  ```css
  .dark .bg-white:is(.text-black, .text-ink, ...) {
    background-color: #fff !important;
    color: #0c1410 !important;
  }
  ```
  Jika kontainer atau panel pembungkus halaman memakai kombinasi utility `bg-white dark:bg-... text-ink`, selektor di atas akan cocok pada kontainer tersebut dan **memaksa latarnya menjadi putih salju `#fff !important` di Mode Gelap**.
- **Dampak Fatal**: Latar halaman menjadi putih benderang, sementara semua komponen anak di dalamnya (input email, tombol, toggle) mengira mode gelap aktif sehingga merender kotak-kotak hitam pekat di atas kanvas putih.
- **Aturan Tegas**: **Dilarang memakai `bg-white` bersama `text-ink` pada elemen pembungkus (kontainer/panel)**. Gunakan kelas semantik scoped khusus seperti `.login-page-root` dan `.login-form-panel`.

### 2.4. Patuhi Batas `!important` (`scripts/uji/lapisan-tambal-dilarang.mts`)
- Jumlah `!important` di seluruh berkas CSS dibatasi secara ketat (maksimal 2157).
- Dilarang membuat berkas CSS berversi baru (`*-vNN.css`). Gunakan token desain yang ada di `src/index.css` atau penataan gaya berbasis komponen.

---

## 3. Standar Kontras & Harmoni Tema (Light & Dark Mode)

### 3.1. Kesatuan Visual (*No Jarring Contrast Split*)
- **Larangan Split Ekstrem**: Dilarang membagi layar split 50:50 dengan kontras yang jomplang (misal panel kiri hijau neon menyilaukan dan panel kanan hitam pekat).
- Di Mode Gelap, latar belakang panel merek wajib beradaptasi menjadi *deep luxury emerald forest* (`#041c11` ke `#010a06`) yang tenang dan serasi dengan panel formulir hitam obsidian.

### 3.2. Penanda Permukaan Gelap Mandiri (*Dark Surface Self-Identification*)
- Sesuai pengujian `scripts/uji/permukaan-gelap-menandai-diri.mts`: Setiap elemen kontainer yang memaksakan latar belakang gelap (`bg-[#0...]` atau `bg-black`) dan teks putih **WAJIB menyertakan kelas `dark`** pada elemen tersebut.
- Hal ini menjamin bahwa seluruh komponen anak (*children*) di dalamnya merender varian gelapnya secara konsisten dan tidak memunculkan lempengan putih yang menyilaukan.

### 3.3. Pasangan Latar & Teks Wajib Dipaksa Bersamaan
- Sesuai pengujian `scripts/uji/kontras-kendali-terang.mts`: Aturan CSS apa pun yang memaksakan `background-color` dengan `!important` **WAJIB memaksakan properti `color` (tinta teks)** dengan kekuatan yang sama.
- Memaksa latar tanpa menetapkan warna teks pasangannya akan menyebabkan teks mewarisi warna dari konteks luar sehingga terjadi teks putih di atas latar putih atau teks hitam di atas latar hitam.

---

## 4. Standar Komponen Formulir & Kendali Masuk (*Form Controls*)

### 4.1. Segmented Control / Role Switcher
- **Dilarang Menampilkan Tab Aktif dan Non-Aktif dengan Gaya yang Sama**:
  Tidak boleh kedua tab sama-sama berlatar kartu putih atau sama-sama abu-abu gelap.
- **Standar Tampilan**:
  - **Tab Aktif**: Wajib menggunakan warna penanda utama Panacea yang solid (`#00BF63`), teks kontras tinggi, dan bayangan lembut (*elevated pill*).
  - **Tab Tidak Aktif**: Wajib berupa *ghost / transparent*, tanpa latar kartu putih, dengan warna teks abu-abu netral teredam.
  - Saat berpindah, pengguna harus dapat mengetahui status aktif seketika tanpa perlu menebak.
- **Struktur Markup Rekomendasi**:
  ```tsx
  <div className="login-role-switch" role="tablist">
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-active={isActive ? 'true' : 'false'}
      className="login-role-tab"
    >
      <span>👤 Pasien & Publik</span>
    </button>
    ...
  </div>
  ```

### 4.2. Tombol Aksi Utama (Submit / CTA): Status Enable & Disable
- **Dilarang Tombol Putih Polos Menyerupai Latar Belakang**:
  Tombol aksi utama tidak boleh putih polos dengan teks tipis yang menyatu dengan kanvas formulir.
- **Wajib Validasi Field Sebelum Diaktifkan**:
  Tombol aksi utama (seperti *Masuk ke Akun Sekarang*) **WAJIB berada dalam status `disabled={true}`** selama data wajib belum terpenuhi:
  1. Alamat email valid (memiliki `@` dan domain).
  2. Nama lengkap terisi minimal 2 karakter.
  3. Kotak persetujuan Syarat Layanan & Kebijakan Privasi dicentang.
  4. Nomor STR terisi minimal 4 karakter (khusus peran medis/klinisi).
- **Gaya Visual Status Tombol**:
  - **Saat Disabled**: Berlatar abu-abu netral teredam (`bg-slate-200 dark:bg-slate-800`, `opacity: 0.65`, `cursor: not-allowed`). Teks tombol secara cerdas memandu pengguna (*"Centang Persetujuan untuk Lanjut"*, *"Lengkapi Alamat Email"*).
  - **Saat Enabled**: Berlatar hijau zamrud Panacea solid (`#00BF63` hover `#00A857`), teks kontras tebal, kursor aktif pointer, dan bayangan aksen lembut.

---

## 5. Standar Interaksi & Animasi (*Zero-Gimmick Interaction*)

### 5.1. Dilarang Animasi Kapsul Mengambang Teatrikal (*No Floating Morph Gimmicks*)
- **Masalah Teridentifikasi**: Skrip `public/panacea-liquid-actions-v45.js` memicu `#pmd-liquid-morph-layer` dan `.pmd-liquid-morph-orb` setiap kali tombol diklik, memunculkan kapsul hitam raksasa melayang berukuran 420px yang menutupi konten di sampingnya selama hampir 1 detik.
- **Aturan**:
  - Dilarang memunculkan kapsul mengambang raksasa atau bola neon yang melintasi layar saat klik tombol biasa.
  - Jika diperlukan label/tooltip, gunakan tooltip kecil kontekstual di bawah tombol atau atribut `title` bawaan peramban.

### 5.2. Micro-Interactions yang Benar
- Respon klik tombol harus instan, tenang, dan tidak mengubah tata letak:
  - Transisi warna latar: `120ms – 150ms ease`.
  - Efek tekan (*press feedback*): `active:scale-[0.98]` tanpa pergeseran posisi yang ekstrim.
  - Hindari tombol pembungkus akordeon form yang memicu efek hover 3D mengambang. Gunakan tag semantik native `<details>` dan `<summary>` untuk informasi tambahan opsional.

---

## 6. Standar Tata Letak & Wadah Formulir (*Layout & Scroll Safety*)

### 6.1. Pencegahan Elemen Terpotong Vertikal (*No Off-Screen Clipping*)
- **Masalah Teridentifikasi**: Menggunakan `min-h-screen flex items-center justify-center` pada halaman formulir panjang menyebabkan bagian atas (judul, role switcher, dan tombol Google) terpotong ke atas di luar layar pada peramban beresolusi laptop atau saat keyboard/form memanjang.
- **Aturan Tata Letak Aman**:
  1. Kontainer luar: `h-screen overflow-hidden grid lg:grid-cols-2`.
  2. Panel formulir: `h-full overflow-y-auto px-6 py-10 sm:px-10 sm:py-12 flex flex-col items-center justify-start`.
  3. Pembungkus formulir: `w-full max-w-[440px] my-auto space-y-5`.
- **Fungsi `my-auto`**:
  - Saat konten pendek: Form berada tepat di tengah layar secara vertikal (*vertically centered*).
  - Saat konten panjang: Form dapat digulir (*scroll*) dari ujung atas hingga paling bawah tanpa ada elemen yang hilang atau terpotong.

---

## 7. Kepatuhan Medis, Bahasa, & Batasan Klaim

1. **Konsistensi Bahasa**:
   - Teks antarmuka publik dan orientasi pengguna wajib menggunakan Bahasa Indonesia yang baku, profesional, dan berbobot medis (bukan terjemahan mesin yang kaku dan bukan campuran bahasa Inggris-Indonesia yang acak).
2. **Kepatuhan Klaim Kesehatan (`scripts/uji/clinical-claim-maturity.mts`)**:
   - Selalu sertakan `<BatasKlaimKesehatan permukaan="care.login" />` (atau permukaan yang sesuai).
   - Dilarang keras menggunakan klaim berlebih (*overclaim*) seperti:
     - `Certified AI-EMR`
     - `doctors verify`
     - `AI co-physician`
     - `Verified by licensed doctors`
   - AI diposisikan sebagai asisten analitis & edukatif yang mendukung, bukan pengganti diagnosis langsung klinisi berizin.

---

## Ringkasan Checklist Sebelum Mengajukan Perubahan Frontend:
- [ ] Apakah kontras teks dan tombol terbaca jelas (>7:1) di Mode Terang dan Mode Gelap?
- [ ] Apakah tombol di kanvas gelap kebal dari pemetaan `.dark .bg-white`?
- [ ] Apakah segmented control memperlihatkan dengan tegas mana tab yang aktif dan nonaktif?
- [ ] Apakah tombol aksi utama memiliki status `disabled` saat form belum lengkap?
- [ ] Apakah tidak ada animasi kapsul raksasa melayang yang menutupi layar saat klik?
- [ ] Apakah form memiliki wadah scroll vertikal yang aman tanpa memotong bagian atas?
- [ ] Apakah seluruh 7 suite pengujian (`scripts/uji/*`) dan `tsc --noEmit` lulus 100%?
