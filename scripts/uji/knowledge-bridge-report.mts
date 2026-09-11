import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/components/KnowledgeBridgeWorkbench.tsx', 'utf8')
const map = readFileSync('src/lib/knowledgeBridgeMap.ts', 'utf8')

// Structured report/export must reuse the canonical curated topic and stage objects.
assert.match(map, /export function bridgeSummary\(topic: BridgeTopic\)/, 'Knowledge Bridge must expose one canonical structured summary function.')
assert.match(map, /topic\.title, topic\.oneLiner, \.\.\.topic\.stages\.map/, 'Structured summary must preserve topic identity, one-line context, and every canonical stage.')
assert.match(map, /canonicalStageLabel\(item\.label\)/, 'Report stage labels must normalize display glossary text back to canonical stage labels.')
assert.match(map, /item\.explanation/, 'Report output must preserve curated stage explanation text rather than synthesize alternate facts.')
assert.match(workbench, /navigator\.clipboard\.writeText\(bridgeSummary\(topic\)\)/, 'Copy report action must export the canonical bridge summary without a hidden transformation layer.')
assert.match(workbench, /Copy bridge summary/, 'The structured report action must remain visible to the user.')

// The report must retain the educational/source-verification boundary and must not
// silently become patient-specific advice or a diagnosis/treatment document.
assert.match(workbench, /Educational · not patient-specific/, 'Structured report surface must remain explicitly educational and not patient-specific.')
assert.match(workbench, /Verify in Medical Library →/, 'Structured report workflow must retain a visible source-verification route.')
assert.match(workbench, /Open the original source before treating a claim as verified\./, 'Evidence pointers must not be promoted to verified claims in the report workflow.')
assert.doesNotMatch(map, /patient-specific recommendation|personalized diagnosis|treatment plan for you/i, 'Structured summary must not encode patient-specific diagnosis or treatment language.')

// Report generation must stay deterministic, bounded by the fixed curated stage list,
// and free from runtime network calls or external report-generation dependencies.
assert.doesNotMatch(map, /\bfetch\s*\(/, 'Structured report generation must not perform network requests.')
assert.doesNotMatch(map, /\baxios\b/, 'Structured report generation must not depend on axios or another network client.')
assert.match(map, /BRIDGE_STAGE_ORDER: BridgeStageKey\[\] = \['anatomy', 'physiology', 'pathology', 'signals', 'diagnostics', 'management', 'evidence'\]/, 'Canonical report ordering must remain the fixed seven-stage Knowledge Bridge order.')

console.log('knowledge-bridge structured-report guard: ok')
