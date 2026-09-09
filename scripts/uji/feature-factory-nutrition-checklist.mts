import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const hub = await readFile(new URL('../../src/pages/PusatGizi.tsx', import.meta.url), 'utf8')
const checklist = await readFile(new URL('../../src/pages/NutritionChecklist.tsx', import.meta.url), 'utf8')

assert.match(hub, /id: 'checklist', label: 'Checklist'/, 'Nutrition hub must expose the checklist as a real reachable tab.')
assert.match(hub, /import\('\.\/NutritionChecklist'\)/, 'Checklist must remain lazy-loaded with the other nutrition subfeatures.')
assert.match(hub, /id: 'data', label: 'Data'/, 'Checklist integration must preserve the existing Nutrition Data controls tab.')
assert.match(hub, /import\('\.\/NutritionDataControls'\)/, 'Nutrition Data controls must remain lazy-loaded after checklist integration.')

assert.match(checklist, /Safety checklist · not a diet-quality score/)
assert.match(checklist, /aria-label="Nutrition data safety checklist"/)
assert.match(checklist, /data-check-id=\{item\.id\}/)
for (const id of ['recorded-intake', 'amount-units', 'source-time', 'context-explicit', 'evidence-opened', 'clinical-boundary']) {
  assert.match(checklist, new RegExp(`id: '${id}'`), `Missing required checklist item: ${id}`)
}

assert.match(checklist, /Leave missing intake missing instead of estimating it\./)
assert.match(checklist, /do not merge sources silently\./)
assert.match(checklist, /does not validate diet adequacy, diagnose a deficiency or authorize patient-specific treatment\./)
assert.match(checklist, /Review state is local to this view and is not stored as a health record\./)
assert.match(checklist, /Unchecked means not reviewed, not abnormal\./)
assert.match(checklist, /onClick=\{\(\) => setChecked\(\{\}\)\}/, 'Checklist must provide a deterministic reset.')
assert.doesNotMatch(checklist, /localStorage|sessionStorage|fetch\(|api\./, 'Checklist must not create hidden persistence or network side effects.')
assert.doesNotMatch(checklist, /diet quality achieved|clinically cleared|deficiency detected/i)

console.log('Nutrition checklist is reachable, provenance-aware, resettable and explicitly non-diagnostic while preserving existing Data controls.')
