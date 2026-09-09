import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_IMPORT_BYTES,
  parseNutritionJournalJson,
  sanitizeNutritionJournal,
} from '../../src/lib/nutritionJournal.ts'

assert.throws(
  () => parseNutritionJournalJson('{not-json'),
  /Nutrition journal is not valid JSON\./,
  'Malformed JSON must fail closed with a specific local error.',
)
assert.throws(
  () => parseNutritionJournalJson(JSON.stringify({ schema: 'panacea-nutrition-journal', version: 999, entries: [] })),
  /Nutrition journal schema\/version is not supported\./,
  'Unknown schema versions must fail closed instead of being guessed.',
)
assert.throws(
  () => parseNutritionJournalJson('x'.repeat(MAX_NUTRITION_IMPORT_BYTES + 1)),
  /larger than the 1 MB import limit/,
  'Oversized local payloads must be rejected before JSON parsing.',
)
assert.deepEqual(sanitizeNutritionJournal(null), { entries: [], rejected: 0 })
assert.deepEqual(sanitizeNutritionJournal([]), { entries: [], rejected: 0 })
assert.deepEqual(sanitizeNutritionJournal('not-an-array'), { entries: [], rejected: 1 })

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /Local journal controls are ready\. No file is uploaded to Panacea\./)
assert.match(page, /Import blocked: file exceeds the 1 MB local safety limit\./)
assert.match(page, /Import blocked: unreadable nutrition journal\./)
assert.match(page, /No valid nutrition journal records yet\. This panel stays empty instead of generating a sample day\./)
assert.match(page, /No validated recorded entry matches this filter\./)
assert.match(page, /Reading and writing happens in your browser\./)
assert.match(page, /There is no automatic upload or background sync from this tab\./)
assert.doesNotMatch(page, /\bfetch\s*\(|\baxios\b|setInterval\s*\(/)

console.log('Feature Factory nutrition fallback: malformed, unsupported, oversized and empty local states fail closed without network or fabricated nutrition data.')
