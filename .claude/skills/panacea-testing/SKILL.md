---
name: panacea-testing
description: Use when writing, changing, fixing or reviewing logic in Panacea that needs tests — new function/engine/handler/component, bug fix, clinical/physiology formula, validation or auth rule. Requires strict unit tests with positive, negative, boundary and security cases; forbids weakening tests.
---

# Panacea unit test ketat (aturan: CLAUDE.md §3.1)

Runner: `node --test` (`scripts/qa/<modul>.test.mjs`), skrip `scripts/uji/*.mts`, atau `server/uji/`. Tanpa jaringan/waktu/acak nyata (injeksi `clock`/`rng`).

## Prosedur
1. **Daftar aturan** unit: setiap validasi, cabang, batas, dan aturan keamanan → satu baris matriks.
2. **Isi matriks** (setiap unit minimal semua yang relevan):

| Kategori | Wajib | Assert |
|---|---|---|
| Positif | input valid | nilai **eksak** (atau toleransi tertulis); rumus klinis vs nilai referensi bersumber |
| Negatif | 1 per aturan: tipe salah, kosong, `NaN`/`Infinity`, di luar rentang, unit salah, provenance hilang | jenis penolakan (`ok:false`/kode/pesan) **dan tidak ada efek samping** |
| Batas | tepat di batas, ±1 di luar | diterima / ditolak berpasangan |
| Keamanan | tanpa identitas, role salah, replay, payload berlebih | ditolak + tidak ada data bocor/tertulis |
| Regresi | tiap bug | tes gagal sebelum perbaikan |

3. **Berpasangan**: kasus ditolak dan kasus diterima hanya berbeda pada kondisi yang diuji.
4. **Tulis**, satu perilaku per tes, nama deskriptif (`menolak_hb_negatif`).
5. **Jalankan**: `node --test <berkas>` lalu `npm run uji`; jalankan dua kali untuk membuktikan determinisme.
6. **Uji sendiri tesmu**: sabotase kecil di kode (ubah batas/hapus validasi) → tes harus merah. Kembalikan setelahnya.

## Kerangka (sesuaikan nama/API nyata)
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { hitung } from '../../src/lib/<modul>.ts';

test('positif: hasil eksak untuk input valid', () => assert.equal(hitung({ a: 60, b: 70 }).value, 4.2));
test('negatif: input di luar rentang ditolak tanpa efek samping', () => {
  const r = hitung({ a: -1, b: 70 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'out-of-range');
});
test('batas: tepat di batas atas diterima, +1 ditolak', () => {
  assert.equal(hitung({ a: MAX, b: 70 }).ok, true);
  assert.equal(hitung({ a: MAX + 1, b: 70 }).ok, false);
});
```

## Larangan
- Negatif yang hanya "tidak melempar error"; assert longgar (`truthy`/"tidak undefined").
- `.skip`/`.only` tertinggal; `catch` yang menelan assertion.
- **Melemahkan tes** (hapus assert, longgarkan toleransi, skip) agar hijau — perubahan ekspektasi wajib dijelaskan di PR.
- Mock di logika murni (mock hanya di adapter/repo).
- Kode klinis/keamanan/privasi: setiap `if`/`switch` di jalur keputusan punya kasus positif **dan** negatif; jalur fail-closed diuji eksplisit.
- Komponen UI: uji state loading, error, kosong, data; tombol tak bisa dobel-submit; input invalid tidak memanggil handler.
