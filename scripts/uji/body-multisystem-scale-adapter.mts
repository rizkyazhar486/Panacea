import assert from 'node:assert/strict'
import {
  getBodyMultisystemReferenceBoundary,
  getBodyMultisystemScaleView,
  listBodyMultisystemDomains,
  listBodyMultisystemScaleViews,
} from '../../src/lib/bodyMultisystemScaleAdapter.ts'

const scales = listBodyMultisystemScaleViews()
assert.equal(scales.length, 15)
assert.deepEqual(scales.map((item) => item.scale), [
  'whole-body', 'system', 'organ', 'tissue', 'cell', 'organelle', 'molecular-pathway', 'protein', 'rna', 'dna-epigenome', 'neural-circuit', 'endocrine-signal', 'cognition-behavior', 'development-regeneration', 'aging-longevity',
])

for (const scale of scales) {
  assert.equal(scale.patientSpecificAllowed, false)
  assert.equal(scale.clinicalInferenceAllowed, false)
}

assert.equal(getBodyMultisystemScaleView('whole-body').representation, 'spatial-3d')
assert.equal(getBodyMultisystemScaleView('whole-body').geometryRequired, true)
assert.equal(getBodyMultisystemScaleView('rna').representation, 'molecular-network')
assert.equal(getBodyMultisystemScaleView('rna').geometryRequired, false)
assert.match(getBodyMultisystemScaleView('rna').note, /measured transcriptomics|patient interpretation/i)
assert.equal(getBodyMultisystemScaleView('neural-circuit').representation, 'neural-network')
assert.equal(getBodyMultisystemScaleView('endocrine-signal').representation, 'endocrine-network')
assert.match(getBodyMultisystemScaleView('cognition-behavior').note, /emergent|network/i)
assert.equal(getBodyMultisystemScaleView('development-regeneration').representation, 'regeneration-timeline')
assert.equal(getBodyMultisystemScaleView('aging-longevity').evidenceBoundary, 'research-frontier')
assert.match(getBodyMultisystemScaleView('aging-longevity').note, /never present immortality/i)

const neural = listBodyMultisystemDomains('neural-circuit').map((item) => item.id)
assert.ok(neural.includes('nervous-system'))
assert.ok(neural.includes('brain-cognition'))
assert.ok(neural.includes('endocrine'))

const rna = listBodyMultisystemDomains('rna').map((item) => item.id)
assert.ok(rna.includes('cell-molecular-genomics'))
assert.ok(rna.includes('stem-cell-regeneration'))
assert.ok(rna.includes('aging-longevity'))

const boundary = getBodyMultisystemReferenceBoundary()
assert.equal(boundary.patientSpecificInference, false)
assert.equal(boundary.diagnosisOrTreatment, false)
assert.equal(boundary.immortalityClaim, false)
assert.ok(boundary.mandatoryReferenceIds.includes('thebuggeddev-anatomy'))
assert.ok(boundary.mandatoryReferenceIds.includes('breath-atlas-thebuggeddev'))
assert.deepEqual(boundary.externalUxReferences.map((item) => item.evidenceStatus), ['reference-only', 'reference-only'])
assert.ok(boundary.scientificEvidence.some((item) => item.pmid === '16904174' && item.evidenceStatus === 'source-checked'))
assert.ok(boundary.scientificEvidence.some((item) => item.pmid === '39969437' && item.evidenceStatus === 'source-checked'))
assert.ok(boundary.scientificEvidence.some((item) => item.pmid === '40509615' && item.evidenceStatus === 'research-frontier'))

console.log('Body multisystem scale adapter: 15-scale navigation, representation modes, mandatory references, and fail-closed evidence boundaries verified.')
