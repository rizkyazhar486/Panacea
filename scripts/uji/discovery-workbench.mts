import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DISCOVERY_CHALLENGES, evidenceReadiness } from '../../src/lib/discoveryWorkbench.ts'

const insufficient = evidenceReadiness({
  provenanceCompleteness: 1,
  identifiability: 1,
  transportability: 1,
  confoundingRisk: 0,
  independentSources: 1,
})
assert.equal(insufficient.score, null)
assert.equal(insufficient.state, 'insufficient-evidence')
assert.equal(insufficient.formula, 'R = P × I × T × (1 − C)')

const idealized = evidenceReadiness({
  provenanceCompleteness: 1,
  identifiability: 1,
  transportability: 1,
  confoundingRisk: 0,
  independentSources: 2,
})
assert.equal(idealized.score, 1)
assert.equal(idealized.state, 'research-ready')

const bounded = evidenceReadiness({
  provenanceCompleteness: 0.8,
  identifiability: 0.5,
  transportability: 0.5,
  confoundingRisk: 0.25,
  independentSources: 3,
})
assert.equal(bounded.score, 0.15)

assert.ok(DISCOVERY_CHALLENGES.length >= 2)
const neuro = DISCOVERY_CHALLENGES.find((item) => item.id === 'cross-scale-neurodegeneration')
assert.ok(neuro)
assert.ok(neuro.hypotheses.length >= 3)
assert.match(neuro.boundary, /No single protein, transmitter, cell type or region/i)
for (const hypothesis of neuro.hypotheses) {
  assert.ok(hypothesis.assumptions.length > 0)
  assert.ok(hypothesis.falsificationCriteria.length > 0)
  assert.ok(hypothesis.requiredEvidence.length > 0)
}

const ui = readFileSync('src/components/frontier/DiscoveryWorkbench.tsx', 'utf8')
for (const term of [
  'Discovery → Innovation → Invention',
  'Hypothesis tournament',
  'Evidence readiness gate',
  'Falsification / counterexamples',
  'Missing experiments / evidence',
  'Candidate causal graph',
  'SynapseMicro3DLab',
  'lazy(',
  '<Suspense',
  'Not scoreable',
  'min-h-11',
  'Research only · fail closed',
]) {
  assert.ok(ui.includes(term), `Discovery workbench is missing guard: ${term}`)
}
assert.match(ui, /Visual realism and internal scores never count as scientific validation/i)
assert.match(ui, /not microscopy, connectomics, molecular dynamics or measured patient physiology/i)

console.log('discovery-workbench: fail-closed evidence, causal uncertainty, falsification and lazy 3D bridge passed')
