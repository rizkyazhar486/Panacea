import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../../src/domains/body-exposure/data/bodySystems.ts'
import { defaultPhysiologyCatalog } from '../../src/domains/body-exposure/engine/system-physiology/physiologyCatalog.ts'
import { simulationsFor } from '../../src/domains/body-exposure/engine/system-physiology/systemSimulations.ts'
import {
  ALLOWED_TRUTH_CLASSES,
  VERTICAL_GAP_MARKER,
  auditSystemProvenanceMatrix,
  buildSystemProvenanceMatrix,
  type SystemProvenanceRecord,
} from '../../src/domains/body-exposure/engine/system-physiology/anatomyPhysiologyProvenance.ts'

const ledger = JSON.parse(
  readFileSync(new URL('../../governance/LITERATURE_CITATION_LEDGER.json', import.meta.url), 'utf8'),
) as { entries: { pmid?: string; nbk?: string }[] }
const verifiedIds = new Set(
  ledger.entries.flatMap((entry) => [entry.pmid, entry.nbk].filter((x): x is string => typeof x === 'string')),
)

const systemCardSource = readFileSync(
  new URL('../../src/domains/body-exposure/ui/system-physiology/SystemCard.tsx', import.meta.url),
  'utf8',
)

const FORBIDDEN_UI_COPY = /\b(lokal|compliant|compliance|certified|tersertifikasi|kepatuhan|hipaa|fda|terverifikasi)\b/i

export function auditSystemCardProvenanceUi(source: string): string[] {
  const problems: string[] = []
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  if (!code.includes('truthClass: reference')) problems.push('SystemCard missing explicit truthClass: reference badge')
  if (!code.includes('truthClass: simulated')) problems.push('SystemCard missing explicit truthClass: simulated badge')
  if (!code.includes('VERTICAL_GAP_MARKER')) problems.push('SystemCard missing VERTICAL_GAP_MARKER on unmodeled organ gaps')
  if (FORBIDDEN_UI_COPY.test(code)) problems.push('SystemCard contains forbidden local/unverified compliance wording')
  return problems
}

// ── 1. POSITIVE: real Body Exposure catalog + simulations pass provenance audit cleanly.
const catalog = defaultPhysiologyCatalog()
const expectedSystems: readonly BodySystemId[] = BODY_SYSTEM_SOURCE_WAVE.map((s) => s.id)
const simulatedSystems = new Set<BodySystemId>(
  expectedSystems.filter((id) => simulationsFor(id).length > 0),
)

const matrix = buildSystemProvenanceMatrix(catalog, { simulatedSystems })
assert.equal(matrix.length, 11, 'all 11 canonical atlas systems must have provenance records')
assert.deepEqual(auditSystemProvenanceMatrix(matrix, verifiedIds, expectedSystems), [])
assert.deepEqual(auditSystemCardProvenanceUi(systemCardSource), [])
assert.deepEqual([...ALLOWED_TRUTH_CLASSES], ['measured', 'reference', 'simulated', 'derived'])

for (const row of matrix) {
  assert.equal(row.anatomy.truthClass, 'reference')
  assert.equal(row.physiology.truthClass, 'reference')
  assert.equal(row.patientSpecificMorphology, VERTICAL_GAP_MARKER)
  assert.equal(row.clinicallyReviewed, false)
  assert.equal(row.personalTelemetry.modeled, false)
  assert.equal(row.personalTelemetry.status, VERTICAL_GAP_MARKER)
}

const totalUnmodeledOrgans = matrix.reduce((sum, row) => sum + row.unmodeledOrgans.length, 0)
assert.equal(totalUnmodeledOrgans, 17, 'all 17 unsourced organ placeholders remain visible VERTICAL GAP records')

// ── 2. BOUNDARY: caller-supplied measured/derived telemetry applies strictly per system; empty simulations = all gaps.
{
  const withPersonal = buildSystemProvenanceMatrix(catalog, {
    simulatedSystems: new Set(),
    personalTruthBySystem: new Map([
      ['cardiovascular', 'measured'],
      ['urinary', 'derived'],
    ]),
  })
  assert.deepEqual(auditSystemProvenanceMatrix(withPersonal, verifiedIds, expectedSystems), [])
  assert.equal(withPersonal.find((r) => r.systemId === 'cardiovascular')?.personalTelemetry.truthClass, 'measured')
  assert.equal(withPersonal.find((r) => r.systemId === 'urinary')?.personalTelemetry.truthClass, 'derived')
  assert.equal(withPersonal.find((r) => r.systemId === 'nervous')?.personalTelemetry.status, VERTICAL_GAP_MARKER)
  assert.ok(withPersonal.every((r) => r.simulation.status === VERTICAL_GAP_MARKER && r.simulation.truthClass === null))
}

// ── 3. NEGATIVE (PAIRED): every fabrication or missing gap marker must fail by name.
const cloneMatrix = (): SystemProvenanceRecord[] => structuredClone(matrix) as SystemProvenanceRecord[]

{
  // Unverified citation
  const badCitation = cloneMatrix()
  ;(badCitation[0] as { citationIds: string[] }).citationIds = [...badCitation[0].citationIds, '99999999']
  assert.ok(auditSystemProvenanceMatrix(badCitation, verifiedIds, expectedSystems).some((p) => p.includes('unverified citation')))

  // Invalid truthClass
  const badTruth = cloneMatrix()
  ;(badTruth[0].physiology as unknown as { truthClass: string }).truthClass = 'ai-guessed'
  assert.ok(auditSystemProvenanceMatrix(badTruth, verifiedIds, expectedSystems).some((p) => p.includes('invalid truthClass')))

  // Fabricated reviewer approval
  const fakeReview = cloneMatrix()
  ;(fakeReview[0] as unknown as { clinicallyReviewed: boolean }).clinicallyReviewed = true
  assert.ok(auditSystemProvenanceMatrix(fakeReview, verifiedIds, expectedSystems).some((p) => p.includes('fabricated clinical review')))

  // Unmodeled slot claiming a truthClass
  const fakePersonal = cloneMatrix()
  ;(fakePersonal[0].personalTelemetry as unknown as { truthClass: string }).truthClass = 'measured'
  assert.ok(auditSystemProvenanceMatrix(fakePersonal, verifiedIds, expectedSystems).some((p) => p.includes('must not claim truthClass')))

  // Unmodeled organ gap hiding VERTICAL GAP marker
  const hiddenGap = cloneMatrix()
  const digestive = hiddenGap.find((r) => r.systemId === 'digestive')!
  ;(digestive.unmodeledOrgans[0] as unknown as { marker: string }).marker = 'coming-soon'
  assert.ok(auditSystemProvenanceMatrix(hiddenGap, verifiedIds, expectedSystems).some((p) => p.includes('organ gap missing')))

  // Patient-specific morphology claiming modeled
  const fakeMorph = cloneMatrix()
  ;(fakeMorph[0] as unknown as { patientSpecificMorphology: string }).patientSpecificMorphology = 'scanned'
  assert.ok(auditSystemProvenanceMatrix(fakeMorph, verifiedIds, expectedSystems).some((p) => p.includes('patient-specific morphology')))

  // Fail-closed empty ledger & missing system
  assert.ok(auditSystemProvenanceMatrix(matrix, new Set(), expectedSystems).includes('verified citation ledger is empty'))
  assert.ok(auditSystemProvenanceMatrix(matrix.slice(1), verifiedIds, expectedSystems).some((p) => p.includes('canonical body system missing')))
}

// ── 4. SABOTAGED GATE VERIFICATION: break SystemCard.tsx and assert UI gate catches each sabotage.
{
  const noGapMarker = systemCardSource.replaceAll('VERTICAL_GAP_MARKER', 'GAP_PLACEHOLDER')
  assert.notEqual(noGapMarker, systemCardSource)
  assert.ok(auditSystemCardProvenanceUi(noGapMarker).some((p) => p.includes('VERTICAL_GAP_MARKER')))

  const noRefBadge = systemCardSource.replace('truthClass: reference', 'reference-only')
  assert.notEqual(noRefBadge, systemCardSource)
  assert.ok(auditSystemCardProvenanceUi(noRefBadge).some((p) => p.includes('truthClass: reference')))

  const withLokal = systemCardSource.replace('Reference physiology:', 'Mode lokal:')
  assert.notEqual(withLokal, systemCardSource)
  assert.ok(auditSystemCardProvenanceUi(withLokal).some((p) => p.includes('forbidden')))
}

console.log(`body-exposure-anatomy-physiology-provenance: 11 systems, ${catalog.mechanisms.length} mechanisms, ${totalUnmodeledOrgans} explicit VERTICAL GAP records, positive+negative+boundary+sabotage PASS`)
