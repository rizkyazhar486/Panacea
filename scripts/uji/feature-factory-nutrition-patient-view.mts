import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NUTRITION_PLAIN_LANGUAGE_GUIDE } from '../../src/lib/nutritionDataExplainability.ts'

assert.equal(NUTRITION_PLAIN_LANGUAGE_GUIDE.length, 4)
assert.deepEqual(
  NUTRITION_PLAIN_LANGUAGE_GUIDE.map((item) => item.id),
  ['recorded-only', 'numbers-as-recorded', 'missing-stays-missing', 'decision-boundary'],
)

const plain = NUTRITION_PLAIN_LANGUAGE_GUIDE.map((item) => item.text).join('\n')
assert.match(plain, /shows only food entries you recorded or chose to import/)
assert.match(plain, /does not make up a meal or a missing day/)
assert.match(plain, /does not turn those numbers into a health grade or a daily eating goal/)
assert.match(plain, /stays missing instead of being silently changed to zero/)
assert.match(plain, /does not diagnose or prescribe/)
assert.doesNotMatch(plain, /you should eat|ideal intake|healthy score|unhealthy|personalized target|treatment plan/i)

const component = readFileSync(new URL('../../src/components/NutritionDataExplainabilityCard.tsx', import.meta.url), 'utf8')
assert.match(component, /<details/)
assert.match(component, />In simple words<\/summary>/)
assert.match(component, /Plain-language nutrition data guide/)
assert.match(component, /NUTRITION_PLAIN_LANGUAGE_GUIDE\.map/)
assert.doesNotMatch(component, /\bfetch\s*\(|\baxios\b|setInterval\s*\(/)

console.log('Feature Factory nutrition patient view: plain-language recorded-data meaning is available without adding targets, diagnosis or recommendation logic.')
