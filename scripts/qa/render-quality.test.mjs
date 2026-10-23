import test from 'node:test'
import assert from 'node:assert/strict'
import { frameStats, nextAutoPreset, stepAuto, initialPreset, effectivePixelRatio, QUALITY_PRESETS } from '../../src/domains/body-exposure/engine/renderQuality.ts'

const steady = (ms, n = 100) => Array.from({ length: n }, () => ms)

test('statistik_frame_stabil_60fps', () => {
  const s = frameStats(steady(16))
  assert.equal(s.count, 100)
  assert.equal(s.meanMs, 16)
  assert.equal(s.p95Ms, 16)
  assert.equal(Math.round(s.fpsMean), 63)
})

test('statistik_1persen_rendah_dari_p99', () => {
  const v = [...steady(16, 98), 50, 50]
  const s = frameStats(v)
  assert.equal(s.p99Ms, 50)
  assert.equal(s.fps1Low, 20)
})

test('statistik_membuang_sampel_tidak_valid', () => {
  const s = frameStats([...steady(20, 12), -1, 0, Number.NaN, 5000])
  assert.equal(s.count, 12)
  assert.equal(s.meanMs, 20)
})

test('statistik_menolak_sampel_kurang_dari_10', () => {
  assert.equal(frameStats(steady(16, 9)), null)
  assert.equal(frameStats([]), null)
})

test('auto_turun_bila_p95_lewat_anggaran_30fps', () => {
  assert.equal(nextAutoPreset('ultra', frameStats(steady(40))), 'balanced')
  assert.equal(nextAutoPreset('balanced', frameStats(steady(40))), 'performance')
  assert.equal(nextAutoPreset('performance', frameStats(steady(40))), 'performance')  // batas bawah
})

test('auto_naik_hanya_bila_jauh_di_bawah_anggaran_60fps', () => {
  assert.equal(nextAutoPreset('performance', frameStats(steady(9))), 'balanced')      // 9 ≤ 10 ms
  assert.equal(nextAutoPreset('balanced', frameStats(steady(12))), 'balanced')         // 12 > 10 ms: tetap
  assert.equal(nextAutoPreset('ultra', frameStats(steady(5))), 'ultra')               // batas atas
})

test('auto_batas_tepat_anggaran_30fps_tidak_turun', () => {
  assert.equal(nextAutoPreset('ultra', frameStats(steady(1000 / 30))), 'ultra')
})

test('auto_tanpa_statistik_tetap', () => {
  assert.equal(nextAutoPreset('balanced', null), 'balanced')
})

test('preset_awal_dari_viewport', () => {
  assert.equal(initialPreset(390, 3), 'balanced')
  assert.equal(initialPreset(1440, 2), 'ultra')
  assert.equal(initialPreset(767, 1), 'balanced')
  assert.equal(initialPreset(768, 1), 'ultra')
})

test('preset_awal_menolak_input_tidak_valid', () => {
  assert.equal(initialPreset(Number.NaN, 2), 'performance')
  assert.equal(initialPreset(1200, 0), 'performance')
})

test('pixel_ratio_dibatasi_preset', () => {
  assert.equal(effectivePixelRatio(3, 'ultra'), QUALITY_PRESETS.ultra.maxPixelRatio)
  assert.equal(effectivePixelRatio(3, 'performance'), 1)
  assert.equal(effectivePixelRatio(1, 'ultra'), 1)
  assert.equal(effectivePixelRatio(Number.NaN, 'balanced'), 1)
})

const S0 = (preset) => ({ preset, overBudget: 0, atVsync: 0 })

test('histeresis_satu_hentakan_tidak_menurunkan', () => {
  const a = stepAuto(S0('ultra'), frameStats(steady(40)))
  assert.deepEqual(a, { preset: 'ultra', overBudget: 1, atVsync: 0 })
  const b = stepAuto(a, frameStats(steady(16)))   // pulih: hitungan direset
  assert.equal(b.preset, 'ultra'); assert.equal(b.overBudget, 0)
})

test('histeresis_dua_evaluasi_lambat_menurunkan', () => {
  const a = stepAuto(stepAuto(S0('ultra'), frameStats(steady(40))), frameStats(steady(40)))
  assert.deepEqual(a, { preset: 'balanced', overBudget: 0, atVsync: 0 })
})

test('histeresis_pulih_di_layar_60hz_setelah_tiga_evaluasi_vsync', () => {
  let s = S0('performance')
  for (let k = 0; k < 2; k++) s = stepAuto(s, frameStats(steady(1000 / 60)))
  assert.equal(s.preset, 'performance')
  s = stepAuto(s, frameStats(steady(1000 / 60)))
  assert.equal(s.preset, 'balanced')
})

test('histeresis_batas_atas_dan_bawah', () => {
  let s = S0('ultra')
  for (let k = 0; k < 5; k++) s = stepAuto(s, frameStats(steady(16)))
  assert.equal(s.preset, 'ultra')
  s = S0('performance')
  for (let k = 0; k < 5; k++) s = stepAuto(s, frameStats(steady(40)))
  assert.equal(s.preset, 'performance')
})

test('histeresis_tanpa_statistik_tidak_berubah', () => {
  const s = { preset: 'balanced', overBudget: 1, atVsync: 2 }
  assert.equal(stepAuto(s, null), s)
})
