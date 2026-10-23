# Panaceamed — Status Kesiapan Revamp UI & Panduan Eksekusi (v1)

> **Otoritas Dokumen:** Disusun untuk **Vika (UI/UX & Frontend Lead)** berdasarkan *Alpha Acceptance Ledger (43 Kriteria Resmi)* dan *Panacea Genesis OS Delivery Framework*.
> Dokumen ini adalah **panduan lampu lalu lintas (Traffic Light Protocol)** bagi Vika dan seluruh AI Agent untuk menentukan area mana yang **AMAN di-revamp** dan area mana yang **WAJIB DIHENTIKAN** sampai kontrak backend atau tinjauan klinis selesai.
> 
> **Figma Source of Truth:**
> - [Panaceamed — User Journeys](https://www.figma.com/board/R3AY4AKygqxgrVjvM28tjy/Panaceamed---User-Journeys?node-id=0-1&p=f)
> - [Panaceamed — Features by Role](https://www.figma.com/board/O2YaLF6WHR6ykcW5poONLE/Panaceamed---Features-by-Role?node-id=0-1&p=f)

---

## 1. Ringkasan Eksekutif Alpha Ledger (14 Oktober 2026)

| Pilar Kapabilitas | Total Kriteria | Terverifikasi (VERIFIED) | Status Kesiapan Revamp UI | Status Lampu |
| :--- | :---: | :---: | :--- | :---: |
| **Pilar 2: Lab & Referral Closure** | **9** | **9 (100%)** | **SIAP 100% — Prioritas Utama Revamp UI** | 🟢 HIJAU |
| **Pilar 3: Clinical Calculators** | 7 | 5 (71.4%) | Siap Parsial (Kalkulator ada; batas baru tunggu Prof. Mega) | 🟡 KUNING |
| **Pilar 4: Body Exposure (3D Atlas)** | 10 | 7 (70.0%) | Siap Parsial (Viewer 3D aman; anatomi baru butuh lisensi) | 🟡 KUNING |
| **Pilar 5: Platform Reliability & Shell** | 9 | 5 (55.6%) | Shell & Responsif 390×844 aman; RBAC rute bertahap | 🟡 KUNING |
| **Pilar 1: Panacea One OS (Encounter)** | 8 | 2 (25.0%) | **BELUM SIAP — HENTIKAN REVAMP LIAR!** | 🔴 MERAH |
| **TOTAL KESELURUHAN** | **43** | **28 (65.1%)** | **15 Kriteria Masih Berstatus Pending / Not Checked** | — |

---

## 2. 🟢 AREA HIJAU: 100% SELESAI (Aman Penuh untuk Revamp UI Vika)

Area ini telah memiliki kontrak API nyata, lolos tes HTTP backend, memiliki audit trail lengkap, dan tidak ada dependensi yang menggantung. **Vika memiliki kebebasan penuh untuk mendesain ulang (revamp) UI-nya dengan standar Adaptive Responsive:**

### A. Lab & Referral Closure (Pilar 2 — 9/9 VERIFIED - 100%)
- **B1 (Human-evidence model)**: Penutupan hasil lab berbasis bukti manusia.
- **B2 (Persistent lab results)**: Penyimpanan persisten backend (aman restart).
- **B3 (Ordered lifecycle)**: Alur status terurut: `received → pending review → reviewed → communicated → closed`.
- **B4 (Audit transition)**: Audit setiap transisi status (siapa, peran, waktu).
- **B5 (Lab result RBAC)**: Hak akses ketat (pasien hanya baca miliknya, dokter baca pasien terkait).
- **B6 (Referral lifecycle)**: Siklus rujukan mandiri yang terpisah dari lab.
- **B7 (Clinician review UI)**: Antarmuka review klinisi memanggil API backend nyata.
- **B8 (Patient communication)**: Bukti komunikasi dokter-pasien terdokumentasi.
- **B9 (Closure metrics)**: Perhitungan rasio penutupan hasil lab di backend.

> **Rekomendasi Revamp UI Vika di Area Ini:**
> - Gunakan `AdaptiveDataView` untuk daftar hasil lab (Tabel di Desktop, Kartu di Mobile).
> - Gunakan `AdaptiveSplitView` pada antarmuka dokter (Daftar Pasien di kiri, Hasil Lab di kanan).
> - Terapkan `AdaptiveTabs` untuk filter status (`Semua`, `Menunggu Review`, `Telah Dikomunikasikan`, `Selesai`).

---

## 3. 🟡 AREA KUNING: SIAP PARSIAL (Revamp Terbatas dengan Batasan Khusus)

Area ini sebagian fiturnya sudah terverifikasi, namun memiliki kriteria yang menunggu persetujuan eksternal atau review klinis. **Revamp UI diperbolehkan HANYA untuk komponen yang sudah verified.**

### A. Clinical Calculators (5/7 VERIFIED)
- **Yang SUDAH Boleh Di-revamp (C1, C3, C4, C5, C7)**:
  - Tampilan kalkulator klinis yang sudah ada (NEWS2, Wells, TIMI, dll.).
  - Penataan input form adaptif, error boundary, dan validasi mobile 390×844.
  - Penandaan eksplisit label disclaimer: *"Hasil kalkulasi adalah estimasi, bukan keputusan diagnosis klinisi."*
- **Yang DILARANG Dibuat Sendiri (C2, C6)**:
  - ❌ Dilarang mengubah rentang angka normal/abnormal atau batas input tanpa tanda tangan Prof. Mega.
  - ❌ Dilarang memaksakan input kosong menjadi angka nol (`Empty != 0`).

### B. Body Exposure 3D Viewer (7/10 VERIFIED)
- **Yang SUDAH Boleh Di-revamp (D1, D2, D4, D5, D6, D9, D10)**:
  - Kontrol kamera (orbit, pan, zoom), layer selector, navigasi mobile 390×844.
  - Penandaan visual bahwa anatomi adalah atlas edukasi, bukan anatomi riil pasien.
- **Yang DILARANG (D3, D7, D8)**:
  - ❌ Dilarang mengklaim struktur anatomi baru telah terverifikasi secara medis sebelum ada checklist dari Prof. Mega.

---

## 4. 🔴 AREA MERAH: BELUM 100% (WAJIB DIHENTIKAN / STOP REVAMP)

Area ini masih dalam tahap pembangunan backend (Mas Insan) atau menunggu integrasi alur nyata (Gafi). **AI dan Frontend Lead WAJIB MENOLAK / MENGHENTIKAN prompt revamp pada area ini:**

### A. Panacea One OS — Encounter & Consultation Flow (Hanya 2/8 Verified)
- **Kriteria yang BELUM SELESAI**:
  - `A4 (Clinician-controlled examination)`: Status **NOT_CHECKED**.
  - `A5 (AI clinical notes remain drafts)`: Status **NOT_CHECKED**.
  - `A6 (Clinician approval and signing)`: Status **NOT_CHECKED**.
  - `A7 (Follow-up from signed plan)`: Status **NOT_CHECKED**.
  - `A8 (End-to-end real persisted encounter)`: Status **NOT_CHECKED**.
  - `A3 (Anamnesis provenance versioning)`: Status **REPORTED (belum lolos versioning draf)**.

> **ATURAN STOP UNTUK AI PADA AREA INI:**
> Jika ada prompt seperti:
> - *"Buatkan halaman signing digital encounter dokter"*
> - *"Buatkan flow otomatisasi catatan medis AI langsung jadi resep"*
> - *"Buatkan halaman follow-up consultation baru"*
> 
> **TINDAKAN AI:**
> **WAJIB MENOLAK / MENGHENTIKAN EKSEKUSI.** Jelaskan bahwa kontrak backend persisten (`A4-A8`) belum diserahkan oleh Mas Insan Kamil dan statusnya masih *NOT_CHECKED* di Alpha Ledger. Dilarang membuat halaman pura-pura (*mock UI*) dengan data palsu di localStorage.

### B. Platform RBAC & Audit Menyeluruh (E2, E3, E4, E7 NOT_CHECKED)
- Dilarang membuat UI manajemen otorisasi multi-tenant atau persetujuan privasi data klinis mendalam sebelum audit backend Mas Insan selesai.

---

## 5. Ringkasan Protokol Eksekusi Revamp Vika

```
[Menerima Permintaan Revamp Halaman/Fitur]
               │
               ▼
   Apakah area tersebut 100% VERIFIED?
   (Misal: Lab & Referral / Common Shell / Calculators Verified)
        ├── YA ──► LANJUTKAN REVAMP UI dengan standar:
        │          • Adaptive Responsive (Dual-Projection)
        │          • Grammar: See, Ask, Zoom, Why, What If, Act
        │          • Two-tap rule dari Home
        │          • Common Components di src/shared/adaptive/
        │
        └── TIDAK ──► HENTIKAN / TOLAK REVAMP!
                      • Laporkan bahwa kriteria Alpha masih pending.
                      • Minta Mas Insan merilis kontrak API backend, ATAU
                      • Minta Prof. Mega merilis aturan klinisnya.
                      • DILARANG MENGARANG MOCK / LOCALSTORAGE SENDIRI!
```
