// ENG-D8-03: catatan sumber primer per kelas lisensi; tiap aturan punya kontrol negatif yang hanya berbeda satu hal.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { checkLicenceRecords, classesOf } from './licence-primary-sources.mjs'

const doc = JSON.parse(fs.readFileSync('governance/LICENCE_PRIMARY_SOURCES.json', 'utf8'))
// string lisensi nyata seperti di metadata GLB (gabungan kelas dalam satu string ikut dihitung)
const USED = ['CC BY-SA 4.0', 'CC BY 4.0 (TotalSegmentator dataset, Wasserthal et al.)', 'CC0 1.0; combined atlas layer CC BY-SA 4.0',
  'CC BY-SA 2.1 JP (OBJ header); CC BY 4.0 (DBCLS licence page, 2026-10-03)', 'Apache-2.0; combined atlas layer CC BY-SA 4.0',
  'ICRP Publication 145 reference phantom data; redistribution in Panacea cleared by the project owner (2026-10-03, ICRP-derived meshes)',
  'ICRP Publication 156 reference phantom data; redistribution in Panacea cleared by the project owner (2026-10-03)']
const edit = (cls, patch) => ({ ...doc, records: doc.records.map((r) => (r.class === cls ? { ...r, ...patch } : r)) })
const problems = (d, used = USED) => checkLicenceRecords(used, d).problems

test('committed records cover every licence class in use, with no problems', () => {
  const r = checkLicenceRecords(USED, doc)
  assert.deepEqual(r.problems, [])
  assert.deepEqual(r.used, ['Apache-2.0', 'CC BY 4.0', 'CC BY-SA 2.1', 'CC BY-SA 4.0', 'CC0 1.0', 'ICRP Publication 145', 'ICRP Publication 156'])
  assert.deepEqual(classesOf('CC BY-SA 2.1 JP (OBJ header); CC BY 4.0'), ['CC BY 4.0', 'CC BY-SA 2.1'], 'one string can carry two classes')
})

test('a licence class without a primary-source record fails (criterion negative control)', () => {
  assert.deepEqual(problems({ ...doc, records: doc.records.filter((r) => r.class !== 'Apache-2.0') }), ['no primary-source record for licence class Apache-2.0'])
  assert.deepEqual(problems(doc, [...USED, 'MIT']), ['unclassified licence string: MIT'])
})

test('ICRP must stay an owner statement pointing to its external gate, never a verified licence', () => {
  assert.deepEqual(problems(edit('ICRP Publication 156', { kind: 'primary-licence-text' })), ['ICRP Publication 156: ICRP basis must be recorded as owner-statement, not a verified licence'])
  assert.deepEqual(problems(edit('ICRP Publication 145', { basis: 'Owner statement.' })), ['ICRP Publication 145: basis must state it is not a verified licence'])
  assert.deepEqual(problems(edit('ICRP Publication 145', { external_gate: undefined })), ['ICRP Publication 145: owner-statement must point to its external gate'])
  for (const r of doc.records.filter((x) => x.class.startsWith('ICRP'))) assert.equal(r.external_gate, 'EXT-D8-C')
})

test('each record must show the source was actually read; no record may claim legal clearance', () => {
  assert.deepEqual(problems(edit('CC BY 4.0', { http_status: 404 })), ['CC BY 4.0: primary source was not read (http_status 404)'])
  assert.deepEqual(problems(edit('CC BY 4.0', { primary_url: 'http://creativecommons.org/licenses/by/4.0/' })), ['CC BY 4.0: primary_url must be https'])
  assert.deepEqual(problems(edit('CC0 1.0', { content_sha256: 'abc' })), ['CC0 1.0: content_sha256 missing'])
  assert.deepEqual(problems(edit('CC0 1.0', { confirmed_text: ' ' })), ['CC0 1.0: confirmed_text missing'])
  assert.deepEqual(problems(edit('CC BY-SA 4.0', { note: 'Use is legally cleared.' })), ['CC BY-SA 4.0: record claims legal clearance, which no record may do'])
  assert.deepEqual(problems({ ...doc, retrieval: { ...doc.retrieval, retrieved_at: 'yesterday' } }), ['retrieval.retrieved_at must be an ISO UTC timestamp'])
  assert.deepEqual(problems(doc, USED.filter((u) => !u.startsWith('Apache'))), ['stale record for unused class Apache-2.0'])
})

test('real audit over every public GLB passes with the committed records (runs the criterion command in CI)', async () => {
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(process.execPath, ['scripts/qa/glb-provenance-audit.mjs'], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout.slice(-400) + r.stderr.slice(-400))
  assert.match(r.stdout, /licence classes with primary-source records: Apache-2\.0, CC BY 4\.0, CC BY-SA 2\.1, CC BY-SA 4\.0, CC0 1\.0, ICRP Publication 145, ICRP Publication 156/)
})
