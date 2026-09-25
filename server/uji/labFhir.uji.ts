import assert from 'node:assert/strict'
import { logKeBundelFhir, kodeUntuk, buatIzin, izinBerlaku, SISTEM_ASAL } from '../src/labFhir.js'

const kini = new Date('2026-09-25T06:00:00Z')
const b = logKeBundelFhir({
  gdp: [{ id: 'g1', tanggal: '2026-09-20', nilai: 92 }],
  crp: [{ id: 'c1', tanggal: '2026-09-20', nilai: 0.8 }],
  wbc: [{ id: 'w1', tanggal: '2026-09-20', nilai: 6.1 }],
  misteri: [{ id: 'm1', tanggal: '2026-09-20', nilai: 1 }],
}, 'Patient/p-a', kini.toISOString()) as any
assert.equal(b.resourceType, 'Bundle'); assert.equal(b.total, 3, 'jenis tak dikenal ikut diekspor')
const obs = (id: string) => b.entry.find((e: any) => e.resource.id === id).resource
assert.deepEqual(obs('lab-g1').code.coding[0], { system: 'http://loinc.org', code: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma' })
assert.equal(obs('lab-g1').valueQuantity.code, 'mg/dL')
assert.equal(obs('lab-g1').effectiveDateTime, '2026-09-20')
// hs-CRP tidak boleh menyamar sebagai CRP 1988-5.
assert.equal(obs('lab-c1').code.coding, undefined, 'hs-CRP diberi kode CRP biasa')
assert.equal(obs('lab-c1').code.text, 'hs-CRP')
assert.equal(obs('lab-w1').valueQuantity.code, '10*3/uL')
for (const e of b.entry) {
  assert.equal(e.resource.meta.tag[0].system, SISTEM_ASAL); assert.equal(e.resource.meta.tag[0].code, 'patient-transcribed', 'asal data (disalin pasien) hilang')
  assert.equal(e.resource.subject.reference, 'Patient/p-a')
}
assert.equal(kodeUntuk('crp'), null); assert.equal(kodeUntuk('apob'), null); assert.ok(kodeUntuk('hba1c'))

// Izin
assert.throws(() => buatIzin('a@x.test', 'bukan-email', 30, kini))
assert.throws(() => buatIzin('a@x.test', 'a@x.test', 30, kini), 'berbagi ke diri sendiri')
assert.throws(() => buatIzin('a@x.test', 'dr@x.test', 0, kini)); assert.throws(() => buatIzin('a@x.test', 'dr@x.test', 91, kini)); assert.throws(() => buatIzin('a@x.test', 'dr@x.test', 1.5, kini))
const iz = buatIzin('a@x.test', ' DR@X.test ', 30, kini)
assert.equal(iz.dokterEmail, 'dr@x.test'); assert.equal(iz.id.length, 24)
assert.ok(izinBerlaku(iz, 'dr@x.test', kini))
assert.ok(!izinBerlaku(iz, 'lain@x.test', kini), 'dokter lain membaca lewat izin orang lain')
assert.ok(!izinBerlaku(iz, 'dr@x.test', new Date(kini.getTime() + 31 * 864e5)), 'izin kedaluwarsa masih berlaku')
assert.ok(!izinBerlaku({ ...iz, dicabut: kini.toISOString() }, 'dr@x.test', kini), 'izin dicabut masih berlaku')
assert.ok(!izinBerlaku(undefined, 'dr@x.test', kini))
console.log('labFhir: LOINC hanya dari registry terverifikasi (hs-CRP tidak dikodekan), asal disalin-pasien ditandai, izin terikat dokter/waktu/pencabutan')
