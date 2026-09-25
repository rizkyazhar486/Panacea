import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  ambilEncounter,
  daftarEncounter,
  simpanEncounter,
  type SimpananEncounter,
} from '../src/rekamEncounter.js'

const lama = {
  id: 'enc-1',
  patientId: 'p1',
  createdAt: '2026-09-25T09:00:00Z',
  updatedAt: '2026-09-25T09:30:00Z',
  signedBy: 'Dr. A',
  signedById: 'd1',
  signedAt: '2026-09-25T09:30:00Z',
}
const baru = {
  id: 'enc-2',
  patientId: 'p1',
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:00:00Z',
}

const legacy: SimpananEncounter = {
  records: { p1: lama },
}

// Migrasi lazy: record legacy tidak hilang ketika encounter kedua pertama kali disimpan.
simpanEncounter(legacy, 'p1', baru)
assert.deepEqual(
  daftarEncounter(legacy, 'p1').map((r) => r.id),
  ['enc-2', 'enc-1'],
  'encounter baru menimpa record lama',
)
assert.equal(legacy.records.p1.id, 'enc-2', 'pointer latest harus tetap kompatibel dengan UI lama')
assert.equal(ambilEncounter(legacy, 'p1', 'enc-1')?.signedBy, 'Dr. A', 'encounter lama tidak dapat dibaca')

// Menyunting encounter lama hanya mengganti encounter itu; encounter kedua tetap ada.
// Latest pointer mengikuti encounter yang baru saja disimpan agar UI lama melihat write terakhir.
const lamaDirevisi = { ...lama, updatedAt: '2026-09-26T11:00:00Z', prognosis: 'updated' }
simpanEncounter(legacy, 'p1', lamaDirevisi)
assert.equal(daftarEncounter(legacy, 'p1').length, 2, 'revisi encounter menggandakan data')
assert.equal(ambilEncounter(legacy, 'p1', 'enc-1')?.prognosis, 'updated')
assert.equal(ambilEncounter(legacy, 'p1', 'enc-2')?.id, 'enc-2')
assert.equal(legacy.records.p1.id, 'enc-1')

// Identitas encounter wajib stabil dan terikat pada pasien yang sama.
assert.throws(() => simpanEncounter(legacy, 'p1', { patientId: 'p1' }), /record\.id/)
assert.throws(() => simpanEncounter(legacy, 'p1', { id: 'enc-x', patientId: 'p2' }), /patientId/)

// Arsip versi bertanda tangan membawa recordId sehingga histori tidak tercampur.
simpanEncounter(legacy, 'p1', lamaDirevisi, { ...lama, diarsipkanPada: '2026-09-26T11:00:00Z' })
assert.equal(legacy.recordHistory?.p1?.at(-1)?.recordId, 'enc-1')

const indexSource = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.match(indexSource, /getRecord\(patientId, record\.id\)/, 'write route masih membandingkan encounter baru dengan latest record pasien')
assert.match(indexSource, /\/api\/clinical\/records\/:patientId/, 'endpoint daftar encounter tidak tersedia')
assert.match(indexSource, /getRecordHistory\(patientId, recordId\)/, 'history belum dapat dibatasi per encounter')
assert.match(indexSource, /record_patient_mismatch/, 'server belum menolak record yang mengaku milik pasien lain')

console.log('rekamEncounter: multi-encounter per pasien, migrasi legacy, exact-id update, latest pointer, scoped archive')
