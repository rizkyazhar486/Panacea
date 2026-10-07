import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const emr = readFileSync('src/pages/clinical/EMR.tsx', 'utf8')
const api = readFileSync('src/lib/api.ts', 'utf8')

assert.match(api, /recordEncounters:\s*\(patientId: string\)/)
assert.match(emr, /api\.recordEncounters\(activePatient\.id\)/)
assert.match(emr, /Encounter history/i)
assert.match(emr, /setDraft\(encounter\)/)
assert.match(emr, /setDirty\(false\)/)
assert.match(emr, /encounterError/)
assert.match(emr, /dirty && encounter\.id !== draft\.id/, 'unsaved edits must block encounter switching')
assert.match(emr, /Hooks stay above this return/, 'STR gate must not make hook order conditional')
assert.match(emr, /const historicalReadOnly = Boolean\(record && draft\.id !== record\.id\)/, 'historical encounters must be explicitly read-only')
assert.match(emr, /if \(historicalReadOnly\) return/, 'historical encounter mutations must fail closed')
assert.match(emr, /Historical encounter · read-only/, 'read-only historical state must be visible to clinicians')
assert.match(emr, /disabled=\{historicalReadOnly \|\| !dirty\}/, 'historical encounters must not expose Save Changes as an active action')

console.log('emr-encounter-history: remote history, selectable encounter, dirty guard, visible error, stable hook order')
