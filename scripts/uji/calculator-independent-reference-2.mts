// C6 (bagian rekayasa), tahap 2: sistem skor klinis berbasis tabel (Child-Pugh, MELD-Na, NEWS2, SOFA, Glasgow-Blatchford).
// Tiap mesin dibandingkan dengan acuan yang ditulis TERPISAH dari tabel/rumus terbitnya (tabel rentang, bukan salinan fungsi mesin), diuji
// ke seluruh nilai bilangan bulat pada rentang tiap parameter (bukan sampel), sampel acak berbenih, invarian, batas rentang, dan masukan
// bermusuhan. Bukti rekayasa, BUKAN tinjauan klinis: rentang masukan adalah batas kewajaran rekayasa, dan pita (mis. mortalitas SOFA,
// "very-low" Blatchford) belum memiliki sumber yang terverifikasi (lihat docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md).
import assert from 'node:assert/strict'
import { HOSTILE, close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  CP_RANGES, GBS_RANGES, MELD_RANGES, NEWS2_RANGES, SOFA_RANGES,
  childPugh, childPughClass, glasgowBlatchford, meldBand, meldNa, news2, news2Band, sofaMortalityBand, sofaScore,
} from '../../src/domains/clinical-calculators/index.ts'

const rand = mulberry32(20261016)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400

/** Tabel acuan: daftar [batas bawah termasuk, batas atas tidak termasuk, poin]; mencari rentang yang memuat nilai. */
type Rentang = readonly [number, number, number]
const cari = (tabel: readonly Rentang[], v: number): number => { const r = tabel.find(([lo, hi]) => v >= lo && v < hi); assert.ok(r, `acuan tidak mencakup ${v}`); return r![2] }
const INF = Infinity

// ── 1. Child-Pugh (Pugh et al., Br J Surg 1973;60:646-9) ─────────────────────────────────────────
// Bilirubin mg/dL: < 2 → 1; 2–3 → 2; > 3 → 3.  Albumin g/dL: > 3.5 → 1; 2.8–3.5 → 2; < 2.8 → 3.  INR: < 1.7 → 1; 1.7–2.3 → 2; > 2.3 → 3.
// Batas dua sisi diwakili dengan nilai tepat di atasnya agar tabel tetap setengah-terbuka: 3.0 masuk "2–3", 3.5 masuk "2.8–3.5", 2.3 masuk "1.7–2.3".
const eps = 1e-9
const CP_BIL: readonly Rentang[] = [[-INF, 2, 1], [2, 3 + eps, 2], [3 + eps, INF, 3]]
const CP_ALB: readonly Rentang[] = [[3.5 + eps, INF, 1], [2.8, 3.5 + eps, 2], [-INF, 2.8, 3]]
const CP_INR: readonly Rentang[] = [[-INF, 1.7, 1], [1.7, 2.3 + eps, 2], [2.3 + eps, INF, 3]]
const cpKelas = (t: number) => (t <= 6 ? 'Class A' : t <= 9 ? 'Class B' : 'Class C')
{
  const nilai = {
    bilirubin: [0.1, 1.99, 2, 2.01, 2.9, 3, 3.01, 10, 60],
    albumin: [0.5, 2.79, 2.8, 2.81, 3.4, 3.5, 3.51, 5, 7],
    inr: [0.5, 1.69, 1.7, 1.71, 2.2, 2.3, 2.31, 5, 15],
  }
  let n = 0
  for (const bilirubin of nilai.bilirubin) for (const albumin of nilai.albumin) for (const inr of nilai.inr) for (const ascites of [1, 2, 3]) for (const enceph of [1, 2, 3]) {
    const r = childPugh({ bilirubin, albumin, inr, ascites, enceph })
    const ref = cari(CP_BIL, bilirubin) + cari(CP_ALB, albumin) + cari(CP_INR, inr) + ascites + enceph
    assert.equal(r.pts, ref, `Child-Pugh ${JSON.stringify({ bilirubin, albumin, inr, ascites, enceph })}`); assert.equal(r.cls!.label, cpKelas(ref)); assert.ok(ref >= 5 && ref <= 15, 'total is within 5–15'); n++
  }
  assert.equal(n, 9 * 9 * 9 * 9, 'the full grid was exercised')
  for (let i = 0; i < N; i++) { // acak
    const v = { bilirubin: between(0.1, 60), albumin: between(0.5, 7), inr: between(0.5, 15), ascites: 1 + Math.floor(rand() * 3), enceph: 1 + Math.floor(rand() * 3) }
    assert.equal(childPugh(v).pts, cari(CP_BIL, v.bilirubin) + cari(CP_ALB, v.albumin) + cari(CP_INR, v.inr) + v.ascites + v.enceph)
  }
  // Monoton: memperburuk satu parameter tidak pernah menurunkan total.
  const dasar = { bilirubin: 1, albumin: 4, inr: 1.2, ascites: 1, enceph: 1 }
  for (const [k, urut] of [['bilirubin', [1, 2.5, 4]], ['albumin', [4, 3, 2]], ['inr', [1.2, 2, 3]], ['ascites', [1, 2, 3]], ['enceph', [1, 2, 3]]] as const) {
    const pts = urut.map((v) => childPugh({ ...dasar, [k]: v }).pts as number); assert.deepEqual(pts, [...pts].sort((a, b) => a - b), `Child-Pugh is monotonic in ${k}`); assert.ok(pts[2]! > pts[0]!)
  }
  assert.equal(childPugh(dasar).pts, 5, 'best case is 5'); assert.equal(childPugh({ bilirubin: 10, albumin: 1, inr: 5, ascites: 3, enceph: 3 }).pts, 15, 'worst case is 15')
  for (const [t, label] of [[5, 'Class A'], [6, 'Class A'], [7, 'Class B'], [9, 'Class B'], [10, 'Class C'], [15, 'Class C']] as const) assert.equal(childPughClass(t).label, label, `class at ${t}`)
  for (const bad of [0, 4, 1.5, -1, Number.NaN, Infinity, '2', null, undefined, true]) { assert.equal(childPugh({ ...dasar, ascites: bad as never }).pts, null, `ascites ${String(bad)}`); assert.equal(childPugh({ ...dasar, enceph: bad as never }).pts, null, `encephalopathy ${String(bad)}`) }
  hostileMatrix('childPugh', dasar as Record<string, unknown>, (i) => childPugh(i as never), (r) => r.pts !== null, ['bilirubin', 'albumin', 'inr'], CP_RANGES)
}

// ── 2. MELD-Na (Kamath 2001; Kim 2008; OPTN/UNOS 2016) ───────────────────────────────────────────
const lantai = (v: number) => Math.max(v, 1)
function refMeld(bili: number, inr: number, cr: number, na: number, dialisis: boolean) {
  const crEf = dialisis ? 4 : Math.min(lantai(cr), 4)
  const meld = Math.min(40, Math.max(6, 3.78 * Math.log(lantai(bili)) + 11.2 * Math.log(lantai(inr)) + 9.57 * Math.log(crEf) + 6.43))
  const naEf = Math.min(137, Math.max(125, na))
  const meldNa = meld > 11 ? Math.min(40, Math.max(6, meld + 1.32 * (137 - naEf) - 0.033 * meld * (137 - naEf))) : meld
  return { meld, meldNa }
}
for (let i = 0; i < N * 2; i++) {
  const bili = between(0.1, 60), inr = between(0.5, 10), cr = between(0.1, 20), na = between(100, 180), dialisis = rand() < 0.3
  const r = meldNa({ bilirubin: bili, inr, creatinine: cr, sodium: na, dialysis: dialisis }); const ref = refMeld(bili, inr, cr, na, dialisis)
  close(r.meld as number, ref.meld, 'MELD'); close(r.meldNa as number, ref.meldNa, 'MELD-Na')
  assert.ok((r.meldNa as number) >= (r.meld as number) - 1e-12, 'MELD-Na is never below MELD'); assert.ok((r.meldNa as number) <= 40 && (r.meldNa as number) >= 6, 'bounded to 6–40')
  if (na >= 137 || (r.meld as number) <= 11) close(r.meldNa as number, r.meld as number, 'no sodium adjustment at Na ≥ 137 or MELD ≤ 11')
}
{
  const base = { bilirubin: 3, inr: 1.8, creatinine: 1.6, sodium: 130, dialysis: false }
  // Lantai: nilai di bawah 1,0 diperlakukan 1,0 (hasil identik).
  close(meldNa({ ...base, bilirubin: 0.3 }).meld as number, meldNa({ ...base, bilirubin: 1 }).meld as number, 'bilirubin floor of 1.0'); close(meldNa({ ...base, inr: 0.8 }).meld as number, meldNa({ ...base, inr: 1 }).meld as number, 'INR floor of 1.0')
  close(meldNa({ ...base, creatinine: 0.4 }).meld as number, meldNa({ ...base, creatinine: 1 }).meld as number, 'creatinine floor of 1.0')
  // Kreatinin dibatasi 4,0 dan dipatok 4,0 pada dialisis (kreatinin yang diberikan diabaikan, bahkan tidak diminta).
  close(meldNa({ ...base, creatinine: 12 }).meld as number, meldNa({ ...base, creatinine: 4 }).meld as number, 'creatinine cap of 4.0'); close(meldNa({ ...base, dialysis: true, creatinine: 0.5 }).meld as number, meldNa({ ...base, creatinine: 4 }).meld as number, 'dialysis pins creatinine at 4.0')
  assert.notEqual(meldNa({ ...base, dialysis: true, creatinine: Number.NaN }).meld, null, 'creatinine is not required on dialysis'); assert.equal(meldNa({ ...base, creatinine: Number.NaN }).meld, null, 'but is required otherwise')
  // Natrium dibatasi [125, 137].
  close(meldNa({ ...base, sodium: 110 }).meldNa as number, meldNa({ ...base, sodium: 125 }).meldNa as number, 'sodium floor of 125'); close(meldNa({ ...base, sodium: 150 }).meldNa as number, meldNa({ ...base, sodium: 137 }).meldNa as number, 'sodium cap of 137')
  // Skor minimum 6 (semua di lantai) dan maksimum 40.
  assert.equal(meldNa({ bilirubin: 0.1, inr: 0.5, creatinine: 0.1, sodium: 140, dialysis: false }).meld, 6.43, 'floors give 6.43, which is above the minimum of 6'); assert.equal(meldNa({ bilirubin: 60, inr: 10, creatinine: 20, sodium: 100, dialysis: false }).meldNa, 40)
  assert.equal(meldNa({ ...base, bilirubin: 1, inr: 1, creatinine: 1 }).meld, 6.43)
  // MELD-Na hanya bila MELD > 11: di batas 11 persis tidak ada penyesuaian.
  const ambang = refMeld(1, 1, 1, 130, false).meld; assert.ok(ambang < 11)
  for (const [s, label] of [[40, 'Extremely high priority'], [39.99, 'Very high priority'], [30, 'Very high priority'], [29.99, 'High priority'], [20, 'High priority'], [19.99, 'Moderate priority'], [10, 'Moderate priority'], [9.99, 'Low priority']] as const) assert.equal(meldBand(s).label, label, `MELD band at ${s}`)
  hostileMatrix('meldNa', base as Record<string, unknown>, (i) => meldNa(i as never), (r) => r.meld !== null, ['bilirubin', 'inr', 'creatinine', 'sodium'], MELD_RANGES)
  for (const bad of [Number.NaN, Infinity, -1, '3', null, undefined, {}]) assert.equal(meldNa({ ...base, dialysis: true, bilirubin: bad as never }).meld, null, 'dialysis does not relax the other fields')
}

// ── 3. NEWS2, skala SpO₂ 1 (Royal College of Physicians, 2017) ───────────────────────────────────
const N2_RR: readonly Rentang[] = [[-INF, 9, 3], [9, 12, 1], [12, 21, 0], [21, 25, 2], [25, INF, 3]]
const N2_SPO2: readonly Rentang[] = [[-INF, 92, 3], [92, 94, 2], [94, 96, 1], [96, INF, 0]]
const N2_SBP: readonly Rentang[] = [[-INF, 91, 3], [91, 101, 2], [101, 111, 1], [111, 220, 0], [220, INF, 3]]
const N2_HR: readonly Rentang[] = [[-INF, 41, 3], [41, 51, 1], [51, 91, 0], [91, 111, 1], [111, 131, 2], [131, INF, 3]]
// Suhu dalam persepuluh °C agar tidak bergantung pada galat bilangan apung: ≤35.0 → 3; 35.1–36.0 → 1; 36.1–38.0 → 0; 38.1–39.0 → 1; ≥39.1 → 2.
const N2_TEMP10: readonly Rentang[] = [[-INF, 351, 3], [351, 361, 1], [361, 381, 0], [381, 391, 1], [391, INF, 2]]
{
  const dasar = { rr: 16, spo2: 98, sbp: 120, hr: 70, temp: 37, onOxygen: false, alert: true }
  const rows = (r: ReturnType<typeof news2>, nama: string) => r.rows.find((x) => x.name === nama)!.pts
  // Seluruh nilai bilangan bulat pada rentang tiap parameter.
  for (let v = NEWS2_RANGES.rr.min; v <= NEWS2_RANGES.rr.max; v++) assert.equal(rows(news2({ ...dasar, rr: v }), 'Respiration rate'), cari(N2_RR, v), `NEWS2 RR ${v}`)
  for (let v = NEWS2_RANGES.spo2.min; v <= NEWS2_RANGES.spo2.max; v++) assert.equal(rows(news2({ ...dasar, spo2: v }), 'SpO₂'), cari(N2_SPO2, v), `NEWS2 SpO2 ${v}`)
  for (let v = NEWS2_RANGES.sbp.min; v <= NEWS2_RANGES.sbp.max; v++) assert.equal(rows(news2({ ...dasar, sbp: v }), 'Systolic BP'), cari(N2_SBP, v), `NEWS2 SBP ${v}`)
  for (let v = NEWS2_RANGES.hr.min; v <= NEWS2_RANGES.hr.max; v++) assert.equal(rows(news2({ ...dasar, hr: v }), 'Pulse'), cari(N2_HR, v), `NEWS2 pulse ${v}`)
  for (let t10 = NEWS2_RANGES.temp.min * 10; t10 <= NEWS2_RANGES.temp.max * 10; t10++) assert.equal(rows(news2({ ...dasar, temp: t10 / 10 }), 'Temperature'), cari(N2_TEMP10, t10), `NEWS2 temperature ${t10 / 10}`)
  assert.equal(rows(news2({ ...dasar, onOxygen: true }), 'Air or oxygen'), 2); assert.equal(rows(news2({ ...dasar, onOxygen: false }), 'Air or oxygen'), 0)
  assert.equal(rows(news2({ ...dasar, alert: false }), 'Consciousness (AVPU)'), 3, 'any reduced consciousness scores 3'); assert.equal(rows(news2({ ...dasar, alert: true }), 'Consciousness (AVPU)'), 0)
  // Total, satu-parameter-3, dan pita (≥7 tinggi; ≥5 atau satu parameter 3 sedang; ≥1 rendah-sedang; 0 rendah).
  for (let i = 0; i < N * 2; i++) {
    const v = { rr: Math.round(between(1, 80)), spo2: Math.round(between(30, 100)), sbp: Math.round(between(20, 300)), hr: Math.round(between(10, 300)), temp: Math.round(between(200, 450)) / 10, onOxygen: rand() < 0.5, alert: rand() < 0.7 }
    const pts = [cari(N2_RR, v.rr), cari(N2_SPO2, v.spo2), v.onOxygen ? 2 : 0, cari(N2_SBP, v.sbp), cari(N2_HR, v.hr), v.alert ? 0 : 3, cari(N2_TEMP10, Math.round(v.temp * 10))]
    const total = pts.reduce((a, b) => a + b, 0), any3 = pts.includes(3); const r = news2(v)
    assert.equal(r.total, total); assert.equal(r.anyThree, any3)
    assert.equal(r.band!.label, total >= 7 ? 'High risk' : total >= 5 || any3 ? 'Medium risk' : total >= 1 ? 'Low-medium risk' : 'Low risk', `NEWS2 band for ${total}${any3 ? ' with a single 3' : ''}`)
  }
  assert.equal(news2(dasar).total, 0); assert.equal(news2(dasar).band!.label, 'Low risk'); assert.equal(news2({ ...dasar, alert: false }).band!.label, 'Medium risk', 'a single 3 escalates even though the total is only 3')
  assert.equal(news2Band(4, false).label, 'Low-medium risk'); assert.equal(news2Band(4, true).label, 'Medium risk'); assert.equal(news2Band(5, false).label, 'Medium risk'); assert.equal(news2Band(6, false).label, 'Medium risk'); assert.equal(news2Band(7, false).label, 'High risk'); assert.equal(news2Band(0, false).label, 'Low risk')
  hostileMatrix('news2', dasar as Record<string, unknown>, (i) => news2(i as never), (r) => r.total !== null, ['rr', 'spo2', 'sbp', 'hr', 'temp'], NEWS2_RANGES)
  assert.deepEqual(news2({ ...dasar, spo2: Number.NaN }).missing, ['SpO₂'], 'blank is "missing", never zero')
}

// ── 4. SOFA (Vincent et al., Intensive Care Med 1996;22:707-10) ──────────────────────────────────
// Ambiguitas tabel terbitan: bilirubin "> 12.0" dan kreatinin "> 5.0" tidak mencakup nilai persis 12.0 / 5.0; mesin memakai ≥ (pembulatan konservatif).
const S_COAG: readonly Rentang[] = [[-INF, 20, 4], [20, 50, 3], [50, 100, 2], [100, 150, 1], [150, INF, 0]]
const S_LIVER: readonly Rentang[] = [[-INF, 1.2, 0], [1.2, 2, 1], [2, 6, 2], [6, 12, 3], [12, INF, 4]]
const S_RENAL: readonly Rentang[] = [[-INF, 1.2, 0], [1.2, 2, 1], [2, 3.5, 2], [3.5, 5, 3], [5, INF, 4]]
const S_CNS: readonly Rentang[] = [[-INF, 6, 4], [6, 10, 3], [10, 13, 2], [13, 15, 1], [15, INF, 0]]
const sResp = (pf: number, vent: boolean) => (pf < 100 && vent ? 4 : pf < 200 && vent ? 3 : pf < 300 ? 2 : pf < 400 ? 1 : 0)
{
  const dasar = { pf: 450, plt: 250, bili: 0.8, creat: 0.8, gcs: 15, supported: false, cv: 0 }
  for (const pf of [20, 99.9, 100, 100.1, 199.9, 200, 200.1, 299.9, 300, 300.1, 399.9, 400, 450, 800]) for (const supported of [false, true]) assert.equal(sofaScore({ ...dasar, pf, supported }).points.resp, sResp(pf, supported), `SOFA resp pf ${pf} supported ${supported}`)
  assert.equal(sofaScore({ ...dasar, pf: 80, supported: false }).points.resp, 2, 'severe hypoxaemia WITHOUT respiratory support scores 2, never 3 or 4')
  for (let v = 1; v <= 2000; v++) assert.equal(sofaScore({ ...dasar, plt: v }).points.coag, cari(S_COAG, v), `SOFA platelets ${v}`)
  for (let t = 1; t <= 600; t++) assert.equal(sofaScore({ ...dasar, bili: t / 10 }).points.liver, cari(S_LIVER, t / 10), `SOFA bilirubin ${t / 10}`)
  for (let t = 1; t <= 250; t++) assert.equal(sofaScore({ ...dasar, creat: t / 10 }).points.renal, cari(S_RENAL, t / 10), `SOFA creatinine ${t / 10}`)
  for (let g = 3; g <= 15; g++) assert.equal(sofaScore({ ...dasar, gcs: g }).points.cns, cari(S_CNS, g), `SOFA GCS ${g}`)
  for (const g of [3.5, 14.5, 0, 2, 16, Number.NaN]) assert.equal(sofaScore({ ...dasar, gcs: g }).total, null, `GCS ${g} is not a score`)
  for (let i = 0; i < N; i++) {
    const v = { pf: between(20, 800), plt: between(1, 2000), bili: between(0.1, 60), creat: between(0.1, 25), gcs: 3 + Math.floor(rand() * 13), supported: rand() < 0.5, cv: Math.floor(rand() * 5) }
    const total = sResp(v.pf, v.supported) + cari(S_COAG, v.plt) + cari(S_LIVER, v.bili) + cari(S_RENAL, v.creat) + cari(S_CNS, v.gcs) + v.cv
    assert.equal(sofaScore(v).total, total); assert.ok(total >= 0 && total <= 24, 'total is within 0–24')
  }
  assert.equal(sofaScore(dasar).total, 0); assert.equal(sofaScore({ pf: 20, plt: 1, bili: 60, creat: 25, gcs: 3, supported: true, cv: 4 }).total, 24, 'worst case is 24')
  for (const bad of [-1, 5, 1.5, Number.NaN, '2', null, undefined]) assert.equal(sofaScore({ ...dasar, cv: bad as never }).total, null, `cardiovascular level ${String(bad)}`)
  // Subskor yang nilainya belum sah TIDAK dihitung; total hanya bila semuanya sah ("kosong" dulu terbaca 0 poin / 4 poin palsu).
  const sebagian = sofaScore({ ...dasar, plt: Number.NaN }); assert.equal(sebagian.points.coag, null); assert.equal(sebagian.total, null); assert.equal(sebagian.points.resp, 0); assert.deepEqual(sebagian.missing, ['platelets'])
  // Pita mortalitas: batas internal mesin (swakonsistensi), BUKAN klaim sumber; lihat dossier.
  for (const [s, label] of [[0, 'Minimal dysfunction'], [1, 'Minimal dysfunction'], [2, 'Mild-moderate dysfunction'], [5, 'Mild-moderate dysfunction'], [6, 'Moderate-severe dysfunction'], [9, 'Moderate-severe dysfunction'], [10, 'Severe dysfunction'], [12, 'Severe dysfunction'], [13, 'Extreme dysfunction'], [24, 'Extreme dysfunction']] as const) assert.equal(sofaMortalityBand(s).label, label, `SOFA band at ${s}`)
  hostileMatrix('sofaScore', dasar as Record<string, unknown>, (i) => sofaScore(i as never), (r) => r.total !== null, ['pf', 'plt', 'bili', 'creat'], SOFA_RANGES)
}

// ── 5. Glasgow-Blatchford (Blatchford et al., Lancet 2000;356:1318-23), urea mmol/L × 2,8 = BUN mg/dL ─
const bun = (urea: number) => Math.round(urea * 2.8 * 10) / 10
const G_UREA: readonly Rentang[] = [[-INF, bun(6.5), 0], [bun(6.5), bun(8), 2], [bun(8), bun(10), 3], [bun(10), bun(25), 4], [bun(25), INF, 6]]
const G_HB_M: readonly Rentang[] = [[-INF, 10, 6], [10, 12, 3], [12, 13, 1], [13, INF, 0]]
const G_HB_F: readonly Rentang[] = [[-INF, 10, 6], [10, 12, 1], [12, INF, 0]]
const G_SBP: readonly Rentang[] = [[-INF, 90, 3], [90, 100, 2], [100, 110, 1], [110, INF, 0]]
{
  assert.deepEqual([6.5, 8, 10, 25].map(bun), [18.2, 22.4, 28, 70], 'urea thresholds convert to the BUN cut-offs')
  const dasar = { bun: 15, hgb: 14, sbp: 120, sex: 'M', flags: {} }
  const skor = (o: Partial<typeof dasar>) => glasgowBlatchford({ ...dasar, ...o } as never).score
  for (let t = 10; t <= 3000; t++) assert.equal(skor({ bun: t / 10 }), cari(G_UREA, t / 10), `GBS BUN ${t / 10}`)
  for (let t = 20; t <= 250; t++) { assert.equal(skor({ hgb: t / 10, sex: 'M' }), cari(G_HB_M, t / 10), `GBS Hb male ${t / 10}`); assert.equal(skor({ hgb: t / 10, sex: 'F' }), cari(G_HB_F, t / 10), `GBS Hb female ${t / 10}`) }
  for (let v = 30; v <= 300; v++) assert.equal(skor({ sbp: v }), cari(G_SBP, v), `GBS SBP ${v}`)
  const FLAG: Record<string, number> = { hr: 1, melena: 1, syncope: 2, hepatic: 2, cardiac: 2 }
  for (let mask = 0; mask < 32; mask++) { const flags: Record<string, boolean> = {}; let pts = 0; Object.keys(FLAG).forEach((k, i) => { if (mask & (1 << i)) { flags[k] = true; pts += FLAG[k]! } }); assert.equal(skor({ flags } as never), pts, `GBS flags ${mask}`) }
  for (let i = 0; i < N; i++) {
    const v = { bun: between(1, 300), hgb: between(2, 25), sbp: between(30, 300), sex: rand() < 0.5 ? 'M' : 'F', flags: Object.fromEntries(Object.keys(FLAG).filter(() => rand() < 0.4).map((k) => [k, true])) }
    const ref = cari(G_UREA, v.bun) + cari(v.sex === 'M' ? G_HB_M : G_HB_F, v.hgb) + cari(G_SBP, v.sbp) + Object.keys(v.flags).reduce((s, k) => s + FLAG[k]!, 0)
    assert.equal(glasgowBlatchford(v as never).score, ref)
  }
  assert.equal(skor({}), 0); assert.equal(glasgowBlatchford(dasar as never).band, 'very-low'); assert.equal(glasgowBlatchford(dasar as never).veryLowRisk, true)
  assert.equal(skor({ bun: 18.2 }), 2, 'a flag-free patient at the first urea cut-off scores 2'); assert.equal(glasgowBlatchford({ ...dasar, bun: 18.2 } as never).veryLowRisk, false)
  // Band swakonsistensi (0 sangat rendah, ≤ 5 rendah-sedang, lebih tinggi): ambang antar-pedoman berbeda; belum bersumber.
  assert.equal(glasgowBlatchford({ ...dasar, flags: { melena: true } } as never).band, 'low-moderate'); assert.equal(glasgowBlatchford({ ...dasar, flags: { syncope: true, hepatic: true, cardiac: true, melena: true } } as never).band, 'high'); assert.equal(glasgowBlatchford({ ...dasar, flags: { syncope: true, hepatic: true, hr: true } } as never).band, 'low-moderate', 'score 5 is the top of low-moderate')
  assert.equal(glasgowBlatchford({ ...dasar, flags: { syncope: true, hepatic: true, hr: true, melena: true } } as never).band, 'high', 'score 6')
  for (const bad of ['X', '', null, undefined, 1, 'm']) assert.equal(glasgowBlatchford({ ...dasar, sex: bad } as never).score, null, `sex ${String(bad)} never defaults`)
  assert.equal(glasgowBlatchford({ ...dasar, flags: { melena: 1 as never } } as never).score, 0, 'only a literal true sets a flag')
  hostileMatrix('glasgowBlatchford', dasar as Record<string, unknown>, (i) => glasgowBlatchford(i as never), (r) => r.score !== null, ['bun', 'hgb', 'sbp'], GBS_RANGES)
  assert.equal(glasgowBlatchford({ ...dasar, bun: Number.NaN } as never).veryLowRisk, null, 'a score of 0 never appears from missing data')
}
void HOSTILE
console.log('calculator-independent-reference-2: Child-Pugh, MELD-Na, NEWS2, SOFA and Glasgow-Blatchford match independently transcribed tables over every integer/tenth value of every parameter, plus seeded random cases, invariants, boundaries and hostile inputs; passed')
