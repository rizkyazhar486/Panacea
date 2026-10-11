import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseFetalTables, assessMeasurement, normalCdf, GA_MIN_WEEKS, GA_MAX_WEEKS } from '../../src/domains/body-exposure/engine/fetalBiometry.ts'

const raw = JSON.parse(await readFile(new URL('../../public/bodyexposure/fetal_reference_tables.json', import.meta.url), 'utf8'))
const parsed = parseFetalTables(raw); assert.equal(parsed.ok, true, parsed.error)
const T = parsed.tables
const A = (reference, measure, weeks, days, value) => assessMeasurement(T, { reference, measure, weeks, days, value })
const near = (a, b, tol, m = '') => assert.ok(Math.abs(a - b) <= tol, `${m} ${a} vs ${b}`)

// Nilai di bawah disalin dari tabel terbit (WHO Tabel 7 dan 11; INTERGROWTH-21st HC dan BPD), bukan dari keluaran kode.
test('who_hc_minggu_40_nilai_pada_persentil_terbit_memberi_persentil_tepat', () => {
  for (const [v, p] of [[319, 2.5], [321, 5], [325, 10], [334, 25], [342, 50], [350, 75], [357, 90], [360, 95], [363, 97.5]]) { const r = A('who_2017', 'hc', 40, 0, v); assert.equal(r.status, 'ok'); assert.equal(r.percentile, p, `HC ${v}`); assert.equal(r.band, 'within') }
  assert.equal(A('who_2017', 'hc', 14, 0, 100).percentile, 50)       // Tabel 7, minggu 14: 86 88 91 95 100 104 107 110 112
  assert.equal(A('who_2017', 'efw', 40, 0, 3617).percentile, 50)      // Tabel 11, minggu 40
  assert.equal(A('who_2017', 'efw', 14, 0, 90).referenceMedian, 90)
})

test('who_di_antara_persentil_diinterpolasi_linear_dan_di_luar_rentang_hanya_dinyatakan_batas', () => {
  near(A('who_2017', 'hc', 40, 0, 338).percentile, 37.5, 1e-9, 'tengah antara p25 (334) dan p50 (342)')
  const lo = A('who_2017', 'hc', 40, 0, 300), hi = A('who_2017', 'hc', 40, 0, 400)
  assert.equal(lo.percentile, null); assert.equal(lo.band, 'below_lowest'); assert.equal(lo.lowestPercentile, 2.5)
  assert.equal(hi.percentile, null); assert.equal(hi.band, 'above_highest'); assert.equal(hi.highestPercentile, 97.5)
  assert.equal(A('who_2017', 'hc', 40, 0, 319).band, 'within'); assert.equal(A('who_2017', 'hc', 40, 0, 318.99).band, 'below_lowest')   // batas tepat
})

test('who_efw_per_jenis_kelamin_memakai_persentil_5_sampai_95_sendiri', () => {
  const f = A('who_2017', 'efw_female', 40, 0, 3294); assert.equal(f.percentile, 25); assert.equal(A('who_2017', 'efw_female', 40, 0, 3567).percentile, 50);   // Tabel 14, minggu 40: 2775 3010 3294 3567 3832 4131 4247 (5. sampai 95.)
   assert.equal(f.lowestPercentile, 5); assert.equal(f.highestPercentile, 95)
  assert.equal(A('who_2017', 'efw_female', 40, 0, 2700).band, 'below_lowest')
  assert.notEqual(A('who_2017', 'efw_male', 40, 0, 3294).percentile, 25)   // tabel laki-laki berbeda
})

test('intergrowth_hc_minggu_20_median_adalah_z_nol_dan_persentil_50', () => {
  const r = A('intergrowth_2014', 'hc', 20, 0, 172.48); assert.equal(r.zScore, 0); near(r.percentile, 50, 1e-6, 'CDF approximation error < 1.5e-7'); assert.equal(r.referenceMedian, 172.48)
  near(A('intergrowth_2014', 'bpd', 14, 0, 29.61).percentile, 50, 1e-6)        // tabel Z: BPD minggu 14, z 0 = 29.61
  near(A('intergrowth_2014', 'bpd', 14, 0, 31.36).zScore, 1, 1e-9)              // z +1 = 31.36
})

test('intergrowth_persentil_dari_z_cocok_dengan_tabel_persentil_terbit_pada_semua_ukuran_dan_minggu', () => {
  for (const k of ['hc', 'bpd', 'ac', 'fl']) for (let w = GA_MIN_WEEKS; w <= GA_MAX_WEEKS; w++) {
    const c = T.references.intergrowth_2014.measures[k].centile_table[String(w)]   // 3,5,10,50,90,95,97
    for (const [i, p] of [[0, 3], [1, 5], [2, 10], [4, 90], [5, 95], [6, 97]]) near(A('intergrowth_2014', k, w, 0, c[i]).percentile, p, 0.35, `${k} w${w} p${p}`)
  }
})

test('persentil_dari_z_beyond_tiga_sd_hanya_batas_dan_normalCdf_nilai_baku', () => {
  assert.equal(A('intergrowth_2014', 'hc', 20, 0, 500).band, 'above_highest'); assert.equal(A('intergrowth_2014', 'hc', 20, 0, 100).band, 'below_lowest')
  near(normalCdf(0), 0.5, 1e-7); near(normalCdf(1.959964), 0.975, 1e-6); near(normalCdf(-1.644854), 0.05, 1e-6); near(normalCdf(3), 0.998650, 1e-6)
})

test('usia_hari_antara_minggu_diinterpolasi_dan_ditandai_sedangkan_minggu_penuh_tidak', () => {
  const r = A('who_2017', 'hc', 20, 3, 150); assert.equal(r.gaInterpolated, true); near(r.gestationalAgeWeeks, 20 + 3 / 7, 1e-12)
  assert.equal(A('who_2017', 'hc', 20, 0, 150).gaInterpolated, false)
  const m20 = T.references.who_2017.measures.hc.table['20'][4], m21 = T.references.who_2017.measures.hc.table['21'][4]
  near(A('who_2017', 'hc', 20, 7 - 7 + 3, 150).referenceMedian, m20 + (m21 - m20) * 3 / 7, 1e-9)
  assert.equal(A('who_2017', 'hc', 40, 0, 342).gaInterpolated, false)       // batas atas: minggu 40 + 0 hari
})

test('usia_di_luar_14_sampai_40_minggu_dan_masukan_tidak_sah_tidak_tersedia_dengan_alasan', () => {
  for (const [w, d] of [[13, 6], [40, 1], [41, 0], [10, 0], [0, 0], [45, 3]]) { const r = A('who_2017', 'hc', w, d, 300); assert.equal(r.status, 'unavailable', `${w}+${d}`); assert.equal(r.reason, 'ga_out_of_range') }
  assert.equal(A('who_2017', 'hc', 14, 0, 100).status, 'ok'); assert.equal(A('who_2017', 'hc', 40, 0, 342).status, 'ok')   // batas tepat diterima
  for (const [w, d] of [[20, 7], [20, -1], [20.5, 0], [NaN, 0], [20, NaN]]) assert.equal(A('who_2017', 'hc', w, d, 150).reason, 'ga_invalid', `${w}+${d}`)
  for (const v of [0, -5, NaN, Infinity]) assert.equal(A('who_2017', 'hc', 20, 0, v).reason, 'value_invalid', String(v))
})

test('efw_tidak_ada_di_intergrowth_dan_pesan_menyebut_alasannya', () => {
  for (const k of ['efw', 'efw_female', 'efw_male']) { const r = A('intergrowth_2014', k, 30, 0, 1500); assert.equal(r.status, 'unavailable'); assert.equal(r.reason, 'measure_not_in_reference'); assert.match(r.message, /no estimated fetal weight standard/) }
  assert.equal(A('who_2017', 'nope', 30, 0, 1500).reason, 'measure_not_in_reference')
})

test('keluaran_membawa_sumber_lisensi_populasi_metode_unit_dan_peringatan', () => {
  const r = A('who_2017', 'hc', 30, 0, 280)
  assert.match(r.source.citation, /Kiserud/); assert.match(r.source.licence, /Creative Commons Attribution/); assert.match(r.source.population, /1,387 low-risk singleton/); assert.match(r.source.method, /Quantile regression/)
  assert.equal(r.unit, 'mm'); assert.match(r.caveat, /qualified clinician/); assert.match(A('who_2017', 'efw', 30, 0, 1500).unit, /^g$/)
  const g = A('intergrowth_2014', 'hc', 30, 0, 280); assert.match(g.source.citation, /Papageorghiou/); assert.match(g.source.population, /eight urban areas/)
})

test('tabel_rusak_atau_tanpa_sumber_ditolak', () => {
  assert.equal(parseFetalTables(null).ok, false); assert.equal(parseFetalTables({ ...raw, schema: 2 }).ok, false)
  const bad = structuredClone(raw); bad.references.who_2017.citation = ' '; assert.equal(parseFetalTables(bad).ok, false)
  const bad2 = structuredClone(raw); bad2.references.who_2017.measures.hc.table['30'] = [1, 2]; assert.equal(parseFetalTables(bad2).ok, false)
  const bad3 = structuredClone(raw); bad3.references.who_2017.measures.hc.table['30'][4] = 1e9; assert.equal(parseFetalTables(bad3).ok, false)   // tidak naik
  const bad4 = structuredClone(raw); delete bad4.references.intergrowth_2014.measures.hc.z_table['25']; assert.equal(parseFetalTables(bad4).ok, false)
})
