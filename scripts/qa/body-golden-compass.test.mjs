import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  COMPASS_PIPELINE_STAGES,
  DEFAULT_WHAT_IF_PROFILE,
  GUIDELINE_TARGETS,
  WHAT_IF_PRESETS,
  evaluateBodyGoldenCompass,
} from '../../src/domains/body-exposure/engine/bodyGoldenCompassEngine.ts'

const FULL = {
  restingHrBpm: 58,
  systolicMmHg: 116,
  diastolicMmHg: 74,
  spo2Pct: 99,
  sleepHours: 7.8,
  waterMl: 2500,
  weightKg: 70,
  heightCm: 175,
  vo2Max: 52,
  labRecordCount: 3,
}

test('engine_murni_tanpa_dom_jam_acak_fetch', () => {
  const src = readFileSync(new URL('../../src/domains/body-exposure/engine/bodyGoldenCompassEngine.ts', import.meta.url), 'utf8')
  for (const forbidden of ['window', 'document', 'localStorage', 'Date.now', 'new Date', 'Math.random', 'fetch(']) {
    assert.equal(src.includes(forbidden), false, `Forbidden runtime reference found: ${forbidden}`)
  }
})

test('tujuh_tahap_pipeline_berurutan', () => {
  assert.deepEqual(
    COMPASS_PIPELINE_STAGES.map((s) => s.id),
    ['collect', 'process', 'interpret', 'specialize', 'coupling', 'visualize', 'simulate'],
  )
})

test('target_pedoman_bersumber_dan_eksak', () => {
  assert.equal(GUIDELINE_TARGETS.aerobic.minimum, 150)
  assert.equal(GUIDELINE_TARGETS.strength.minimum, 2)
  assert.equal(GUIDELINE_TARGETS.sleep.minimum, 7)
  for (const t of Object.values(GUIDELINE_TARGETS)) assert.ok(t.source.length > 10)
})

test('tanpa_skor_kesehatan_atau_proyeksi_masa_depan', () => {
  const res = evaluateBodyGoldenCompass(FULL)
  for (const key of ['compositeBaseline', 'compositeWhatIf', 'horizonLabel', 'couplingEdges']) {
    assert.equal(key in res, false, `${key} must not exist`)
  }
  for (const axis of res.axes) {
    assert.equal('whatIfScore' in axis, false)
    assert.equal('baselineScore' in axis, false)
  }
  assert.equal(res.clinicallyReviewed, false)
})

test('masukan_kosong_cakupan_nol_bukan_tebakan', () => {
  const res = evaluateBodyGoldenCompass({})
  assert.equal(res.processed.observedCount, 0)
  assert.equal(res.processed.completenessPct, 0)
  assert.equal(res.processed.bmi, null)
  assert.equal(res.processed.mapMmHg, null)
  assert.equal(res.processed.pulsePressureMmHg, null)
  for (const axis of res.axes) {
    assert.equal(axis.observedSignals, 0)
    assert.equal(axis.coveragePct, 0)
  }
  assert.equal(Object.isFrozen(res), true)
})

test('masukan_rusak_diperlakukan_kosong', () => {
  const res = evaluateBodyGoldenCompass({ restingHrBpm: Number.NaN, systolicMmHg: -120, diastolicMmHg: Infinity, weightKg: 0, heightCm: null })
  assert.equal(res.processed.observedCount, 0)
  assert.equal(res.processed.bmi, null)
  assert.equal(res.processed.mapMmHg, null)
})

test('data_lengkap_turunan_eksak_dan_cakupan_penuh', () => {
  const res = evaluateBodyGoldenCompass(FULL)
  assert.equal(res.processed.observedCount, 10)
  assert.equal(res.processed.completenessPct, 100)
  assert.equal(res.processed.bmi, 22.9) // 70 / 1.75²
  assert.equal(res.processed.mapMmHg, 88) // (116 + 2·74) / 3
  assert.equal(res.processed.pulsePressureMmHg, 42)
  assert.ok(res.axes.every((a) => a.coveragePct === 100))
})

test('menolak_map_bila_sistolik_tidak_lebih_dari_diastolik', () => {
  const bad = evaluateBodyGoldenCompass({ systolicMmHg: 70, diastolicMmHg: 80 })
  assert.equal(bad.processed.mapMmHg, null)
  assert.equal(bad.processed.pulsePressureMmHg, null)
  const ok = evaluateBodyGoldenCompass({ systolicMmHg: 120, diastolicMmHg: 80 })
  assert.equal(ok.processed.mapMmHg, 93)
})

test('cakupan_parsial_per_sumbu', () => {
  const res = evaluateBodyGoldenCompass({ restingHrBpm: 60 })
  const cardio = res.axes.find((a) => a.id === 'cardiovascular')
  assert.equal(cardio.observedSignals, 1)
  assert.equal(cardio.coveragePct, 33)
})

test('rencana_tepat_di_batas_minimum_memenuhi_semua_target', () => {
  const res = evaluateBodyGoldenCompass({}, DEFAULT_WHAT_IF_PROFILE)
  assert.equal(res.targetsMet, 3)
  assert.ok(res.targets.every((t) => t.met && t.attainmentPct === 100))
  assert.equal(res.recommendedSim4DMode, 'exercise')
})

test('rencana_satu_langkah_di_bawah_batas_tidak_memenuhi', () => {
  const res = evaluateBodyGoldenCompass({}, { sleepHoursPerNight: 6.5, aerobicMinPerWeek: 135, strengthDaysPerWeek: 1 })
  assert.equal(res.targetsMet, 0)
  const aerobic = res.targets.find((t) => t.id === 'aerobic')
  assert.equal(aerobic.attainmentPct, 90)
  assert.equal(res.recommendedSim4DMode, 'live')
})

test('rencana_di_atas_target_dibatasi_100_persen', () => {
  const res = evaluateBodyGoldenCompass({}, { sleepHoursPerNight: 9, aerobicMinPerWeek: 300, strengthDaysPerWeek: 5 })
  assert.ok(res.targets.every((t) => t.attainmentPct === 100))
  assert.ok(res.axes.every((a) => a.planAttainmentPct === 100))
})

test('rencana_rusak_dianggap_nol', () => {
  const res = evaluateBodyGoldenCompass({}, { sleepHoursPerNight: Number.NaN, aerobicMinPerWeek: -30, strengthDaysPerWeek: Infinity })
  const byId = Object.fromEntries(res.targets.map((t) => [t.id, t]))
  assert.equal(byId.sleep.planValue, 0)
  assert.equal(byId.aerobic.planValue, 0)
  assert.equal(byId.strength.planValue, 0)
  assert.equal(res.targetsMet, 0)
})

test('preset_di_bawah_pedoman_lebih_rendah_dari_preset_pedoman', () => {
  const good = evaluateBodyGoldenCompass({}, WHAT_IF_PRESETS.guideline)
  const below = evaluateBodyGoldenCompass({}, WHAT_IF_PRESETS.below)
  assert.ok(below.targetsMet < good.targetsMet)
})

test('deterministik', () => {
  assert.deepEqual(evaluateBodyGoldenCompass(FULL, WHAT_IF_PRESETS.below), evaluateBodyGoldenCompass(FULL, WHAT_IF_PRESETS.below))
})
