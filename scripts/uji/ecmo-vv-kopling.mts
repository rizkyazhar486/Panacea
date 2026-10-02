// VV pada sirkulasi yang sama: CO dan aliran pompa adalah keluaran, bukan penggeser.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { simulasiSirkulasi as S, SIRKULASI_NORMAL as N } from '../../src/lib/ecmo/sirkulasi.ts'
import { simulasiVV } from '../../src/lib/ecmo/mesin.ts'

const VV = (x: Partial<typeof N> = {}, rpm = 3500) => S({ ...N, hr: 110, svr: 0.7, ...x, ecmo: { konfigurasi: 'VV', rpm } })
const gas = { jarakKanulaCm: 15, hb: 10, vo2: 320, shunt: 0.9, fio2: 0.3, va: 1, hco3: 26, fdo2: 1, sweep: 3, fungsiMembran: 1 }
const o2 = (h: ReturnType<typeof VV>) => simulasiVV({ ...gas, co: h.coAsli, qEcmo: h.qEcmo })

const b = VV()
assert.ok(b.sah && Math.abs(b.volumeTotal - N.volumeDarah) < 1e-6, 'VV: volume kekal (drainase dan return sama-sama vena)')
// ELSO VV 2021: "Increasing circuit flow will not improve patient blood pressure" (VV in seri, bukan dukungan sirkulasi).
// Diuji sebagai perbandingan fisik: pada RPM sama, kenaikan MAP oleh VV jauh lebih kecil daripada VA.
import { SKENARIO_SYOK_KARDIOGENIK as CS } from '../../src/lib/ecmo/sirkulasi.ts'
for (const dasar of [{ ...N, hr: 110, svr: 0.7 }, CS]) {
  const t = S({ ...dasar, ecmo: { konfigurasi: 'tanpa', rpm: 0 } }), vv = S({ ...dasar, ecmo: { konfigurasi: 'VV', rpm: 4500 } }), va = S({ ...dasar, ecmo: { konfigurasi: 'VA-perifer', rpm: 4500 } })
  const dVv = vv.map - t.map, dVa = va.map - t.map
  assert.ok(vv.qEcmo > 5 && dVa > 20, 'kedua konfigurasi benar-benar mengalirkan darah')
  assert.ok(dVv < 0.2 * dVa, `VV tidak boleh memberi dukungan tekanan sebanding VA: ΔMAP VV ${dVv.toFixed(1)} vs VA ${dVa.toFixed(1)}`)
}
// Kalibrasi baseline UI: pita tipikal ELSO (SaO2 80–95%).
{ const v = o2(b); assert.ok(v.sao2 >= 0.8 && v.sao2 <= 0.97, `baseline VV di luar pita: ${v.sao2}`) }
// SVR↓ (vasodilatasi) → CO↑ pada aliran pompa sama → SaO2↓ (ELSO: aliran relatif terhadap CO).
{ const a = VV({ svr: 0.9 }), c = VV({ svr: 0.6 })
  assert.ok(c.coAsli > a.coAsli && Math.abs(c.qEcmo - a.qEcmo) < 0.1, 'SVR↓ → CO↑, aliran pompa ~tetap')
  assert.ok(o2(c).sao2 < o2(a).sao2, 'CO↑ tanpa aliran ECMO↑ → SaO2↓') }
// Hipovolemia membatasi drainase VV.
{ const h = VV({ volumeDarah: 4500 }, 4000), n = VV({}, 4000)
  assert.ok(h.qEcmo < n.qEcmo && h.sirkuit!.pDrainase < n.sirkuit!.pDrainase, 'hipovolemia → aliran VV turun, drainase lebih negatif') }
// UI memakai nilai turunan, bukan penggeser CO/aliran bebas.
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /vvTurunan\(/); assert.doesNotMatch(ui, /label: 'Patient cardiac output'/, 'CO VV tidak boleh lagi penggeser bebas')
assert.doesNotMatch(ui, /\{ k: 'qEcmo', label: 'Pump flow'/, 'aliran VV tidak boleh lagi penggeser bebas')
console.log('ecmo-vv-kopling: lulus')
