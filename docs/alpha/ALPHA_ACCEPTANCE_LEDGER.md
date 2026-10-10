# Alpha acceptance ledger

> Dihasilkan dari `governance/ALPHA_ACCEPTANCE_LEDGER.json` (jangan edit tangan; jalankan `UPDATE_LEDGER=1 node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/alpha-ledger.mts`).

**Alpha completion: 11 / 43 = 25.6%** (baseline main `4b2009a1f`, 2026-10-10).

Disetujui: Product Owner (arahan eksekusi 2026-10-10). Baseline awal oleh Sonnet Cloud dari bukti yang ada; menunggu konfirmasi Sol atas penyebut. Kriteria dapat DITAMBAH oleh pemilik; tidak boleh dikurangi tanpa persetujuan pemilik.

## Kebijakan penghitungan

Bobot sama (1 per kriteria). Hanya status VERIFIED yang diberi kredit. REPORTED, NOT_CHECKED, NOT_STARTED, BLOCKED, dan PENDING_CLINICAL_REVIEW bernilai 0 tetapi tetap masuk penyebut. Kriteria tidak boleh dihapus untuk menaikkan persentase.

Persentase tidak mengalahkan gerbang yang gagal: Alpha tidak dinyatakan 100% sebelum seluruh gerbang wajib lulus, termasuk tinjauan klinis yang terpisah.

## Lingkup Alpha (disetujui)

- Panacea One OS: alur klinis longitudinal dari identitas pasien hingga tindak lanjut
- Lab & Referral Closure: penerimaan, penyimpanan persisten, review klinisi, komunikasi, penutupan terverifikasi
- Clinical Calculators: fungsi, validasi, regression, penandaan status review
- Body Exposure Alpha: anatomi seluruh tubuh bertahap, interaksi 3D, layer dasar, navigasi, WALK/RUN teruji; modul belum tervalidasi berlabel
- Platform Reliability: auth, authorization, audit trail, keamanan data, UI 390×844, CI/CD, verifikasi deployment

## Ringkasan status

| Status | Jumlah |
|---|---|
| VERIFIED | 11 |
| REPORTED | 7 |
| NOT_CHECKED | 14 |
| NOT_STARTED | 10 |
| BLOCKED | 0 |
| PENDING_CLINICAL_REVIEW | 1 |

## Panacea One OS (0 / 8)

| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |
|---|---|---|---|---|---|
| A1 | Satu identitas pasien dan satu state longitudinal | Satu pasien uji memiliki satu identitas; encounter, anamnesis, dan hasil merujuk ID yang sama (diuji lewat API, bukan UI saja) | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A2 | Encounter dibuat dan dipersist di backend | Encounter yang dibuat tetap ada setelah restart server dan dapat dibaca ulang oleh pengguna berwenang | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A3 | Anamnesis tercatat dengan provenance | Jawaban anamnesis tersimpan bersama penulis, waktu, dan sumber; perubahan membuat versi baru, bukan menimpa | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A4 | Pemeriksaan dikendalikan klinisi | Entri pemeriksaan hanya dapat dibuat/diubah oleh peran klinisi terotorisasi; peran lain ditolak (tes negatif) | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A5 | Dokumentasi berbantuan AI berstatus draf | Keluaran AI tersimpan sebagai draf, tidak pernah sebagai catatan bertanda tangan, sampai klinisi teridentifikasi menyetujui | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A6 | Persetujuan dan tanda tangan klinisi | Rencana klinis menjadi aktif hanya setelah tanda tangan klinisi; percobaan tanpa tanda tangan ditolak dan tercatat | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A7 | Tindak lanjut terjadwal | Tindak lanjut dapat dibuat dari rencana bertanda tangan dan muncul pada daftar kerja pemilik yang benar | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |
| A8 | Satu perjalanan E2E lulus | Satu skenario terskrip dari identitas hingga tindak lanjut lulus di CI dengan persistensi nyata (bukan mock UI) | NOT_CHECKED | Sol (backend) / Sonnet (UI setelah kontrak) | Ada bukti tingkat unit di server/uji (carePlanFhir, carePlanIdem, authAccess) tetapi bukan E2E; tanpa kredit. |

## Lab & Referral Closure (1 / 9)

| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |
|---|---|---|---|---|---|
| B1 | Aturan evaluasi penutupan hasil (model murni) | Hasil tertutup hanya bila bukti dicatat orang; bukti sistem tidak menutup; penyebut nol = tidak terukur | VERIFIED | Sonnet | PR #2310 (merge 2ba5c734d); scripts/qa/result-closure.test.mjs: 17 tes, 24 mutan terbunuh; Hanya model; belum terhubung ke backend atau UI. |
| B2 | Penyimpanan hasil lab persisten di server | Hasil yang diterima tetap ada setelah restart; PostgreSQL bila kompatibel dengan infrastruktur repo | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |
| B3 | State hasil received→pending_review→reviewed→communicated→closed | Transisi hanya sesuai urutan; transisi tak sah ditolak dengan alasan | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |
| B4 | Setiap perubahan status diaudit | Setiap transisi mencatat pelaku, peran, waktu, dan status sebelum/sesudah; log tidak dapat diubah oleh pelaku | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |
| B5 | RBAC pada hasil | Hanya peran berwenang dan pasien sendiri yang membaca; peran/tenant lain ditolak (tes negatif) | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |
| B6 | Lifecycle rujukan terpisah | Rujukan memiliki state, transisi, dan audit sendiri | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |
| B7 | UI tinjauan klinisi atas hasil | Klinisi dapat meninjau hasil dan mengubah state lewat API; UI memakai kontrak backend | NOT_STARTED | Sonnet (setelah kontrak tersedia) | Menunggu kontrak data dari Sol. |
| B8 | Komunikasi hasil ke pasien tercatat | Pengiriman penjelasan tercatat sebagai bukti oleh orang, bukan notifikasi otomatis | NOT_STARTED | Sol/Sonnet | Menunggu kontrak data dari Sol. |
| B9 | Metrik penutupan dihitung dari backend | Rasio penutupan memakai data server (bukan localStorage) dan tidak terukur bila penyebut nol | NOT_STARTED | Sol | Menunggu kontrak data dari Sol. |

## Clinical Calculators (4 / 7)

| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |
|---|---|---|---|---|---|
| C1 | Validasi masukan pada kalkulator yang dimigrasi | Kolom kosong = "belum diisi" (bukan 0); di luar rentang ditolak dengan alasan; tes positif, negatif, dan batas; mutasi terbunuh | VERIFIED | Sonnet | PR #2297 #2298 #2302 #2305 #2306 #2307 #2308 #2313 #2314 dan 7 mesin sebelumnya di src/domains/clinical-calculators/engine; scripts/uji/*.mts per mesin; Rentang adalah batas kewajaran, bukan ambang klinis. |
| C2 | Ratchet "kolom kosong → 0" mencapai nol | governance/EMPTY_FIELD_ZERO_BASELINE.json total = 0 | NOT_STARTED | Sonnet | Baseline 147 → 80 (28 berkas) di main 4b2009a1f; Sisa 80 belum diklasifikasikan klinis vs non-klinis. |
| C3 | Penandaan batas klaim pada kalkulator klinis | Setiap permukaan kalkulator terdaftar dan menampilkan batas klaim (bukan keputusan klinis tervalidasi) | VERIFIED | Sonnet | scripts/uji/clinical-claim-maturity.mts (bagian npm run uji, check CI `validate`) |
| C4 | Status review klinis eksplisit per fungsi | Fungsi yang memerlukan review ditandai PENDING_CLINICAL_REVIEW dan clinically_reviewed=false dapat diperiksa mesin | NOT_STARTED | Sonnet | Label batas klaim ada, tetapi belum ada registri status review per fungsi. |
| C5 | Regression suite kalkulator berjalan di CI | Tes kalkulator termasuk dalam check wajib `validate` dan merah bila gagal | VERIFIED | Sonnet | npm run uji (681/681 pada 4b2009a1f); check wajib `validate` |
| C6 | Rentang masukan ditinjau klinisi | Peninjau berwenang menandatangani rentang tiap kalkulator | PENDING_CLINICAL_REVIEW | Klinisi (belum ditunjuk) | Gerbang terpisah; tidak menghentikan pekerjaan teknis. |
| C7 | Halaman kalkulator diverifikasi di 390×844 | Per halaman: tanpa scroll horizontal, alasan penolakan tampil, hasil tidak tampil bila tak sahih | VERIFIED | Sonnet | Angka terukur di badan PR #2297 #2298 #2302 #2305 #2306 #2307 #2308 #2313 #2314; Hanya halaman yang saya ubah. |

## Body Exposure Alpha (3 / 10)

| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |
|---|---|---|---|---|---|
| D1 | Viewer 3D merender semua panel | Check wajib Body 3D Render Acceptance hijau pada main | VERIFIED | Sol (CI) / Local | Workflow organ-3d-acceptance.yml; hijau pada main 4b2009a1f |
| D2 | Pemuatan GLB valid | GLB dewasa laki-laki dan LOD memuat tanpa error halaman | REPORTED | Local | bodyexposure/qa_reports/web_budget.json; bodyexposure/qa_reports/gait_visual_browser.json (page_errors: []); Laporan ada; belum direproduksi independen oleh Cloud. |
| D3 | Anatomi seluruh tubuh dewasa laki-laki lulus gerbang kasar | gross_adult_male lulus | REPORTED | Local | bodyexposure/qa_reports/gross_adult_male.json; Reproduksi independen parsial (Sonnet Cloud, scripts/qa/glb-gross-reproduce.py, dari GLB publik LOD3 tanpa Blender): 3877 struktur, 3403 berpasangan (sama dengan laporan Local); hati x=-0,012, limpa +0,085, lambung +0,038; kaki y=-0,0004 m. Lateralitas: 6 pelanggaran pada metrik bbox-center, 5 di antaranya ≤2,1 mm dari garis tengah (artefak metrik kasar) dan 1 (VAGUS_NERVE_X.R, +20 mm) setara satu pengecualian terdokumen Local; Direproduksi sebagian saja (lateralitas, sisi organ, kaki). Interpenetrasi, rongga iga, dan kranium belum direproduksi, jadi tetap REPORTED. |
| D4 | Rangka perempuan (Visible Human/Denver) lulus gerbang kasar | gross_vhf_denver_ct lulus; lisensi CC BY 4.0 tercatat | REPORTED | Local | bodyexposure/qa_reports/gross_vhf_denver_ct.json; bodyexposure/PROVENANCE.md (lisensi dibaca 2026-10-10) |
| D5 | Layer visibility dan navigasi dasar | Orbit, pilih mesh, dan layer dapat dioperasikan lewat uji browser | VERIFIED | Sonnet (verifikasi) / Local | qa/canonical-body-check.mjs dijalankan Sonnet Cloud pada main 505c64339 (dev server Vite, Chromium swiftshader, host luar diblokir): lulus pada 390×844 dan 1440×900, tema terang dan gelap; keluaran OK; Catatan: skrip ini belum menjadi gerbang CI (hanya dijalankan manual); Cakupan asersi: pencarian→pilih struktur→panel provenans, mode isolate, potongan sagittal, dispersi sistem, kupas lapisan kulit→otot→tulang, ukur dua titik, preset kamera, ganti tubuh; Verifikasi fungsional; kecepatan bingkai di sandbox (5–7 fps, tanpa GPU) bukan penilaian performa. |
| D6 | WALK/RUN: kontinuitas loop | Jahitan loop rotasi ≤ batas teknis terdokumen; kecepatan batas dilaporkan | REPORTED | Local | bodyexposure/qa_reports/gait_loop_continuity.json (seam 0,0°); bodyexposure/qa_reports/gait_visual_browser.json; Alat sendiri menyatakan analisis kaki WALK/RUN eksperimental. Skrip QA di atas juga memutar klip Walk dan memeriksa kanvas berubah serta label "Recorded motion" (pemeriksaan fungsional, bukan kualitas gait). |
| D7 | WALK/RUN: selip kaki terukur dan dalam batas terdokumen | Selip kaki diukur dari rig dan berada dalam kriteria teknis yang ditetapkan | NOT_CHECKED | Local | bodyexposure/qa_reports/gait_foot_slide.json (WALK tumit RMS 24,5 mm; RUN belum terverifikasi); Basis ukur yang ada (bodyexposure/qa_reports/gait_foot_slide.json, dari Local, belum direproduksi): WALK tumit 1 fase tumpu / 4 bingkai, RMS 24,5 mm, maks 32,5 mm; WALK jari 3 fase / 29 bingkai, RMS 11,2 mm; RUN tumit 1 fase / 3 bingkai, RMS 0,6 mm; RUN jari 0 fase tumpu (tidak terukur); Ambang lulus belum ditetapkan siapa pun, jadi tidak ada angka yang bisa dinilai lulus atau gagal; status tetap NOT_CHECKED. Statistik tipis: WALK tumit hanya 1 fase tumpu dan RUN jari 0 fase. Keputusan yang dibutuhkan dari Local/Sol: ambang RMS dan maks (mm) per klip, serta jumlah minimum fase tumpu agar sebuah ukuran dianggap sah. |
| D8 | Provenance dan lisensi seluruh aset terpublikasi | Setiap aset publik punya sumber, lisensi, dan atribusi terbaca dari halaman resmi | REPORTED | Local | bodyexposure/PROVENANCE.md; scripts/uji/body-asset-provenance.mts |
| D9 | Modul belum tervalidasi berlabel jelas | Modul tanpa tinjauan anatomi berlabel (clinically_reviewed=false) dan tidak diklaim akurat secara klinis | REPORTED | Local | bodyexposure/DELTA.md; manifest clinically_reviewed |
| D10 | Viewer responsif di 390×844 | Halaman Body Exposure tanpa scroll horizontal dan tanpa error di 390×844 pada build main | VERIFIED | Sonnet (verifikasi) | qa/canonical-body-check.mjs dijalankan Sonnet Cloud pada main 505c64339 (dev server Vite, Chromium swiftshader, host luar diblokir): lulus pada 390×844 dan 1440×900, tema terang dan gelap; keluaran OK; Catatan: skrip ini belum menjadi gerbang CI (hanya dijalankan manual); Asersi scrollWidth ≤ innerWidth pada 390×844 dan batas ≤ 80 ribu segitiga muatan awal (terukur 40 ribu); Hanya halaman kanonik (/body-exposure/canonical via qa/canonical-body.html). |

## Platform Reliability (3 / 9)

| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |
|---|---|---|---|---|---|
| E1 | Autentikasi | Akses tanpa identitas ditolak; sesi tidak dapat dipalsukan (tes negatif) | REPORTED | Sol | server/uji/authAccess.uji.ts; Belum direproduksi oleh Cloud. |
| E2 | Otorisasi (RBAC) untuk data klinis | Peran yang salah ditolak pada setiap rute data klinis | NOT_CHECKED | Sol | server/uji/aksesKlinis.uji.ts |
| E3 | Audit trail perubahan klinis | Setiap perubahan klinis tercatat dengan pelaku dan waktu | NOT_CHECKED | Sol | - |
| E4 | Perlindungan data pasien | Tidak ada PHI di log/repo; retensi dan consent sesuai kebijakan | NOT_CHECKED | Sol | - |
| E5 | Home responsif 390×844 | Tanpa scroll horizontal; label ≥ 11 px (dua pengecualian 10 px terdokumen) | VERIFIED | Sonnet | PR #2321 (merge c85a91761): 0 elemen < 10 px dari 158; scripts/uji/home-teks-minimum.mts |
| E6 | Check CI wajib hijau pada exact head sebelum merge | 8 check wajib hijau pada head yang di-merge | VERIFIED | Sol/Sonnet | Setiap merge sesi ini (PR #2297–#2321) diperiksa pada exact head |
| E7 | Deployment staging terverifikasi | SHA yang berjalan di staging/produksi sama dengan SHA main dan smoke perjalanan kritis lulus | NOT_CHECKED | Sol | Workflow Vercel Prebuilt Production hijau, tetapi belum diverifikasi independen |
| E8 | Security Baseline hijau pada main | Security Baseline Enforcement hijau pada main | VERIFIED | Sol (CI) | Workflow security-baseline-enforcement.yml hijau pada main 4b2009a1f |
| E9 | Audit dependensi menolak laporan rusak | Gerbang audit dependensi gagal pada laporan malformed | NOT_CHECKED | Sol | PR #2301 terbuka (milik agen lain) |

