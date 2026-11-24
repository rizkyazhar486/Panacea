import assert from 'node:assert/strict'
import {
  amendCenturyEvent,
  analyzeLongitudinalTrend,
  buildAnnualYearbook,
  buildDecadeChronicle,
  buildMultiResolutionTimeline,
  buildPortableLifetimePassport,
  exportCenturyArchiveJson,
  ingestCenturyEvents,
  preserveDatePrecision,
  resolveActiveCenturyRecords,
  rotateCenturyArchiveKey,
  verifyAndImportCenturyArchive,
  type CenturyHealthEvent,
} from '../../src/domains/personal-health/engine/aureumCenturyLifetimeEngine.ts'

// 1. Approximate-date precision preservation (Section III: never fabricate exact dates)
assert.equal(preserveDatePrecision('1984-07-12T00:00:00Z', 'YEAR'), '1984')
assert.equal(preserveDatePrecision('1991-03-22', 'MONTH'), '1991-03')
assert.equal(preserveDatePrecision('2024-02-29T08:30:00Z', 'DAY'), '2024-02-29')

// 2. Synthesize a 100-YEAR dataset (1980..2079, 100 years x 12 monthly vitals + 25 leap days + device replacements + clinical events)
const syntheticEvents: CenturyHealthEvent[] = []
const devices = ['ManualClinic1980', 'DigitalCuff2005', 'AppleWatch2024', 'BiometricRing2045', 'AmbientSensor2065']

// Historical childhood approximate events + emergency + sensitive records
syntheticEvents.push(
  {
    id: 'evt_birth_vax_1981',
    domain: 'clinical-note',
    metric: 'vaccination',
    textValue: 'BCG + Hepatitis B Childhood Series',
    effectiveDate: '1981',
    datePrecision: 'YEAR',
    recordedAt: '2026-11-24T04:00:00Z',
    semanticState: 'patient-reported',
    provenance: { sourceKind: 'manual', sourceId: 'backfill-parent', capturedAt: '1981', receivedAt: '2026-11-24T04:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
  {
    id: 'evt_allergy_penicillin',
    domain: 'clinical-note',
    metric: 'allergy',
    textValue: 'Penicillin (anaphylaxis)',
    effectiveDate: '1996-05',
    datePrecision: 'MONTH',
    recordedAt: '2026-11-24T04:00:00Z',
    semanticState: 'clinician-entered',
    provenance: { sourceKind: 'clinical-system', sourceId: 'rsud-emr', capturedAt: '1996-05', receivedAt: '2026-11-24T04:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
  {
    id: 'evt_sensitive_psych_2018',
    domain: 'clinical-note',
    metric: 'condition',
    textValue: 'Confidential Psychotherapy Note (Restricted)',
    effectiveDate: '2018-09-14',
    datePrecision: 'DAY',
    recordedAt: '2018-09-14T10:00:00Z',
    semanticState: 'clinician-entered',
    provenance: { sourceKind: 'clinical-system', sourceId: 'clinic-emr', capturedAt: '2018-09-14', receivedAt: '2018-09-14T10:00:00Z' },
    sensitivityClass: 'RESTRICTED_SENSITIVE',
  },
  {
    id: 'evt_med_statin_2035',
    domain: 'medication',
    metric: 'medication',
    textValue: 'Atorvastatin 20 mg QD',
    effectiveDate: '2035-04-10',
    datePrecision: 'DAY',
    recordedAt: '2035-04-10T09:00:00Z',
    semanticState: 'clinician-reviewed',
    provenance: { sourceKind: 'clinical-system', sourceId: 'satusehat-fhir', capturedAt: '2035-04-10', receivedAt: '2035-04-10T09:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
)

let leapDayCount = 0
for (let y = 1980; y < 2080; y++) {
  const deviceGen = devices[Math.min(devices.length - 1, Math.floor((y - 1980) / 20))]
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  if (isLeap) {
    leapDayCount++
    syntheticEvents.push({
      id: `evt_leap_${y}`,
      domain: 'vital',
      metric: 'systolic_bp',
      numericValue: 112 + (y - 1980) * 0.22,
      unit: 'mmHg',
      effectiveDate: `${y}-02-29T07:30:00+07:00`,
      datePrecision: 'EXACT_TIMESTAMP',
      recordedAt: `${y}-02-29T07:30:05Z`,
      semanticState: 'measured',
      provenance: { sourceKind: 'wearable', sourceId: deviceGen, capturedAt: `${y}-02-29T07:30:00+07:00`, receivedAt: `${y}-02-29T07:30:05Z` },
      deviceGeneration: deviceGen,
    })
  }
  for (let m = 1; m <= 12; m++) {
    // Deliberately leave missing month 12 in year 2026 to test missing-data reporting
    if (y === 2026 && m === 12) continue
    const mm = String(m).padStart(2, '0')
    syntheticEvents.push({
      id: `evt_sbp_${y}_${mm}`,
      domain: 'vital',
      metric: 'systolic_bp',
      numericValue: Math.round((110 + (y - 1980) * 0.2) * 10) / 10,
      unit: 'mmHg',
      effectiveDate: `${y}-${mm}-15T07:00:00Z`,
      datePrecision: 'EXACT_TIMESTAMP',
      recordedAt: `${y}-${mm}-15T07:00:10Z`,
      semanticState: 'measured',
      provenance: { sourceKind: 'wearable', sourceId: deviceGen, capturedAt: `${y}-${mm}-15T07:00:00Z`, receivedAt: `${y}-${mm}-15T07:00:10Z` },
      deviceGeneration: deviceGen,
    })
  }
}

// Add a simulated projection point and prove it NEVER pollutes observed longitudinal statistics
syntheticEvents.push({
  id: 'evt_sim_2085',
  domain: 'vital',
  metric: 'systolic_bp',
  numericValue: 199,
  unit: 'mmHg',
  effectiveDate: '2085-01-01',
  datePrecision: 'DAY',
  recordedAt: '2026-11-24T04:00:00Z',
  semanticState: 'simulated',
  provenance: { sourceKind: 'derived', sourceId: 'counterfactual-sim', capturedAt: '2026-11-24T04:00:00Z', receivedAt: '2026-11-24T04:00:00Z' },
})

const t0 = performance.now()
// 3. Idempotent ingestion + duplicate rejection across device sync retries
const firstIngest = ingestCenturyEvents([], syntheticEvents)
const dupRetry = ingestCenturyEvents(firstIngest.records, syntheticEvents.slice(0, 100))
assert.equal(dupRetry.ingestedCount, 0)
assert.equal(dupRetry.duplicateSkippedCount, 100)
assert.equal(firstIngest.approximateDatesPreserved, 2)
assert.equal(leapDayCount, 25)

// 4. Immutable amendment chain (original preserved, active resolution reflects correction)
const amended = amendCenturyEvent({
  existing: firstIngest.records,
  targetEventId: 'evt_sbp_2026_06',
  amendmentId: 'evt_sbp_2026_06_rev2',
  recordedAt: '2026-06-16T08:00:00Z',
  reason: 'Recalibrated brachial cuff reading',
  patch: { numericValue: 118 },
})
assert.equal(amended.amendedCount, 1)
assert.equal(amended.records.length, firstIngest.records.length + 1)
const activeOnly = resolveActiveCenturyRecords(amended.records)
assert.equal(activeOnly.some((r) => r.id === 'evt_sbp_2026_06'), false)
assert.equal(activeOnly.find((r) => r.id === 'evt_sbp_2026_06_rev2')?.numericValue, 118)

// 5. Multi-resolution rollups across 100 years (LIFETIME/DECADE, YEAR, MONTH)
const decades = buildMultiResolutionTimeline(amended.records, 'DECADE', { metric: 'systolic_bp' })
assert.ok(decades.length >= 10, `expected >= 10 decades, got ${decades.length}`)
const simDecade = decades.find((d) => d.bucketKey === '2080s')
assert.equal(simDecade?.simulatedCount, 1)
assert.equal(simDecade?.numericMean, undefined, 'simulated records must never populate observed numericMean')

// 6. Statistical trend analysis (slope ~ +0.20 mmHg/year, simulated 199 mmHg excluded!)
const trend = analyzeLongitudinalTrend(amended.records, 'systolic_bp')
assert.equal(trend.clinicallyConfirmed, false)
assert.ok(trend.slopeBeta1PerYear !== null && Math.abs(trend.slopeBeta1PerYear - 0.2) < 0.02, `expected ~0.2 mmHg/yr, got ${trend.slopeBeta1PerYear}`)
assert.ok(trend.latestValue !== null && trend.latestValue < 140, 'simulated 199 mmHg leaked into trend!')

// 7. Annual Yearbook (detects missing month 12 in 2026) + Decade Chronicle + Narrow Emergency Passport
const yb2026 = buildAnnualYearbook(amended.records, 2026)
assert.ok(yb2026.missingDataMonths.includes(12))
const dec2030 = buildDecadeChronicle(amended.records, 2030)
assert.equal(dec2030.dataCompletenessPct, 100)

const emergencyPassport = buildPortableLifetimePassport(amended.records, 'EMERGENCY_NARROW', '2026-11-24T04:25:00Z')
assert.equal(emergencyPassport.restrictedSensitiveExcluded, true)
assert.ok(emergencyPassport.allergies.includes('Penicillin (anaphylaxis)'))
assert.ok(emergencyPassport.activeMedications.includes('Atorvastatin 20 mg QD'))
assert.equal(emergencyPassport.majorConditions.includes('Confidential Psychotherapy Note (Restricted)'), false)

const clinicianPassport = buildPortableLifetimePassport(amended.records, 'CLINICIAN_FULL', '2026-11-24T04:25:00Z')
assert.ok(clinicianPassport.majorConditions.includes('Confidential Psychotherapy Note (Restricted)'))

// 8. Lossless Portability Export/Import + Tamper Rejection + AES-GCM Key Rotation
const archive = await exportCenturyArchiveJson(amended.records, '2026-11-24T04:25:00Z')
const reimported = await verifyAndImportCenturyArchive(archive)
assert.equal(reimported.valid, true)
assert.equal(reimported.records.length, amended.records.length)

const tampered = await verifyAndImportCenturyArchive({ ...archive, sha256ChecksumHex: '0'.repeat(64) })
assert.equal(tampered.valid, false)

const oldKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
const newKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
const cipher = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, oldKey, new TextEncoder().encode(JSON.stringify(emergencyPassport)))
const toB64 = (arr: Uint8Array) => { let s = ''; for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]); return btoa(s) }
const rotated = await rotateCenturyArchiveKey({
  ciphertextBase64: toB64(new Uint8Array(cipher)),
  ivBase64: toB64(iv),
  oldKey,
  newKey,
})
const fromB64 = (s: string) => { const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a }
const restoredBytes = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(rotated.ivBase64) }, newKey, fromB64(rotated.ciphertextBase64))
const restoredPassport = JSON.parse(new TextDecoder().decode(restoredBytes))
assert.equal(restoredPassport.allergies[0], 'Penicillin (anaphylaxis)')

const elapsedMs = Math.round((performance.now() - t0) * 10) / 10
assert.ok(elapsedMs < 1500, `100-year stress test exceeded latency ceiling: ${elapsedMs}ms`)

console.log(
  `aureum-century-lifetime-stress: 100y (${amended.records.length} records, 25 leap days, 5 device gens) ingested+deduped+amended+rolled-up+OLS(beta1=${trend.slopeBeta1PerYear}/yr)+passport+SHA256-portability+AES-GCM-key-rotation in ${elapsedMs}ms PASS`,
)
