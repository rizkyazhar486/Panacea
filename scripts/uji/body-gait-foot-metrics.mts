// Metrik kaki WALK/RUN (D7): rumus asimetri eksak, penolakan fail-closed, dan penilaian selip terhadap kriteria eksplisit.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fitFootContact } from '../qa/foot-contact-math.mjs'
import { footAsymmetry, evaluateFootSlide, RESEARCH_FOOT_SLIDE_CRITERIA as C } from '../../src/domains/body-exposure/engine/gaitFootMetrics.ts'

// D7 (ENG-D7-01): data tidak terukur wajib berstatus 'unmeasurable' — memeriksa alasan saja tidak cukup, status 'within' dengan alasan tetap lolos.
const unmeasurable = (result: any, reason: string, msg?: string) => {
  assert.equal(result?.status, 'unmeasurable', `${msg ?? reason}: status harus unmeasurable, bukan ${result?.status}`)
  assert.equal(result.reason, reason, msg)
}

const s = (value: number | null | undefined, unit = 'mm', frame = 'pelvis') => ({ value, unit, frame })
// positif: nilai eksak
assert.deepEqual(footAsymmetry(s(10), s(14)), { ok: true, absoluteDifference: 4, meanMagnitude: 12, relativeDifferencePercent: 100 * 4 / 12 })
assert.equal((footAsymmetry(s(14), s(10)) as any).absoluteDifference, 4, 'simetris_terhadap_urutan')
assert.equal((footAsymmetry(s(-10), s(10)) as any).absoluteDifference, 20, 'selisih_bertanda')
assert.equal((footAsymmetry(s(-10), s(10)) as any).relativeDifferencePercent, 200, 'penyebut_memakai_abs')
// batas: kedua sisi sama → 0 persen; kedua 0 → relatif tidak terdefinisi (null), mutlak 0
assert.equal((footAsymmetry(s(7), s(7)) as any).relativeDifferencePercent, 0)
assert.deepEqual(footAsymmetry(s(0), s(0)), { ok: true, absoluteDifference: 0, meanMagnitude: 0, relativeDifferencePercent: null })
assert.equal((footAsymmetry(s(0), s(5)) as any).relativeDifferencePercent, 200, 'satu_sisi_nol_tetap_terdefinisi')
// negatif berpasangan
for (const [l, r, why] of [[s(null), s(1), 'missing'], [s(undefined), s(1), 'missing'], [s(NaN), s(1), 'not_finite'], [s(1), s(Infinity), 'not_finite'], [s(1, 'mm'), s(1, 'm'), 'unit_mismatch'], [s(1, 'mm', 'pelvis'), s(1, 'mm', 'world'), 'frame_mismatch']] as const) {
  assert.deepEqual(footAsymmetry(l, r), { ok: false, reason: why }, `menolak_${why}`)
}
assert.deepEqual(footAsymmetry(null, s(1)), { ok: false, reason: 'missing' })
assert.deepEqual(footAsymmetry(s('3' as any), s(1)), { ok: false, reason: 'not_finite' }, 'menolak_string')

// penilaian selip: batas tepat lulus, ±1 langkah gagal
const ok = { stance_phases: 2, stance_frames: 6, slide_rms_mm: 15, slide_max_mm: 30 }
assert.equal(evaluateFootSlide(ok, C).status, 'within', 'menerima_tepat_di_batas')
assert.deepEqual(evaluateFootSlide({ ...ok, slide_rms_mm: 15.1 }, C), { status: 'exceeds', criteria: C, failed: ['rms'] })
assert.deepEqual(evaluateFootSlide({ ...ok, slide_max_mm: 30.1 }, C), { status: 'exceeds', criteria: C, failed: ['peak'] })
assert.deepEqual((evaluateFootSlide({ ...ok, slide_rms_mm: 99, slide_max_mm: 99 }, C) as any).failed, ['rms', 'peak'])
// statistik tipis / data hilang = tidak terukur, bukan lulus
unmeasurable(evaluateFootSlide({ ...ok, stance_phases: 1 }, C), 'too_few_phases')
assert.equal(evaluateFootSlide({ ...ok, stance_phases: 2 }, C).status, 'within', 'pasangan: hanya jumlah fase berbeda (batas bawah 2)')
assert.equal(C.minStancePhases, 2, 'satu siklus tertutup hanya punya satu fase tumpu per kaki')
unmeasurable(evaluateFootSlide({ stance_phases: 0 }, C), 'no_stance')
unmeasurable(evaluateFootSlide(null, C), 'no_stance')
unmeasurable(evaluateFootSlide({ stance_phases: 2, slide_rms_mm: 1 }, C), 'missing_values')
unmeasurable(evaluateFootSlide({ stance_phases: 2, slide_rms_mm: NaN, slide_max_mm: 1 }, C), 'missing_values')
unmeasurable(evaluateFootSlide({ stance_phases: 2, slide_rms_mm: -1, slide_max_mm: 1 }, C), 'missing_values')
// Without independent sampling counts, an arithmetic RMS alone is never proof of contact.
for (const sample of [
  { ...ok, stance_frames: undefined },
  { ...ok, stance_frames: 5 },
  { ...ok, stance_frames: 0 },
  { ...ok, stance_frames: Number.NaN },
  { ...ok, stance_frames: 6.5 },
]) unmeasurable(evaluateFootSlide(sample, C), 'insufficient_frames', 'insufficient or malformed stance frame evidence')
assert.equal(evaluateFootSlide({ ...ok, stance_frames: 6 }, C).status, 'within', 'exactly three samples per stance permits assessment')
unmeasurable(evaluateFootSlide({ ...ok, stance_phases: 1.5 }, C), 'too_few_phases', 'fractional phases are not physically valid')
unmeasurable(evaluateFootSlide(ok, { ...C, minStancePhases: 0 }), 'invalid_criteria', 'zero required phases cannot certify a gait')
unmeasurable(evaluateFootSlide(ok, { ...C, minStancePhases: 2.5 }), 'invalid_criteria', 'fractional required phases cannot certify a gait')
unmeasurable(evaluateFootSlide(ok, { ...C, provenance: '  ' }), 'invalid_criteria', 'whitespace-only provenance is not evidence')
unmeasurable(evaluateFootSlide(ok, { ...C, provenance: '' }), 'invalid_criteria')
unmeasurable(evaluateFootSlide(ok, { ...C, maxRmsMm: NaN }), 'invalid_criteria')
assert.match(C.provenance, /not clinically validated/)

// data nyata dari rig (bodyexposure/qa_reports/gait_foot_slide.json): hanya WALK jari yang cukup untuk dinilai
const real = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_foot_slide.json', 'utf8')).clips
const v = (c: string, k: string) => evaluateFootSlide(real[c][k], C)
assert.equal(v('WALK', 'toe').status, 'within')
unmeasurable(v('WALK', 'heel'), 'too_few_phases')
unmeasurable(v('RUN', 'heel'), 'too_few_phases')
unmeasurable(v('RUN', 'toe'), 'no_stance')
// fixture nol fase tumpu lewat jalur penuh (fitFootContact -> evaluateFootSlide): tidak pernah PASS dan tidak pernah FAIL
const zeroStance = evaluateFootSlide(fitFootContact([]), C)
unmeasurable(zeroStance, 'no_stance', 'fixture nol fase tumpu')
assert.notEqual(zeroStance.status, 'within'); assert.notEqual(zeroStance.status, 'exceeds')
for (const bad of [undefined, {}, { stance_phases: -1 }, { stance_phases: '2' }]) unmeasurable(evaluateFootSlide(bad as any, C), 'no_stance', `stance_phases tidak sah: ${JSON.stringify(bad)}`)
// determinisme
assert.deepEqual(evaluateFootSlide(ok, C), evaluateFootSlide(ok, C))
console.log('body-gait-foot-metrics: asimetri eksak; data buruk ditolak; selip tipis = tidak terukur; WALK jari dalam kriteria penelitian, 3 ukuran lain tidak terukur')
