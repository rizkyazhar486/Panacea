# Directive Orkestrator — Kerja Bersama Claude, Gemini CLI, Gemini Chat, Hydrogen dan Argon

Tanggal: 2026-11-16 · Status: **DIRECTIVE KERJA, bukan klaim kesiapan** · Berlaku untuk semua agent.
Otoritas: instruksi pemilik terbaru → batas keselamatan CLAUDE.md §8 → dokumen ini → rencana agent lama.
Dokumen ini tidak melemahkan `CLAUDE.md`, `AGENTS.md`, atau `docs/governance/`. Jika bertentangan, mereka yang menang.

## 0. Arah, dalam satu kalimat
Satu sistem operasi kesehatan longitudinal yang **sederhana, cepat, dapat dipercaya, dan berizin**: satu identitas dan satu keadaan pasien dipakai lintas kehidupan harian, poli, rawat inap, bedah, ICU, dan tindak lanjut.

Ambisi sebesar Alipay, WeChat, Visa atau Mastercard dibaca sebagai **skala dan keandalan infrastruktur**, bukan sebagai kendali atas manusia atau negara. Skala diraih dengan: dipakai setiap hari karena berguna, dipercaya karena jujur, dan tersambung lewat standar terbuka serta mitra berlisensi.

Kata "surveillance" dan "control" dalam arahan pemilik diterjemahkan menjadi **permissioned observability** (doktrin repo): data sah, berizin, bertujuan jelas, dapat dicabut, dan setiap tampilan menyebut asal serta tingkat kepastiannya. Tidak ada pemantauan diam-diam, tidak ada pelacakan tanpa persetujuan, tidak ada keputusan klinis otonom.

## 1. Fakta keadaan hari ini (per 2026-11-16, diukur, bukan perkiraan)
| Area | Keadaan terukur |
|---|---|
| Situs publik | `www.panaceamed.id` memberi **Cloudflare Error 1033**: konektor tunnel di Mac pemilik tidak hidup. Satu titik kegagalan. |
| CI `main` | Merah. UX Audit (target sentuh <44 px: 14 > 0; kontras teks: 18 > 0; screenshot `/fitness-hub`), perf-audit (`/health-data` 68 request > 59; `/clinical-hub` 69 > 65), dan smoke Poli (`QA No observations` tidak muncul; **direproduksi lokal pada build `main` 71957cd**). |
| Cara kerja | Ada commit langsung ke `main` dari laptop pemilik yang melewati gerbang PR, lalu semua PR lain gagal karena `main` merah. |
| Data pengguna | Disimpan di `localStorage` perangkat. Backup/restore aman sudah ada di `QrHealthPassModal` (hanya akun dengan email sama). Tidak ada penyimpanan server yang menjadi sumber kebenaran. |
| QR/Barcode | Mesin QR dan Code 128 asli ada di PR #3073 (belum digabung, diverifikasi dengan 4 dekoder independen). "EMV pass" di hub lama adalah **simulasi**, bukan pembayaran. |
| Bluetooth | Standar GATT (detak jantung, suhu, tekanan darah) ada. Perangkat vendor tertutup butuh fixture tertangkap. iPhone/Safari tidak punya Web Bluetooth. |
| Wi-Fi | Browser tidak bisa memindai atau menyambung perangkat Wi-Fi. Jalurnya: aplikasi vendor → Apple Health/Health Connect, atau gateway lokal. |
| Validasi klinis | C6 ditunda ke fase Clinical Validation (arahan pemilik). `clinically_reviewed=false` tetap. |

## 2. Pembagian kerja (anti-konflik)
### 2.1 Peran
- **Claude = orkestrator dan verifier.** Memilih urutan, memeriksa bukti, menggabungkan PR yang hijau, menolak yang tidak berbukti. Tidak mengerjakan lebih dari satu lane tulis pada satu berkas.
- **Gemini CLI = pelaksana lane implementasi** (kode, uji, CI) di cabang sendiri.
- **Gemini Chat = peneliti dan kritikus** (sumber, standar, regulasi, desain). Keluarannya berupa draf bersumber, bukan commit.
- **Hydrogen dan Argon = lane pelaksana** sesuai deskripsi tugas di `docs/governance/JOB_DESCRIPTIONS.md`. Jika belum ada, pemilik menugaskan satu lane per agent di `TASK_BOARD.md`.

### 2.2 Aturan tunggal-penulis (satu berkas, satu pemilik pada satu waktu)
1. Sebelum menyentuh berkas, periksa PR terbuka yang menyentuh berkas itu (`list_pull_requests`). Jika ada, **rekonsiliasi atau tunggu**, jangan duplikasi.
2. Satu cabang = satu perubahan logis. Nama: `feat|fix|refactor|test|docs|chore|hotfix/<scope>-<deskripsi>`.
3. **Dilarang push langsung ke `main`.** Pengecualian nol, termasuk pemilik, kecuali `hotfix/` lewat PR. Alasan terukur: commit langsung membuat `main` merah dan memblokir semua orang.
4. Berkas bersama yang sering bentrok (`ClinicalHub`, `UnifiedBodyWorkspace`, `BodyExposureOS`, `HealthProfile`, `store.tsx`) hanya diubah dengan **klaim lane tertulis** di `TASK_BOARD.md` (agent, cabang, berkas, tenggat 24 jam).
5. Serah-terima: setiap sesi berakhir dengan catatan satu halaman (apa selesai, bukti, yang diblokir, langkah berikut) di PR atau `TASK_BOARD.md`.

### 2.3 Gerbang merge (semua wajib, tanpa pengecualian)
- CI hijau pada **SHA terakhir**, cabang sudah memuat `main` terbaru, `mergeable_state` bersih.
- Uji positif **dan** negatif, nilai eksak, uji berpasangan; setiap gerbang baru disabotase dan harus gagal dengan nama.
- Dilarang melemahkan uji, baseline, atau ambang untuk membuat hijau. Baseline hanya boleh turun.
- Perubahan area klinis/keamanan/privasi menyebut batasnya di bagian "Risiko & batas".
- Agent tidak menggabungkan PR sendiri kecuali pemilik mengizinkan secara eksplisit (izin tetap yang berlaku saat ini hanya untuk PR Claude yang hijau penuh).

### 2.4 Kritik dan stabilitas
- Gemini Chat boleh dan **wajib** mengkritik setiap PR Claude; kritik dijawab dengan bukti atau perbaikan, bukan dibantah tanpa data.
- Klaim "novel", "pertama", "terbukti" memerlukan bukti pencarian (protokol Pioneer), bukan ingatan model.
- Persetujuan satu AI bukan validasi eksternal (`PANACEA_WORTHINESS_EVIDENCE_STANDARD`).

## 3. Kapan Panaceamed layak disebarluaskan (Go / No-Go)
Rilis publik hanya jika **semua** gerbang di bawah lulus dengan bukti. Hari ini jawabannya **TIDAK** (belum), karena G1, G2, G4 dan G5 belum terpenuhi.

| # | Gerbang | Kriteria lulus (terukur) | Keadaan |
|---|---|---|---|
| G1 | Ketersediaan | Situs publik terbuka dari hosting tanpa laptop (Vercel/Pages/Render) dengan uptime terukur ≥ 99,5% selama 14 hari; DNS dan SSL berpindah dari tunnel | Belum |
| G2 | `main` hijau | Semua gerbang CI hijau pada SHA `main` selama 7 hari berturut-turut; nol commit langsung | Belum |
| G3 | Data aman | Backup/restore teruji; migrasi `localStorage` → penyimpanan server berenkripsi dengan persetujuan; uji kehilangan data | Sebagian |
| G4 | Keselamatan klinis | Label klaim konsisten; tidak ada diagnosis/dosis/order otonom; keluaran AI tampil sebagai draf; jalur darurat menyebut batas | Sebagian |
| G5 | Privasi dan hukum | Kepatuhan UU PDP (persetujuan, hak akses/hapus, retensi), pendaftaran PSE, kebijakan privasi yang cocok dengan kontrol nyata, DPIA singkat | Belum |
| G6 | Keamanan | Audit dependensi, uji otorisasi (RBAC), tanpa rahasia di repo, pen-test ringan oleh pihak independen | Sebagian |
| G7 | Pengalaman | Dua ketukan ke fitur inti, 390×844 tanpa gulir horizontal, target sentuh ≥ 44 px, kontras AA, LCP/CLS/TBT sesuai ambang Web Vitals pada perangkat menengah | Belum |
| G8 | Bukti manfaat | Satu episode rawat jalan nyata diukur (waktu, kelengkapan, kepercayaan) melawan pembanding, dengan izin dan etika | Belum |
| G9 | Dukungan | Pemantauan kesalahan, rencana insiden, kanal bantuan, rollback (`docs/governance/ROLLBACK.md`) | Sebagian |

Rilis bertahap: (1) **tertutup**, 20–50 pengguna undangan, hanya fitur pelacakan pribadi; (2) **terbuka terbatas** setelah G1–G7 hijau; (3) **publik** setelah G8 dan G9. Klaim klinis publik menunggu fase Clinical Validation.

## 4. Urutan kerja (satu per satu)
**Fase A — Stabilkan (blokir semua lainnya).** Pemilik: Claude + satu lane Gemini CLI.
1. Pulihkan akses: pindahkan domain ke hosting statis (Vercel deploy `main` sudah hijau); backend ke Render. *Tindakan pemilik di Cloudflare/Vercel; agent menyiapkan panduan.*
2. Hijaukan `main`: smoke Poli (regresi identitas di `store.tsx`), perf (panel interop dan hub dimuat saat dibuka), target sentuh 44 px, kontras, screenshot `/fitness-hub`. Satu PR "restore green main".
3. Tutup jalur commit langsung: proteksi cabang `main` di GitHub (wajib PR + CI hijau).
4. Gabungkan #3075, #3068, #3070, #3071, #3073 satu per satu setelah `main` hijau.

**Fase B — Satu pintu harian (nilai bagi pengguna).**
5. Beranda: satu fokus, satu aksi utama; enam kategori kanonik (Human, Health, Clinical, Explore, Simulate, Records, For You).
6. Visual data ala Fitbit/Google Health: satu angka besar, satu grafik kecil, "tidak ada data" ditulis jujur (kosong ≠ nol); detail di balik disclosure.
7. QR/Barcode asli (#3073): pintasan personal ke layar, barcode MRN Code 128, pemindai dengan fallback jujur; GS1/EAN untuk kemasan obat pada tahap berikutnya.
8. Profil Bluetooth standar berikutnya: oksimeter (0x2A5E/0x2A5F), timbangan (0x2A9D), komposisi tubuh (0x2A9C) dengan provenance.

**Fase C — Pemulihan dan performa (wellness).**
9. Kartu modalitas pemulihan (hiperbarik, krioterapi, lampu merah, EMS, kriolokal): hanya **log sesi buatan pengguna/operator** dan korelasi dengan HRV, tidur, RHR milik pengguna. Tanpa dosis, tanpa klaim terapi, tanpa kendali perangkat otomatis.
10. Mode pelatih/atlet/klinisi: peran dan izin per pengguna (RBAC), data dibagi dengan persetujuan yang dapat dicabut.

**Fase D — Episode klinis tunggal (inti bisnis).**
11. Satu alur rawat jalan terverifikasi: identitas → catatan AI-EMR (draf) → tanda tangan klinisi → rujukan lab → hasil kembali ke keadaan yang sama → tindak lanjut. Diukur, bukan dijanjikan.
12. Interoperabilitas: FHIR R4 / SATUSEHAT melalui adaptor yang diuji dengan fixture.

**Fase E — Transaksi (hanya lewat mitra berlisensi).**
13. Pembayaran dan klaim: QRIS/e-wallet/asuransi lewat PJP dan penyelenggara berlisensi; Panaceamed menyimpan status kanonik klaim, bukan menerbitkan alat pembayaran sendiri. **Dilarang** menampilkan "kartu EMV", PAN, atau token palsu. Keuangan tidak boleh menolak perawatan hanya karena profitabilitas.

## 5. Meminimalkan alur kerja, UI/UX dan pembagian peran
1. **Aturan dua ketukan:** setiap fitur utama dapat dicapai ≤ 2 ketukan dari Beranda.
2. **Satu layar, satu pertanyaan:** SEE → ASK → ZOOM → WHY → WHAT IF → ACT; jawaban dahulu, detail di balik disclosure.
3. **Satu kalimat per baris** di gulir utama; istilah teknis di balik tombol "i".
4. **Dua proyeksi:** mobile (kartu, sheet bawah, target ≥ 44 px) dan desktop (tabel, paginasi, modal) memakai komponen adaptif bersama.
5. **Peran:** pasien melihat milik sendiri; klinisi menulis dan menandatangani; operator fasilitas mencatat sesi; admin mengelola akses. Tidak ada aksi tulis klinis di layar pasien.
6. **Satu sumber kebenaran:** tidak ada penyimpanan data kedua. Halaman adalah proyeksi dari keadaan kanonik.
7. **Fitur hanya masuk bila** ada pengguna bernama, masalah nyata, cara mengukur manfaat, dan alasan tak bisa ditangani kapabilitas yang ada. Kedalaman mengalahkan jumlah halaman.
8. **Keterikatan sehat:** motivasi lewat tujuan pengguna sendiri (streak, ringkasan mingguan, pengingat opt-in). Dilarang pola gelap (dark pattern), pemicu dopamin manipulatif, atau pengukuran keterlibatan yang mengorbankan kesejahteraan pengguna.

## 6. Batas keras (tidak bisa ditawar)
- Tidak ada diagnosis, dosis, resep, order, atau keputusan darurat otonom; keluaran AI = draf sampai klinisi teridentifikasi menandatangani.
- Pisahkan measured / reference / simulated / derived / unsupported; tidak ada data, angka, sitasi, atau kredensial karangan; tidak tahu = tampil "tidak diketahui".
- Tanpa peniruan perangkat, tanpa UUID/protokol vendor tanpa fixture, tanpa data wearable palsu.
- Tidak ada pemantauan diam-diam; persetujuan, audit, retensi terbatas, pencabutan.
- Tanpa PHI atau rahasia di repo (repo publik), log, atau commit.
- Pemulihan data tidak boleh melewati pemeriksaan `ownerId` antar akun; impor harus eksplisit dan terbatas pada pemilik yang sama.
- Pemilik tidak melewati kontrol Visit; keputusan "siap rilis" mengikuti gerbang §3, bukan jumlah fitur.

## 7. Cara pakai dengan Gemini
1. Gemini CLI membaca `CLAUDE.md`, `AGENTS.md`, dokumen ini, dan `TASK_BOARD.md` sebelum bekerja.
2. Setiap tugas: klaim lane → cabang → PR kecil → bukti uji → serah-terima.
3. Gemini Chat dipakai untuk riset sumber dan kritik; hasil dicatat sebagai draf bersumber dan diverifikasi sebelum menjadi kode.
4. Konflik antar agent diselesaikan dengan **bukti terukur**, lalu keputusan pemilik; bukan dengan menimpa pekerjaan agent lain.
5. Laporan kemajuan hanya memuat: SHA/nomor PR, kapabilitas berubah, hasil uji, status CI, blocker. Tanpa persentase karangan.

## 8. Yang harus dilakukan pemilik (tidak bisa diwakili agent)
1. Hidupkan `cloudflared` di Mac atau pindahkan DNS ke Vercel (lihat `docs/engineering/PUBLIC-SITE-DOWN-CLOUDFLARE.md`).
2. Aktifkan proteksi cabang `main` (wajib PR + CI hijau).
3. Simpan backup `localStorage` dari Console sebelum mengubah apa pun di browser.
4. Tetapkan lane untuk Hydrogen dan Argon di `TASK_BOARD.md`.
5. Tunjuk penanggung jawab hukum/regulasi (UU PDP, PSE, SaMD) sebelum rilis terbuka.

## 9. Kerangka algoritmik (agar keputusan dapat diulang, bukan selera)

### 9.1 Pemilihan pekerjaan berikutnya (deterministik)
Untuk setiap kandidat `w`, jalankan berurutan; berhenti pada aturan pertama yang cocok.
1. **Blokir keselamatan/keamanan/privasi/data hilang** → kerjakan dahulu.
2. **`main` merah atau situs tidak terjangkau** → kerjakan dahulu (memblokir semua agent).
3. **Duplikat PR terbuka atau lane diklaim agent lain** → lewati, rekonsiliasi.
4. Sisanya diurutkan menurut `skor(w) = (D × K × B) / (U × R)`, dengan
   - `D` = jumlah pengguna bernama yang tersentuh pada alur harian (1–5),
   - `K` = kedalaman: memperdalam kapabilitas yang ada = 3, menambah halaman baru = 1,
   - `B` = bukti: terukur dengan uji = 3, hanya argumen = 1,
   - `U` = usaha (hari kerja), `R` = risiko klinis/privasi (1–5).
   Skor hanya mengurutkan antrean; **tidak pernah** membatalkan gerbang §3 atau §6.
5. **Batas kerja-berjalan (WIP):** satu lane tulis per agent, maksimal 3 PR terbuka per agent, umur cabang < 3 hari.

### 9.2 Keputusan rilis (konjungtif, bukan rata-rata)
`rilis(tahap) = G1 ∧ G2 ∧ … ∧ Gn` untuk gerbang yang disyaratkan tahap itu (§3). Satu gerbang gagal berarti **tidak rilis**; kekuatan gerbang lain tidak mengompensasi. Setiap gerbang punya: pengukur (skrip/CI), ambang, tanggal ukur, SHA, pemilik. Hasil `lulus` tanpa bukti yang dapat dibuka ulang dianggap `gagal`.

### 9.3 Penyelesaian konflik (urutan bukti)
1. Reproduksi kegagalan secara lokal pada SHA yang sama. 2. Tentukan apakah merah juga pada `main` (bukan salah PR). 3. Perbaikan di lane pemilik berkas. 4. Bila dua agent berselisih: ukur, pilih yang terukur lebih baik; bila seri, pilih perubahan lebih kecil dan lebih mudah dibatalkan. 5. Pemilik memutuskan hanya bila 1–4 tidak menentukan. Tidak ada force-push, tidak ada penimpaan riwayat.

### 9.4 Siklus kerja tetap
`PINDAI → PETAKAN → CELAH → PRIORITAS (§9.1) → SATU IRISAN VERTIKAL → IMPLEMEN → UJI (positif, negatif, batas, sabotase) → BUKTI → PR → CI exact-head → GABUNG → UKUR ULANG`. Hasil negatif dilaporkan sebagai negatif.

## 10. Peta kebutuhan dasar manusia di bidang kesehatan (apa yang harus ditutup OS)
Disusun dari kebutuhan paling mendasar ke paling tinggi. Kolom "Nilai fundamental" adalah alasan fitur boleh ada; kolom "Tahap" mengacu §4.

| Tingkat | Kebutuhan manusia | Kapabilitas OS | Nilai fundamental yang diukur | Tahap |
|---|---|---|---|---|
| 1 Bertahan hidup | Darurat, obat, alergi, kontak | Kartu darurat opt-in, pengingat obat, jalur ke fasilitas | Waktu ke informasi kritis; nol data karangan | B, D |
| 2 Aman | Identitas, privasi, data tidak hilang | Identitas tunggal, backup/restore, persetujuan | Tingkat pemulihan data; nol kebocoran lintas akun | A, B |
| 3 Pantau diri | Tidur, aktivitas, vital, berat | Perangkat standar (BLE), impor Health/Health Connect, visual minimal | Kelengkapan data; "tidak ada data" jujur | B |
| 4 Paham | Mengerti arti angka dan penyakit | Penjelasan bersumber, WHY/WHAT IF terisolasi, edukasi tingkat buku teks | Skor pemahaman pengguna dibanding pembanding | B, D |
| 5 Berobat | Kunjungan, resep, lab, rujukan | AI-EMR draf, tanda tangan klinisi, rujukan, hasil kembali | Waktu episode, kelengkapan, kepercayaan | D |
| 6 Bayar | Klaim, biaya, asuransi | Status klaim kanonik + adaptor mitra berlisensi | Waktu klaim; tanpa penolakan perawatan karena profit | E |
| 7 Pulih dan tampil | Pemulihan, olahraga, performa | Log modalitas pemulihan + korelasi HRV/tidur/RHR milik pengguna | Perubahan terukur pada metrik milik pengguna (bukan klaim terapi) | C |
| 8 Berkembang | Longevitas, tujuan, komunitas | Tren pribadi, tujuan, pengingat opt-in, mode pelatih/klinisi | Retensi sehat: kembali karena berguna, bukan karena dipaksa | C, D |

Aturan penutupan: sebuah tingkat dianggap "tertutup" hanya bila ada alur ujung-ke-ujung yang diuji dan diukur untuk pengguna bernama. Tingkat 1–3 harus tertutup sebelum rilis terbuka; tingkat 5–6 butuh mitra dan izin regulasi.

## 11. Mengapa skala Alipay/WeChat/Visa dapat dicapai secara sah
- **Jaringan, bukan kendali:** nilai Visa/Mastercard datang dari standar bersama, kepercayaan, dan penyelesaian yang andal. Padanannya di sini: identitas dan keadaan kanonik, standar terbuka (FHIR, SATUSEHAT, GATT, QR/GS1), dan jejak audit.
- **Pintu harian lebih dulu:** WeChat/Alipay tumbuh dari kegunaan harian (pesan, bayar, peta). Padanannya: satu layar harian yang berguna dalam ≤ 2 ketukan, lalu layanan klinis dan pembayaran di atasnya.
- **Kepercayaan sebagai produk:** setiap angka punya asal, waktu, dan kepastian; kegagalan data ditampilkan, bukan ditutupi.
- **Pertumbuhan terukur:** perluasan per negara hanya lewat adaptor yurisdiksi dan mitra berlisensi, masing-masing dengan fixture dan gerbang sendiri.
- **Hal yang tidak dilakukan:** mendominasi dengan memaksa, mengumpulkan data tanpa izin, menerbitkan instrumen keuangan sendiri tanpa lisensi, atau menyatakan keunggulan tanpa bukti pembanding.
