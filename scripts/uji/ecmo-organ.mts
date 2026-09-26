// Perfusi organ ECMO: neraca massa kreatinin (Chen 2013), arah perfusi ginjal/otak/tungkai.
import assert from 'node:assert/strict'
import { kreatininSetelah, keadaanGinjal, keadaanTungkai, keadaanOrganVA, fraksiFiltrasi } from '../../src/lib/ecmo/organ.ts'
import { simulasiSirkulasi as S, SKENARIO_SYOK_KARDIOGENIK as CS } from '../../src/lib/ecmo/sirkulasi.ts'
import { simulasiVA } from '../../src/lib/ecmo/mesin.ts'

const P = { crAwal: 1.0, gfrDasar: 100, beratKg: 70 }
const dekat = (a: number, b: number, t: number, m: string) => assert.ok(Math.abs(a - b) <= t, `${m}: ${a} vs ${b}`)

// Neraca massa: t=0 tetap, GFR dasar tetap tunak, GFR separuh → menuju 2×Cr0.
dekat(kreatininSetelah(0, 50, P), 1.0, 1e-12, 'Cr pada t=0')
dekat(kreatininSetelah(72, 100, P), 1.0, 1e-9, 'GFR tak berubah → Cr tetap')
dekat(kreatininSetelah(24 * 30, 50, P), 2.0, 0.01, 'keadaan tunak baru = produksi/GFR')
// Vd·dCr/dt = produksi − GFR·Cr (turunan numerik).
{ const vd = 0.6 * 70 * 10, prod = 100 * 0.01, h = 1e-3, t = 10
  const dcr = (kreatininSetelah(t + h, 30, P) - kreatininSetelah(t - h, 30, P)) / (2 * h * 60)
  dekat(vd * dcr, prod - 0.3 * kreatininSetelah(t, 30, P), 1e-6, 'neraca massa Chen 2013') }
// Kreatinin tidak melompat: GFR jatuh ke 10%, satu jam kemudian kenaikan < 10% dari kenaikan akhir.
{ const akhir = kreatininSetelah(24 * 60, 10, P) - 1, satuJam = kreatininSetelah(1, 10, P) - 1
  assert.ok(satuJam > 0 && satuJam < 0.1 * akhir, `kreatinin melompat terlalu cepat: ${satuJam} dari ${akhir}`) }
// Anuria: kenaikan linear.
dekat(kreatininSetelah(48, 0, P) - kreatininSetelah(24, 0, P), kreatininSetelah(24, 0, P) - 1, 1e-9, 'anuria linear')

// Filtrasi: monoton terhadap tekanan perfusi, dibatasi 0–1.
assert.equal(fraksiFiltrasi(30), 0); assert.equal(fraksiFiltrasi(120), 1); assert.ok(fraksiFiltrasi(60) > fraksiFiltrasi(50))

// Ginjal dari keadaan sirkulasi yang sama: tekanan perfusi = MAP distal − CVP.
const cs = S(CS), va4 = S({ ...CS, ecmo: { konfigurasi: 'VA-perifer', rpm: 4000 } })
dekat(keadaanGinjal(cs).tekananPerfusi, cs.mapDistal - cs.cvp, 1e-9, 'definisi tekanan perfusi ginjal')
assert.ok(keadaanGinjal(va4).tekananPerfusi > keadaanGinjal(cs).tekananPerfusi, 'dukungan VA → perfusi ginjal naik pada syok')
assert.ok(keadaanGinjal({ ...cs, cvp: cs.cvp + 15 }).tekananPerfusi < keadaanGinjal(cs).tekananPerfusi, 'kongesti vena menurunkan perfusi ginjal')

// Otak: dukungan VA menaikkan hantaran O2 kepala-leher pada syok.
const o2 = { hb: 12, vo2: 250, shunt: 0.3, fio2: 0.4, va: 4, hco3: 24, fdo2: 1, sweep: 3, fungsiMembran: 1 }
const vTanpa = simulasiVA({ ...o2, qLv: cs.coAsli, qEcmo: 0.01 }), vDengan = simulasiVA({ ...o2, qLv: va4.coAsli, qEcmo: va4.qEcmo })
assert.ok(keadaanOrganVA(va4, vDengan).otakDo2 > keadaanOrganVA(cs, vTanpa).otakDo2, 'VA → hantaran O2 otak naik pada syok')

// Tungkai: arah sesuai Marbach 2022 (kanula lebih kecil dan DPC melindungi).
const t19 = keadaanTungkai(19, 8, false, 4, 1, 0.97), t15 = keadaanTungkai(15, 8, false, 4, 1, 0.97), t19d = keadaanTungkai(19, 8, true, 4, 1, 0.97)
assert.ok(t15.indeksPerfusi > t19.indeksPerfusi, 'kanula lebih kecil → perfusi tungkai lebih baik')
assert.ok(t19d.indeksPerfusi > t19.indeksPerfusi, 'DPC → perfusi tungkai lebih baik')
assert.equal(keadaanTungkai(19, 8, true, 0, 1, 0.97).indeksPerfusi, t19.indeksPerfusi, 'DPC tanpa aliran ECMO tidak menambah apa pun')
assert.equal(keadaanTungkai(30, 8, false, 4, 1, 0.97).fraksiLumenTersisa, 0, 'kanula ≥ arteri → lumen nol, bukan negatif')
console.log('ecmo-organ: lulus')
