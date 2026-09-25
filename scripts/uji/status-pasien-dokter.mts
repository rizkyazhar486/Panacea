import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { statusPasienUntukDokter, logDariBundel } from '../../src/lib/statusPasienDokter.ts'
import { timelineHarian } from '../../src/lib/perubahanLongitudinal.ts'
import { canEnterClinicalRecord } from '../../src/lib/panaceaLongitudinalState.ts'
import { logKeBundelFhir } from '../../server/src/labFhir.ts'
import { susunRencana, susunLaporan } from '../../server/src/carePlan.ts'

// Dokter melihat status kanonik YANG SAMA dengan pasien, disusun dari sumber
// server lewat jembatan yang sama — bukan model pasien kedua di server.
const kini = new Date('2026-09-25T06:00:00Z')
const bundel = logKeBundelFhir({ gdp: [{ id: 'gdp-1', tanggal: '2026-09-20', nilai: 108, rujukanBawah: 74, rujukanAtas: 106 }] }, 'Patient/uA', kini.toISOString()) as { entry: { resource: never }[] }
assert.deepEqual(logDariBundel(bundel.entry), { gdp: [{ id: 'gdp-1', tanggal: '2026-09-20', nilai: 108, rujukanBawah: 74, rujukanAtas: 106 }] }, 'bundel FHIR server tidak kembali utuh menjadi log lab')
const plan = susunRencana({ diagnosisRefs: [{ code: 'HT', display: 'Hypertension' }], questions: [{ id: 'q1', prompt: 'Did you feel dizzy today?', kind: 'boolean', required: true }] }, 'uA', 'uD', kini)
const lap = susunLaporan(plan, { scheduledFor: '2026-09-25', answers: [{ questionId: 'q1', value: true }] }, kini)
const izin = { dibuat: '2026-09-25T00:00:00.000Z', berakhir: '2026-12-25T00:00:00.000Z' }
const { state, labels } = statusPasienUntukDokter(bundel.entry, { plan: plan as never, reports: [lap as never] },
  [{ id: 'rv', tes: 'gdp', dokterEmail: 'dr@x.test', ditinjau: '2026-09-25T05:00:00.000Z', catatan: 'Repeat.' }], izin, kini.toISOString())
const teks = timelineHarian(state, 30, labels, 'dokter').flatMap((h) => h.butir.map((b) => `${h.tanggal}|${b.label}|${b.asal}`))
assert.deepEqual(teks.sort(), [
  '2026-09-20|Fasting glucose|patient-transcribed lab report',
  '2026-09-25|Did you feel dizzy today?|patient daily check-in',
  '2026-09-25|Doctor review · Fasting glucose|clinician review',
].sort(), `timeline dokter berbeda: ${teks.join(' ; ')}`)
// Izin klinis berakhir bersama izin berbagi; lab salinan pasien tetap butuh tinjauan.
const lab = Object.values(state.eventsById).find((e) => e.domain === 'lab')!
assert.equal(lab.consent.expiresAt, izin.berakhir, 'izin klinis tidak berakhir bersama izin berbagi pasien')
assert.equal(canEnterClinicalRecord(lab, kini.getTime()), false, 'lab salinan pasien masuk rekam klinis tanpa tinjauan')
assert.match(readFileSync('src/components/LabPasienUntukDokter.tsx', 'utf8'), /timelineHarian\(state, 30, labels, 'dokter'\)/)
assert.match(readFileSync('server/src/index.ts', 'utf8'), /dibuat: izin\.dibuat, berakhir: izin\.berakhir/)
console.log('status-pasien-dokter: dokter melihat timeline kanonik yang sama dari sumber server, izin berakhir bersama izin berbagi')
