import assert from 'node:assert/strict'
import test from 'node:test'
import { synthesizeNewDNACode, getGenesisEngineStatus } from '../../src/domains/argon/panaceaGenesisEngine.ts'

test('legacy Genesis requests do not fabricate genomic sequences or biological effects', () => {
  assert.equal(getGenesisEngineStatus().clinicalAuthority, false)
  for (const seed of [0, 101, 2026]) for (const mutation of [0, 0.5, 2]) {
    const result = synthesizeNewDNACode(seed, mutation)
    assert.equal(result.engineMode, 'UNAVAILABLE')
    assert.equal(result.clinicallyReviewed, false)
    assert.equal(result.clinicalAuthority, false)
    for (const field of ['syntheticGenome', 'transcendenceIndex', 'strainCode', 'cytopathicEffect', 'replicationRate']) assert.equal(result[field], null)
  }
})

test('invalid seed or mutation requests cannot be converted into a successful synthesis', () => {
  for (const seed of [NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, null]) assert.throws(() => synthesizeNewDNACode(seed, 0.5), /INVALID_GENESIS_REQUEST/)
  for (const mutation of [NaN, Infinity, -1, 2.01, '0.5', null]) assert.throws(() => synthesizeNewDNACode(101, mutation), /INVALID_GENESIS_REQUEST/)
})
