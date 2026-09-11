import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/components/KnowledgeBridgeWorkbench.tsx', 'utf8')
const handoff = readFileSync('src/lib/knowledgeBridgeHandoff.ts', 'utf8')
const map = readFileSync('src/lib/knowledgeBridgeMap.ts', 'utf8')

// The Knowledge Bridge is intentionally a local curated surface. Its core map must
// remain usable even when live evidence/network access is unavailable.
assert.doesNotMatch(workbench, /\bfetch\s*\(/, 'Knowledge Bridge must not add a direct third-party/network fetch path.')
assert.doesNotMatch(workbench, /\baxios\b/, 'Knowledge Bridge must not add an axios/network dependency.')
assert.match(workbench, /BRIDGE_TOPICS\[0\]/, 'A deterministic local curated topic fallback must remain available.')
assert.match(map, /export const BRIDGE_TOPICS/, 'The local curated topic registry must remain explicit.')

// Empty input fails closed instead of guessing a topic.
assert.match(workbench, /Enter a disease, mechanism or clinical topic first\./, 'Blank search must produce an explicit empty-input state.')

// Unknown topics stay useful without fabricating a causal map: the UI says that
// no curated map exists and hands the exact query to the evidence surface.
assert.match(workbench, /No curated causal map matches/, 'Unknown topics must be disclosed as not curated.')
assert.match(workbench, /Use Medical Library for the live evidence search instead\./, 'Unknown topics must expose a safe evidence-search fallback.')
assert.match(workbench, /\/med-study\?bagian=evidence&cari=\$\{encodeURIComponent\(query\.trim\(\)\)\}/, 'Fallback handoff must preserve the explicit user query.')
assert.match(workbench, /Search evidence →/, 'The no-match state must expose a visible evidence-search action.')

// Local persistence failures must not crash the teaching surface or fabricate notes.
assert.match(workbench, /JSON\.parse\(localStorage\.getItem\(NOTE_KEY\) \|\| '\{\}'\)/, 'Notes must parse from an explicit empty-object fallback.')
assert.match(workbench, /catch \{\s*return \{\}\s*\}/, 'Malformed/unavailable note storage must fail closed to an empty record.')
assert.match(workbench, /try \{ localStorage\.setItem\(NOTE_KEY, JSON\.stringify\(next\)\) \} catch \{ \/\* unavailable \*\/ \}/, 'Unavailable note persistence must not crash the workbench.')

// Persisted evidence is bounded/sanitized by the dedicated handoff module rather
// than being trusted directly from storage.
assert.match(handoff, /const MAX_ITEMS\s*=\s*8/, 'Evidence fallback storage must remain bounded to eight pointers.')
assert.match(handoff, /parsed\.filter\(isBridgeEvidenceRef\)\.slice\(0, MAX_ITEMS\)/, 'Persisted evidence must be validated and bounded before use.')
assert.match(handoff, /catch \{\s*return \[\]\s*\}/, 'Malformed evidence persistence must fail closed to an empty shelf.')

// Truth boundary: absence of a live/selected source cannot silently become proof.
assert.match(workbench, /Open the original source before treating a claim as verified\./, 'Evidence fallback must preserve the source-verification boundary.')
assert.match(workbench, /Educational · not patient-specific/, 'Fallback content must remain explicitly educational and non-patient-specific.')

console.log('Knowledge Bridge graceful fallback guards verified (local-first, fail-closed, provenance-preserving).')
