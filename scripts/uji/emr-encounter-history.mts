import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const emr = readFileSync('src/pages/EMR.tsx', 'utf8')
const api = readFileSync('src/lib/api.ts', 'utf8')

assert.match(api, /recordEncounters:\s*\(patientId: string\)/, 'client tidak punya API daftar encounter')
assert.match(api, /\/api\/clinical\/records\//, 'client tidak memanggil endpoint encounter server')
assert.match(emr, /api\.recordEncounters\(activePatient\.id\)/, 'AI-EMR tidak memuat riwayat encounter pasien')
assert.match(emr, /Encounter history/i, 'AI-EMR tidak memberi akses ke riwayat encounter')
assert.match(emr, /setDraft\(encounter\)/, 'encounter lama tidak dapat dibuka untuk ditinjau')
assert.match(emr, /setDirty\(false\)/, 'membuka encounter lama langsung dianggap perubahan')
assert.match(emr, /encounter\.signedBy[^\n]*Signed|Signed[^\n]*encounter\.signedBy/s, 'status tanda tangan encounter tidak terlihat')
assert.match(emr, /encounterError/, 'kegagalan memuat encounter masih menjadi blank/silent failure')

console.log('emr-encounter-history: typed API, history list, selectable encounter, signature state, visible error')
