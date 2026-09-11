import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')

assert.match(source, /Study verification checklist · not clinical clearance/)
assert.match(source, /aria-label="Study verification checklist"/)
assert.match(source, /data-check-id="source"/)
assert.match(source, /Open the original source and preserve its identifier, date and provenance before treating a claim as verified\./)
assert.match(source, /data-check-id="population"/)
assert.match(source, /Compare population, setting, definitions and units with the question you are studying\./)
assert.match(source, /data-check-id="uncertainty"/)
assert.match(source, /Record uncertainty and plausible alternatives instead of forcing one causal explanation\./)
assert.match(source, /data-check-id="management"/)
assert.match(source, /If management is involved, check contraindications, harms and source currency before reuse\./)
assert.match(source, /data-check-id="clinical-boundary"/)
assert.match(source, /A completed study checklist never authorizes a patient-specific diagnosis or treatment decision\./)
assert.doesNotMatch(source, /clinical clearance achieved/i)

console.log('Knowledge Bridge exposes a static, provenance-aware study checklist without creating a clinical-clearance state.')
