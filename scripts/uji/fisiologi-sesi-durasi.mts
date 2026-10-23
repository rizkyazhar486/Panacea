import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { sesiFisiologi } = await import('../../src/pages/fitness/trainingPhysiologySessions.ts')
const w = (id: string, extra: Record<string, unknown> = {}) => ({ id, nama: 'Run', mulai: '2026-10-10T06:00:00Z', selesai: '2026-10-10T06:30:00Z', durasi: 1800, durationSource: 'source_field', hr: [], pemulihan: [], ...extra }) as any
const r = sesiFisiologi([w('a'), w('b', { durasi: 0, durationSource: 'unknown' }), w('c', { durasi: 0, durationSource: 'source_field', selesai: '2026-10-10T06:00:00Z' })])
assert.deepEqual(r.sesi.map((s) => [s.id, s.durasiDetik]), [['a', 1800], ['c', 0]], 'unknown dikecualikan, nol tercatat tetap 0')
assert.equal(r.dikecualikan, 1)
assert.deepEqual(sesiFisiologi([]), { sesi: [], dikecualikan: 0 })
const page = readFileSync('src/pages/fitness/TrainingPhysiology.tsx', 'utf8')
assert.match(page, /sesiFisiologi\(workouts\)/); assert.doesNotMatch(page, /durasiDetik: w\.durasi/)
assert.match(page, /dikecualikan > 0 \? ` \(\$\{dikecualikan\} excluded: duration unknown\)`/)
console.log('fisiologi-sesi-durasi: ok')
