import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const checklist = await readFile(new URL('../../src/pages/NutritionChecklist.tsx', import.meta.url), 'utf8')
const controls = await readFile(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')

assert.match(checklist, /aria-labelledby="nutrition-checklist-title"/)
assert.match(checklist, /aria-describedby="nutrition-checklist-description"/)
assert.match(checklist, /id="nutrition-checklist-description"/)
assert.match(checklist, /role="status"/)
assert.match(checklist, /aria-live="polite"/)
assert.match(checklist, /aria-label=\{`\$\{reviewed\} of \$\{ITEMS\.length\} nutrition checklist items reviewed`\}/)
assert.match(checklist, /const detailId = `nutrition-check-\$\{item\.id\}-detail`/)
assert.match(checklist, /aria-describedby=\{detailId\}/)
assert.match(checklist, /id=\{detailId\}/)
assert.match(checklist, /focus-visible:ring-2 focus-visible:ring-emerald-500/, 'Keyboard focus must remain visibly distinguishable on checklist controls.')
assert.match(checklist, /<label className="flex cursor-pointer items-start gap-3">/, 'Every checklist checkbox must remain wrapped by its visible label.')

assert.match(controls, /htmlFor="nutrition-journal-search"/, 'Nutrition journal search must keep a programmatic label.')
assert.match(controls, /htmlFor="nutrition-journal-date"/, 'Nutrition date filter must keep a programmatic label.')
assert.match(controls, /aria-label="Import Panacea nutrition journal JSON"/, 'The visually hidden file input must keep an explicit accessible name.')
assert.match(controls, /role="status"/)
assert.match(controls, /aria-live="polite"/)
assert.match(controls, /role="img"/)
assert.match(controls, /aria-label=\{`Recorded energy totals across \$\{timeline\.length\} logged days`\}/)
assert.doesNotMatch(checklist, /onKeyDown|tabIndex=\{-1\}/, 'Native checkbox/button keyboard semantics must not be replaced with custom keyboard traps.')

console.log('Nutrition accessibility guards preserve named controls, described checklist items, visible keyboard focus, live status and chart semantics without custom keyboard traps.')
