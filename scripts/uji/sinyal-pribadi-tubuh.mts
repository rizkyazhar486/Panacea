import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SISTEM_UNTUK_METRIK, sistemUntukMetrik, sinyalPerSistem } from '../../src/lib/sinyalPribadiSistem.ts'
import { JENIS_LAB } from '../../src/lib/lab.ts'
import { labLogToLongitudinalEvents } from '../../src/lib/labLongitudinalBridge.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

// Body Exposure menampilkan data orang itu sendiri per sistem tubuh, dari status
// longitudinal kanonik. Peta = asosiasi edukatif, bukan lokasi kelainan.
for (const m of Object.keys(SISTEM_UNTUK_METRIK)) {
  assert.ok(JENIS_LAB.some((j) => `lab.${j.id}` === m), `peta menyebut jenis lab yang tidak ada: ${m}`)
}
// Sistem hematologi tidak dimodelkan: tes darah lengkap tidak boleh dipaksakan ke sistem lain.
for (const id of ['hb', 'mcv', 'rdw', 'ferritin', 'b12', 'vitd']) assert.equal(sistemUntukMetrik(`lab.${id}`), null, `lab.${id} dipaksakan ke sistem yang tidak mewakilinya`)
assert.equal(sistemUntukMetrik('lab.kreatinin'), 'urinary')
assert.equal(sistemUntukMetrik('store:self:systolic'.replace(/^/, '')), null) // kunci tak dikenal
assert.equal(sistemUntukMetrik('self.systolic'), 'cardiovascular')

const kini = '2026-09-25T06:00:00.000Z'
const consent = { granted: true, purposes: ['personal-visualization'] as const, grantedAt: '1970-01-01T00:00:00.000Z' }
const { events } = labLogToLongitudinalEvents({
  gdp: [{ id: 'g1', tanggal: '2026-04-01', nilai: 90 }, { id: 'g2', tanggal: '2026-09-20', nilai: 108 }],
  kreatinin: [{ id: 'k1', tanggal: '2026-09-20', nilai: 0.9 }],
  hb: [{ id: 'b1', tanggal: '2026-09-20', nilai: 14 }],
}, 'p1', { consent, receivedAt: kini, confidence: 1 })
let s = createLongitudinalPatientState('p1', kini)
for (const e of events) s = ingestLongitudinalEvent(s, e).state
const peta = sinyalPerSistem(s)
assert.deepEqual([...peta.keys()].sort(), ['endocrine', 'urinary'])
assert.equal(peta.get('endocrine')![0].delta, 18)
assert.equal(peta.get('endocrine')![0].method, 'patient-transcribed-lab-report')

const ui = readFileSync('src/components/SinyalPribadiDiTubuh.tsx', 'utf8')
assert.match(ui, /not where a problem is/, 'batas "bukan lokasi masalah" hilang dari tampilan')
assert.match(readFileSync('src/pages/BodyExposureOS.tsx', 'utf8'), /<SinyalPribadiDiTubuh selectedSystemId=\{selectedBodySystemId\} onSelectSystem=\{setSelectedBodySystemId\} \/>/, 'Body Exposure tidak lagi menampilkan data pribadi per sistem')
console.log('sinyal-pribadi-tubuh: data pribadi per sistem dari status kanonik, peta hanya jenis lab nyata, hematologi tidak dipaksakan')
