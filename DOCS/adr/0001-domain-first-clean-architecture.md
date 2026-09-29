# ADR 0001 — Struktur domain-first dengan clean architecture

- Status: Diusulkan (2026-09-29)
- Konteks tertaut: `CLAUDE.md` §2

## Konteks

Kondisi terukur saat keputusan ini ditulis:
- `src/lib` berisi 513 berkas datar + 15 subfolder; `server/src` 60 berkas datar.
- 9 berkas `lib` mengimpor `components`/`pages`; 17 memanggil `fetch(`; 43 memakai `Date.now`/`Math.random` — logika domain tidak murni dan sulit diuji deterministik.
- Banyak agent/kontributor bekerja bersamaan; struktur datar memicu konflik dan duplikasi.

## Keputusan

1. Kode dikelompokkan per **bounded context** (`src/domains/<x>/{model,engine,data,adapters,ui,index.ts}`; `server/src/modules/<x>/{http,service,domain,repo}`).
2. Arah dependensi satu arah; I/O hanya di `adapters/` dan `repo/`; domain diakses lewat `index.ts`.
3. Aturan ditegakkan otomatis (boundary lint + baseline "ratchet"), bukan hanya dokumen.
4. Migrasi **bertahap (strangler)**: kode baru di struktur baru, `src/lib` datar dibekukan, berkas lama dipindah saat disentuh lewat PR `refactor/` tanpa perubahan perilaku.

## Alternatif yang ditolak

- **Big-bang reorganisasi**: risiko regresi tinggi, konflik dengan PR paralel, tidak bisa direview.
- **Status quo + dokumen saja**: aturan tanpa penegakan terbukti luntur (lihat pelanggaran di atas).

## Konsekuensi

- (+) Kepemilikan jelas per domain, kerja paralel aman, logika murni mudah diuji, bundle awal lebih kecil.
- (−) Dua struktur hidup berdampingan selama migrasi; perlu disiplin re-export tipis dan penghapusan setelah pemanggil pindah.
- Metrik keberhasilan: jumlah pelanggaran baseline turun monoton; berkas baru di `src/lib` datar = 0.
