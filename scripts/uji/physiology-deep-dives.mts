import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PHYSIOLOGY_DEEP_DIVES } from '../../src/lib/physiologyDeepDives.ts'

const requiredIds = [
  'vision',
  'hearing',
  'umn-lmn',
  'bbb',
  'adh-osmoregulation',
  'insulin',
  'digestion',
  'spirometry',
  'hemostasis',
  'temperature-fever',
  'olfaction',
  'voice',
  'renal-clearance',
  'electrolytes-acid-base',
  'hepatic-carbohydrate',
  'protein-metabolism',
  'cardiopulmonary',
  'shock',
  'allergy',
  'immune-response',
]

assert.ok(PHYSIOLOGY_DEEP_DIVES.length >= 20, `expected at least 20 physiology deep dives, got ${PHYSIOLOGY_DEEP_DIVES.length}`)
assert.equal(new Set(PHYSIOLOGY_DEEP_DIVES.map((topic) => topic.id)).size, PHYSIOLOGY_DEEP_DIVES.length, 'physiology topic ids must be unique')

for (const id of requiredIds) {
  const topic = PHYSIOLOGY_DEEP_DIVES.find((item) => item.id === id)
  assert.ok(topic, `${id} must be represented`)
  assert.ok(topic.sequence.length >= 4, `${id} needs a real mechanism sequence`)
  assert.ok(topic.boundary.length >= 30, `${id} needs an explicit interpretation boundary`)
  assert.ok(topic.references.length >= 1, `${id} needs at least one reference`)
  assert.ok(topic.searchTerms.length >= 2, `${id} needs anatomical focus terms`)
}

const formulas = PHYSIOLOGY_DEEP_DIVES.flatMap((topic) => topic.formulas.map((formula) => `${formula.label} ${formula.expression}`)).join('\n')
assert.match(formulas, /CO = HR × SV/, 'cardiac output relation must stay explicit')
assert.match(formulas, /SV = EDV − ESV/, 'stroke volume relation must stay explicit')
assert.match(formulas, /EF = SV \/ EDV × 100%/, 'ejection fraction relation must stay explicit')
assert.match(formulas, /FEV₁ \/ FVC × 100%/, 'spirometry ratio must stay explicit')
assert.match(formulas, /Cₓ = Uₓ·V \/ Pₓ/, 'renal clearance relation must stay explicit')
assert.match(formulas, /pH = 6\.1 \+ log₁₀/, 'Henderson–Hasselbalch relation must stay explicit')
assert.match(formulas, /CaO₂ ≈ 1\.34·Hb·SaO₂ \+ 0\.003·PaO₂/, 'arterial oxygen content relation must stay explicit')
assert.match(formulas, /DO₂ = CO · CaO₂ · 10/, 'oxygen delivery relation must stay explicit')
assert.match(formulas, /S = M − W ± R ± C ± K − E/, 'human heat-balance relation must stay explicit')

const unsafeClaimPattern = /guaranteed diagnosis|diagnoses the patient|predicts your disease|perfect diagnosis|patient-specific prediction/i
for (const topic of PHYSIOLOGY_DEEP_DIVES) {
  assert.doesNotMatch(JSON.stringify(topic), unsafeClaimPattern, `${topic.id} must remain educational rather than diagnostic/predictive`)
}

const section = readFileSync('src/pages/bodyhub/PhysiologySection.tsx', 'utf8')
const panel = readFileSync('src/pages/bodyhub/PhysiologyDeepDivePanel.tsx', 'utf8')
assert.match(section, /PhysiologyDeepDivePanel/, 'general physiology section must render deep dives')
assert.match(section, /onPickSystem\(topic\.layer3d, topic\.searchTerms, topic\.label\)/, 'deep dive must focus the existing shared Body Explorer')
assert.match(panel, /Educational physiology/)
assert.match(panel, /Source anatomy unchanged/)
assert.match(panel, /These are teaching models, not measurements from a patient/)
assert.match(panel, /Focus in 3D →/)
assert.match(panel, /aria-pressed/, 'topic/domain controls need accessible selected state')
assert.doesNotMatch(panel, /requestAnimationFrame|WebGLRenderer|Canvas/, 'physiology deep dive must not introduce another renderer or animation loop')

console.log(`${PHYSIOLOGY_DEEP_DIVES.length} granular physiology topics validated with formulas, references, boundaries and shared 3D focus`)
