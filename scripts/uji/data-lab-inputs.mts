import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hitungPhenoAgeDariTeks, rasioOmega, periksaSuplemen, PHENOAGE_KOLOM, type TeksPhenoAge } from '../../src/domains/data-lab/index.ts'

const typical: TeksPhenoAge = { usia: '35', albuminGL: '45', kreatininUmolL: '80', glukosaMmolL: '5', crpMgL: '1', limfositPersen: '30', mcvFL: '90', rdwPersen: '13', alpUL: '70', wbcRibu: '6' }
const ph = (p: Partial<TeksPhenoAge>) => hitungPhenoAgeDariTeks({ ...typical, ...p })

// Referensi independen: koefisien terbitan Levine 2018 ditulis ulang di sini (bukan diimpor), CRP dalam mg/dL = mg/L / 10.
function referensi(usia: number, alb: number, kre: number, glu: number, crpMgL: number, lim: number, mcv: number, rdw: number, alp: number, wbc: number) {
  const xb = -19.90667 - 0.03359355 * alb + 0.009506491 * kre + 0.1953192 * glu + 0.09536762 * Math.log(crpMgL / 10) - 0.01199984 * lim
    + 0.02676401 * mcv + 0.3306156 * rdw + 0.001868778 * alp + 0.05542406 * wbc + 0.08035356 * usia
  const M = 1 - Math.exp((-1.51714 * Math.exp(xb)) / 0.0076927)
  return Math.log(-0.0055305 * Math.log(1 - M)) / 0.090165 + 141.50225
}
const hasil = ph({})
assert.equal(hasil.ok, true)
if (hasil.ok) {
  assert.ok(Math.abs(hasil.data.phenoAge - referensi(35, 45, 80, 5, 1, 30, 90, 13, 70, 6)) < 0.051, 'PhenoAge harus sama dengan referensi independen (pembulatan 0,1)')
  assert.deepEqual(hitungPhenoAgeDariTeks({ ...typical }), hasil, 'deterministik')
}
// CRP mg/L → mg/dL: 10 mg/L lebih tinggi dari 1 mg/L menghasilkan PhenoAge lebih tinggi sebesar 0,0954·ln(10)/0,0902-ish (arah saja).
const rendah = ph({ crpMgL: '1' }), tinggi = ph({ crpMgL: '10' })
assert.ok(rendah.ok && tinggi.ok && tinggi.data.phenoAge > rendah.data.phenoAge, 'CRP lebih tinggi harus menaikkan PhenoAge')

// Negatif: tiap kolom kosong/spasi/NaN/Infinity/bukan angka ditolak dan DISEBUT dengan labelnya; tidak ada nilai tebakan.
for (const { key, label } of PHENOAGE_KOLOM) {
  for (const t of ['', '   ', 'abc', 'NaN', 'Infinity']) {
    const r = ph({ [key]: t })
    assert.equal(r.ok, false, `${key}=${JSON.stringify(t)}`)
    assert.equal(r.ok ? '' : r.alasan, `Missing or not a number: ${label}`)
    assert.equal('data' in r, false)
  }
}
assert.equal((hitungPhenoAgeDariTeks({ ...typical, usia: '', albuminGL: '' }) as { alasan: string }).alasan, 'Missing or not a number: Chronological age; Albumin (g/L)')
// Rentang tetap diperiksa mesin kanonik (albumin g/dL salah satuan, usia di bawah 18).
const albDl = ph({ albuminGL: '4.2' }); assert.equal(albDl.ok, false); assert.match(albDl.ok ? '' : albDl.alasan, /albumin 10–60 g\/L/)
const muda = ph({ usia: '17' }); assert.equal(muda.ok, false); assert.match(muda.ok ? '' : muda.alasan, /age 18–120/)
assert.equal(ph({ usia: '18' }).ok, true); assert.equal(ph({ usia: '120' }).ok, true); assert.equal(ph({ usia: '121' }).ok, false)
assert.equal(hitungPhenoAgeDariTeks(undefined as unknown as TeksPhenoAge).ok, false)

// Omega: positif, batas pita (4 dan 10), negatif berpasangan.
const om = (a: string, b: string) => rasioOmega(a, b)
assert.deepEqual(om('12000', '1500'), { ok: true, data: { ratio: 8, pita: 'Moderate', nada: 'low' } })
assert.deepEqual(om('4000', '1000'), { ok: true, data: { ratio: 4, pita: 'Favorable', nada: 'brand' } })
assert.deepEqual(om('4001', '1000'), { ok: true, data: { ratio: 4.001, pita: 'Moderate', nada: 'low' } })
assert.deepEqual(om('10000', '1000'), { ok: true, data: { ratio: 10, pita: 'Moderate', nada: 'low' } })
assert.deepEqual(om('10001', '1000'), { ok: true, data: { ratio: 10.001, pita: 'High (pro-inflammatory tilt)', nada: 'critical' } })
assert.deepEqual(om('12000', ''), { ok: false, alasan: 'Omega-3: 0.001 to 50000 mg/day' }, 'omega-3 kosong dulu menjadi penyebut 1 → "12000 : 1"')
assert.deepEqual(om('12000', '0'), { ok: false, alasan: 'Omega-3: 0.001 to 50000 mg/day' })
assert.deepEqual(om('', '1500'), { ok: false, alasan: 'Omega-6: 0 to 100000 mg/day' })
assert.deepEqual(om('-1', '1500'), { ok: false, alasan: 'Omega-6: 0 to 100000 mg/day' })
assert.deepEqual(om('100001', '1500'), { ok: false, alasan: 'Omega-6: 0 to 100000 mg/day' })
assert.equal(om('0', '1500').ok, true, 'omega-6 nol sah (batas bawah)')
assert.equal(om('12000', 'Infinity').ok, false)

// Suplemen: positif, batas, negatif per kolom, waktu paruh kosong tidak lagi jadi 1.
const sp = (p: Partial<{ nama: string; doseMg: string; jam: string; paruhJam: string }>) => periksaSuplemen({ nama: 'Caffeine', doseMg: '200', jam: '8', paruhJam: '5', ...p })
assert.deepEqual(sp({ nama: '  Magnesium ' }), { ok: true, nilai: { name: 'Magnesium', doseMg: 200, timeHour: 8, halfLifeH: 5 } })
for (const [p, ok] of [[{ jam: '0' }, true], [{ jam: '24' }, true], [{ jam: '-0.1' }, false], [{ jam: '24.1' }, false], [{ paruhJam: '0.1' }, true], [{ paruhJam: '0.09' }, false], [{ paruhJam: '500' }, true], [{ paruhJam: '500.1' }, false], [{ doseMg: '20000' }, true], [{ doseMg: '20000.1' }, false], [{ doseMg: '0' }, false]] as const) assert.equal(sp(p).ok, ok, JSON.stringify(p))
assert.deepEqual(sp({ paruhJam: '' }), { ok: false, masalah: { paruhJam: 'Half-life (h): enter a number' } })
assert.deepEqual(sp({ nama: ' ', doseMg: 'x' }), { ok: false, masalah: { nama: 'Name: required', doseMg: 'Dose (mg): enter a number' } })
assert.equal(sp({ nama: 'a'.repeat(41) }).ok, false); assert.equal(sp({ nama: 'a'.repeat(40) }).ok, true)

// Regresi halaman: tanpa `|| 0` dan tanpa salinan rumus PhenoAge inline; memakai mesin kanonik lewat domain.
const halaman = readFileSync(new URL('../../src/pages/DataLabAdvanced.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(halaman, /Number\([^)]*\) *\|\| *[01]/, 'bentuk lama Number(x) || 0/1 kembali di DataLabAdvanced')
assert.doesNotMatch(halaman, /19\.907|0\.0336|0\.00188/, 'salinan koefisien PhenoAge inline kembali; pakai lib/longevity lewat domains/data-lab')
assert.match(halaman, /from '\.\.\/domains\/data-lab'/); assert.match(halaman, /hitungPhenoAgeDariTeks\(t\)/)
console.log('data-lab-inputs: ok')
