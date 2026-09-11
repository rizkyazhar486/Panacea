import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  getBodyMultisystemReferenceBoundary,
  listBodyMultisystemScaleViews,
} from '../../src/lib/bodyMultisystemScaleAdapter.ts'
import { MULTISYSTEM_SCALES } from '../../src/lib/multisystemKnowledgeGraph.ts'

const views = listBodyMultisystemScaleViews()

assert.equal(views.length, 15)
assert.equal(views.length, MULTISYSTEM_SCALES.length)
assert.deepEqual(views.map((view) => view.scale), MULTISYSTEM_SCALES)
assert.equal(new Set(views.map((view) => view.scale)).size, views.length)

for (const view of views) {
  assert.equal(view.patientSpecificAllowed, false)
  assert.equal(view.clinicalInferenceAllowed, false)
  assert.ok(view.label.trim().length > 0)
  assert.ok(view.note.trim().length > 0)
}

const boundary = getBodyMultisystemReferenceBoundary()
assert.equal(boundary.patientSpecificInference, false)
assert.equal(boundary.diagnosisOrTreatment, false)
assert.equal(boundary.immortalityClaim, false)
assert.ok(boundary.mandatoryReferenceIds.length > 0)

const navigatorSource = readFileSync(
  new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url),
  'utf8',
)

assert.match(
  navigatorSource,
  /data-body-multisystem-scale-navigator="v1"\s+data-selected-scale=\{selected\.scale\}/,
  'navigator must expose the canonical selected scale without introducing a second state source',
)
assert.match(
  navigatorSource,
  /const \[scale, setScale\] = useState<KnowledgeScale>\('whole-body'\)/,
  'navigator must retain one canonical KnowledgeScale state',
)
assert.doesNotMatch(
  navigatorSource,
  /patientSpecificAllowed\s*=\s*\{?true\}?|clinicalInferenceAllowed\s*=\s*\{?true\}?/,
  'UI must not promote multisystem navigation to patient-specific or clinical inference',
)

console.log(JSON.stringify({
  scaleCount: views.length,
  selectedScaleObservable: true,
  patientSpecificInference: boundary.patientSpecificInference,
  diagnosisOrTreatment: boundary.diagnosisOrTreatment,
  immortalityClaim: boundary.immortalityClaim,
}, null, 2))
