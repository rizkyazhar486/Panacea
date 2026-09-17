import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { validateCapabilityOs } from '../lib/capability-os.mjs'

const schema = JSON.parse(await readFile(new URL('../../config/capability-os.schema.json', import.meta.url), 'utf8'))

const validEntry = {
  id: 'research.biomedical.pubmed',
  lane: 'biomedical-evidence',
  domains: ['medicine', 'evidence'],
  executors: { preferred: 'chatgpt', supported: ['chatgpt'] },
  primary: 'pubmed',
  fallbacks: ['consensus', 'elicit'],
  skill: 'panacea-medical-evidence-validator',
  risk: 'clinical-reference',
  sideEffects: 'read-only',
  parallelizable: true,
  writeAuthority: 'none',
  requiredEvidence: ['source-identity', 'retrieval-date', 'citation'],
  stopCondition: 'sufficient-authoritative-evidence',
}

const manifest = (entries) => ({ version: 1, capabilities: entries })
const errorsFor = (entry) => validateCapabilityOs(manifest([entry]), schema)

test('accepts a complete logical capability', () => {
  assert.deepEqual(errorsFor(validEntry), [])
})

test('rejects duplicate capability ids', () => {
  const errors = validateCapabilityOs(manifest([validEntry, { ...validEntry }]), schema)
  assert.match(errors.join('\n'), /duplicate capability id/i)
})

test('rejects secret-like and connection-state fields', () => {
  for (const [key, value] of [
    ['token', 'secret'],
    ['apiKey', 'secret'],
    ['accessToken', 'secret'],
    ['oauth', true],
    ['installed', true],
    ['connected', true],
  ]) {
    const errors = errorsFor({ ...validEntry, [key]: value })
    assert.match(errors.join('\n'), /additional property|token|apiKey|accessToken|oauth|installed|connected/i)
  }
})

test('rejects preferred executor that is not supported', () => {
  const errors = errorsFor({
    ...validEntry,
    executors: { preferred: 'claude-code', supported: ['chatgpt'] },
  })
  assert.match(errors.join('\n'), /preferred executor.*supported/i)
})

test('rejects invalid executor aliases that hide runtime differences', () => {
  const errors = errorsFor({
    ...validEntry,
    executors: { preferred: 'either', supported: ['either'] },
  })
  assert.match(errors.join('\n'), /enum|executor|either/i)
})

test('rejects production write authority on read-only capability', () => {
  const errors = errorsFor({ ...validEntry, writeAuthority: 'approved-production' })
  assert.match(errors.join('\n'), /read-only.*write authority/i)
})

test('rejects empty domains and evidence requirements', () => {
  assert.match(errorsFor({ ...validEntry, domains: [] }).join('\n'), /domains|minItems/i)
  assert.match(errorsFor({ ...validEntry, requiredEvidence: [] }).join('\n'), /requiredEvidence|minItems/i)
})

test('rejects primary provider repeated in fallbacks', () => {
  const errors = errorsFor({ ...validEntry, fallbacks: ['pubmed', 'consensus'] })
  assert.match(errors.join('\n'), /primary provider.*fallback/i)
})

test('rejects duplicate fallback providers', () => {
  const errors = errorsFor({ ...validEntry, fallbacks: ['consensus', 'consensus'] })
  assert.match(errors.join('\n'), /fallback providers.*unique/i)
})

test('rejects invalid lane risk side-effect and write-authority values', () => {
  for (const entry of [
    { ...validEntry, lane: 'everything' },
    { ...validEntry, risk: 'unknown-risk' },
    { ...validEntry, sideEffects: 'magic-write' },
    { ...validEntry, writeAuthority: 'main-direct' },
  ]) {
    assert.match(errorsFor(entry).join('\n'), /enum|value/i)
  }
})

test('rejects an attempted fallback-policy bypass field', () => {
  const errors = errorsFor({ ...validEntry, fallbackPolicy: 'bypass' })
  assert.match(errors.join('\n'), /additional property|fallbackPolicy/i)
})
