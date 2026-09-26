// Weaning VV (ELSO VV 2021, Tabel 7): urutan tahap, ambang pH dari pendidik, arah pemulihan paru.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nilaiWeaningVV } from '../../src/lib/ecmo/weaningVV.ts'

const b = { co: 7.5, qEcmo: 4, jarakKanulaCm: 15, hb: 10, vo2: 320, fio2: 0.4, hco3: 26, fungsiMembran: 1 }
const sakit = { ...b, shunt: 0.9, va: 1 }, pulih = { ...b, shunt: 0.15, va: 6 }, sebagian = { ...b, shunt: 0.3, va: 5 }
const ok = (r: ReturnType<typeof nilaiWeaningVV>) => r.tahap.map((t) => t.tercapai)

assert.deepEqual(ok(nilaiWeaningVV({ ...sakit, fdo2: 0.21, sweep: 1 }, 7.3)), [false, false, false], 'paru sakit: gagal sejak tahap FdO2')
const pulihNormo = { ...pulih, va: 5 }
assert.deepEqual(ok(nilaiWeaningVV({ ...pulihNormo, fdo2: 0.21, sweep: 0.5 }, 7.3, 7.5)), [true, true, true], 'paru pulih, ventilasi wajar: semua tahap tercapai')
assert.equal(nilaiWeaningVV({ ...pulih, fdo2: 0.21, sweep: 1 }, 7.3, 7.45).tahap[1].tercapai, false, 'alkalosis (ventilasi berlebih) bukan pH yang dapat diterima')
assert.equal(nilaiWeaningVV({ ...pulihNormo, fdo2: 0.21, sweep: 0.5 }, 7.3, 7.5).siapDekanulasi, true)
assert.equal(nilaiWeaningVV({ ...pulihNormo, fdo2: 0.21, sweep: 1 }, 7.3, 7.5).tahap[1].tercapai, false, 'sweep 1 masih alkalosis pada ventilasi ini: turunkan lagi')
assert.deepEqual(ok(nilaiWeaningVV({ ...sebagian, fdo2: 0.21, sweep: 1 }, 7.3, 7.6)), [true, true, false], 'paru pulih sebagian: gagal uji tanpa sweep')
// Urutan ELSO: sweep tidak dinilai tercapai selama FdO2 belum diturunkan.
assert.deepEqual(ok(nilaiWeaningVV({ ...pulihNormo, fdo2: 1, sweep: 1 }, 7.3, 7.5)), [false, false, false], 'tahap berikut tidak boleh lolos sebelum tahap FdO2')
// Ambang pH adalah masukan pendidik dan benar-benar dipakai.
assert.equal(nilaiWeaningVV({ ...pulihNormo, fdo2: 0.21, sweep: 0.5 }, 7.495, 7.6).tahap[1].tercapai, false, 'ambang pH bawah lebih ketat harus menggagalkan tahap sweep')
// Sumber dan batasnya tertulis; UI menyebut ambang pH sebagai pilihan pendidik.
const src = readFileSync('src/lib/ecmo/weaningVV.ts', 'utf8')
assert.match(src, /Tabel 7/); assert.match(src, /TIDAK menetapkan angka pH/)
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /data-ecmo-weaning/); assert.match(ui, /educator-set/i); assert.match(ui, /not a decannulation decision/i)
console.log('ecmo-weaning-vv: lulus')
