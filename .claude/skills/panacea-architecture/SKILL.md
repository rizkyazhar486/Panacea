---
name: panacea-architecture
description: Use when adding or moving code in Panacea — new feature, engine, component, page, hook, server route/service, or when refactoring/migrating files out of the flat src/lib or server/src. Decides where code belongs (clean architecture, domain-first tree), prevents duplication, and enforces layer/dependency rules.
---

# Panacea architecture — di mana kode ini harus ditaruh? (aturan: CLAUDE.md §2–§3)

## 1. Cari dulu (wajib sebelum menulis)
```bash
git grep -il "<konsep/rumus/istilah>" -- src server/src
```
Sudah ada → **reuse/perluas**. Jangan buat versi kedua (mis. konstanta O₂: pakai `oxygenContentConventions.ts`, jangan ketik ulang 1.34/0.003). Tidak perlu ada sama sekali? Katakan dan jangan tulis.

## 2. Tentukan domain & layer
Kode baru → struktur target; **jangan tambah berkas baru di `src/lib` datar** (dibekukan).

| Yang kamu tulis | Lokasi | Boleh impor | Dilarang |
|---|---|---|---|
| tipe/entitas/invariant | `src/domains/<d>/model/` | `shared/kernel` | apa pun lain |
| rumus, engine, use-case, simulasi | `…/engine/` | `model`, `data` | React, DOM, `fetch`, `Date.now`, `Math.random` (injeksi `clock`/`rng`) |
| konstanta/korpus | `…/data/` (korpus besar via `import()`) | — | logika |
| I/O: API, sensor, device, storage | `…/adapters/` | `model`, `engine` | UI |
| komponen khusus domain | `…/ui/` | `engine` via hook | rumus/aturan klinis |
| pintu domain | `…/index.ts` | — | ekspor internal berlebih |
| primitif UI lintas domain | `src/shared/ui/` | — | logika domain |
| layar/komposisi | `src/pages/` | `features`, `domains/*` (via index) | logika domain |
| server | `server/src/modules/<d>/{http,service,domain,repo}` | http→service→domain; repo di ujung | SQL/HTTP di service; impor `src/` |

Antar-domain: hanya lewat `index.ts` atau tipe di `shared/kernel`.

## 3. Aturan mutu
- DRY nyata: logika/konstanta ≥2 pemakaian → satu fungsi/konstanta.
- Tanpa abstraksi spekulatif (interface satu implementasi, factory satu produk).
- Komponen kecil, props bertipe, komposisi > flag boolean; engine 3D/berat `lazy`.
- Data eksternal divalidasi & dinormalisasi di boundary; tak diketahui = fail closed.
- TypeScript ketat: tanpa `any`/`@ts-ignore` baru.

## 4. Verifikasi
```bash
npm run lint:arsitektur     # pelanggaran BARU menggagalkan; baseline hanya boleh turun
npm run build && npm run uji
```

## 5. Memigrasi berkas lama (strangler; PR `refactor/` terpisah)
1. Hanya saat berkas disentuh substansial; **tanpa perubahan perilaku**.
2. Pindahkan ke domainnya; tinggalkan re-export tipis di lokasi lama.
3. Migrasikan pemanggil bertahap; hapus re-export bila kosong.
4. `build` + `uji` hijau, tes hanya berubah pada path impor. Jangan memindah ratusan berkas dalam satu PR.
5. Urutan domain: `physiology`, `anatomy`, `multiskala`, `ecmo`, `bodyExposure`; server mulai dari `visits`/`realtime*`.
