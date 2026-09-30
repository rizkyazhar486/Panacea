// Echo skematis dari keadaan sirkulasi: VTI integral konsisten, bingkai mengikuti volume, tanpa kecepatan puncak palsu.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bangunEcho, indeksBingkai } from '../../src/lib/ecmo/echo.ts'
import { simulasiSirkulasi as S, SIRKULASI_NORMAL as N, SKENARIO_SYOK_KARDIOGENIK as CS } from '../../src/lib/ecmo/sirkulasi.ts'

for (const p of [N, CS, { ...CS, ecmo: { konfigurasi: 'VA-perifer' as const, rpm: 4500 } }]) {
  const h = S(p), e = bangunEcho(h)!
  assert.ok(Math.abs(e.vtiIntegral - h.sv / Math.PI) < 1e-6, `VTI integral ≠ SV/luas LVOT: ${e.vtiIntegral} vs ${h.sv / Math.PI}`)
  const buka = e.bingkai.filter((b) => b.katupBuka).length / e.bingkai.length
  assert.ok(Math.abs(buka - h.fraksiBukaKatupAorta) < 0.02, 'katup echo harus mengikuti aliran aorta simulasi')
  const v = h.lingkarLV.map((t) => t.v), iMin = v.indexOf(Math.min(...v))
  assert.ok(Math.abs(e.bingkai[iMin].skalaRongga - Math.cbrt((v[iMin] / Math.max(...v)) ** 2)) < 1e-12, 'skala rongga = (V/Vmaks)^(2/3)')
  assert.ok(Math.max(...e.bingkai.map((b) => b.skalaRongga)) <= 1 + 1e-12)
}
// Arah fisiologis: dukungan VA tinggi pada LV lemah → VTI turun, rongga berayun lebih sedikit.
const tanpa = bangunEcho(S(CS))!, dengan = bangunEcho(S({ ...CS, ecmo: { konfigurasi: 'VA-perifer', rpm: 4500 } }))!
assert.ok(dengan.vtiIntegral < tanpa.vtiIntegral, 'aliran VA tinggi → VTI aorta turun')
assert.ok(Math.min(...dengan.bingkai.map((b) => b.skalaRongga)) > Math.min(...tanpa.bingkai.map((b) => b.skalaRongga)), 'aliran VA tinggi → rongga LV berayun lebih sedikit')
assert.equal(bangunEcho(S({ ...N, hr: 0 })), null, 'keadaan tidak sah → tanpa echo')
// Regresi crash browser: stempel rAF sebelum waktu mulai memberi indeks negatif → panel ECMO hilang.
for (const t of [-5, 0, 3, 999, 1e7]) { const k = indeksBingkai(1000 + t, 1000, 0.005, 160); assert.ok(Number.isInteger(k) && k >= 0 && k < 160, `indeks bingkai di luar 0..n-1 pada t=${t}: ${k}`) }
assert.equal(indeksBingkai(NaN, 0, 0.005, 160), 0); assert.equal(indeksBingkai(10, 0, 0.005, 0), 0)
assert.match(readFileSync('src/components/PanelEcmo.tsx', 'utf8'), /indeksBingkai\(/, 'animasi echo harus memakai indeksBingkai')
// UI: dinyatakan skematis; kecepatan puncak tidak ditampilkan (bentuk profil belum tervalidasi).
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /data-ecmo-echo/); assert.match(ui, /not an ultrasound image/i)
assert.doesNotMatch(ui, /kecepatanPuncak/, 'kecepatan puncak tidak boleh ditampilkan sebelum inersia dimodelkan')
console.log('ecmo-echo: lulus')
