import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildParametricAnatomicalCad,
  evaluateBiomechanicalCae,
  evaluateArchetypeComparison,
  TARGET_ARCHETYPES,
} from '../../src/domains/body-exposure/biomedicalCadCaeEngine.ts'
import { evaluateOpticalSkinScan } from '../../src/domains/scan/index.ts'
import { evaluateQeegBrainScan, evaluateOsaSleepMonitor } from '../../src/domains/neuro/index.ts'
import { computeOneWayAnova, computeRepeatedMeasuresAnova } from '../../src/domains/analytics/index.ts'
import {
  sha256Hex,
  sanitizeExportFilename,
  buildCanonicalJsonExport,
  buildLongitudinalCsvExport,
  buildFhirR4BundleExport,
  buildNeonAutoSyncPayload,
  evaluateAutoExportDecision,
} from '../../src/lib/export/autoExportEngine.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('biomedicalCadCaeEngine: computes deterministic CAD morphs, CAE stress loads, and FIFA 6-attribute archetype comparison', () => {
  const invalid = buildParametricAnatomicalCad({ heightCm: Number.NaN, weightKg: 68 })
  assert.equal(invalid.ok, false)

  const cad = buildParametricAnatomicalCad({
    heightCm: 173,
    weightKg: 68,
    bodyFatPct: 15,
    waistCm: 77,
    chestCm: 98,
    plantarArchAngleDeg: 22,
    thoracicKyphosisDeg: 30,
  })
  assert.equal(cad.ok, true)
  if (!cad.ok) return
  assert.equal(cad.truthClass, 'estimated')
  assert.equal(cad.clinicallyReviewed, false)
  assert.ok(cad.zAnatomyScaleVector.y > 0.9 && cad.zAnatomyScaleVector.y < 1.1)

  const cae = evaluateBiomechanicalCae({ cad, gaitSpeedMps: 1.5, restingSystolicMmHg: 118, restingHrBpm: 60, postureAlignment01: 0.78 })
  assert.equal(cae.ok, true)
  assert.equal(cae.truthClass, 'simulated')
  assert.equal(cae.clinicallyReviewed, false)
  assert.equal(cae.plantarTripodStress.heelPct + cae.plantarTripodStress.firstMtpPct + cae.plantarTripodStress.fifthMtpPct, 100)
  assert.equal(cae.superficialFrontLineTension.length, 7)
  assert.ok(cae.vascularWallShearPa > 0.5 && cae.vascularWallShearPa < 4)

  assert.equal(TARGET_ARCHETYPES.length, 5)
  const cmp = evaluateArchetypeComparison(
    { vo2max: 48, hrvMs: 66, sleepHours: 7.6, restingHrBpm: 58, bodyFatPct: 15 },
    'longevity_lean',
  )
  assert.equal(cmp.archetype.id, 'longevity_lean')
  assert.equal(cmp.truthClass, 'estimated')
  assert.equal(cmp.clinicallyReviewed, false)
  assert.equal(cmp.deltas.ovr, cmp.target.ovr - cmp.current.ovr)
})

test('skinAnalyzerEngine: computes visible optical scores and fails closed on out-of-range lighting', () => {
  const darkFail = evaluateOpticalSkinScan({
    chronologicalAgeYears: 32,
    meanLuminance01: 0.05,
    toneStdDev01: 0.1,
    redGreenDelta: 0.05,
    edgeEnergy01: 0.2,
    pigmentContrast01: 0.2,
    specularUniformity01: 0.7,
  })
  assert.equal(darkFail.ok, false)

  const res = evaluateOpticalSkinScan({
    chronologicalAgeYears: 32,
    meanLuminance01: 0.58,
    toneStdDev01: 0.08,
    redGreenDelta: 0.06,
    edgeEnergy01: 0.22,
    pigmentContrast01: 0.18,
    specularUniformity01: 0.74,
  })
  assert.equal(res.ok, true)
  if (!res.ok) return
  assert.equal(res.truthClass, 'estimated')
  assert.equal(res.clinicallyReviewed, false)
  assert.equal(res.visibleFactsOnly, true)
  assert.ok(res.scores.toneUniformity >= 20 && res.scores.toneUniformity <= 99)
  assert.ok(res.scores.estimatedOpticalSkinAgeYears >= 14)
})

test('brainAndOsaEngine: computes qEEG cognitive age/peer percentile and stratifies OSA severity with clinician referral', () => {
  const poorContact = evaluateQeegBrainScan({
    chronologicalAgeYears: 32,
    device: 'muse',
    bands: { delta: 10, theta: 15, alpha: 35, beta: 30, gamma: 10 },
    signalQuality01: 0.2,
  })
  assert.equal(poorContact.ok, false)

  const eeg = evaluateQeegBrainScan({
    chronologicalAgeYears: 32,
    device: 'muse',
    bands: { delta: 10, theta: 14, alpha: 34, beta: 32, gamma: 10 },
    reactionTimeMs: 225,
    signalQuality01: 0.9,
  })
  assert.equal(eeg.ok, true)
  if (!eeg.ok) return
  assert.equal(eeg.truthClass, 'estimated')
  assert.equal(eeg.clinicallyReviewed, false)
  assert.ok(eeg.peerPercentile >= 5 && eeg.peerPercentile <= 99)

  const normalOsa = evaluateOsaSleepMonitor({ ahiEventsPerHour: 2.4, odiEventsPerHour: 1.8, spo2NadirPct: 94, studySource: 'hsat' })
  assert.equal(normalOsa.ok, true)
  if (!normalOsa.ok) return
  assert.equal(normalOsa.severity, 'Normal')
  assert.equal(normalOsa.clinicianReferralRequired, false)
  assert.equal(normalOsa.truthClass, 'measured')

  const severeOsa = evaluateOsaSleepMonitor({ ahiEventsPerHour: 34.2, spo2NadirPct: 82, respiratoryEffortFlag: true, studySource: 'psg' })
  assert.equal(severeOsa.ok, true)
  if (!severeOsa.ok) return
  assert.equal(severeOsa.severity, 'Severe')
  assert.equal(severeOsa.clinicianReferralRequired, true)
})

test('fullBodyAnovaEngine: computes exact One-Way & Repeated-Measures ANOVA and fails closed on n < 3', () => {
  const insufficient = computeOneWayAnova([
    { label: 'Baseline', values: [70] },
    { label: 'Month 1', values: [74] },
  ])
  assert.equal(insufficient.ok, false)
  assert.equal(insufficient.verdict, 'Insufficient Samples')
  assert.equal(insufficient.table, null)

  const improved = computeOneWayAnova([
    { label: 'Baseline', values: [60, 62, 61, 59] },
    { label: 'Month 1', values: [70, 72, 71, 69] },
    { label: 'Month 3', values: [81, 83, 82, 80] },
  ])
  assert.equal(improved.ok, true)
  assert.equal(improved.verdict, 'Significant Improvement')
  assert.ok(improved.table !== null)
  assert.equal(improved.table.df1, 2)
  assert.equal(improved.table.df2, 9)
  assert.ok(improved.table.fStatistic > 100)
  assert.ok(improved.table.pValue < 0.001)
  assert.ok(improved.table.etaSquared > 0.9)

  const rmInsufficient = computeRepeatedMeasuresAnova(
    ['Baseline', 'Month 1', 'Month 3'],
    [
      [62, 70, 79],
      [58, 66, 75],
    ],
  )
  assert.equal(rmInsufficient.ok, false)
  assert.equal(rmInsufficient.verdict, 'Insufficient Samples')
  assert.equal(rmInsufficient.table, null)

  const rm = computeRepeatedMeasuresAnova(
    ['Baseline', 'Month 1', 'Month 3'],
    [
      [62, 70, 79],
      [58, 66, 75],
      [65, 73, 82],
      [60, 68, 77],
    ],
  )
  assert.equal(rm.ok, true)
  assert.equal(rm.design, 'repeated_measures')
  assert.equal(rm.verdict, 'Significant Improvement')
  assert.ok(rm.table !== null && rm.table.pValue < 0.01)
})

test('autoExportEngine: builds JSON, CSV, FHIR R4, Neon payloads with SHA-256 deduplication and null safety', () => {
  // Known NIST SHA-256 test vector for "abc"
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(sanitizeExportFilename('PanaceaMed Export!!', '2026-11-20T02:00:00Z', 'JSON'), 'panaceamed-export-2026-11-20.json')

  const input = {
    exportedAtIso: '2026-11-20T02:00:00.000Z',
    owner: {
      profileKey: 'rizkyazhar486',
      fullName: 'dr. Rizky Muhammad Azrissal',
      username: '@rizkyazhar486',
      mrn: 'PMD-000486',
    },
    vitals: {
      heightCm: 173,
      weightKg: 68,
      restingHrBpm: 58,
      hrvMs: 68,
      vo2max: null,
      sleepHours: 7.6,
      steps: 9400,
      spo2Pct: 98,
    },
    longitudinalRows: [
      { date: '2026-11-20', source: 'WHOOP', restingHrBpm: 58, hrvMs: 68, sleepHours: 7.6, vo2max: null },
    ],
    conditions: ['Preventive longevity tracking'],
  }

  const json = buildCanonicalJsonExport(input)
  assert.equal(json.filename, 'panaceamed-export-2026-11-20.json')
  assert.equal(json.clinicallyReviewed, false)
  assert.equal(json.sha256.length, 64)

  const csv = buildLongitudinalCsvExport(input)
  assert.equal(csv.filename, 'panaceamed-export-2026-11-20.csv')
  // vo2max is null -> cell stays empty "", NEVER coerced to 0
  assert.ok(csv.content.includes('2026-11-20,WHOOP,,58,68,7.6'))

  const fhir = buildFhirR4BundleExport(input)
  const parsedFhir = JSON.parse(fhir.content)
  assert.equal(parsedFhir.resourceType, 'Bundle')
  assert.ok(parsedFhir.entry.some((e) => e.resource.resourceType === 'Patient'))
  assert.ok(parsedFhir.entry.some((e) => e.resource.resourceType === 'Observation' && e.resource.code.coding[0].code === '8867-4'))

  const neon = buildNeonAutoSyncPayload(input)
  assert.equal(neon.events.length, 2)
  assert.equal(neon.clinicallyReviewed, false)

  // SHA-256 duplicate prevention
  const dupDecision = evaluateAutoExportDecision({
    mode: 'both',
    contentHash: json.sha256,
    lastExportedHash: json.sha256,
    hasUserGesture: true,
  })
  assert.equal(dupDecision.skippedAsDuplicate, true)
  assert.equal(dupDecision.shouldRunLocalDownload, false)
  assert.equal(dupDecision.shouldQueueNeonOutbox, false)

  // Safari popup-block protection when no user gesture
  const bgDecision = evaluateAutoExportDecision({
    mode: 'both',
    contentHash: json.sha256,
    lastExportedHash: null,
    hasUserGesture: false,
  })
  assert.equal(bgDecision.shouldRunLocalDownload, false)
  assert.equal(bgDecision.shouldQueueNeonOutbox, true)
})

test('all 5 new pure engines obey strict purity boundary (zero DOM, storage, clock, RNG, or fetch)', () => {
  const files = [
    'src/domains/body-exposure/biomedicalCadCaeEngine.ts',
    'src/domains/scan/skinAnalyzerEngine.ts',
    'src/domains/neuro/brainAndOsaEngine.ts',
    'src/domains/analytics/fullBodyAnovaEngine.ts',
    'src/lib/export/autoExportEngine.ts',
  ]
  const forbidden = [
    /(?<![\w.$])window(?:\.[A-Za-z_$]|\[)/,
    /(?<![\w.$])document(?:\.[A-Za-z_$]|\[)/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /(?<![\w.$])fetch\s*\(/,
  ]

  for (const rel of files) {
    const raw = readFileSync(join(ROOT, rel), 'utf8')
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    for (const pattern of forbidden) {
      assert.equal(pattern.test(stripped), false, `${rel} violated purity rule ${pattern}`)
    }
  }
})
