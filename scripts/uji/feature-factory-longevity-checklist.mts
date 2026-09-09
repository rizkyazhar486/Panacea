import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildLongevityRecordedChecklist } from '../../src/lib/longevityRecordedChecklist.ts'
import type { LongevityRecordedMetric } from '../../src/lib/longevityRecordedSnapshot.ts'

const page = readFileSync('src/pages/Longevity.tsx', 'utf8')
const component = readFileSync('src/components/LongevityRecordedSnapshot.tsx', 'utf8')
const helper = readFileSync('src/lib/longevityRecordedChecklist.ts', 'utf8')

assert.match(page, /<LongevityRecordedSnapshot vitals=\{vitals\} \/>/, 'The recorded-input checklist must remain mounted on the real Longevity surface.')
assert.match(component, /Recorded-input safety checklist/, 'Longevity recorded-input panel must expose its safety checklist.')
assert.match(component, /aria-labelledby="longevity-recorded-checklist-title"/, 'Checklist must retain a visible labelled section.')
assert.match(component, /aria-label="Longevity recorded-input safety checklist"/, 'Checklist needs an explicit assistive-technology label.')
assert.match(component, /data-check-id=\{item\.id\}/, 'Checklist items need stable deterministic QA hooks.')
assert.match(component, /buildLongevityRecordedChecklist\(metrics, provenance\)/, 'Production UI must render the pure checklist derivation rather than duplicate inline logic.')
assert.doesNotMatch(component, /\bfetch\s*\(|axios|localStorage|sessionStorage|setInterval|setTimeout/, 'Checklist component must remain presentation-only without network, persistence or polling side effects.')
assert.doesNotMatch(helper, /\bfetch\s*\(|axios|localStorage|sessionStorage|setInterval|setTimeout|Math\.random|Date\.now/, 'Checklist derivation must stay deterministic and side-effect free.')

const validMetrics: LongevityRecordedMetric[] = [
  { key: 'vo2max', label: 'VO₂max', unit: 'ml/kg/min', value: 41.2 },
  { key: 'waistHipRatio', label: 'Waist-to-hip ratio', unit: '', value: 0.88 },
]
const fullProvenance = { source: 'Apple Health', timestamp: '2026-09-09T02:00:00.000Z' }
const complete = buildLongevityRecordedChecklist(validMetrics, fullProvenance)

assert.deepEqual(
  complete.map((item) => item.id),
  ['source', 'timestamp', 'units', 'empty-state', 'scientific-boundary'],
  'Checklist order and identities must remain stable.',
)
assert.equal(complete.length, 5, 'Checklist must stay intentionally bounded to five safety checks.')
assert.equal(complete.find((item) => item.id === 'source')?.ok, true)
assert.equal(complete.find((item) => item.id === 'timestamp')?.ok, true)
assert.equal(complete.find((item) => item.id === 'units')?.ok, true, 'Dimensionless waist-to-hip ratio must be accepted only by explicit metric identity while other metrics retain units.')
assert.equal(complete.find((item) => item.id === 'source')?.detail, 'Apple Health')
assert.equal(complete.find((item) => item.id === 'timestamp')?.detail, fullProvenance.timestamp)
assert.deepEqual(
  buildLongevityRecordedChecklist(validMetrics, fullProvenance),
  complete,
  'Same recorded inputs must produce byte-equivalent checklist state.',
)

const empty = buildLongevityRecordedChecklist([], { source: null, timestamp: null })
assert.equal(empty.find((item) => item.id === 'source')?.ok, false, 'Missing source must fail closed instead of synthesizing provenance.')
assert.equal(empty.find((item) => item.id === 'timestamp')?.ok, false, 'Missing timestamp must fail closed instead of synthesizing time.')
assert.equal(empty.find((item) => item.id === 'units')?.ok, false, 'No recorded metric means the UI cannot claim unit preservation.')
assert.match(empty.find((item) => item.id === 'units')?.detail ?? '', /no unit claim is synthesized/i)
assert.equal(empty.find((item) => item.id === 'empty-state')?.ok, true, 'Empty state itself is a valid safety behavior when no measurements exist.')
assert.equal(empty.find((item) => item.id === 'scientific-boundary')?.ok, true)

const missingUnitMetric: LongevityRecordedMetric[] = [
  { key: 'restingHr', label: 'Resting heart rate', unit: '', value: 62 },
]
const invalidUnits = buildLongevityRecordedChecklist(missingUnitMetric, fullProvenance)
assert.equal(invalidUnits.find((item) => item.id === 'units')?.ok, false, 'A non-dimensionless metric with a missing unit must fail the unit guard.')

const dimensionlessOnly: LongevityRecordedMetric[] = [
  { key: 'waistHipRatio', label: 'Waist-to-hip ratio', unit: '', value: 0.9 },
]
assert.equal(
  buildLongevityRecordedChecklist(dimensionlessOnly, fullProvenance).find((item) => item.id === 'units')?.ok,
  true,
  'Waist-to-hip ratio is explicitly dimensionless and must not receive a fabricated unit.',
)

assert.match(helper, /does not validate the page’s legacy score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance/i, 'Checklist must keep the scientific-review boundary explicit.')
assert.doesNotMatch(component + helper, /clinically cleared|validated longevity score|diagnosis confirmed/i)

console.log('Feature Factory longevity checklist: behavior-tested, reachable, accessible, provenance-aware, deterministic and explicitly non-clinical.')
