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
