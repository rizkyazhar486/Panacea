# Panaceamed — Standar Desain Adaptive Responsive & Komponen Bersama (v1)

> **Otoritas Dokumen:** Disusun dan disetujui langsung oleh **Vika (UI/UX & Frontend Lead)**.
> Berlaku wajib untuk **semua AI Agent (Claude, Gemini, Copilot, Codex, dll.)** dan engineer yang mengembangkan atau mengubah antarmuka di repositori Panaceamed.id.
> 
> **Referensi Resmi Figma (Source of Truth):**
> 1. [**Panaceamed — User Journeys (FigJam)**](https://www.figma.com/board/R3AY4AKygqxgrVjvM28tjy/Panaceamed---User-Journeys?node-id=0-1&p=f) — Rujukan wajib seluruh urutan alur navigasi dan langkah klinis/pasien.
> 2. [**Panaceamed — Features by Role (FigJam)**](https://www.figma.com/board/O2YaLF6WHR6ykcW5poONLE/Panaceamed---Features-by-Role?node-id=0-1&p=f) — Matriks resmi pemisahan fitur berdasarkan peran pengguna (Dokter, Pasien, Perawat, Lab, Admin).

---

## 1. Filosofi: Mengapa "Adaptive Responsive (Dual-Projection)"?

Di platform kesehatan klinis & longevity seperti Panaceamed, kebutuhan antarmuka antara **Pasien** dan **Klinisi/Dokter** memiliki perbedaan fundamental:

1. **Pasien / Pengguna Lapangan (Mayoritas Mobile / PWA)**:
   - Memerlukan kemudahan satu tangan (*one-handed reachability*).
   - Memantau vitalitas harian, telemetri wearable, dan aksi cepat (minum obat, catat makan, cek janji).
   - Pola interaksi: Sentuhan, usap (*swipe*), scroll mengalir, sasaran ketuk besar (≥44px).

2. **Dokter / Klinisi / Admin (Mayoritas Desktop / Laptop / Tablet Horizontal)**:
   - Memerlukan kepadatan informasi (*high data density*) untuk menelaah rekam medis longitudinal.
   - Meninjau puluhan hasil lab darah, resep obat, audit trail SATUSEHAT, dan anatomi 3D.
   - Pola interaksi: Mouse presisi tinggi, keyboard shortcuts (`Cmd+K`, `Cmd+S`, Tab, Enter, Esc), multi-panel berdampingan (*split view*).

> **HUKUM UTAMA DUAL-PROJECTION (VIKA):**
> **"Jangan meregangkan kartu ponsel menjadi lempengan raksasa di monitor desktop, dan jangan memampatkan tabel desktop menjadi teks mikro tak terbaca di ponsel."**
> 
> Komponen tidak sekadar berganti ukuran CSS, melainkan **bertransformasi bentuk dan pola interaksinya** sesuai lingkungan fisik perangkat.

---

## 2. Matriks Resmi 9 Transformasi Komponen (Disetujui Vika)

| No | Kategori Komponen | Tampilan di Mobile (< 1024px) | Tampilan di Desktop (≥ 1024px) |
| :-: | :--- | :--- | :--- |
| **1** | **Tombol Aksi Formulir (`AdaptiveFormAction`)** | **Sticky Bottom Bar**: tombol simpan melayang menempel di dasar layar (tepat di atas safe-area). Jempol tidak perlu scroll sampai ujung form untuk submit. | **Inline / Top-Right Action**: tombol aksi diletakkan di header form / bilah atas, dilengkapi shortcut keyboard (`Cmd+S`). |
| **2** | **Master-Detail Data (`AdaptiveSplitView`)** | **Drill-down Navigation**: Halaman 1 (Daftar Pasien/Lab) → Tap item → Pindah rute (*push*) ke Halaman 2 (Rincian Medis) dengan tombol `‹ Kembali`. | **Dual-Pane Split View**: 30% daftar di panel kiri, 70% detail rekam medis di panel kanan terbuka bersamaan tanpa reload. |
| **3** | **Pemilih Tanggal & Periode (`AdaptiveDatePicker`)** | **Bottom Sheet Calendar / Wheel Picker**: sasaran ketuk bulat besar, pil geser cepat horizontal (*"Hari Ini", "7 Hari", "30 Hari"*). | **Dual-Month Popover**: kalender 2 bulan berdampingan untuk rentang tanggal, plus input teks manual langsung via keyboard (`DD/MM/YYYY`). |
| **4** | **Aksi Cepat per Item Data (`AdaptiveActionMenu`)** | **Swipeable Actions / Bottom Sheet**: geser kartu ke kiri memunculkan tombol hapus/arsip, atau tombol `...` membuka Action Sheet dari bawah. | **Hover Actions / Context Menu**: ikon aksi muncul halus saat kursor mouse melintas (*hover*) di atas baris tabel, atau klik kanan. |
| **5** | **Grafik & Visualisasi Tren Medis (`AdaptiveChartContainer`)** | **Sparkline Ringkas**: scroll horizontal, tap titik untuk memunculkan kartu indikator di atas grafik (bukan tooltip yang tertutup jempol), tombol *Rotate to Landscape*. | **Wide Canvas Chart**: kanvas lebar penuh, tooltip kursor multi-metrik presisi, crosshair X-Y, zoom slider, dan pembanding tren berdampingan. |
| **6** | **Tooltip & Penjelasan Istilah Medis (`AdaptiveTooltip`)** | **Tap Popover / Info Sheet**: karena tidak ada kursor di layar sentuh, istilah medis/singkatan lab diketuk untuk membuka info ringkas, tap luar untuk tutup. | **Hover Floating Tooltip**: cukup arahkan kursor mouse ke istilah medis, kotak penjelasan melayang seketika. |
| **7** | **Bilah Tab Kategori (`AdaptiveTabs`)** | **Horizontal Scrolling Pills**: pil tab dapat digeser jari dengan efek pudar (*fading edge*) di kanan-kiri penanda adanya tab tersembunyi. | **Expanded Inline Tabs**: seluruh tab dijajarkan penuh secara horizontal dengan label teks lengkap, ikon, dan lencana (*badge*) jumlah data. |
| **8** | **Upload Berkas / Foto Klinis (`AdaptiveFileUpload`)** | **Native Camera/Gallery Intent**: tombol upload memicu opsi ponsel langsung *"Ambil Foto Kamera"* atau *"Pilih dari Galeri"*. | **Drag-and-Drop Zone**: area kotak putus-putus untuk menarik berkas PDF lab/rontgen dari komputer dan melepasnya ke browser. |
| **9** | **Notifikasi & Toast Alert (`AdaptiveToast`)** | **Top Banner / Dynamic Island Style**: meluncur dari atas agar tidak menutupi navigasi jempol di bawah, usap ke atas (*swipe-up*) untuk dismiss. | **Top-Right Floating Toast**: melayang di sudut kanan atas selama beberapa detik dengan tombol `✕` dan aksi cepat. |

---

## 3. Arsitektur Komponen Bersama (*Common Components*)

Seluruh komponen adaptif ini diimplementasikan secara terpusat di:

```
src/shared/adaptive/
├── index.ts                     # Ekspor publik modul adaptif
├── useAdaptive.ts               # Hook pendeteksi breakpoint & perangkat
├── AdaptiveDataView.tsx         # Pola Tabel (Desktop) vs Kartu (Mobile)
├── AdaptivePagination.tsx       # Pola Paginasi Angka (Desktop) vs Load More (Mobile)
├── AdaptiveDialog.tsx           # Pola Modal Tengah (Desktop) vs Bottom Sheet (Mobile)
├── AdaptiveFormAction.tsx       # Pola Sticky Bottom Bar (Mobile) vs Header Actions (Desktop)
├── AdaptiveSplitView.tsx        # Pola Dual-Pane (Desktop) vs Drill-down (Mobile)
├── AdaptiveTooltip.tsx          # Pola Hover Tooltip (Desktop) vs Tap Popover (Mobile)
├── AdaptiveTabs.tsx             # Pola Expanded Tabs (Desktop) vs Scroll Pills (Mobile)
├── AdaptiveFileUpload.tsx       # Pola Drag-and-Drop (Desktop) vs Camera Intent (Mobile)
└── AdaptiveToast.tsx            # Pola Top-Right Toast (Desktop) vs Top Banner (Mobile)
```

---

## 4. Aturan Wajib untuk AI Agent & Kontributor

1. **Gunakan Common Component**:
   Sebelum membuat dialog, tabel, tab, atau form action baru, periksa `src/shared/adaptive/`. Wajib mengimpor komponen bersama ini.
2. **Grammar Interaksi (Vika)**:
   Setiap komponen harus mematuhi alur *see, ask, zoom, why, what if, act*. Satu fokus & satu aksi utama per layar.
3. **Patuhi Batasan Peran**:
   - Teks keamanan klinis hanya boleh diubah atas persetujuan Prof. Mega.
   - Kontrak data dan API wajib berasal dari Mas Insan Kamil.
   - Status AI selalu berlabel *draft* dengan ketidakpastian terbuka (`clinically_reviewed=false`) sampai klinisi berizin menandatanganinya secara nyata.
