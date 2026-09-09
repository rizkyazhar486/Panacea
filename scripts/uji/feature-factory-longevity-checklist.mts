import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/Longevity.tsx', 'utf8')
const component = readFileSync('src/components/LongevityRecordedSnapshot.tsx', 'utf8')

assert.match(page, /<LongevityRecordedSnapshot vitals=\{vitals\} \/>/, 'The recorded-input checklist must remain mounted on the real Longevity surface.')
assert.match(component, /Recorded-input safety checklist/, 'Longevity recorded-input panel must expose its safety checklist.')
assert.match(component, /aria-labelledby="longevity-recorded-checklist-title"/, 'Checklist must retain a visible labelled section.')
assert.match(component, /aria-label="Longevity recorded-input safety checklist"/, 'Checklist needs an explicit assistive-technology label.')
assert.match(component, /data-check-id=\{item\.id\}/, 'Checklist items need stable deterministic QA hooks.')
assert.match(component, /Source identity/, 'Checklist must expose source identity.')
assert.match(component, /Measurement timestamp/, 'Checklist must expose measurement timestamp.')
assert.match(component, /Units \/ dimensionless identity preserved/, 'Checklist must expose unit and dimensionless identity preservation.')
assert.match(component, /No fabricated defaults/, 'Checklist must guard against fabricated defaults.')
assert.match(component, /Scientific boundary/, 'Checklist must expose the scientific-review boundary.')
for (const id of ['source', 'timestamp', 'units', 'empty-state', 'scientific-boundary']) {
  assert.match(component, new RegExp(`id: '${id}'`), `Missing required Longevity checklist item: ${id}`)
}
assert.match(component, /metrics\.every\(\(metric\) => metric\.unit\.trim\(\)\.length > 0 \|\| metric\.key === 'waistHipRatio'\)/, 'Unit guard must preserve explicit units while accepting the dimensionless waist-to-hip ratio.')
assert.match(component, /waist-to-hip ratio remains explicitly dimensionless/i, 'Dimensionless ratio semantics must be visible rather than implied by a blank unit.')
assert.match(component, /Boolean\(provenance\.source\)/, 'Source check must derive from recorded provenance.')
assert.match(component, /Boolean\(provenance\.timestamp\)/, 'Timestamp check must derive from recorded provenance.')
assert.match(component, /No shared-vitals source is recorded yet\./, 'Missing source must stay explicitly unresolved.')
assert.match(component, /No shared-vitals timestamp is recorded yet\./, 'Missing timestamp must stay explicitly unresolved.')
assert.match(component, /No recorded metric is present, so no unit claim is synthesized\./, 'Missing measurements must not synthesize a unit claim.')
assert.match(component, /does not validate the page’s legacy score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance/i, 'Checklist must not promote legacy longevity logic as validated.')
assert.doesNotMatch(component, /\bfetch\s*\(|axios|localStorage|sessionStorage|setInterval|setTimeout/, 'Checklist component must remain presentation-only without network, persistence or polling side effects.')
assert.doesNotMatch(component, /clinically cleared|validated longevity score|diagnosis confirmed/i)

console.log('Feature Factory longevity checklist: reachable, accessible, deterministic, provenance-aware and explicitly non-clinical.')
