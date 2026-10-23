# Struktur domain `src/pages` dan `src/components`

Ditulis untuk: engineer frontend (Vika, Insan, dan agent) yang perlu tahu di mana sebuah file berada dan cara memindahkannya dengan aman.

## Kenapa dokumen ini ada

Dulu `src/pages` dan `src/components` datar: sekitar 250 dan 220 file lepas. Sulit membedakan mana komponen Landing, Dashboard, alur klinis/EMR, atau tool edukasi. Sekarang file dikelompokkan per domain fungsional, mengikuti alur menu di `components/layout/Shell.tsx`.

Rencananya berasal dari `blueprint-restrukturisasi-domain.md` (root workspace). Dokumen ini adalah catatan kondisi saat ini. Jika kode dan dokumen berbeda, periksa kode lalu perbarui dokumen ini.

## Satu aturan yang menjaga semuanya tetap jalan: stub re-export

Setiap file yang dipindah meninggalkan stub di path lamanya:

```ts
// src/pages/Login.tsx
export * from './landing/Login'
// ditambah baris ini hanya jika file aslinya punya default export:
export { default } from './landing/Login'
```

Jadi `import { Login } from '../pages/Login'` tetap jalan. Stub adalah **alat transisi**, bukan kondisi akhir. Kode baru sebaiknya mengimpor dari path domain yang sebenarnya. Import lama belum ditulis ulang.

## Peta folder

| Domain | `src/pages/` | `src/components/` |
| --- | --- | --- |
| Landing & auth | `landing/` — Landing, Login, Legal, NotFound | `landing/` — PricingSection, MedicalNews, ScrollCinematic |
| Dashboard & layout inti | `dashboard/` — Home, Beranda, Dashboard, Profile, Settings, AturFitur, SemuaFitur, Tutorial, Notifications | `layout/` — Shell, MenuPeran, PencarianGlobal, FabNavigasi, ErrorBoundary, AppStatus, OfflineBanner, Rangka; `dashboard/` — widget, NotificationBell, InstallApp, OnboardingTour, DailyQuoteBanner, PeringatanPenyimpanan |
| Klinis / EMR | `clinical/` — EMR, Chatbot, Consult, VisitOS, Planning, CareEpisode, hub, Hospitals, Pharmacy, Orders, EmergencyCard; `clinical/scores/` — 32 kalkulator dan skor (Braden, MELD, SOFA, Wells, dll.) | `clinical/` — ClinicalPatientContext, ConsultChat, KunjunganEmr, EmrTimelineLens, berbagi/impor lab, VisitCommandCenter, dll. |
| Tubuh / biomarker | `bodyhub/` — BodyExplorer beserta panelnya, Radiology, Electrophysiology, GeneInfo, PusatGizi, Longevity, BiologicalAge, dll. | `bodyhub/` — Body3D, BodyAllSystems3D, CardioAtlas3D, AtlasViewer3D, Cell3D, CardiacCycle3D, BilahTubuh |
| Kebugaran | `fitness/` — Athlete, CrossFit, Kalistenik, PusatLatihan, SleepPattern, HeartRateLog, Breathwork, dll. | `fitness/` — CatatanLatihan, ArtiKebugaran, ActivityShareCard |
| Pendidikan medis | `medstudy/` — MedStudyHub, OsceUkmppd, UsmleSection, KnowledgeBridge, PusatRujukan, PusatCatatan, dll. | `medstudy/` — CatatanStasiunKartu |
| Primitif UI | — | `ui/` — ui.tsx (Button, Badge, Card, dll.), Accordion, BottomSheet, Carousel, Reveal, Prosa, Logo, icons |

Folder yang sudah ada sebelumnya dan tidak disentuh: `pages/discovery`, `pages/emr`, `components/digital-twin`, `components/finance`, `components/frontier`, `components/growth`, `components/design-demo`. `pages/bodyhub` dan `components/dashboard`/`medstudy` sudah sebagian berisi file lain dari pekerjaan sebelumnya; file di tabel di atas ditambahkan ke folder yang sama, bukan menimpa isinya.

Belum dibuat karena di v1 belum ada isi yang jelas: domain `community/` dan `admin/` (Feed, Messages, Owner, Billing, dll. masih di root), serta `Register.tsx` (tidak ada di v1).

## Pengecualian dan hal yang belum selesai

- **`pages/GenomeLab.tsx` sengaja tetap di root.** Jika dipindah ke `pages/bodyhub/`, file ini terpindai oleh gate `scripts/uji/panel-punya-keterbatasan.mts`, yang mewajibkan setiap panel kuantitatif diakhiri catatan keterbatasan. GenomeLab belum punya catatan itu. Menulisnya adalah keputusan konten klinis (Rizky/Vika); jangan melemahkan gate-nya. Pindahkan setelah catatannya ada.
- **`components/ui/ui.tsx`** masih menampung Button, Badge, dan kawan-kawannya dalam satu file. Memecahnya menjadi file terpisah belum dilakukan (itu rewrite, bukan pemindahan).
- **Stub belum dihapus.** Sekitar 140 stub masih ada. Menghapusnya berarti menulis ulang import internal dan banyak tes; kerjakan sebagai perubahan tersendiri.
- **Sekitar 100 halaman dan 100 komponen masih di root** (community, admin, wellness, longevity, dan domain lain yang tidak ada di rencana). Tentukan dulu rumahnya sebelum dipindah.
- **Gate `scripts/uji/lapisan-tambal-dilarang.mts`** membekukan jumlah lapisan CSS/JS berversi (`*-vNN`) dan `!important` di `public/` dan `src/styles/` agar tidak bertambah. Lihat `docs/V1_REBUILD_VS_REFACTOR.md` (K2) untuk latar belakangnya. Ini bukan bagian dari restrukturisasi domain, tapi berjalan bersamaan.

## Cara memindahkan file dengan aman

1. `git mv src/pages/X.tsx src/pages/<domain>/X.tsx` (riwayat git tetap terjaga).
2. Di file yang dipindah, tambahkan satu tingkat `../` pada semua import relatif (`'../lib/a'` menjadi `'../../lib/a'`, `'./Sibling'` menjadi `'../Sibling'`). Periksa juga `import('…')` lazy, termasuk beberapa dalam satu baris.
3. Tulis stub di path lama (`export * from './<domain>/X'`, dan `export { default }` jika ada default export).
4. Perbaiki string path di `scripts/`: tes membaca source lewat path, misalnya `src/pages/X.tsx` menjadi `src/pages/<domain>/X.tsx`, dan string import literal (`'../domains/...'`, `'../lib/...'`) juga ikut bergeser kedalamannya.
5. Verifikasi (lihat bagian di bawah).

Jebakan yang ditemukan selama migrasi (termasuk saat mengulang migrasi setelah main maju ratusan commit):

- **Rebase berisiko tinggi.** Setelah commit restrukturisasi dibuat, jangan biarkan basis-nya jadi basi. Setiap file yang dipindah kemungkinan besar juga diubah isinya oleh commit lain di `main` — stub menimpa isi baru itu, sehingga `git rebase` menghasilkan konflik di hampir semua file yang dipindah, bukan cuma beberapa. Kalau ini terjadi, jangan resolve massal secara buta; lebih aman mengulang pemindahan dari `main` terbaru.
- **Tes yang membaca isi source** melihat stub, bukan file aslinya, jika path dibangun secara dinamis. Pakai `bacaSumber(jenis, nama)` dari `scripts/lib/sumberAsli.mjs`; fungsi ini mencari file asli (bukan stub) di `src/pages` atau `src/components`.
- **Tes yang mencocokkan string import dengan regex** (`import('./bodyhub/X')`, `from '../components/Y'`, `from '../domains/...'`, `from '../lib/...'`) rusak ketika file naik/turun satu tingkat. Perbarui string yang diharapkan ke path baru; jangan melonggarkan assertion-nya.
- **Baseline berbasis path** (misalnya `governance/EMPTY_FIELD_ZERO_BASELINE.json`) memetakan jumlah pelanggaran per file. Memindahkan file tanpa memperbarui kunci path di baseline membuat gate mengira filenya "baru" (hilang dari baseline) alih-alih "pindah". Baca stub pada path lama untuk tahu tujuannya, lalu ganti kunci lama dengan path barunya, pertahankan angkanya — jangan menjalankan mode regenerasi baseline secara membabi buta, karena itu bisa menyembunyikan kenaikan pelanggaran asli di balik pemindahan path.
- **File yang baru masuk ke folder yang dipindai** bisa memicu gate yang memindai folder itu (inilah yang terjadi pada GenomeLab). Baca gate-nya sebelum memindah.
- `components/ui.tsx` (stub) dan `components/ui/` (folder) berdampingan: `import '../components/ui'` di-resolve ke file stub lebih dulu. Jangan hapus stub tanpa menulis ulang import tersebut.

## Verifikasi

Jalankan dari `v1/`:

```
npx tsc -b
npx vite build
node --test scripts/qa/*.test.mjs
npm run uji                               # scripts/uji/*.mts
```

Kondisi saat migrasi ini selesai (branch `refactor/domain-structure-pages-components`, di atas main terbaru): `tsc` dan `vite build` lulus; 587 dari 587 tes `scripts/qa` lulus; `npm run uji` punya 1 file gagal (`baked-ao.mts`) yang sudah gagal sebelum pemindahan apa pun dimulai (baseline, tidak terkait restrukturisasi).

Ini hanya membuktikan bahwa restrukturisasi tidak merusak build dan gate yang ada. Ini tidak membuktikan apa pun tentang validitas klinis.
