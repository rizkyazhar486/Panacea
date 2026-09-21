import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const planning = readFileSync(new URL('../../src/pages/Planning.tsx', import.meta.url), 'utf8')

// A hard safety gate is only real if the clinical commit path calls it.
// Merely rendering a red badge is not an authorization boundary.
assert.ok(
  /import\s+\{[^}]*evaluatePlanSafety[^}]*\}\s+from\s+['"]\.\.\/lib\/cdss['"]/.test(planning),
  'Planning must import the deterministic CDSS verification gate',
)
assert.ok(
  /if\s*\(status\s*===\s*['"]diverifikasi['"]\)[\s\S]{0,900}evaluatePlanSafety[\s\S]{0,900}if\s*\(!safety\.canVerify\)\s*return/.test(planning),
  'Verify transition must fail closed when the current safety evaluation cannot be verified',
)

// A physician-authored item is not automatically safe merely because a
// physician typed it. It must enter the same explicit verification path.
assert.ok(
  /source:\s*['"]Dokter['"]\s*,\s*status:\s*['"]usulan['"]/.test(planning),
  'new physician-authored plan items must start proposed, not auto-verified',
)
assert.ok(
  !/source:\s*['"]Dokter['"]\s*,\s*status:\s*['"]diverifikasi['"]/.test(planning),
  'physician authorship must not bypass the safety gate',
)

// An override has clinical meaning only if it survives rerender/reload and is
// bound to the blockers that were actually reviewed.
assert.ok(
  !/useState<Record<string,\s*string>>\(\{\}\)/.test(planning),
  'safety overrides must not live only in component-local state',
)
assert.ok(
  /safetyOverride:\s*\{[\s\S]{0,650}reason:[\s\S]{0,650}by:[\s\S]{0,650}at:[\s\S]{0,650}findingIds:/.test(planning),
  'override must persist rationale, clinician identity, timestamp, and exact blocker identities',
)

// Allergies are not medications and must not be fed into a DDI keyword list.
assert.ok(
  !/DDICheck\s+texts=\{\[[\s\S]{0,350}activePatient\.allergies/.test(planning),
  'documented allergies must not be injected into the DDI medication list',
)

// A bounded local DDI table cannot truthfully certify absence of interactions.
assert.ok(
  !planning.includes('No significant interactions detected in the current list.'),
  'bounded local DDI rules must not render a comprehensive-looking all-clear',
)
assert.ok(
  /not a comprehensive interaction database/i.test(planning),
  'DDI no-hit state must state the coverage limitation explicitly',
)

console.log('planning-safety-gate: ok')
