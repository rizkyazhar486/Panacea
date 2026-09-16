import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { BRIDGE_TOPICS, resolveBridgeTopic, searchBridgeTopics } from '../../src/lib/knowledgeBridgeMap.ts'

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

// --- ff-medical-education-search: lightweight local index over the same curated corpus ---
//
// resolveBridgeTopic above stays a single deterministic exact/alias match — unchanged.
// searchBridgeTopics is the new discrete "search" capability: it must widen recall (find a
// topic from body/stage text, not only title/alias) WITHOUT reintroducing the character-
// fragment false positives the guards above exist to prevent. Whole-word matching only.

// A query with no title/alias hit can still surface the right topic from curated stage text.
const kidneyHits = searchBridgeTopics('kidney disease')
assert.ok(kidneyHits.length > 0, 'expected at least one hit for "kidney disease"')
assert.equal(kidneyHits[0].topic.id, 'ckd', 'CKD must rank first for "kidney disease"')

const chestPainHits = searchBridgeTopics('chest pain')
assert.ok(chestPainHits.some((hit) => hit.topic.id === 'acs'), 'expected ACS among chest pain hits')

// The exact same fragment guard as resolveBridgeTopic: "art" must not surface ACS via "heart".
assert.deepEqual(searchBridgeTopics('art'), [], 'search must stay whole-word: "art" must not match inside "heart attack"')
assert.deepEqual(searchBridgeTopics('press'), [], 'search must stay whole-word: "press" must not match inside "pressure"')

// Short/noise queries and queries with no match anywhere return no hits, not garbage.
assert.deepEqual(searchBridgeTopics(''), [])
assert.deepEqual(searchBridgeTopics('xyzxyzxyz'), [])

// Result count respects the requested limit even when many topics match.
const limited = searchBridgeTopics('management', 1)
assert.ok(limited.length <= 1)

// Every curated topic is reachable by its own title through the index too.
for (const item of BRIDGE_TOPICS) {
  const hits = searchBridgeTopics(item.title)
  assert.ok(hits.some((hit) => hit.topic.id === item.id), `expected "${item.title}" to find itself`)
}

const source = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')
assert.match(source, /searchBridgeTopics/)
assert.match(source, /aria-label="Related curated topics"/)
assert.match(source, /Did you mean/)

console.log('Knowledge Bridge search finds curated topics from body text, not just title/alias, with the same whole-word fail-closed guard and no network dependency.')
