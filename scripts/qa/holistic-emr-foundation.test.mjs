import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const modelPath = new URL('../../src/lib/holisticEmr.ts', import.meta.url)
const panelPath = new URL('../../src/pages/emr/HolisticEmrFoundation.tsx', import.meta.url)
const flowPath = new URL('../../src/pages/emr/AutonomousFlow.tsx', import.meta.url)

const model = await readFile(modelPath, 'utf8')
const panel = await readFile(panelPath, 'utf8')
const flow = await readFile(flowPath, 'utf8')

test('holistic EMR models the safety-critical longitudinal domains', () => {
  for (const token of [
    'problemListStatus',
    'allergyStatus',
    'medicationReconciliation',
    'problems:',
    'allergies:',
    'medications:',
    'vitals:',
    'diagnostics:',
    'imaging:',
    'procedures:',
    'orders:',
    'encounters:',
    'notes:',
    'carePlans:',
    'immunizations:',
    'preventiveCare:',
    'narratives:',
    'genomics:',
    'devices:',
    'documents:',
    'audit:',
  ]) assert.ok(model.includes(token), `missing longitudinal domain: ${token}`)
})

test('unknown allergy and medication states are explicit rather than inferred from empty arrays', () => {
  assert.match(model, /allergyStatus:\s*'unknown'/)
  assert.match(model, /medicationReconciliation:\s*'unknown'/)
  assert.ok(panel.includes('Do not assume NKDA'))
  assert.ok(panel.includes('Free text is not treated as reconciled'))
})

test('AI governance forbids autonomous signing, medication commits, and order commits', () => {
  assert.match(model, /autoSignAllowed:\s*false/)
  assert.match(model, /autoMedicationCommitAllowed:\s*false/)
  assert.match(model, /autoOrderCommitAllowed:\s*false/)
  assert.match(model, /clinicianReviewRequired:\s*true/)
  assert.match(model, /evidenceLinkingRequired:\s*true/)
  assert.ok(model.includes('canCommitAiDraft'))
})

test('clinical completeness is weighted and blocks on critical reconciliation gaps', () => {
  assert.ok(model.includes('HOLISTIC_DOMAIN_WEIGHTS'))
  assert.ok(model.includes('missingCritical'))
  assert.ok(model.includes('Problem list has not been clinician-reviewed'))
  assert.ok(model.includes('Allergy status is unknown'))
  assert.ok(model.includes('Medication reconciliation is incomplete'))
  assert.ok(panel.includes('C = Σ(wᵢ × cᵢ) / Σwᵢ'))
})

test('legacy EMR migrates into the longitudinal layer without replacing the existing autonomous flow', () => {
  assert.ok(model.includes('buildHolisticChartFromLegacy'))
  assert.ok(flow.includes("import { HolisticEmrFoundation } from './HolisticEmrFoundation'"))
  assert.ok(flow.includes('<HolisticEmrFoundation />'))
  assert.ok(flow.includes('Autonomous clinical flow'))
})
