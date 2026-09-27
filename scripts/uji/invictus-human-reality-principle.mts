import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function includesAll(path: string, needles: string[]) {
  const text = read(path).toLowerCase()
  for (const needle of needles) {
    assert.ok(
      text.includes(needle.toLowerCase()),
      `${path} must include "${needle}" for Invictus Human Reality inheritance`,
    )
  }
}

const specPath = 'docs/superpowers/specs/2026-09-28-invictus-human-reality-principle-design.md'

includesAll('PANACEA_CONSTITUTION.md', [
  'Invictus Human Reality Principle',
  specPath,
  'future-realizable',
  'patient truth',
  'human agency',
])

includesAll('PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md', [
  'Human Reality Model',
  'Reality Lattice',
  'future-capability absorbability',
  'Canonical Patient State',
  'Physiological State Engine',
])

includesAll('PANACEA_PRODUCT_MATURITY_OS.md', [
  'IMAGINE FUTURE-REALIZABLE CAPABILITY',
  'FORMALIZE STABLE INTERFACE',
  'DEEPEST JUSTIFIED PRESENT SLICE',
  'VALIDATE / FALSIFY AGAINST REALITY',
])

includesAll('PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md', [
  'meaningful horizontal expansion',
  'adaptive explanatory scale',
  'VERTICAL GAP — NOT YET MODELED',
])

includesAll('PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md', [
  'knowledge boundary',
  'KNOWN_WITH_UNCERTAINTY',
  'KNOWABLE_BUT_UNMEASURED',
  'CURRENTLY_UNIDENTIFIABLE',
  'SCIENTIFICALLY_UNCERTAIN',
  'UNSUPPORTED',
  'uncertainty anatomy',
])

includesAll('AGENTS.md', [
  'Invictus Human Reality Principle',
  specPath,
  'imagine beyond present capability',
])

includesAll('CLAUDE.md', [
  'Invictus Human Reality Principle',
  specPath,
])

includesAll('governance/RISK_REGISTRY.yaml', [
  'risk.speculative_truth_leakage',
  'risk.future_model_lock_in',
])

console.log('invictus-human-reality-principle: lulus')
