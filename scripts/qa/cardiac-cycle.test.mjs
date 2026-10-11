import test from 'node:test'
import assert from 'node:assert/strict'
import { cardiacStateAt, phaseDurations, validateParams, DEFAULT_PARAMS, HR_MIN, HR_MAX, PHASE_LABEL } from '../../src/domains/body-exposure/engine/cardiacCycle.ts'

const P = (over = {}) => ({ ...DEFAULT_PARAMS, ...over })
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`)

test('durasi_fase_berjumlah_tepat_satu_siklus_dan_semua_positif_pada_seluruh_rentang', () => {
  for (const hr of [HR_MIN, 40, 70, 120, 180, HR_MAX]) {
    const d = phaseDurations(hr); const sum = Object.values(d).reduce((x, y) => x + y, 0)
    near(sum, 60 / hr, 1e-12, `HR ${hr}`); for (const [k, v] of Object.entries(d)) assert.ok(v > 0, `${k} at ${hr}`)
  }
})

test('sistol_memendek_saat_denyut_naik_dan_diastol_lebih_cepat', () => {
  const sys = (hr) => { const d = phaseDurations(hr); return d.isovolumic_contraction + d.ejection }
  assert.ok(sys(60) > sys(120) && sys(120) > sys(180))
  const dia = (hr) => 60 / hr - sys(hr); assert.ok(dia(60) > dia(120) * 1.5)
})

test('volume_ventrikel_di_antara_esv_dan_edv_dan_fraksi_ejeksi_sesuai_parameter', () => {
  const p = P()
  let lo = Infinity, hi = -Infinity
  for (let t = 0; t < 60 / p.hrBpm; t += 0.002) { const s = cardiacStateAt(p, t); lo = Math.min(lo, s.ventricleMl); hi = Math.max(hi, s.ventricleMl); assert.ok(s.atriumMl >= p.atriumMinMl - 1e-9 && s.atriumMl <= p.atriumMaxMl + 1e-9) }
  near(lo, p.esvMl, 0.05, 'min = ESV'); near(hi, p.edvMl, 1e-9, 'max = EDV')
  near(cardiacStateAt(p, 0).ejectionFraction, (120 - 50) / 120, 1e-12)
})

test('urutan_fase_dalam_satu_siklus_dan_awal_siklus_adalah_edv_isovolumik', () => {
  const p = P(); const rr = 60 / p.hrBpm; const seen = []
  for (let t = 0; t < rr; t += rr / 2000) { const ph = cardiacStateAt(p, t).phase; if (seen[seen.length - 1] !== ph) seen.push(ph) }
  assert.deepEqual(seen, ['isovolumic_contraction', 'ejection', 'isovolumic_relaxation', 'rapid_filling', 'diastasis', 'atrial_systole'])
  assert.equal(cardiacStateAt(p, 0).phase, 'isovolumic_contraction'); near(cardiacStateAt(p, 0).ventricleMl, p.edvMl, 1e-12)
  for (const k of seen) assert.ok(PHASE_LABEL[k])
})

test('periodik_tanpa_lompatan_di_sambungan_dan_waktu_negatif_membungkus', () => {
  const p = P(); const rr = 60 / p.hrBpm, e = 1e-7
  const a = cardiacStateAt(p, rr - e), b = cardiacStateAt(p, e)
  near(a.ventricleMl, b.ventricleMl, 1e-3, 'ventricle seam'); near(a.atriumMl, b.atriumMl, 1e-3, 'atrium seam')
  near(cardiacStateAt(p, -0.1).ventricleMl, cardiacStateAt(p, rr - 0.1).ventricleMl, 1e-9)
  near(cardiacStateAt(p, 3 * rr + 0.2).ventricleMl, cardiacStateAt(p, 0.2).ventricleMl, 1e-9)
})

test('ventrikel_dan_atrium_bergerak_berlawanan_fase_saat_ejeksi', () => {
  const p = P(); const d = phaseDurations(p.hrBpm)
  const t0 = d.isovolumic_contraction + 0.1 * d.ejection, t1 = d.isovolumic_contraction + 0.9 * d.ejection
  const s0 = cardiacStateAt(p, t0), s1 = cardiacStateAt(p, t1)
  assert.ok(s1.ventricleMl < s0.ventricleMl); assert.ok(s1.atriumMl > s0.atriumMl)   // ventrikel mengosongkan, atrium terisi
})

test('skala_dari_akar_pangkat_tiga_volume_dan_tidak_melampaui_satu', () => {
  const p = P()
  for (let t = 0; t < 0.9; t += 0.01) { const s = cardiacStateAt(p, t); assert.ok(s.ventricleScale <= 1 + 1e-12 && s.atriumScale <= 1 + 1e-12 && s.wholeHeartScale <= 1 + 1e-12) }
  near(cardiacStateAt(p, 0).ventricleScale, 1, 1e-12); near(cardiacStateAt(p, 0.3).ventricleScale, Math.cbrt(cardiacStateAt(p, 0.3).ventricleMl / 120), 1e-12)
})

test('parameter_tidak_sah_ditolak_dan_batas_denyut_diterima', () => {
  for (const hr of [HR_MIN, HR_MAX]) assert.equal(validateParams(P({ hrBpm: hr })), null)
  for (const hr of [HR_MIN - 0.1, HR_MAX + 0.1, NaN, Infinity, 0, -70]) assert.match(validateParams(P({ hrBpm: hr })), /heart rate/, String(hr))
  assert.match(validateParams(P({ esvMl: 120 })), /end-systolic volume must be below/); assert.match(validateParams(P({ esvMl: 130 })), /end-systolic/)
  assert.match(validateParams(P({ atriumMinMl: 65 })), /atrial/); assert.match(validateParams(P({ edvMl: -1 })), /positive/); assert.match(validateParams(P({ edvMl: NaN })), /positive/)
  assert.throws(() => cardiacStateAt(P({ hrBpm: 500 }), 0), RangeError); assert.throws(() => cardiacStateAt(P(), NaN), RangeError); assert.throws(() => cardiacStateAt(P(), Infinity), RangeError)
})
