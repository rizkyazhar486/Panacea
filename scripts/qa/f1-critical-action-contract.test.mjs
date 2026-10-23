import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const main = read('scripts/qa/user-journey-e2e.mjs')
const staff = read('scripts/qa/user-journey-staff.mjs')
const workflow = read('.github/workflows/user-journey-acceptance.yml')

test('critical patient and clinician journeys exercise completed supported actions', () => {
  assert.match(main, /patient daily note persists after refresh/i)
  assert.match(main, /clinician reviews a real lab result through the UI/i)
  assert.match(main, /doctor.*logout.*revokes/i)
  assert.match(main, /owner.*logout.*revokes/i)
})

test('both staff viewports complete browser back and logout', () => {
  assert.match(staff, /staff browser back returns to the lab desk/i)
  assert.doesNotMatch(staff, /if \(vp === VIEWPORTS\[VIEWPORTS\.length - 1\]\) await step\(vp\.name, J, 'logout staf/)
})

test('F1 workflow watches clinician lab-review on push and runs on every PR to main', () => {
  assert.equal((workflow.match(/src\/pages\/clinical\/LabResultReview\.tsx/g) ?? []).length, 1, 'push paths must still include the real lab-review page')
  assert.match(workflow, /  pull_request:\n    branches: \[main\]\npermissions:/, 'all main PRs must run the workflow, without paths filter')
  assert.doesNotMatch(workflow, /src\/pages\/LabResultReview\.tsx/)
})
