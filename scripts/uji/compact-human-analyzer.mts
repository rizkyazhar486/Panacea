import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  VENUE_LENSES,
  buildCompactHumanAnalysis,
} from '../../src/domains/personal-health/engine/compactHumanAnalyzer.ts'

test('missing inputs fail closed to "—" without inventing defaults', () => {
  const res = buildCompactHumanAnalysis({})
  assert.equal(res.clinicallyReviewed, false)
  assert.equal(res.signalCoverage.populated, 0)
  assert.equal(res.bodyDomain.bmi.valid, false)
  assert.equal(res.bodyDomain.whtr, null)
  assert.equal(res.cardioPulmDomain.mapMmHg, null)
  assert.equal(res.cardioPulmDomain.fev1FvcRatio, null)
  assert.equal(res.cardioPulmDomain.news2Total, null)
  assert.equal(res.energySleepDomain.dailyKcal, null)
  assert.equal(res.longevityDomain.vo2maxBest, null)
  for (const s of [...res.bodyDomain.slots, ...res.cardioPulmDomain.slots, ...res.energySleepDomain.slots, ...res.longevityDomain.slots]) {
    assert.equal(s.available, false, `${s.id} must stay unavailable when empty`)
    assert.equal(s.valueDisplay, '—')
  }
})

test('invalid and extreme boundary inputs reject safely without NaN or reversed FEV1>FVC ratios', () => {
  const res = buildCompactHumanAnalysis({
    weightKg: Number.NaN,
    heightCm: Number.POSITIVE_INFINITY,
    systolic: 80,
    diastolic: 90, // systolic <= diastolic rejected
    fvcL: 3.0,
    fev1L: 3.5, // impossible FEV1 > FVC rejected
    restingHr: 10, // below min 25 bpm rejected
    age: 5, // below min 10 yrs rejected
  })
  assert.equal(res.bodyDomain.bmi.valid, false)
  assert.equal(res.cardioPulmDomain.mapMmHg, null)
  assert.equal(res.cardioPulmDomain.fev1FvcRatio, null)
  assert.equal(res.longevityDomain.hrMaxTanaka, null)
  assert.equal(res.longevityDomain.vo2maxBest, null)
})

test('populated multi-domain inputs compute exact deterministic values across body, BP/MAP, FEV1/FVC, NEWS2, TDEE, sleep, and performance zones', () => {
  const input = {
    age: 30,
    sex: 'M' as const,
    heightCm: 175,
    weightKg: 70,
    bodyFatPct: 14,
    waistCm: 78,
    hipCm: 94,
    forwardHeadDeg: 10,
    systolic: 120,
    diastolic: 80,
    spo2Pct: 98,
    restingHr: 56,
    hrvMs: 65,
    respRate: 14,
    bodyTempC: 36.6,
    fvcL: 4.5,
    fev1L: 3.6,
    sleepH: 7.5,
    steps: 9000,
    exerciseMinToday: 45,
    activityLevel: 'sedang' as const,
  }
  const a = buildCompactHumanAnalysis(input)
  const b = buildCompactHumanAnalysis(input)
  assert.deepEqual(a, b, 'analysis must be purely deterministic')
  assert.equal(a.clinicallyReviewed, false)
  assert.equal(a.bodyDomain.bmi.valid, true)
  assert.equal(a.bodyDomain.bmi.bmi, 22.9)
  assert.equal(a.bodyDomain.whtr?.ratio, 0.45) // 78/175 = 0.4457 -> 0.45
  assert.equal(a.cardioPulmDomain.mapMmHg?.map, 93) // (120+160)/3 = 93.3
  assert.equal(a.cardioPulmDomain.pulsePressureMmHg, 40)
  assert.equal(a.cardioPulmDomain.fev1FvcRatio?.ratioPct, 80) // 3.6/4.5 = 80%
  assert.equal(a.cardioPulmDomain.news2Total, 0)
  assert.equal(a.energySleepDomain.sleepDebtH, 0.5)
  assert.equal(a.longevityDomain.hrMaxTanaka, 187) // 208 - 21 = 187
  assert.equal(a.longevityDomain.vo2maxBest?.source, 'uth_estimate')
  assert.equal(a.performanceStyles.length, 4)
  assert.ok(a.performanceStyles[0].hrRangeDisplay.includes('112–131 bpm'))
  assert.equal(VENUE_LENSES.length, 4)
  assert.ok(a.citations.length >= 6)
})

test('CompactHumanAnalyzer & DataLab UI enforce >=44px targets, safe contrast tokens, lazy BLE/FHIR imports, and claim boundary', () => {
  const ui = readFileSync('src/components/CompactHumanAnalyzer.tsx', 'utf8')
  const page = readFileSync('src/pages/bodyhub/DataLab.tsx', 'utf8')
  const eng = readFileSync('src/domains/personal-health/engine/compactHumanAnalyzer.ts', 'utf8')

  assert.doesNotMatch(eng, /\b(window\.|document\.|localStorage\.|Date\.now\(|new Date\(|Math\.random\(|fetch\()/)
  assert.doesNotMatch(ui, /minHeight:\s*(?:[1-3]?\d|4[0-3])\b/)
  assert.doesNotMatch(ui, /color:\s*['"]#00BF63['"]/i)
  assert.doesNotMatch(page, /color:\s*['"]#00BF63['"]/i)
  assert.match(page, /<BatasKlaimKesehatan permukaan="lab\.data-lab"/)
  assert.match(ui, /import\('\.\.\/domains\/devices\/adapters\/quickConnectSession'\)/)
  assert.match(ui, /import\('\.\.\/domains\/clinical-operations'\)/)
})
