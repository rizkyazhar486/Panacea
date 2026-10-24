import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseRespiratoryModel, sampleRespiration, cycleAt, PHASE_COUNT, SCALE_MIN, SCALE_MAX } from '../../src/domains/body-exposure/engine/respiratoryMotion.ts'

// fixture sintetis: skala naik linear 1.00 → 1.09 lalu turun; BUKAN data pasien, hanya untuk menguji mesin
const near = (a, b, tol = 1e-9) => a.forEach((x, k) => assert.ok(Math.abs(x - b[k]) <= tol, `${x} vs ${b[k]}`)) // toleransi 1e-9: i/10 tidak persis di batas fase
const phase = (i) => ({ phase_index: i, volume_ml: 2000 + 100 * Math.sin((Math.PI * i) / 5) ** 2 * 5, scale_lr_ap_si: [1 + 0.01 * (i < 5 ? i : 10 - i), 1 + 0.02 * (i < 5 ? i : 10 - i), 1 + 0.03 * (i < 5 ? i : 10 - i)], centroid_shift_mm_lr_ap_si: [0, 0.5 * (i < 5 ? i : 10 - i), -2 * (i < 5 ? i : 10 - i)] })
const raw = (over = {}) => ({ schema: 1, kind: 'respiratory_motion_model', truth_class: 'measured-transferred', label: 'l', source: 's', licence: 'CC BY 3.0', citation: 'c', limitations: 'x', cases: ['a'], phases: Array.from({ length: 10 }, (_, i) => phase(i)), ...over })

test('model_valid_diterima_dan_membawa_sumber_lisensi_dan_batas', () => {
  const r = parseRespiratoryModel(raw())
  assert.equal(r.ok, true); assert.equal(r.model.phases.length, PHASE_COUNT); assert.equal(r.model.licence, 'CC BY 3.0'); assert.equal(r.model.truthClass, 'measured-transferred')
})

test('model_tanpa_sumber_lisensi_sitasi_atau_batas_ditolak', () => {
  for (const k of ['label', 'source', 'licence', 'citation', 'limitations']) {
    const r = parseRespiratoryModel(raw({ [k]: '  ' })); assert.equal(r.ok, false, k); assert.match(r.error, new RegExp(k))
  }
  assert.equal(parseRespiratoryModel(raw({ cases: [] })).ok, false)
})

test('kelas_kebenaran_selain_measured_transferred_ditolak', () => {
  for (const c of ['simulated', 'measured', 'patient-specific', undefined]) assert.equal(parseRespiratoryModel(raw({ truth_class: c })).ok, false, String(c))
  assert.equal(parseRespiratoryModel(raw({ schema: 2 })).ok, false); assert.equal(parseRespiratoryModel(null).ok, false); assert.equal(parseRespiratoryModel('x').ok, false)
})

test('jumlah_fase_urutan_volume_dan_angka_tidak_wajar_ditolak', () => {
  const p = raw().phases
  assert.equal(parseRespiratoryModel(raw({ phases: p.slice(0, 9) })).ok, false)               // 9 fase
  assert.equal(parseRespiratoryModel(raw({ phases: [...p, phase(10)] })).ok, false)             // 11 fase
  assert.equal(parseRespiratoryModel(raw({ phases: [p[1], p[0], ...p.slice(2)] })).ok, false)  // urutan terbalik
  assert.equal(parseRespiratoryModel(raw({ phases: p.map((x, i) => (i === 3 ? { ...x, volume_ml: 0 } : x)) })).ok, false)
  assert.equal(parseRespiratoryModel(raw({ phases: p.map((x, i) => (i === 3 ? { ...x, volume_ml: NaN } : x)) })).ok, false)
  assert.equal(parseRespiratoryModel(raw({ phases: p.map((x, i) => (i === 3 ? { ...x, scale_lr_ap_si: [1, 1, Infinity] } : x)) })).ok, false)
})

test('skala_tepat_di_batas_diterima_dan_satu_langkah_di_luar_ditolak', () => {
  const at = (v) => raw({ phases: raw().phases.map((x, i) => (i === 2 ? { ...x, scale_lr_ap_si: [v, 1, 1] } : x)) })
  assert.equal(parseRespiratoryModel(at(SCALE_MIN)).ok, true); assert.equal(parseRespiratoryModel(at(SCALE_MAX)).ok, true)
  assert.equal(parseRespiratoryModel(at(SCALE_MIN - 0.001)).ok, false); assert.equal(parseRespiratoryModel(at(SCALE_MAX + 0.001)).ok, false)
  const sh = (v) => raw({ phases: raw().phases.map((x, i) => (i === 2 ? { ...x, centroid_shift_mm_lr_ap_si: [0, 0, v] } : x)) })
  assert.equal(parseRespiratoryModel(sh(60)).ok, true); assert.equal(parseRespiratoryModel(sh(60.01)).ok, false)
})

test('sampel_tepat_di_fase_dan_periodik_di_sambungan', () => {
  const m = parseRespiratoryModel(raw()).model
  for (const i of [0, 3, 7]) {
    const s = sampleRespiration(m, i / 10)
    near(s.scale, m.phases[i].scale); near(s.centroidShiftMm, m.phases[i].centroidShiftMm)
  }
  near(sampleRespiration(m, 1).scale, sampleRespiration(m, 0).scale)      // 1.0 membungkus ke 0
  near(sampleRespiration(m, -0.3).scale, sampleRespiration(m, 0.7).scale) // negatif membungkus
  const eps = 1e-6, a = sampleRespiration(m, 1 - eps).scale, b = sampleRespiration(m, eps).scale
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(a[k] - b[k]) < 1e-4, `seam axis ${k}`)
})

test('sampel_tidak_melampaui_data_dan_menolak_waktu_tidak_sah', () => {
  const m = parseRespiratoryModel(raw()).model
  const all = m.phases.flatMap((p) => p.scale); const lo = Math.min(...all), hi = Math.max(...all)
  for (let t = 0; t < 1; t += 0.013) for (const s of sampleRespiration(m, t).scale) assert.ok(s >= lo - 1e-12 && s <= hi + 1e-12)
  assert.throws(() => sampleRespiration(m, NaN), RangeError); assert.throws(() => sampleRespiration(m, Infinity), RangeError)
  assert.throws(() => cycleAt(1, 0), RangeError); assert.throws(() => cycleAt(NaN, 4), RangeError); assert.throws(() => cycleAt(1, -4), RangeError)
  assert.equal(cycleAt(4, 4), 0); assert.equal(cycleAt(2, 4), 0.5); assert.equal(cycleAt(-1, 4), 0.75)
})

test('model_terbit_valid_lisensi_cc_by_3_dan_dua_kali_jalan_sama', async () => {
  const pub = JSON.parse(await readFile(new URL('../../public/bodyexposure/respiration_model.json', import.meta.url), 'utf8'))
  const r = parseRespiratoryModel(pub)
  assert.equal(r.ok, true, r.error)
  assert.match(r.model.licence, /CC BY 3\.0/); assert.match(r.model.citation, /Hugo/); assert.ok(r.model.cases >= 3)
  assert.ok(r.model.phases[0].scale.every((x) => Math.abs(x - 1) < 1e-9), 'phase 0 is the reference')
  assert.deepEqual(sampleRespiration(r.model, 0.37), sampleRespiration(r.model, 0.37))
})

test('cycleAt rejects overflow rather than returning a NaN animation phase', () => {
  for (const time of [Number.MAX_VALUE, -Number.MAX_VALUE]) {
    assert.throws(() => cycleAt(time, 0.001), RangeError)
    assert.throws(() => cycleAt(time, Number.MIN_VALUE), RangeError)
  }
})

test('cycleAt preserves normal playback and finite boundary phases', () => {
  for (const period of [2, 4, 10]) for (const time of [-10, -1, 0, 0.125, 2, 4, 60, 3600]) {
    assert.equal(cycleAt(time, period), (((time / period) % 1) + 1) % 1)
  }
  assert.equal(cycleAt(Number.MAX_VALUE, Number.MAX_VALUE), 0)
  assert.equal(cycleAt(Number.MIN_VALUE, Number.MIN_VALUE), 0)
  assert.equal(cycleAt(0, Number.MIN_VALUE), 0)
})
