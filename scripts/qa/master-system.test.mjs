import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { evaluateMasterSystem } from '../../src/domains/master/panaceaMasterKernel.ts'

test('master status does not invent a score, branch, count, or readiness', () => {
  const status = evaluateMasterSystem()
  assert.equal(status.productionReady, false)
  assert.equal(status.systemIntegrityScore, null)
  assert.equal(status.totalModulesIntegrated, null)
  assert.equal(status.branchName, null)
})

test('master UI reports missing evidence instead of hardcoded readiness', () => {
  const ui = readFileSync(new URL('../../src/components/MasterCommandCenter.tsx', import.meta.url), 'utf8')
  assert.match(ui, /READINESS UNKNOWN/)
  assert.match(ui, /No authenticated branch or CI evidence is connected/)
  assert.doesNotMatch(ui, /PRODUCTION READY|Harmoni Sempurna/)
})
