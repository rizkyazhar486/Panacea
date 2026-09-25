import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { labLogToLongitudinalEvents } from '../../src/lib/labLongitudinalBridge.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent, canEnterClinicalRecord, canEnterAiContext, validateLongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'
import { perubahanTeratas, timelineHarian } from '../../src/lib/perubahanLongitudinal.ts'

// Hasil lab kini masuk ke status longitudinal kanonik (dulu: pulau terpisah),
// dan "What changed" membacanya dari status itu — satu pasien, satu sumber.
const kini = '2026-09-25T06:00:00.000Z'
const consent = { granted: true, purposes: ['personal-visualization'] as const, grantedAt: '1970-01-01T00:00:00.000Z' }
const lab = {
  gdp: [{ id: 'g1', tanggal: '2026-04-01', nilai: 90 }, { id: 'g2', tanggal: '2026-09-20', nilai: 108 }],
  hba1c: [{ id: 'h1', tanggal: '2026-04-01', nilai: 5.4 }, { id: 'h2', tanggal: '2026-09-20', nilai: 5.5 }],
  misteri: [{ id: 'x', tanggal: '2026-09-20', nilai: 1 }],
  crp: [{ id: 'c9', tanggal: '2026-09-27', nilai: 1 }],
}
const { events, skipped } = labLogToLongitudinalEvents(lab, 'p1', { consent, receivedAt: kini, confidence: 1 })
assert.equal(events.length, 4)
assert.deepEqual(skipped.map((s) => s.reason).sort(), ['future-date', 'unknown-lab-type'], 'jenis tak dikenal atau tanggal masa depan tidak dilewati')
for (const e of events) {
  validateLongitudinalEvent(e)
  assert.equal(e.domain, 'lab'); assert.equal(e.review.state, 'pending', 'lab salinan pasien ditandai sudah ditinjau')
  assert.equal(e.provenance.method, 'patient-transcribed-lab-report')
  assert.ok(e.tags?.includes('patient-transcribed'))
  // Hanya persetujuan visualisasi pribadi: tidak masuk rekam klinis maupun konteks AI.
  assert.equal(canEnterClinicalRecord(e, Date.parse(kini)), false, 'lab salinan pasien masuk rekam klinis tanpa tinjauan/izin')
  assert.equal(canEnterAiContext(e, Date.parse(kini)), false, 'lab masuk konteks AI tanpa izin tujuan ai-context')
}
assert.equal(events.find((e) => e.metric === 'lab.gdp')!.unit, 'mg/dL')

let s = createLongitudinalPatientState('p1', kini)
for (const e of events) s = ingestLongitudinalEvent(s, e).state
const top = perubahanTeratas(s, new Date(kini))
assert.equal(top[0].m, 'lab.gdp', 'perubahan terbesar (glukosa +20%) tidak di urutan pertama')
assert.equal(Math.round(top[0].t.relativeDelta! * 100), 20)
assert.equal(top.length, 2)

// Timeline: event yang sama, dikelompokkan per tanggal, terbaru di atas, asal terlihat.
{
  const tl = timelineHarian(s)
  assert.deepEqual(tl.map((h) => h.tanggal), ['2026-09-20', '2026-04-01'], 'timeline tidak terurut terbaru di atas')
  assert.equal(tl[0].butir.length, 2)
  assert.ok(tl[0].butir.every((b) => b.asal === 'from your lab report'), 'asal data hilang dari timeline')
  assert.equal(timelineHarian(s, 1).length, 1, 'batas jumlah hari timeline diabaikan')
  assert.match(readFileSync('src/components/ApaYangBerubah.tsx', 'utf8'), /timelineHarian\(state, 30, labels\)/, 'timeline tidak lagi dibaca dari status kanonik')
}

const ui = readFileSync('src/lib/useLongitudinalState.ts', 'utf8')
assert.match(ui, /purposes: \['personal-visualization'\]/, 'hook mengasumsikan izin klinis/AI yang tidak pernah diberikan')
assert.match(ui, /labLogToLongitudinalEvents\(/); assert.match(ui, /syncProductionAppState\(/)
assert.match(readFileSync('src/pages/PusatTubuh.tsx', 'utf8'), /<ApaYangBerubah \/>/, 'konsumen runtime status longitudinal hilang dari halaman')
console.log('lab-status-longitudinal: lab masuk status kanonik (tinjauan pending, hanya visualisasi pribadi), What changed membaca status itu')
