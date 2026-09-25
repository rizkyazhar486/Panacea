import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Pemilik: "fitur utama seperti clinical, data harian, dosis dan kalkulator
// WAJIB ada di home". Berkas ini menahan keempatnya di baris aksi beranda,
// dan memastikan setiap tujuannya benar-benar rute yang terdaftar, supaya
// tombolnya tidak pernah menjadi jalan buntu.
const src = readFileSync(new URL('../../src/components/HomeVisualLanding.tsx', import.meta.url), 'utf8')
const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const tujuan = [...src.matchAll(/\{ to: '([^']+)', label: '([^']+)'/g)].map((m) => ({ to: m[1], label: m[2] }))

for (const [nama, rute] of [
  ['Clinical', '/clinical-hub'],
  ['data harian', '/ikhtisar'],
  ['dosis obat', '/drug-info'],
  ['kalkulator', '/clinical-calculators'],
] as const) {
  assert.ok(tujuan.some((t) => t.to === rute), `${nama} (${rute}) hilang dari aksi inti beranda`)
}
assert.ok(tujuan.length <= 6, `aksi inti beranda ${tujuan.length} > 6 — melanggar batas enam pilihan`)
for (const t of tujuan) {
  assert.ok(main.includes(`path="${t.to}"`), `aksi beranda "${t.label}" menuju ${t.to}, rute yang tidak terdaftar`)
}
console.log(`beranda-fitur-inti: ${tujuan.length} aksi inti, Clinical/data harian/dosis/kalkulator hadir dan semua rute terdaftar`)
