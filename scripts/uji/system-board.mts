import assert from 'node:assert/strict'
import { buildSystemBoard, formatAge, parseSystemParam, RECENT_DAYS } from '../../src/domains/body-exposure/engine/systemBoard.ts'
import type { SinyalSistem } from '../../src/lib/sinyalPribadiSistem.ts'

const NOW = new Date('2026-11-16T00:00:00.000Z')
const sig = (metric: string, recordedAt: string, value = 1): SinyalSistem => ({ metric, value, recordedAt, count: 1, delta: null })
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString()

// positif: urutan kanonik saat kosong, 11 sistem, semuanya 'none' tanpa tebakan
const kosong = buildSystemBoard(new Map(), NOW)
assert.equal(kosong.length, 11)
assert.ok(kosong.every((r) => r.recency === 'none' && r.headline === null && r.ageDays === null && r.signalCount === 0))
assert.equal(kosong[0].id, 'cardiovascular')

// positif: sistem ber-data naik ke atas, terbaru dulu; headline = sinyal terbaru walau urutan input terbalik
const peta = new Map([
  ['respiratory', [sig('spo2', daysAgo(2), 97)]],
  ['urinary', [sig('lab.egfr', daysAgo(40), 90), sig('lab.kreatinin', daysAgo(10), 1)]],
] as const)
const papan = buildSystemBoard(peta as never, NOW)
assert.deepEqual(papan.slice(0, 2).map((r) => r.id), ['respiratory', 'urinary'])
assert.equal(papan[1].headline?.metric, 'lab.kreatinin')
assert.equal(papan[1].signalCount, 2)
assert.equal(papan[0].recency, 'recent')

// batas: tepat 30 hari = recent, 31 hari = older (berpasangan: hanya umur yang berbeda)
const batas = (d: number) => buildSystemBoard(new Map([['digestive', [sig('lab.sgot', daysAgo(d))]]]) as never, NOW)[0]
assert.equal(RECENT_DAYS, 30)
assert.equal(batas(30).recency, 'recent')
assert.equal(batas(31).recency, 'older')
assert.equal(batas(0).recency, 'recent')

// negatif fail-closed: tanggal rusak dan tanggal di masa depan → 'unknown', bukan 'recent'
assert.equal(buildSystemBoard(new Map([['digestive', [sig('lab.sgot', 'bukan-tanggal')]]]) as never, NOW)[0].recency, 'unknown')
assert.equal(buildSystemBoard(new Map([['digestive', [sig('lab.sgot', daysAgo(-1))]]]) as never, NOW)[0].recency, 'unknown')
assert.equal(buildSystemBoard(new Map([['digestive', [sig('lab.sgot', daysAgo(1))]]]) as never, new Date('x'))[0].recency, 'unknown')

// determinisme + tanpa efek samping pada masukan
const masuk = new Map([['urinary', [sig('a', daysAgo(40)), sig('b', daysAgo(10))]]]) as never as Map<never, SinyalSistem[]>
const before = JSON.stringify([...masuk.entries()])
assert.deepEqual(buildSystemBoard(masuk as never, NOW), buildSystemBoard(masuk as never, NOW))
assert.equal(JSON.stringify([...masuk.entries()]), before)

// parseSystemParam: positif + negatif berpasangan
assert.equal(parseSystemParam('cardiovascular'), 'cardiovascular')
assert.equal(parseSystemParam('lymphatic-immune'), 'lymphatic-immune')
for (const buruk of ['Cardiovascular', '', ' cardiovascular', '__proto__', 'constructor', 'toString', 'heart', null, undefined]) {
  assert.equal(parseSystemParam(buruk as never), null, `menolak ${String(buruk)}`)
}
// formatAge: positif + negatif fail-closed
assert.equal(formatAge(0), 'today'); assert.equal(formatAge(1), 'yesterday'); assert.equal(formatAge(2), '2 days ago'); assert.equal(formatAge(45), '45 days ago')
for (const buruk of [null, -1, 1.5, Number.NaN]) assert.equal(formatAge(buruk as never), 'date unreadable', `menolak ${String(buruk)}`)
console.log('system-board: OK')
