import assert from 'node:assert/strict'
import { resolveBridgeTopic } from '../../src/lib/knowledgeBridgeMap.ts'

function topicId(query: string) {
  return resolveBridgeTopic(query)?.id ?? null
}

assert.equal(topicId('Hypertension'), 'hypertension', 'Exact curated title must resolve deterministically.')
assert.equal(topicId('  T2DM  '), 't2dm', 'Exact topic id must remain case/whitespace tolerant.')
assert.equal(topicId('blood-pressure'), 'hypertension', 'Punctuation-normalized complete phrases must remain searchable.')
assert.equal(topicId('pressure'), 'hypertension', 'A complete token inside a curated alias must remain searchable.')
assert.equal(topicId('suspected heart attack symptoms'), 'acs', 'A longer query containing a complete curated alias must resolve.')
assert.equal(topicId('renal disease?'), 'ckd', 'Trailing punctuation must not break a complete curated phrase.')

assert.equal(topicId('art'), null, 'Character fragments must not match inside an unrelated alias such as heart attack.')
assert.equal(topicId('press'), null, 'Partial word prefixes must fail closed instead of guessing a topic.')
assert.equal(topicId(''), null, 'Blank input must fail closed.')
assert.equal(topicId('unrelated topic'), null, 'Unknown input must remain unmatched for the Medical Library fallback.')

console.log('Knowledge Bridge local search guards verified (normalized, phrase-bounded, fail-closed).')
