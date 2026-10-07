import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../../src/pages/DoctorReviewChecklist.tsx', import.meta.url), 'utf8')
const model = await readFile(new URL('../../src/domains/clinical-review/model/doctorReviewChecklist.ts', import.meta.url), 'utf8')
const main = await readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const hub = await readFile(new URL('../../src/pages/clinical/ClinicalHub.tsx', import.meta.url), 'utf8')

test('doctor review is a non-blocking review-only workflow', () => {
  assert.match(model, /'open' \| 'reviewed'/)
  assert.doesNotMatch(model, /rejected|accepted/i)
  assert.match(page, /Mark reviewed/)
  assert.match(page, /There is no approve\/reject control on this page/i)
  assert.doesNotMatch(page, />\s*(Approve|Reject)\s*</i)
  assert.match(page, /Engineering and automated validation are not blocked by this checklist/)
})

test('doctor review page is wired into the clinical doctor surface', () => {
  assert.match(main, /DoctorReviewChecklist/)
  assert.match(main, /path="\/doctor-review"/)
  assert.match(hub, /to="\/doctor-review"/)
  assert.match(hub, /account\?\.role === 'dokter' \|\| account\?\.isOwner/)
})

test('review notes do not silently become patient truth', () => {
  assert.match(page, /not a clinical authorization decision/i)
  assert.match(page, /Avoid unnecessary patient identifiers/i)
  assert.doesNotMatch(page, /localStorage|sessionStorage/)
})
