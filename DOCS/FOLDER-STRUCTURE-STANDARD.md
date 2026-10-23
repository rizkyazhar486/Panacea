# Folder Structure Standard — batas file per folder

Status saat ini (bukti, bukan target): `src/components/` 235 file flat,
`src/lib/` 519 file flat, `src/pages/` root 217 file flat. Ini yang bikin
folder susah dinavigasi dan rawan duplikasi (gak ketemu helper yang udah
ada, jadi bikin baru lagi). Dokumen ini nambahin aturan konkret di atas
arahan umum `CLAUDE.md` §2 (Clean Architecture) dan §2.4 (jalur migrasi).

## Aturan inti

**Folder flat (tanpa subfolder) maksimal 15 file.** Begitu nambah file ke-16,
folder itu wajib dipecah jadi subfolder per domain/fungsi sebelum PR di-merge.

Kenapa 15, bukan 10 atau 50: di atas ~15 item, manusia udah gak bisa scan folder
sekali lihat buat nemu yang dicari — mulai ketergantungan search/grep, dan itu
tandanya udah ada beberapa konsep berbeda numpuk di satu tempat. 15 juga pas
buat precedent yang udah jalan di repo ini: `src/pages/landing/sections/` (9
file), `src/pages/fitness/` (17 file — lihat catatan di bawah), `src/domains/*`
(rata-rata 1 file per subfolder, karena tiap domain punya batas sendiri).

Dua kelas folder beda ambang:
- **Folder domain/campuran** (components, lib, pages subfolder berisi
  komponen+hook+util campur): ambang 15, ketat.
- **Folder "index"/barrel homogen** — isinya satu kategori seragam tanpa
  campuran konsep (mis. `clinical/scores/` isinya cuma kalkulator skor klinis,
  `landing/sections/` isinya cuma section landing): boleh sampai ~25, karena
  nambah satu item sejenis gak nambah beban kognitif kayak nambah konsep baru.

Pengecualian yang sah (gak perlu dipecah):
- Folder yang isinya murni data/konstanta/fixture satu kesatuan (mis. korpus
  terkurasi) — bukan kode yang butuh dicari satu-satu.
- Folder yang sudah jadi subfolder domain hasil pemecahan (mis.
  `src/pages/fitness/` boleh di atas 15 **sementara**, tapi begitu lewat ~25
  dan ada sub-tema yang jelas di dalamnya — misal "kalkulator" vs "program
  latihan" — pecah lagi satu tingkat).
- Folder flat besar yang masih migrasi (`src/lib/` 519 file, `src/components/`
  235 file saat ini): gak realistis dipaksa ≤15 sekaligus. Ambang berlaku
  untuk **penambahan baru** — freeze (jangan nambah file baru ke situ, taruh
  di domain yang sesuai), bukan maksa rapihin semua existing sekaligus
  (dilarang mindahin ratusan berkas sekaligus, CLAUDE.md §2.4).
- `node_modules`, folder generated/build, folder vendor.

## Kapan & gimana mecahnya

1. **Deteksi**: sebelum nambah file baru ke folder, cek `ls <folder> | wc -l`.
   Kalau hasilnya ≥15, jangan tambah file flat — bikin/pakai subfolder dulu.
2. **Kelompokkan by domain, bukan by tipe file.** Subfolder dikasih nama
   bounded-context (`wellness/`, `admin/`, `social/`, `longevity/`,
   `notifications/`, `digital-twin/`, `ibadah/` — bukan `utils/`, `misc/`,
   `helpers/`, `other/`). Nama tipe generik nunjukin domainnya belum jelas —
   mending diem dulu, tanya pemilik area, daripada bikin folder sampah.
3. **Migrasi strangler, bukan big-bang** (CLAUDE.md §2.4): satu domain per
   commit/PR, update semua pemanggil langsung di PR yang sama kalau cakupannya
   kecil (≤5 importer), atau tinggalkan stub re-export satu baris
   (`export * from './domain/File'`) kalau pemanggilnya banyak/belum sempat
   semua diupdate — lalu hapus stub begitu migrasi tuntas.
4. **Validasi**: `npm run lint:arsitektur` (dependency-cruiser) tetap harus
   hijau setelah pemindahan — batas dependency arah (`pages → components →
   lib → data`) gak boleh dilanggar cuma karena lokasi file berubah.
5. **tsc -b harus hijau** sebelum commit — jalur impor relatif (`../`) berubah
   kedalamannya setiap kali file turun/naik satu level folder.

## Checklist PR yang mindahin/mecah folder

- [ ] Folder tujuan punya nama domain yang jelas, bukan tipe generik.
- [ ] Semua pemanggil (importer) di-grep dulu sebelum mindah file
      (`grep -rl "/NamaFile'" src`), bukan nebak.
- [ ] Import relatif di file yang dipindah disesuaikan kedalaman foldernya.
- [ ] `tsc -b` dan `npm run lint:arsitektur` hijau.
- [ ] Satu domain/grup = satu commit, pesan commit sebut domain + jumlah
      pemanggil yang diupdate (lihat riwayat commit `refactor(wellness)`,
      `refactor(admin)`, `refactor(fitness)` di branch migrasi `src/pages/`
      sebagai contoh).

## Status migrasi `src/pages/`

`src/pages/landing/` = referensi resmi (section + components terisolasi,
tidak ada file di atas ambang). Root `src/pages/` masih dalam migrasi
bertahap — jangan nambah file baru langsung ke root, taruh di domain yang
sesuai atau buat domain baru kalau belum ada yang cocok.

## Status migrasi `src/components/`

Root `src/components/` sudah dipecah ke subfolder domain (2026-10-14). Semua
file lama ditinggal sebagai stub re-export satu baris di path lama
(`export * from './<domain>/File'`) biar importer lama gak perlu diubah —
**jangan hapus stub ini** sampai semua importer lama dimigrasi dan dicek
(lihat §3 di atas). Subfolder domain yang ada sekarang: `bodyhub/`,
`clinical/`, `dashboard/`, `digital-twin/`, `finance/`, `fitness/`,
`foryou/`, `frontier/`, `growth/`, `ibadah/`, `landing/`, `layout/`,
`medstudy/`, `notifications/`, `share/`, `tiles/`, `ui/`. File baru **wajib**
masuk subfolder yang sesuai domainnya — kalau gak ada yang cocok, bikin
subfolder baru dengan nama domain (bukan nama generik), jangan taruh flat
di root.

## Standar `docs/` (dan `DOCS/` — folder yang sama, lihat catatan di bawah)

Root `docs/` sudah dipecah per domain (2026-10-14), **tanpa** stub re-export
— dokumen `.md` gak dipanggil lewat import, jadi link yang lama cuma
dibetulin langsung di pemanggil yang kepake (`CLAUDE.md`, `AGENTS.md`).
Referensi lama di dokumen lain (`DOCS/*`, `governance/*.json`, dll) yang
belum sempat diupdate bisa 404 — itu utang kecil, bukan alasan nulis dobel.

**Peta domain `docs/` — taruh dokumen baru di sini, jangan bikin folder baru
kalau salah satu ini cocok:**

| Folder | Isinya |
|---|---|
| `docs/body-exposure/` | Anatomi, atlas 3D, digital twin tubuh, organ/eye/ECMO pipeline |
| `docs/clinical-research/` | Evidence pipeline (genomik, varian, sequencing), gate akademik, engine fisiologi/oksigen |
| `docs/sport/` | Performance, tactical/sport OS, workout/strength, rescue/expedition |
| `docs/environment/` | Sensor lingkungan, geospasial, wearable, satellite mesh |
| `docs/product/` | IA, design system, UI/UX, feature factory, audit revamp |
| `docs/longevity/` | Longevity, personal digital human, diet/carbon input |
| `docs/care-governance/` | Continuous care OS, replay/ledger governance longitudinal |
| `docs/engineering/` | Setup, release gate, API eksternal, infra persistence |
| `docs/handoffs/` | Handoff antar-agent, status stabilisasi, continuation notes |
| `docs/mental-health/` | Mental health clinical research & safety orchestrator |
| `docs/clinical-calculators/` | Kalkulator skor klinis (sudah ada sebelumnya) |
| `docs/architecture/`, `docs/adr/` | Keputusan arsitektur (sudah ada sebelumnya) |

Root repo tetap cuma nyimpen meta/entry file yang emang harus di root biar
ke-auto-load tooling: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`.
Semua dokumen baca lainnya (termasuk panduan setup, standar CSS/UI) masuk
`docs/<domain>/`, bukan root.

## Status migrasi `scripts/` (2026-10-14)

Root `scripts/` dipecah: `scripts/medstudy/` (audit kurikulum/catatan klinis,
SKDI, OSCE), `scripts/atlas/` (tooling GLB/atlas 3D), `scripts/bangun/`
(build & release tracking), `scripts/qa/validate-*.mjs` (gate validasi
`npm run build`, digabung ke folder `qa/` yang udah ada). `package.json`,
`render.yaml`, dan `.github/workflows/` sudah diupdate ke path baru.

**Gotcha path relatif via `import.meta.url`/`fileURLToPath`**: script yang
nulis/baca file lain pakai `new URL('../x', import.meta.url)` — ini
kedalamannya ikut berubah kalau script dipindah satu level folder, SAMA
kayak import TypeScript biasa. Udah ketemu beberapa kali kejadian nyata:
`write-frontend-build-info.mjs` sempat nulis `scripts/public/build-info.json`
(harusnya `public/build-info.json`) gara-gara path `'../'`-nya gak
disesuaikan pas dipindah ke `scripts/bangun/`. **Selalu grep
`import.meta.url\|__dirname\|fileURLToPath` di script yang mau dipindah**,
bukan cuma `import ... from './...'` — dua-duanya sama-sama berbasis lokasi
file, bukan cwd. (Pengecualian: string yang dieksekusi lewat
`execFileSync('npx', ['tsx', '-e', ...])` — itu jalan di cwd proses
pemanggil, bukan lokasi file, jadi aman gak perlu disesuaikan.)

`qa/` di root sendiri masih 24 file flat — di bawah ambang ~25 folder
homogen (lihat §"Dua kelas folder beda ambang"), jadi belum wajib dipecah.
Kalau nambah lagi dan lewat 25, kelompokkan per topik (body/anatomy vs
clinical-workflow vs misc).

## Status migrasi `server/src/` (area Insan — backend/auth/payments/clinical)

Root `server/src/` turun ke 11 file flat (mulai 62, di bawah ambang 15 —
lihat §"Kenapa berhenti" di bawah). Sepuluh batch 2026-10-14:
1. `visits.ts`, `visitRealtimePolicy.ts`, `realtime.ts`,
   `realtimeRoomRegistry.ts` → `server/src/modules/visits/` (sesuai urutan
   yang udah ditulis di `CLAUDE.md` §2.4 poin 3).
2. `rxnorm.ts`, `rxclass.ts`, `atcDdd.ts`, `drugInfo.ts`,
   `productAtcCrosswalk.ts`, `mygene.ts`, `icd11.ts`, `openfda.ts`,
   `pubmed.ts`, `trials.ts` → `server/src/domains/medical-reference/`
   (wrapper API terminologi/obat eksternal, kopling rendah).
3. `anatomyImages.ts`, `anatomyOntology.ts`, `hraReference.ts`,
   `bodyBiomedicalCoverage.ts`, `genomicsCompute.ts` →
   `server/src/domains/anatomy/`.
4. `healthAlerts.ts`, `healthMetrics.ts`, `healthWebhook.ts`,
   `aturanNotif.ts`, `pengingatCek.ts`, `push.ts` →
   `server/src/domains/push/` (gabung ke folder yang udah ada,
   `pushSubscription.ts`).
5. `aksesKlinis.ts`, `carePlan.ts`, `catatanKesehatanDiri.ts`,
   `rekamEncounter.ts`, `rekamKlinis.ts`, `labFhir.ts`, `labLog.ts`,
   `satusehat.ts`, `validasiLedger.ts`, `keadaanLongitudinal.ts` →
   `server/src/domains/clinical-records/` (EMR/FHIR inti — dipisah dari
   `domains/clinical/` yang isinya cuma demo RAG, beda konsen).
6. `observabilitas.ts`, `galatKlien.ts` → `domains/observability/`.
7. `accessControl.ts`, `otp.ts`, `email.ts`, `telepon.ts` →
   `domains/identity/` (`auth.ts` sendiri sengaja TETAP di root — kopling
   terlalu tinggi buat batch ini, lihat §"Kenapa berhenti" di bawah).
8. `payments.ts`, `markets.ts`, `midtrans-client.d.ts` →
   `domains/payments/` (`.d.ts` ambient module ikut pindah aman karena
   `tsconfig.json` `include: ["src"]` rekursif, bukan path eksplisit).
9. `productLearning.ts`, `productRegistry.ts` → `domains/product/`
   (`productLearning.ts` ternyata orphan — nol importer di seluruh repo,
   dibiarin gitu aja, bukan wewenang saya hapus).
10. `jadwal.ts`, `kota.ts`, `lingkungan.ts`, `salat.ts`, `sports.ts` →
    `domains/lifestyle/`.

### Kenapa berhenti di 11 file flat

Sisa `ai.ts`, `aiRequestPolicy.ts`, `auth.ts`, `config.ts`, `connect.ts`,
`index.ts`, `iris.ts`, `irisanPenyimpanan.ts`, `simpanAman.ts`, `store.ts`,
`translate.ts` — ini **sudah di bawah ambang 15**, jadi secara standar gak
wajib dipecah lagi. `auth.ts`/`config.ts`/`store.ts`/`index.ts` itu inti
bootstrap yang diimpor hampir semua modul lain (puluhan importer) — pindahin
itu beda kelas resiko dari batch-batch di atas, bukan sekadar "satu domain
kopling rendah". Kalau mau lanjut, pecah dulu yang jelas kopling rendah
(`ai.ts`+`aiRequestPolicy.ts` → `domains/ai/`, `iris.ts`+
`irisanPenyimpanan.ts`+`simpanAman.ts` → `domains/storage/`), baru
`auth`/`config`/`store`/`connect`/`index` dipertimbangkan terpisah dengan
Insan langsung (bukan lewat agent), karena blast radius-nya beda level.

Batch 5 pakai script generik
`node server-move.mjs <dest-dir-under-src> <Name1> <Name2> ...` (bisa dibuat
ulang kapan aja — lihat logika di bawah) yang otomatis: (a) `git mv` file,
(b) grep+rewrite semua referensi ke file itu di seluruh `src/` + `uji/`
dengan path relatif yang dihitung ulang dari lokasi tiap pemanggil, (c) pass
kedua yang ngecek import KELUAR dari file yang baru dipindah (`./store.js`
dkk) dan ikut nambahin `../` yang perlu. Tetap wajib dicek manual: baris
komentar yang nyebut path file (gak ikut ke-rewrite, itu teks biasa) dan
`npm run typecheck` + jalanin test satu-satu buat verifikasi akhir.

**Ini bukan folder rame-rame** —
tanya Insan dulu sebelum mindahin batch berikutnya, per aturan "Peran
manusia" di `CLAUDE.md`. Pola layer `http/service/domain/repo` penuh (lihat
`modules/labResults/`) itu target ideal CLAUDE.md §2.2, tapi gak wajib
dipaksa sekaligus pas sekadar mindahin file — pindah dulu flat ke
`modules/<domain>/`, layering nyusul kalau emang disentuh logic-nya.

Checklist tambahan khusus server (di atas checklist umum §"Checklist PR"):
- [ ] `npm run typecheck` (bukan cuma `tsc -b` frontend) hijau di `server/`.
- [ ] Cek importer bukan cuma `src/` tapi juga `uji/` (test pakai path
      `../src/...` relatif dari folder test, bukan dari `src/`).
- [ ] Import yang nyeberang keluar folder baru (`../auth.js`, `../store.js`,
      dst) ikut nambah satu `../` — pola sama kayak bug yang kejadian di
      migrasi `src/components/` dan `scripts/` (lihat gotcha di atas).
- [ ] Grep importer pakai DUA pola ekstensi sekaligus: `src/` impor pakai
      `.js` (NodeNext ESM), tapi `uji/*.uji.ts` impor file yang sama pakai
      `.ts` (dijalankan lewat `tsx`, bukan dikompilasi). Grep yang cuma
      nyari `.js'` bakal ngelewatin importer test — kejadian nyata pas
      migrasi `rxnorm`/`openfda`/`icd11` dkk, 3 file test ketinggalan dan
      baru ketauan pas jalanin test manual, bukan dari `tsc`.

Gak ada yang cocok? Tanya pemilik area dulu (lihat `CLAUDE.md` §"Peran
manusia") sebelum bikin domain baru — jangan taruh flat di root `docs/` dan
jangan bikin folder generik (`misc/`, `other/`, `general/`).

**Gotcha macOS/case-insensitive filesystem**: `DOCS/` dan `docs/` itu folder
**yang sama** di disk (case-insensitive), walau ditulis beda kapital di
dokumen ini dan di `CLAUDE.md`. Jangan pernah bikin folder/file baru di root
yang namanya cuma beda kapital dari folder lain (`ui.tsx` vs folder `ui/`
pernah nyebabin bug resolusi path pas migrasi `src/components/` — file dan
folder sama-sama "resolve" ke path yang sama, jadi relative import jadi
kosong/salah). Cek `ls` dulu sebelum pilih nama folder baru.
