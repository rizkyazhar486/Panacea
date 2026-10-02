import assert from 'node:assert/strict'
import { advanceTranslationCandidate, contradictionLoad, mayAdvanceToInnovation, mayAdvanceToInvention, type TranslationCandidate } from '../../src/lib/discovery/evidenceTranslationBridge'

const discovery: TranslationCandidate = {
  id: 'lrrk2-mechanism-1',
  title: 'LRRK2 mechanism candidate',
  stage: 'discovery',
  anchors: [
    { sourceId: 'uniprot', recordId: 'Q5S007', grade: 'textbook' },
    { sourceId: 'pubmed', recordId: 'example', grade: 'observational' },
  ],
  falsifiers: ['effect disappears in an orthogonal perturbation model'],
  contradictions: ['context-dependent effect size'],
  uncertainty: 'high',
  prototypePlan: null,
  clinicalEfficacyClaim: false,
}
assert.equal(mayAdvanceToInnovation(discovery), true)
const innovation = advanceTranslationCandidate(discovery, 'innovation')
assert.equal(innovation.stage, 'innovation')
assert.equal(mayAdvanceToInvention(innovation), false)
const prototype = { ...innovation, prototypePlan: 'Build a bounded assay simulator with explicit falsification outputs.' }
assert.equal(mayAdvanceToInvention(prototype), true)
assert.equal(advanceTranslationCandidate(prototype, 'invention').stage, 'invention')
assert.equal(contradictionLoad(discovery), 1 / 3)

const hypothesisOnly: TranslationCandidate = {
  ...discovery,
  id: 'hypothesis-only',
  anchors: [{ sourceId: 'internal', recordId: 'h1', grade: 'hypothesis' }],
}
assert.equal(mayAdvanceToInnovation(hypothesisOnly), false)
assert.equal(hypothesisOnly.clinicalEfficacyClaim, false)

console.log('evidence-translation-bridge: ok')
