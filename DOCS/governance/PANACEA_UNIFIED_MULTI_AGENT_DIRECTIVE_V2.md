# PANACEA UNIFIED MULTI-AGENT ORCHESTRATION DIRECTIVE (V2)
## Koordinasi Anti-Konflik, Anti-Kritik, Anti-Destabilisasi: Claude · CLI Gemini · Gemini Chat · Hydrogen · Argon

**Tanggal:** 2026-11-16  
**Baseline SHA:** `71957cd86e08f7bab84423d6729e6f2207c54790`  
**Status:** OPERATIONAL DIRECTIVE (bukan klaim kesiapan rilis publik)  
**Hierarki Otoritas:**  
1. Instruksi eksplisit terbaru Pemilik (Rizky) yang tidak melanggar keselamatan pasien/keamanan/hukum  
2. Batas keselamatan keras `AGENTS.md`, `CLAUDE.md`, `PANACEA_CONSTITUTION.md`, `docs/governance/README.md`  
3. Handoff Orkestrator `ORCHESTRATOR_DIRECTIVE_GEMINI_HANDOFF.pdf`  
4. Direktif Terpadu ini (`PANACEA_UNIFIED_MULTI_AGENT_DIRECTIVE_V2.md`)  

Dokumen ini memperdalam dan menyatukan panduan operasional untuk **Claude**, **CLI Gemini**, **Gemini Chat**, **Hydrogen**, dan **Argon** agar tidak terjadi tumpang tindih berkas, perang edit, regresi CI, atau klaim sepihak yang mudah dipatahkan peninjau eksternal.

---

## 0. Misi Arsitektural dalam Satu Kalimat

Membangun **satu Sistem Operasi Kesehatan & Kehidupan Longitudinal** yang sederhana, secepat ketukan harian (**<= 2 ketukan**), dapat dipercaya, dan tunduk pada persetujuan eksplisit (**permissioned observability**) — menyatukan identitas tunggal dan keadaan pasien kanonik di seluruh siklus hidup (kehidupan harian, pemulihan/olahraga, poli rawat jalan, rawat inap, kamar operasi, ICU, dan rujukan/penyelesaian klaim berizin).

Ambisi skala setingkat **Alipay, WeChat, Visa, dan Mastercard** dicapai lewat **keandalan standar terbuka + utilitas harian + kliring mitra berlisensi**, bukan monopoli koersif, pengumpulan data tersembunyi, atau penerbitan instrumen keuangan sendiri.

---

## 1. Fakta Terukur Hari Ini (Baseline 2026-11-16 — Kejujuran Non-Halusinasi)

Setiap angka dan status di bawah berasal dari observasi langsung repositori, log GitHub Actions, dan respons server hidup (bukan perkiraan):

| Domain | Keadaan Terukur | Bukti / Rujukan |
|---|---|---|
| **Backend & Database Lama** | **HIDUP & UTUH.** Server `panaceamed-backend` pada Render terhubung ke MongoDB (`penyimpanan: "mongo"`, `penyimpananSehat: true`), `google: true`, `otpEmail: true`, `payments: true`, `ai: true`, `push: true`, `usersUsed: 23`, build SHA backend `a9c8d3930`. Data akun, log latihan, dan profil server lama **tidak hilang**. | Respons langsung `GET /api/health` |
| **Vercel Frontend** | Live HTTP `200`, terotomatisasi via `vercel-prebuilt-production.yml` (`VERCEL_TOKEN` tersedia, butuh tag `[deploy-vercel]` pada pesan commit atau jadwal 6 jam bila seluruh gerbang rilis hijau). | GitHub workflow `43876575510` (`success`) |
| **Domain Publik (`panaceamed.id`)** | Secara historis menunjuk Cloudflare DNS; insiden Cloudflare Tunnel (`Error 1033`) terjadi saat tunnel lokal Mac (`cloudflared` -> `127.0.0.1:4399`) mati dan `.env.local` belum diarahkan ke Render sehingga panggilan lokal jatuh ke berkas dummy lokal. Solusi permanen: kembalikan DNS Cloudflare ke hosting cloud (Vercel) + biarkan `.env.local` mengarah ke Render saat pengembangan lokal. | `~/.cloudflared/config.yml`, `.env.local`, PR `#3071` |
| **Status CI `main` (`71957cd86`)** | **Masih sebagian merah (F2).** `Security Baseline`, `Dependency Audit`, `Clinical Evidence`, `Mongo Persistence`, `User Journey (F1)`, `Body 3D Render`, dan `Shared Longitudinal` hijau; **namun** `UX Audit Acceptance (F2)` (`43876575627`) gagal pada: target sentuh mobile `<44px` (`16`), kontras WCAG (`20 > 0`), `screenshot-regresi` (`#/fitness-hub` 16 sel > batas 6), dan `perf-audit` (`8` pelanggaran jumlah request & `417,817 B > 413,183 B` JS pada `/health-data`). | GitHub Actions run `43876575627` |
| **Bundle Anggaran F2 (`npm run build`)** | Lokal pada split `bootVitals.ts` (`71957cd86`) lulus ketat: `cssBlokirGzip = 113040 <= 115200`, `jsGzip = 220683 <= 256500`, `totalGzip = 333723 <= 371700`, dan `1828/1828` pengujian QA `scripts/qa/*.test.mjs` lulus. | `task-5852`, `task-5662` |
| **QR / Barcode Asli vs Simulasi** | Mesin QR & Code 128 deterministik yang diverifikasi 4 dekoder independen berada pada **PR #3073** (`feat/codes-real-qr-and-barcode`, belum digabung). Tampilan "EMV pass" atau kartu/token simulasi pada hub lama wajib disinkronkan agar memakai kode QR/Code 128 asli dan **dilarang** menampilkan PAN/token pembayaran fiktif. | `gh pr list` `#3073`, `ORCHESTRATOR_DIRECTIVE` §1 & §4 Fase E |
| **Validasi Klinis (`C6`)** | Ditunda ke fase Clinical Validation (`DEFERRED_TO_CLINICAL_VALIDATION`); `clinically_reviewed = false` wajib bertahan. Nilai kesiapan di `WORTHINESS_EVIDENCE.json` berstatus `E0/E1` dengan skor `null`. | `PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md`, `WORTHINESS_EVIDENCE.json` |

---

## 2. Keputusan Orkestrator: Kapan Panaceamed Layak Disebarluaskan ke Umum?

**Keputusan per 2026-11-16: BELUM LAYAK UNTUK PUBLIK UMUM (`NO-GO`).**

Alasan objektif dan tidak dapat ditawar:
1. **Gerbang keandalan infrastruktur (`G1`) & CI (`G2`)** belum terpenuhi: domain publik masih bergantung pada tunnel Mac pemilik (`#3071`) alih-alih hosting statis 24/7, dan CI `F2` (`ux-audit` & `perf-audit`) masih merah pada `main`.
2. **Gerbang pengalaman (`G7`)** gagal pada metrik terukur (target sentuh `<44 px` di mobile, kontras AA, regresi `#/fitness-hub`, request/byte overage `perf-audit`).
3. **Gerbang hukum & tata kelola data (`G5`)** dan **bukti manfaat terukur (`G8`)** (persetujuan UU PDP formal, pendaftaran PSE, DPIA, evaluasi komparatif episode rawat jalan nyata dengan persetujuan etik) belum ditutup.
4. **Ketidakjujuran antarmuka** masih berisiko dikritik bila kartu "EMV/Visa/Mastercard", log pemulihan medis, atau klaim siap-publik belum dipisahkan ketat dari simulasi.

### 2.1 Gerbang Konjungtif Kelayakan Rilis (`G1..G9`)

Kelulusan rilis **bersifat konjungtif**:  
$$\text{Rilis}(\text{Tahap}) = \bigwedge_{i \in \text{Tahap}} G_i$$  
Satu gerbang gagal = **TIDAK RILIS**. Kelebihan di 80 fitur lain **tidak** menutupi 1 kegagalan keselamatan, privasi, ketersediaan, atau keterbacaan.

| Gerbang | Nama | Kriteria Terukur Wajib Lulus | Status 2026-11-16 | Tahap Rilis Minimal |
|---|---|---|---|---|
| **G1** | Ketersediaan Cloud 24/7 | Domain publik di Vercel/CF Pages + backend Render/Mongo tanpa tunnel Mac; uptime terukur >= 99.5% selama 14 hari | Belum | Tertutup (20–50) |
| **G2** | `main` Hijau Total | Semua workflow CI termasuk `UX Audit F2`, `perf-audit`, `Stabilization`, dan `Body 3D` hijau 7 hari berturut-turut; proteksi branch `main` aktif; 0 push langsung | Belum | Tertutup (20–50) |
| **G3** | Integritas Data & Sinkronisasi | Autentikasi server terverifikasi + sinkronisasi terenkripsi/persetujuan `localStorage <-> MongoDB`; uji isolasi `ownerId` + backup/restore 0-loss | Sebagian | Tertutup (20–50) |
| **G4** | Keselamatan Klinis | Nol diagnosis/dosis/order otonom; AI tampil sebagai draf (`clinically_reviewed=false`); batas darurat menyebut nomor darurat & bukan keputusan AI | Sebagian | Tertutup (20–50) |
| **G5** | Hukum & Privasi Indonesia | Kebijakan privasi sinkron dengan telemetri nyata, opt-in/revocation consent log, DPIA ringkas, kesiapan pendaftaran PSE & kepatuhan UU PDP No. 27/2022 | Belum | Terbuka Terbatas |
| **G6** | Keamanan & RBAC | `npm audit` bebas kerentanan tinggi, RBAC lintas peran teruji negatif/positif, zero secrets di git, uji penetrasi ringan independen | Sebagian | Tertutup -> Terbatas |
| **G7** | Pengalaman & Web Vitals | `targetKecilMobile = 0`, `kontras gagal = 0`, `overflowX = 0` pada 390x844, `<= 2 ketukan` ke aksi inti, seluruh batas request & JS `perf-audit` lulus | Belum | Tertutup -> Terbatas |
| **G8** | Bukti Manfaat Klinis/Workflow | Uji komparatif >= 1 episode rawat jalan nyata (waktu siap encounter, kelengkapan rekam, skor pemahaman pasien) berizin & berpersetujuan | Belum | Publik Umum |
| **G9** | Operasi, Dukungan & Rollback | `docs/governance/ROLLBACK.md` teruji nyata, pelacakan error produksi aktif, kanal insiden & SLA respons | Sebagian | Publik Umum |

**Peta Graduasi Rilis 3 Tahap:**
- **Tahap 1 — Alpha Tertutup (20–50 pengguna undangan):** Pelacakan kebugaran & kesehatan pribadi saja (**0 klaim klinis**). Syarat: `G1 + G2 + G3 + G4 + G6 + G7` hijau.
- **Tahap 2 — Beta Terbatas / Klinik Percontohan:** Syarat: `G1..G7` hijau + perjanjian klinik + DPIA/UU PDP + review hukum.
- **Tahap 3 — Rilis Publik Luas:** Syarat: `G1..G9` seluruhnya hijau + validasi klinis independen untuk setiap fitur klinis berisiko (C6).

---

## 3. Protokol Pembagian Kerja Anti-Konflik (5 Agent + Pemilik)

Agar **CLI Gemini**, **Gemini Chat**, **Claude**, **Hydrogen**, dan **Argon** saling mempercepat tanpa bertabrakan:

| Peran | Aktor | Mandat Utama | Terlarang Dilakukan |
|---|---|---|---|
| **Orkestrator & Integrator** | **Claude** | Menjaga kesehatan `main`, menentukan urutan merge PR (`#3075 -> #3071 -> #3070 -> #3068 -> #3067 -> #3073`), memeriksa bukti uji & audit silang | Menulis dua lane bersamaan pada berkas sama; merge PR yang CI-nya merah; menyetujui PR sendiri tanpa review |
| **Pelaksana Implementasi, Perbaikan CI & Pemulihan Teknis** | **CLI Gemini** | Menulis kode produksi TypeScript/React/Node, unit/e2e test (positif, negatif, batas, sabotase), memperbaiki audit `F2` / request count / adapter perangkat di branch terpisah | Push langsung ke `main`; menyentuh berkas yang sedang diklaim PR terbuka lain; mengendurkan baseline/test agar terlihat hijau |
| **Peneliti Primer & Kritikus Independen** | **Gemini Chat** | Mencari referensi primer (WHO, HL7 FHIR R4, SATUSEHAT, IEEE 11073, ISO 18004, UU PDP, BI QRIS/PJP), mengkritisi keras setiap PR, desain arsitektur & klaim klinis | Melakukan commit langsung; menulis sitasi/regulasi dari ingatan tanpa tautan sumber terverifikasi |
| **Lane Kedalaman Biologis & Observabilitas** | **Hydrogen** | Memperdalam mesin fisiologi, Body Exposure 3D/biomekanika (`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM`), komposisi tubuh, korelasi tidur/HRV lintas skala | Membuat silo penyimpanan terpisah di luar Canonical State; mencampur `simulated` ke `measured` |
| **Lane Klinis, Interop, Fitness & E2E** | **Argon** | Episode klinis terpadu (`VisitOS`, `CareEpisode`, `ClinicalHub`, FHIR/SATUSEHAT), ketahanan atletik (`WorkoutHistory`, `AnalisisPro`), suite browser E2E Chromium | Menghapus tanda tangan manusia / menganggap draf AI sebagai catatan klinis final; melewati uji owner/RBAC |
| **Pemilik & Pemegang Keputusan Akhir** | **Rizky** | Penentu prioritas (`P1`), kebijakan DNS Cloudflare/Vercel, proteksi branch `main`, alokasi lane, penunjukan peninjau hukum/klinis | (Hal infrastruktur Cloudflare/GitHub Settings/Legal tidak bisa diwakilkan oleh AI) |

### 3.1 Aturan Single-Writer Mutex (Zero Conflict Law)
1. **Prasyarat mutlak sebelum edit berkas:** Jalankan `git fetch origin main` dan `gh pr list --state open --json number,headRefName,files`. Jika berkas target disentuh PR terbuka lain, **dilarang menduplikasi edit** — tunggu merge atau koordinasikan via `TASK_BOARD.md`.
2. **Satu branch = satu perubahan logis terisolasi:** Format wajib `feat|fix|refactor|test|docs|chore|hotfix/<scope>-<deskripsi>`. **0 pengecualian** — tidak ada commit langsung ke `main`.
3. **Kunci Berkas Panas (Shared-File Mutex):** Berkas bersama (`src/lib/store.tsx`, `src/components/layout/Shell.tsx`, `src/main.tsx`, `src/pages/clinical/ClinicalHub.tsx`, `src/pages/UnifiedBodyWorkspace.tsx`, `src/pages/bodyhub/BodyExposureOS.tsx`, `src/pages/bodyhub/HealthProfile.tsx`) **hanya boleh diubah oleh 1 agent aktif pada satu waktu** setelah mencatat klaim eksplisit (agent, branch, berkas, batas waktu 24 jam) di `docs/governance/TASK_BOARD.md`.
4. **Protokol Handoff Terukur:** Setiap akhir sesi menulis ringkasan 1 halaman berisi: `[Commit SHA / PR #, kapabilitas berubah, bukti uji positif+negatif+sabotase, status CI, blocker terbuka]`. Tanpa persentase kemajuan karangan.

### 3.2 Aturan Tahan Kritik (*Critic-Proof Standard*)
- **Gemini Chat wajib menyerang setiap PR Claude/Gemini CLI/Hydrogen/Argon** minimal pada 4 sumbu: *(1) batas kebenaran data (`measured vs derived vs simulated`), (2) isolasi identitas/privasi (`ownerId` & consent), (3) klaim klinis/hukum, (4) regresi UX/perf/accessibility*.
- **Setiap kritik dijawab oleh kode atau bukti tes**, bukan retorika. Jika tidak ada data terukur -> wajib tampil `"Belum diukur"` / `"Tidak diketahui"`.

---

## 4. Blueprint Infrastruktur Setingkat Alipay / WeChat / Visa / Mastercard (Tanpa Celah Hukum & Etika)

Untuk menyamai dampak sistemik raksasa global tanpa melanggar etika medis, regulasi privasi, atau otoritas sistem keuangan:

### 4.1 Terjemahan Konsep "Surveillance & Control" -> *Permissioned Observability & Orchestration*
Setiap aliran pengamatan (wearable BLE GATT, Apple Health / Health Connect, rPPG, catatan klinis, keuangan/klaim, paparan lingkungan) **wajib membawa 6 atribut kanonik**:
1. `truth_class`: `'patient-recorded' | 'clinician-signed' | 'device-measured' | 'model-derived' | 'mechanistic-simulation' | 'reference' | 'unknown'`
2. `source`: pengidentifikasi perangkat/klinisi/importer eksplisit
3. `recorded_at` & `ingested_at`: pembedaan waktu kejadian nyata vs waktu sinkron
4. `consent_scope_id`: cakupan izin spesifik tujuan (misal: hanya untuk pelacakan diri vs dibagi ke pelatih/dokter)
5. `review_status`: selalu `clinically_reviewed: false` hingga ditandatangani klinisi terverifikasi
6. `revocation_handle`: kemampuan pencabutan 1 ketukan yang **seketika** menghentikan akses baca lintas modul & mencatat log audit baca (*access lineage*).

### 4.2 Pilar Skala Alipay / WeChat (Kebiasaan Harian 2 Ketukan + Ekosistem Terpadu)
- **Pintu Harian Universal (`Beranda` -> `<= 2 Ketukan`):** Pengguna membuka Panacea setiap hari bukan karena dipaksa, tetapi karena 1 layar langsung menjawab: *"Bagaimana kondisi saya hari ini, mengapa angka ini berubah, dan apa satu langkah paling masuk akal berikutnya?"*
- **Kartu Identitas & Akses Cepat Asli (`PR #3073`):** QR Code & Barcode Code 128 berstandar ISO/IEC 18004 (diverifikasi 4 dekoder) sebagai pintasan aman antarmuka pasien/MRN/tautan perangkat/resep terverifikasi, **didampingi WebAuthn Passkey (TouchID/FaceID) & RFC 6238 TOTP**. *Dilarang menerbitkan fake EMV chip, fake PAN kartu kredit, atau saldo token tak berizin.*

### 4.3 Pilar Skala Visa / Mastercard (Standar Kliring & Keandalan Jaringan Global)
- **Standar Pesan Bersama (Bukan Mengendalikan Bank/Negara):**
  - *Kesehatan:* **HL7 FHIR R4**, **SATUSEHAT**, **LOINC**, **ICD-10**, **SNOMED CT**, **DICOM** -> identitas pasien kanonik lintas klinik, RS, apotek, dan laboratorium.
  - *Perangkat Fisik:* **Bluetooth SIG GATT standard** (`0x180D` HR/RR, `0x1809` Suhu, `0x1810` Tekanan Darah, `0x1822` Pulse Ox, `0x181D` Weight, `0x181B` Body Comp) + webhook/importer Apple Health & Health Connect. Perangkat proprietary tertutup hanya didukung setelah penangkapan fixture nyata — zero device spoofing.
  - *Keuangan & Klaim:* **Canonical Claim & Settlement Envelope** yang terhubung ke mitra berlisensi (**PJP / QRIS / Midtrans / BPJS Kesehatan / Penyelenggara Asuransi Asing lewat jurisdiction adapters**). Sistem finansial **dilarang keras** menolak penatalaksanaan gawat darurat/perawatan mendesak semata demi optimalisasi margin.

---

## 5. Peta Kebutuhan Dasar Manusia Lengkap dalam Satu OS (`Level 1 – Level 10`)

Sistem hanya boleh menambah fitur jika menutup celah nyata pada **10 tingkat kebutuhan manusia** ini tanpa memecah sumber kebenaran:

| Level | Ranah Kebutuhan Dasar | Masalah Nyata Manusia | Kapabilitas OS Panaceamed | Metrik Pembuktian Wajib | Fase Target |
|---|---|---|---|---|---|
| **L1** | Bertahan Hidup & Darurat | Informasi alergi, obat rutin, dan kontak darurat terlambat ditemukan saat kolaps | Kartu darurat opt-in 1-tap, daftar alergi/obat aktif, rute fasilitas & nomor 118/119 dengan batas kewenangan jelas | Detik ke info kritis; 0 angka karangan | Fase B, D |
| **L2** | Identitas Aman & Data Kekal | Berganti perangkat/domain bikin akun, profil, & riwayat olahraga hilang | Identitas kanonik + Passkey/Google/TOTP + Vault Backup/Restore + migrasi terenkripsi persetujuan ke MongoDB (`ownerId` ketat) | 0 kebocoran lintas akun; 100% pemulihan pemilik sama | Fase A, B |
| **L3** | Observasi Tubuh Kontinu | Pengguna tidak tahu tren tidur, RHR, HRV, langkah, berat, tensi harian | Auto-sync BLE GATT standar + Apple Health/Health Connect + 1 grafik ringkas & teks jujur `"belum ada data"` | Kelengkapan sinyal; 0 nilai palsu saat kosong | Fase B |
| **L4** | Literasi Kognitif & Edukasi | Angka lab/medis membingungkan; kecemasan pasien akibat jargon | Gramatika `SEE->ASK->ZOOM->WHY->WHAT IF->ACT`; istilah teknis di tombol `i`; rujukan buku teks SKDI/guidelines terindeks | Skor pemahaman pengguna vs kontrol | Fase B, D |
| **L5** | Episode Klinis Tertutup | Rekonsiliasi anamnesis, AI-EMR, resep, rujukan lab & hasil sering terputus | AI-EMR draf -> tanda tangan klinisi berizin -> order lab/rujukan -> hasil kembali ke episode & identitas pasien yang sama | Waktu persiapan encounter; % rujukan tertutup | Fase D |
| **L6** | Transaksi & Penjaminan Biaya | Pasien bingung tarif, klaim asuransi tertolak/lambat, kasir & klinis terpisah | Canonical coverage & status klaim via adapter QRIS/PJP/BPJS/asuransi berlisensi; nota terverifikasi | Waktu penyelesaian klaim; akurasi status | Fase E |
| **L7** | Pemulihan, Olahraga & Performa | Sesi lari, latihan beban, HBOT/Cryo/PBM/EMS tercatat terpisah dari HRV/HR | Log latihan zona denyut + **5 Modalitas Pemulihan sebagai catatan sesi pengguna/operator** + korelasi HRV/tidur/RHR | Korelasi terukur pada data pemilik; 0 klaim terapi | Fase C |
| **L8** | Keluarga, Kehamilan & Lansia | Mengurus orang tua sakit, anak, & pengingat vaksin/obat masih manual | Profil dependen berizin (*proxy consent scoping*), imunisasi/tumbuh kembang, jadwal obat & alarm dosis terstruktur | Kepatuhan jadwal; audit akses keluarga | Fase D, E |
| **L9** | Umur Panjang (*Longevity*) & Riset | Intervensi gaya hidup, sauna/termal, biomarker penuaan tanpa kerangka uji | Pelacakan baseline pribadi 14/90 hari, simulasi terisolasi (*mechanistic simulation proxy*), jalur riset berizin | Drift/kalibrasi retrospektif; 0 klaim medis | Fase C, F |
| **L10** | Minimasi Kerja Harian (*Work-Zero OS*) | Pengisian formulir berulang (tinggi, berat, riwayat) di 10+ layar berbeda | **Single-Entry Propagate Everywhere**: isi 1 kali di Profil/Baseline -> otomatis terisi tervalidasi ke Clinical, Gizi, Fitness, Body Exposure, FHIR export | Pengurangan ketukan & waktu pengisian | Fase A–E |

---

## 6. Prinsip Minimasi Alur Kerja, UI/UX & Pengolahan Kerja Harian Instan

Agar antarmuka benar-benar terasa **"instant, effortless, smooth, & minimalist"** bagi semua kalangan (pasien awam, atlet, lansia, dokter UGD, admin):

1. **Hukum Dua Ketukan (`<= 2 Taps`):** Fitur harian terpenting (cek kondisi, catat latihan/makan/pemulihan, buka kartu QR/darurat, mulai konsultasi, hubungkan jam/tensi) harus terjangkau dalam maksimal 2 sentuhan dari Beranda.
2. **Hukum Satu Fokus Per Layar (`Answer First, Detail in Disclosure`):** Jangan menumpuk 15 widget bersaing di layar pertama. Tampilkan **1 kesimpulan + 1 aksi utama** di atas lipatan; detail teknis, rumus kalkulator, dan grafik historis diletakkan di balik lipatan/disclosure teratur.
3. **Proyeksi Ganda Adaptif (`Mobile <1024px` vs `Desktop >=1024px`):**
   - Mobile (`390x844`): kartu bertumpuk, *bottom sheet*, **setiap target sentuh >= 44x44 px**, nol gulir horizontal.
   - Desktop (`1440x900`): tabel padat dengan tajuk lengket, paginasi bernomor, modal terpusat, navigasi samping kiri.
4. **Nol Input Berulang (Zero Redundant Work):** Tinggi badan, berat, umur, denyut istirahat, alergi, dan riwayat latihan masuk satu kali ke state kanonik (`store` + `LongitudinalStateProvider`) lalu otomatis mewarnai Kalkulator Klinis, AI-EMR (`SOAP/SBAR`), Komposisi Tubuh, Studio Pemulihan, dan Ringkasan Pasien.
5. **Pengisian Instan Bebas Macet (Non-Blocking & Lazy-First):**
   - Data lokal tampil **seketika (<50ms)** sambil sinkronisasi jaringan (Render/MongoDB) berjalan asinkron di latar belakang (`stale-while-revalidate`).
   - Komponen berat (3D WebGL, modal QR/Passkey, scanner kamera, daftar penyakit SKDI) **wajib lazy-load saat diklik** agar *request count* & byte awal tetap jauh di bawah `PERF_BASELINE.json` dan `BUNDLE_BUDGET_BASELINE.json`.

---

## 7. Kerangka Matematis Anti-Selera (Pemilihan Tugas & Resolusi Konflik)

### 7.1 Antrean Tugas Deterministik (`skor(w)`)
Berhenti berurutan pada kondisi pertama yang cocok:
1. **Bloker Keselamatan / Kebocoran PHI / Kehilangan Data Nyata** -> **KERJAKAN SEGERA**.
2. **`main` merah atau situs publik mati** -> **KERJAKAN SEGERA** (blokir fitur baru hingga hijau).
3. **Berkas tumpang tindih dengan PR terbuka / lane terikat agent lain** -> **LEWATI / REKONSILIASI**.
4. **Lainnya diurutkan dengan:**

`skor(w) = (D × K × B) / (U × R)`

dengan `D ∈ [1..5]` jangkauan pengguna pada alur harian, `K ∈ {3 = pendalaman, 1 = halaman baru}`, `B ∈ {3 = berbukti uji, 1 = argumen}`, `U` usaha (hari), dan `R ∈ [1..5]` risiko klinis/privasi. **WIP maksimum: 1 lane tulis aktif per agent, <= 3 PR terbuka per agent, umur branch < 72 jam.**

### 7.2 Syarat Mutlak Uji (*Sabotage-First Contract*)
Setiap aturan baru wajib memiliki 4 kelas bukti terotomatisasi:
1. **Positif** (jalur valid berhasil tepat sesuai nilai referensi eksak),
2. **Negatif** (data lintas-`ownerId`, token kedaluwarsa, parameter di luar batas ditolak tertutup / fail-closed),
3. **Batas** (`390x844`, angka `0` vs `null/undefined`, kuota penuh, offline),
4. **Kontrol Sabotase** (saat penjaga dimatikan sementara, tes gagal dengan nama kriteria yang jelas).

### 7.3 Resolusi Konflik Antar Agent
1. Reproduksi kegagalan lokal pada **SHA yang sama**.
2. Pisahkan apakah kerusakan berasal dari `main` atau dari branch PR.
3. Hanya pemilik berkas / `Claude Orchestrator` yang melakukan penyatuan lintas PR (berdasarkan bukti terukur: *pass test + F2 metrics + diff terkecil*, bukan opini model).
4. **Dilarang `git push --force` atau commit penimpa riwayat pada `main`.**

---

## 8. Peta Jalan Eksekusi Terurut (`Fase A -> Fase F`) & Pembagian Lane Langsung

| Fase | Fokus Utama | Tugas & Pemilik Lane (Tanpa Konflik Berkas) | Syarat Keluar Terukur |
|---|---|---|---|
| **Fase A (Aktif)** | **Hijaukan `main` & Stabilisasi Infrastruktur 24/7** | **Pemilik:** Alihkan DNS `panaceamed.id` di Cloudflare kembali ke Vercel (`#3071`) + aktifkan GitHub Branch Protection pada `main` + catat klaim lane di `TASK_BOARD`.<br>**Claude:** Merge berurutan `#3075` (legibility `#/fitness-hub`), `#3071` (docs CF), `#3070` (Home quote no-shift), `#3068`/`#3067` (lazy bundle), `#3073` (QR/Code128 asli).<br>**CLI Gemini:** Turunkan `request count` & byte awal pada rute `F2` (lazy-load `localRecovery` / `deviceRegistry` di `store.tsx`, naikkan seluruh tombol `<44px` di `Shell` & `HolisticRecoveryModalities`, selaraskan `QrHealthPassModal` ke engine `#3073` & hapus token EMV simulasi) **setelah** PR `#3075/#3068/#3073` mendarat.<br>**Gemini Chat:** Verifikasi & kritik PR perbaikan `F2` dan audit kebenaran UX.<br>**Argon:** Reproduksi & perbaiki smoke test Poli (`QA No observations`). | `UX Audit F2`, `perf-audit`, `Stabilization`, dan semua `1828+` QA tests **100% HIJAU** pada `origin/main` + `panaceamed.id` online tanpa laptop Mac |
| **Fase B** | **Satu Pintu Harian & Identitas Terpadu** | **Hydrogen:** Konsolidasi tampilan 1-angka + 1-tren jujur (`empty != zero`) di Home & Body Numbers.<br>**CLI Gemini:** Integrasikan QR/Barcode `#3073` ke kartu pasien, sinkronisasi profil WebAuthn/TOTP <-> endpoint server (`/api/auth/*`), & profil BLE standar berikutnya (`0x2A5E`, `0x2A9D`, `0x2A9C`).<br>**Gemini Chat:** Validasi standar ISO 18004, Bluetooth SIG, & teks awam UU PDP. | `<= 2 ketukan` ke 6 zona utama; sinkronisasi perangkat & backup/restore server lulus E2E |
| **Fase C** | **Pemulihan Holistik & Performa Atletik** | **CLI Gemini & Hydrogen:** Pisahkan ketat catatan sesi user-logged (`HBOT`, `WBC`, `PBM`, `X-Tone`, `X-Cryo`) dari klaim terapi/dosis otomatis; hubungkan korelasi retrospektif dengan HRV/tidur/RHR dari `/api/workouts` & `/api/keadaan-longitudinal`.<br>**Argon:** Perkuat RBAC berbagi data atlet <-> pelatih <-> dokter dengan pencabutan izin instan. | Nol klaim dosis/terapi; 100% riwayat latihan terpulihkan antar perangkat untuk pemilik sah |
| **Fase D** | **Closed-Loop Episode Klinis Tunggal (Inti Bisnis)** | **Argon & CLI Gemini:** Alur terpadu `Identitas -> AI-EMR (draf) -> Tanda Tangan Klinisi -> Rujukan Lab -> Hasil Kembali ke Episode -> Follow-up` tersambung fixture FHIR R4 / SATUSEHAT.<br>**Gemini Chat:** Audit risiko diagnostik & skrip uji kesalahpahaman pasien. | 1 episode komparatif terukur memperlihatkan pengurangan ketukan & waktu kerja nyata |
| **Fase E** | **Kliring Transaksi & Penjaminan Berlisensi** | **CLI Gemini & Partner Integrasi:** Hubungkan status klaim kanonik ke adapter QRIS / PJP / BPJS Kesehatan / Midtrans yang ada di backend **tanpa** menerbitkan alat bayar sendiri & **tanpa** penolakan kasus emergensi berbasis margin. | Idempotensi ledger, jejak audit lengkap, persetujuan mitra uji |
| **Fase F** | **Ekspansi Yurisdiksi Global & Validasi Independen** | **Semua Agent + Peninjau Eksternal Manusia:** Uji eksternal `E3/E4` (klinisi independen untuk C6, uji penetrasi, audit hukum lintas negara, & publikasi terbuka bukti komparatif). | Seluruh `G1..G9` hijau dengan bukti eksternal -> layak Rilis Publik |

---

## 9. Daftar Periksa Tindakan Pemilik Sekarang (Tidak Bisa Diwakilkan AI)

1. **Infrastruktur DNS (Hentikan Error 1033):** Di Cloudflare Dashboard (`dash.cloudflare.com`), alihkan DNS `panaceamed.id` & `www.panaceamed.id` dari Tunnel CNAME ke target Vercel produksi (`cname.vercel-dns.com` / `panaceamed.vercel.app`) — panduan lengkap disiapkan pada PR `#3071`.
2. **Aktifkan Proteksi Branch `main`:** Wajibkan Pull Request + lulus exact-head CI sebelum merge agar `main` tidak lagi merah oleh commit langsung.
3. **Verifikasi Kredensial Render & MongoDB:** Pastikan backup berkala MongoDB Atlas & variabel env (`MONGODB_URI`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `MIDTRANS_*`, `VAPID_*`) terkelola rapi di dashboard Render.
4. **Tetapkan Penanggung Jawab Hukum/Regulasi & Klinis Fase Akhir:** Siapkan dokumen UU PDP (persetujuan, retensi, penghapusan), registrasi PSE, serta tinjauan klinis independen sebelum memasuki Tahap 2/3.
5. **Kunci Penugasan Lane:** Tandai baris penugasan **Hydrogen** dan **Argon** pada `docs/governance/TASK_BOARD.md` setelah Claude menggabungkan antrean stabilisasi `Fase A`.

---

## 10. Amandemen A (2026-11-16, Claude Orchestrator) — dilipat ke direktif ini

Amandemen ini menggantikan draf amandemen terpisah (PR #3077, ditutup) agar hanya ada **satu direktif kanonik**.
Bila bertentangan dengan bagian 0–9 soal peran, gerbang `G1..G9` dan tahap rilis, **bagian 0–9 menang**.

### 10.1 Keputusan Pemilik (2026-11-16, di chat)
1. Direktif ini (V2) adalah **satu-satunya direktif kanonik**; perubahan datang sebagai PR ke berkas ini.
2. Deskripsi peran **Hydrogen** (lane kedalaman biologis & observabilitas) dan **Argon** (lane klinis, interop, fitness, E2E) pada bagian 3 **benar dan final**.

### 10.2 Koreksi dan penegasan fakta (bukti 2026-11-16)

| Pernyataan | Status | Bukti |
|---|---|---|
| Backend produksi hidup dan menyimpan data di MongoDB | **Terkonfirmasi** | `GET https://panaceamed-backend.onrender.com/api/health` → `"penyimpanan":"mongo"`, `"penyimpananSehat":true`, `s5xx:0` |
| Frontend yang disajikan memanggil backend itu | **Terkonfirmasi** | `VITE_API_URL` di `.env.local` menunjuk host Render; string host ada di `dist/assets/index-*.js` |
| `panaceamed.id` disajikan dari `vite preview` di laptop pemilik lewat Cloudflare Tunnel | **Terkonfirmasi** | `~/.cloudflared/config.yml` (ingress `127.0.0.1:4399`), `ps`, tunnel mati → 502/1033 |
| `server/data.json` di checkout adalah data produksi | **Salah.** Itu berkas dev lokal berisi 3 pengguna uji | inspeksi baca-saja |
| Sesi peramban pemilik terautentikasi ke backend | **Belum terverifikasi** | pemilik harus masuk ulang dengan akun yang sama |

Pemulihan akun dan log lama = **masuk dengan akun yang sama** agar aplikasi membaca dari backend, lalu bandingkan jumlah
dengan salinan lokal. Tidak ada agent yang membaca, mengekspor atau mengubah data Mongo produksi tanpa instruksi eksplisit
pemilik dan metode baca-saja yang tercatat audit. Rujukan `ORCHESTRATOR_DIRECTIVE_GEMINI_HANDOFF.pdf` di hierarki
otoritas tidak ditemukan di repositori pada sesi ini; jangan dianggap ada sampai dibuat.

### 10.3 Protokol perselisihan antar-agent
1. Tulis klaim + bukti (file:baris, perintah, URL). Pangkat bukan bukti.
2. Peninjau mereproduksi bukti; yang tak bisa direproduksi ditandai `{unverified}` dan tidak memblokir.
3. Bila tetap berselisih, Orkestrator memutuskan dengan urutan: keselamatan > integritas data > bukti > reversibilitas > kesederhanaan > kecepatan, alasan ditulis di PR.
4. Bila Orkestrator pihak yang berselisih atau cakupan/risiko berubah, Pemilik memutuskan; agent lain lanjut pada baris yang tidak terblokir.

### 10.4 Pemicu ketidakstabilan (berhenti, isolasi, lapor pemilik)
`main` merah; auth/RBAC/consent/audit/tanda tangan berubah tanpa tes; PHI atau rahasia di diff; tes dihapus/di-skip/dilonggarkan; agent non-Claude mengedit branch agent lain; penyimpanan kebenaran pasien kedua; klaim validitas klinis/lisensi/kepatuhan; push langsung ke `main`; dokumen otoritas ganda.

### 10.5 Aturan isolasi worktree (insiden nyata 2026-11-16)
Bukti: branch checkout bersama diganti agent paralel di antara dua perintah; commit `06179efc5` nyasar ke nama branch agent lain dan terdorong ke remote (`feat/perf-ux-interop-split`). Tiga dokumen direktif juga ditulis paralel.
1. Setiap agent bekerja di `git worktree` sendiri: `git worktree add ../Panaceamed.id-wt-<agent>-<tugas> -b <tipe>/<scope> origin/main`; jangan `git switch/checkout` di checkout utama.
2. Sebelum commit/push, pastikan branch dalam perintah yang sama: `test "$(git branch --show-current)" = "<branch>"`, dan dorong dengan refspec jelas `git push -u origin <branch>`; jangan `push HEAD` dari checkout bersama.
3. Sebelum menulis dokumen otoritas baru, cari PR dan branch remote (`gh pr list`, `git branch -r`) dan klaim baris TASK_BOARD.
4. Bila branch/commit nyasar tercipta, pembuatnya melapor ke pemilik dengan SHA; hanya Claude yang membersihkan ref agent lain, tanpa force.

### 10.6 Gerbang tambahan (DIUSULKAN; butuh persetujuan pemilik, `G1..G9` tidak berubah)
| Gerbang | Tambahan | Alasan |
|---|---|---|
| `G3+` | **Latihan durabilitas data:** masuk di peramban bersih, pulihkan, bandingkan jumlah rekaman dengan ekspor; uji restore backup Atlas | Pemulihan bergantung pada backend; restore belum terbukti |
| `G9+` | **Alur dukungan & penghapusan:** laporan penyalahgunaan, takedown, hapus data pengguna, kontak insiden, diuji sekali | Pengguna publik butuh jalur pemulihan; kewajiban UU PDP dikonfirmasi penasihat hukum |
| **`G10`** | **Hak aset:** logo, video tutorial, data ICRP dibersihkan atau dicabut (EXT-D8-A/B/C) | Risiko hukum di `EXTERNAL_GATES.md` |
| **`G11`** | **Uji beban & kegagalan pada batas pengguna rencana + pagar bandwidth/biaya** | Layanan Render ditangguhkan karena bandwidth 2026-10-29 (`TASK_BOARD.md` T-OPS-BW-01) |

### 10.7 Tangga menuju skala platform (tiap anak tangga butuh bukti sebelum yang berikutnya)
1 Inti kepercayaan (identitas, consent, audit, data awet) · 2 Satu kebiasaan harian yang berulang (retensi terukur) · 3 Satu episode institusi terukur · 4 Interoperabilitas (FHIR/DICOM/fixture perangkat, ekspor/impor, situs kedua) · 5 Rujukan lintas situs & adaptor pembayar per yurisdiksi · 6 API/SDK terbuka dengan sandbox · 7 Pembayaran/klaim hanya lewat mitra berlisensi, dikonfirmasi penasihat hukum · 8 Operasi teraudit pada skala besar. Melompati anak tangga = cacat. Tanpa klaim dominasi, kepatuhan atau lisensi tanpa bukti.

### 10.8 Bootstrap Gemini (CLI & Chat)
1. Baca `AGENTS.md`, `CLAUDE.md`, `docs/governance/README.md`, lalu direktif ini.
2. Nyatakan lane dan apa yang benar-benar bisa dijalankan. Agent chat hanya memberi usulan dan menandai fakta ingatan `{unverified}`.
3. Agent CLI: buat worktree sendiri (10.5), jalankan `git fetch`, `gh pr list`, `node scripts/qa/acceptance-v2.mjs`, klaim satu baris TASK_BOARD, baru kerja.
4. Laporan per tugas: SHA, perubahan, bukti, PR/branch, blocker atau satu keputusan yang dibutuhkan (≤120 kata).
