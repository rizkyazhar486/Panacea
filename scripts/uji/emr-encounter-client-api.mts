import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const api = readFileSync('src/lib/api.ts', 'utf8')
const kunjungan = readFileSync('src/components/clinical/KunjunganEmr.tsx', 'utf8')

assert.match(api, /recordEncounters:\s*\(patientId: string\)/, 'typed client API daftar encounter hilang')
assert.match(api, /\/api\/clinical\/records\//, 'client tidak menunjuk endpoint multi-encounter server')
assert.match(api, /recordHistory:\s*\(patientId: string, recordId\?: string\)/, 'typed client API scoped history hilang')
assert.match(api, /recordId=\$\{encodeURIComponent\(recordId\)\}/, 'recordId history tidak di-encode')
assert.match(api, /recordEncounters\?: Record<string, EMRRecord\[\]>/, 'ClinicalData tidak membawa multi-encounter payload')
assert.match(api, /recordHistory\?: Record<string, EMRRecord\[\]>/, 'ClinicalData tidak membawa signed-version history')
assert.match(api, /encounters:\s*\(patientId: string\)/, 'closed-encounter API lama terhapus')
assert.match(kunjungan, /api\.encounters\(pid\)/, 'KunjunganEmr existing closed-encounter flow terputus')

console.log('emr-encounter-client-api: typed multi-encounter/history bridge added without deleting closed-encounter UI')
