import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bacaDicom, urutkanSeri } from '../../src/lib/dicom.ts'
import { buatVolumeMpr } from '../../src/lib/dicomMpr.ts'
import { ukurJarak, skalaIrisanTunggal } from '../../src/lib/ukurMpr.ts'
import { irisanFantom, type OpsiFantom } from './fantomDicom.ts'

const volume = (o: OpsiFantom) => {
  const c = Array.from({ length: o.irisan ?? 10 }, (_, z) => { const h = bacaDicom(irisanFantom(z, o)); assert.ok(h.ok); return h.data })
  const v = buatVolumeMpr(urutkanSeri(c.map((x) => ({ citra: x }))).map((x) => x.citra)); assert.ok(v.ok); return v.volume
}
// Anisotropik: piksel 0.5 mm, jarak irisan 2.5 mm — sumbu yang tertukar memberi angka salah.
const v = volume({ sisi: 32, irisan: 10, jarakPikselMm: 0.5, tebalMm: 2.5 })
assert.deepEqual(v.asalSpasi, { baris: 'dicom', kolom: 'dicom', iris: 'posisi' })
const r1 = ukurJarak(v, 'source', { kolom: 0, baris: 0 }, { kolom: 6, baris: 8 })
assert.ok(r1.ok && Math.abs(r1.mm - 5) < 1e-9, `aksial 6×8 px @0.5 mm harus 5 mm, dapat ${JSON.stringify(r1)}`)
const r2 = ukurJarak(v, 'cross-row', { kolom: 0, baris: 0 }, { kolom: 0, baris: 4 })
assert.ok(r2.ok && Math.abs(r2.mm - 10) < 1e-9, `4 irisan @2.5 mm harus 10 mm (sumbu vertikal bidang silang = jarak irisan), dapat ${JSON.stringify(r2)}`)
const r3 = ukurJarak(v, 'cross-column', { kolom: 8, baris: 0 }, { kolom: 8, baris: 2 })
assert.ok(r3.ok && Math.abs(r3.mm - 5) < 1e-9 && !r3.perkiraan)

// Tanpa Pixel Spacing: gagal tertutup, tidak ada angka mm.
const tanpa = volume({ sisi: 32, irisan: 10, tanpaJarakPiksel: true })
assert.equal(tanpa.asalSpasi?.kolom, 'asumsi')
const r4 = ukurJarak(tanpa, 'source', { kolom: 0, baris: 0 }, { kolom: 3, baris: 4 })
assert.equal(r4.ok, false, 'asumsi 1 mm dipakai sebagai ukuran — angka mm palsu')
assert.equal(skalaIrisanTunggal({}).sah, false)
assert.equal(skalaIrisanTunggal({ jarakPiksel: [0.7, 0.7] }).sah, true)

const ui = readFileSync('src/pages/Radiology.tsx', 'utf8')
assert.match(ui, /skala=\{volume \? skalaBidang\(volume, 'cross-row'\)/, 'bidang silang tidak memakai skala bidangnya sendiri')
assert.match(ui, /hasilUkur\.ok \? `\$\{hasilUkur\.mm\.toFixed\(1\)\} mm/)
console.log('ukur-mpr: aksial 5.0 mm, silang 10.0 mm (jarak irisan), tanpa Pixel Spacing → tidak ada angka mm')
