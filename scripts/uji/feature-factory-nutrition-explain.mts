import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NUTRITION_DATA_EXPLAINABILITY_STEPS } from '../../src/lib/nutritionDataExplainability.ts'

assert.equal(NUTRITION_DATA_EXPLAINABILITY_STEPS.length, 4)
assert.deepEqual(
  NUTRITION_DATA_EXPLAINABILITY_STEPS.map((step) => step.id),
  ['recorded-input', 'structural-validation', 'bounded-transform', 'recorded-output'],
  'Explainability must keep a deterministic input-to-output order.',
)
assert.equal(new Set(NUTRITION_DATA_EXPLAINABILITY_STEPS.map((step) => step.id)).size, 4)

const combined = NUTRITION_DATA_EXPLAINABILITY_STEPS.map((step) => `${step.title} ${step.detail}`).join('\n')
assert.match(combined, /Empty history stays empty/)
assert.match(combined, /does not prove that a food identity or nutrient value is scientifically accurate/)
assert.match(combined, /hard result\/history limits/)
assert.match(combined, /Missing calendar dates remain missing rather than being silently inserted as zero/)
assert.match(combined, /not calorie or macro requirements, adequacy judgments, diagnoses, treatment rules or dietary recommendations/)
assert.doesNotMatch(combined, /optimal intake|healthy choice|unhealthy choice|deficiency diagnosed|recommended target/i)

const component = readFileSync(new URL('../../src/components/NutritionDataExplainabilityCard.tsx', import.meta.url), 'utf8')
assert.match(component, /Nutrition data transformation explanation/)
assert.match(component, /structural validity means the record is safe for this software workflow/)
assert.match(component, /it does not establish nutrient correctness, health benefit, deficiency, metabolic status or dietary suitability/)
assert.doesNotMatch(component, /\bfetch\s*\(|\baxios\b|setInterval\s*\(|setTimeout\s*\(/)

const workbench = readFileSync(new URL('../../src/pages/NutritionDataWorkbench.tsx', import.meta.url), 'utf8')
assert.match(workbench, /NutritionDataExplainabilityCard/)

console.log('Feature Factory nutrition explainability: the recorded-data software pipeline and scientific boundary are explicit, deterministic and network-free.')