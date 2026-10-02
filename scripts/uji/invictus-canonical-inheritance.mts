import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function requireText(path: string, needles: readonly string[]) {
  const text = read(path).toLowerCase()
  for (const needle of needles) {
    assert.ok(
      text.includes(needle.toLowerCase()),
      `${path} must inherit Panacea Invictus authority: missing "${needle}"`,
    )
  }
}

const authority = 'PANACEA_INVICTUS_PRINCIPLE.md'

for (const path of [
  'PANACEA_CONSTITUTION.md',
  'PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md',
  'PANACEA_PRODUCT_MATURITY_OS.md',
  'PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md',
  'PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md',
  'AGENTS.md',
  'CLAUDE.md',
]) {
  requireText(path, [authority])
}

requireText('PANACEA_CONSTITUTION.md', [
  'future-realizable',
  'patient truth',
  'human agency',
])

requireText('PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md', [
  'future-capability absorbability',
  'Canonical Patient State',
  'Physiological State Engine',
])

requireText('PANACEA_PRODUCT_MATURITY_OS.md', [
  'IMAGINE FUTURE-REALIZABLE CAPABILITY',
  'FORMALIZE STABLE INTERFACE',
  'DEEPEST JUSTIFIED PRESENT SLICE',
  'VALIDATE / FALSIFY AGAINST REALITY',
])

requireText('PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md', [
  'meaningful horizontal expansion',
  'VERTICAL GAP — NOT YET MODELED',
])

requireText('PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md', [
  'knowledge boundary',
  'KNOWN_WITH_UNCERTAINTY',
  'KNOWABLE_BUT_UNMEASURED',
  'CURRENTLY_UNIDENTIFIABLE',
  'SCIENTIFICALLY_UNCERTAIN',
  'UNSUPPORTED',
])

requireText('governance/RISK_REGISTRY.yaml', [
  'risk.speculative_truth_leakage',
  'risk.future_model_lock_in',
])

console.log('invictus-canonical-inheritance: lulus')
