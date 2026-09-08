import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/components/KnowledgeBridgeWorkbench.tsx', 'utf8')
const map = readFileSync('src/lib/knowledgeBridgeMap.ts', 'utf8')

// Patient-view capability must reuse the same curated facts rather than inventing
// a second content source. The plain view is a presentation-depth choice only.
assert.match(workbench, /type Depth = 'plain' \| 'student' \| 'clinical'/, 'Knowledge Bridge must retain an explicit plain-language depth.')
assert.match(workbench, /\(\['plain', 'student', 'clinical'\] as Depth\[\]\)/, 'Plain, student, and clinical views must be selectable from one shared workbench.')
assert.match(workbench, /topic\.oneLiner/, 'All depth modes must render the same topic one-liner source.')
assert.match(workbench, /topic\.stages\.map/, 'All depth modes must render the same curated stage objects rather than alternate patient facts.')
assert.match(map, /export const BRIDGE_TOPICS/, 'Patient view must stay anchored to the curated topic registry.')
assert.match(map, /export const BRIDGE_STAGE_GLOSSARY/, 'Plain-language terminology must come from the shared stage glossary.')

// The patient-friendly surface must state its educational boundary and keep a
// clear route to source verification before facts are applied clinically.
assert.match(workbench, /Educational · not patient-specific/, 'Patient view must remain explicitly educational and not patient-specific.')
assert.match(workbench, /Verify in Medical Library →/, 'Patient view must retain a direct source-verification action.')
assert.match(workbench, /Open the original source before treating a claim as verified\./, 'Selected evidence pointers must not be presented as verified facts.')

// Plain-language guidance must be understandable without implying diagnosis,
// competence, or personalized medical advice.
assert.match(workbench, /Read the sequence and ask: what changed, what can be observed, and what action needs a professional\?/, 'Plain mode must explain the reasoning sequence in understandable language.')
assert.doesNotMatch(workbench, /patient diagnosis|your diagnosis|personalized treatment recommendation/i, 'Patient view must not imply a diagnosis or personalized treatment recommendation.')

console.log('knowledge-bridge patient-view guard: ok')
