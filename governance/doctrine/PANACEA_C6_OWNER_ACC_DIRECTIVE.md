# ARAHAN PEMILIK — ACC KLINIS C6 (17 OKTOBER 2026)

> **PERNYATAAN PEMILIK YANG DICATAT DARI INSTRUKSI LANGSUNG: “SAYA, DOKTER RIZKY MUHAMMAD ASRIZAL, SEBAGAI PEMILIK PANACEA DAN KLINISI, MENYATAKAN TELAH MEMERIKSA DAN MENG-ACC RUMUS-RUMUS DASAR C6 YANG ADA, SERTA MATERI ANATOMI DAN FISIOLOGI DASAR YANG SAYA TINJAU. INVENTARIS SUMBER DAN LISENSI TELAH SAYA SEDIAKAN. JANGAN MEMINTA PROFESOR ATAU DOKTER SPESIALIS MENGULANG VERIFIKASI RUMUS DASAR SEBAGAI SYARAT UNTUK MELANJUTKAN ENGINEERING.”**

**Keputusan operasional untuk semua AI agent (termasuk Claude Code, Codex, dan cloud):**
1. **ACC pemilik diakui sebagai keputusan review internal.** Jangan merendahkan kompetensi yang dinyatakan pemilik, memaksakan gelar spesialis untuk rumus dasar, atau mengulang permintaan ACC/tanda tangan secara administratif. C6 **bukan blocker dan bukan tugas manusia yang tersisa di Alpha**. Lanjutkan implementasi, cek rumus terhadap referensi, pengujian numerik, input/range, error dan negative cases dengan AI.
2. **Review dasar tidak identik dengan validasi seluruh penggunaan klinis.** Pernyataan ini adalah self-attestation pemilik, bukan identitas/STR/SIP yang diverifikasi oleh GitHub, tanda tangan elektronik terautentikasi, atau validasi independen eksternal. Jangan membuat klaim tersebut atas nama pemilik. Penetapan reviewer/sumber/versi per-kalkulator yang belum terdokumentasi tidak boleh diisi dengan data fiktif.
3. **Jangan mengubah bukti menjadi klaim palsu.** Temuan terukur yang tersisa (misalnya implementasi koreksi natrium/defisit kalium yang saling berbeda, ambang tanpa sumber, atau penggunaan di populasi berisiko) harus diselesaikan melalui referensi, tes, atau pembatasan fitur. C6 tetap `DEFERRED_TO_CLINICAL_VALIDATION` di ledger formal dan `clinically_reviewed=false` untuk fungsi yang belum punya approval versi-terikat yang sah. Itu **tidak** membatalkan ACC internal pemilik dan **tidak** menghalangi Alpha engineering.
4. **Lisensi aset dan penggunaan pada pasien:** AI mengurus inventaris lisensi, sumber primer, atribusi, dan keterbatasan izin. ACC inventaris oleh pemilik bukan izin dari pemegang hak pihak ketiga. Tidak ada izin produksi/keputusan pasien, legal compliance, STR/SIP, atau keselamatan klinis yang direkayasa dari pernyataan ini.

**Pelaporan singkat yang wajib:** “C6 — ACC INTERNAL PEMILIK TERCATAT; ALPHA NON-BLOCKING; VALIDASI KLINIS FORMAL TERPISAH.” Jangan memasukkan C6 lagi dalam daftar pekerjaan engineering Alpha atau meminta professor/spesialis tanpa alasan risiko spesifik.

**Rujukan internal:** [kebijakan batas fase C6](PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md), [catatan penundaan](../../docs/alpha/CLINICAL_REVIEW_DEFERRAL.md), [dossier rekayasa kalkulator](../../docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md).

## Pembaruan pernyataan pemilik — 18 Oktober 2026 WIB

Pemilik menyatakan langsung: **“C6 sudah di validasi semuanya oleh reviewer saya, termasuk secara independen dan internal oleh saya.”** Catat seluruh cakupan C6 sebagai telah direview/ divalidasi menurut pernyataan pemilik, termasuk reviewer independen dan review internal. Jangan meminta pelaksanaan review ulang sebagai syarat melanjutkan engineering.

Pembaruan ini menggantikan asumsi bahwa pemilik baru menyatakan review internal. Identitas reviewer independen, laporan, tanggal review, dan versi kalkulator tidak disebutkan dalam pesan; jangan mengarang rincian tersebut. Konfirmasi pemilik ini tidak dengan sendirinya mengubah status ledger versi-terikat atau mengesahkan perubahan kode sesudah review. Tes numerik, input/range, regresi dan exact-head CI tetap dijalankan; status deferred Alpha yang sebelumnya diputuskan tetap sampai ada pembaruan ledger berbukti.
