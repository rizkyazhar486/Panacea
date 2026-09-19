import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolveBridgeTopic, searchBridgeTopics } from '../../src/lib/knowledgeBridgeMap.ts'

// Fail-closed on empty/unmatched input: a lightweight index must never guess.
assert.deepEqual(searchBridgeTopics(''), [], 'Blank query must return no results instead of a default topic.')
assert.deepEqual(searchBridgeTopics('   '), [], 'Whitespace-only query must fail closed.')
assert.deepEqual(searchBridgeTopics('unrelated topic'), [], 'Unmatched query must return no results.')
assert.deepEqual(searchBridgeTopics('art'), [], 'A character fragment must not match inside an unrelated word such as heart.')

// Multiple genuinely matching curated topics must all surface, ranked, not just
// the first one in array order (the old single-result Array.find behaviour).
const highMatches = searchBridgeTopics('high')
assert.equal(highMatches.length, 2, 'A shared whole-word alias term must surface every matching curated topic.')
assert.deepEqual(highMatches.map((item) => item.id), ['hypertension', 't2dm'], 'Ties break deterministically by title, not by source array order.')
assert.ok(highMatches.every((item) => item.score === highMatches[0].score), 'Equal-strength alias matches must carry equal scores.')

// Exact title/id and exact alias matches must outrank a looser phrase match.
const exact = searchBridgeTopics('hypertension')
assert.equal(exact[0]?.id, 'hypertension')
assert.equal(exact[0]?.matchedOn, 'title')
const idMatch = searchBridgeTopics('t2dm')
assert.equal(idMatch[0]?.id, 't2dm')
assert.equal(idMatch[0]?.matchedOn, 'id')
const aliasExact = searchBridgeTopics('nstemi')
assert.equal(aliasExact[0]?.id, 'acs')
assert.equal(aliasExact[0]?.matchedOn, 'alias-exact')

// Results are bounded by an explicit limit, never an unbounded scan dump.
assert.ok(searchBridgeTopics('high', 1).length <= 1, 'limit must bound the returned result count.')
assert.equal(searchBridgeTopics('high', 0).length, 0, 'A zero limit must return no results rather than throwing.')

// resolveBridgeTopic stays the single-best-match convenience wrapper over the index.
for (const query of ['Hypertension', 'high blood pressure', 'nstemi', 'kidney disease', 'unrelated topic', '']) {
  const [top] = searchBridgeTopics(query, 1)
  assert.equal(resolveBridgeTopic(query)?.id ?? null, top?.id ?? null, `resolveBridgeTopic("${query}") must match the top search-index result.`)
}

// The workbench must expose the index as a visible, keyboard-reachable result list
// rather than silently jumping to whichever topic happened to match first.
const workbench = readFileSync('src/components/KnowledgeBridgeWorkbench.tsx', 'utf8')
assert.match(workbench, /searchBridgeTopics\(query, 5\)/, 'Knowledge Bridge must render the bounded local search index.')
assert.match(workbench, /role="listbox" aria-label="Matching curated topics"/, 'Matches must be exposed as a labeled, selectable list.')
assert.match(workbench, /aria-expanded=\{showSuggestions\}/, 'The search input must disclose whether a result list is open.')
assert.doesNotMatch(workbench, /\bfetch\s*\(/, 'The search index must stay local-first with no network fetch.')

console.log('Knowledge Bridge search index: ranked, bounded, deterministic, fail-closed, and visibly wired into the workbench.')
