import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  BRIDGE_EXPLAINABILITY_BOUNDARY,
  BRIDGE_EXPLAINABILITY_INTERPRETATION,
  buildBridgeExplainabilityTrace,
} from '../../src/lib/knowledgeBridgeExplainability.ts'
import { BRIDGE_TOPICS } from '../../src/lib/knowledgeBridgeMap.ts'

const hypertension = BRIDGE_TOPICS.find((topic) => topic.id === 'hypertension')
assert.ok(hypertension)

const traced = buildBridgeExplainabilityTrace(hypertension, '  high   blood pressure  ')
assert.equal(traced.topicId, 'hypertension')
assert.equal(traced.topicTitle, 'Hypertension')
assert.match(traced.input, /high blood pressure/)
assert.equal(traced.transformations.length, 3)
assert.equal(traced.uncertainty.length, 3)
assert.equal(traced.interpretation, BRIDGE_EXPLAINABILITY_INTERPRETATION)
assert.equal(traced.boundary, BRIDGE_EXPLAINABILITY_BOUNDARY)
assert.match(traced.transformations.join(' '), /without adding a score, probability, diagnosis, treatment decision, or patient-specific inference/)
assert.match(traced.uncertainty.join(' '), /provenance, not proof/)
assert.match(traced.uncertainty.join(' '), /Clinical application requires current source review/)

const selectedDirectly = buildBridgeExplainabilityTrace(hypertension, '   ')
assert.match(selectedDirectly.input, /selected directly/)

for (const topic of BRIDGE_TOPICS) {
  const trace = buildBridgeExplainabilityTrace(topic, topic.title)
  assert.equal(trace.topicId, topic.id)
  assert.ok(trace.input.trim())
  assert.ok(trace.transformations.every((item) => item.trim().length > 0))
  assert.ok(trace.uncertainty.every((item) => item.trim().length > 0))
  assert.equal(trace.interpretation, 'educational-system-trace-only')
  assert.equal(trace.boundary, 'not-evidence-verification-or-clinical-reasoning')
}

const ui = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')
assert.match(ui, /aria-label="Explanation depth"/)
assert.match(ui, /Educational · not patient-specific/)
assert.match(ui, /without hiding the reasoning path/)
assert.match(ui, /verify uncertain claims in Medical Library/)
assert.match(ui, /Open the original source before treating a claim as verified/)
assert.match(ui, /Check uncertainty, differential diagnosis, patient context, contraindications and source currency/)
assert.match(ui, /Save the uncertainty, not only the answer/)

console.log('Knowledge Bridge explainability makes inputs, transformations, uncertainty, source-verification limits and non-patient-specific boundaries explicit and deterministically guarded.')
