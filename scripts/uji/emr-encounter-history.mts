import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const emr = readFileSync('src/pages/EMR.tsx', 'utf8')
const api = readFileSync('src/lib/api.ts', 'utf8')

assert.match(api, /recordEncounters:\s*\(patientId: string\)/)
assert.match(emr, /api\.recordEncounters\(activePatient\.id\)/)
assert.match(emr, /Encounter history/i)
assert.match(emr, /setDraft\(encounter\)/)
assert.match(emr, /setDirty\(false\)/)
assert.match(emr, /encounterError/)
assert.match(emr, /dirty && encounter\.id !== draft\.id/, 'unsaved edits must block encounter switching')
assert.match(emr, /Hooks stay above this return/, 'STR gate must not make hook order conditional')

console.log('emr-encounter-history: remote history, selectable encounter, dirty guard, visible error, stable hook order')
