// withDeadline: hasil tepat waktu lolos, janji yang menggantung ditolak dengan DeadlineExceeded, batas tak sah ditolak.
import assert from 'node:assert/strict'
import { withDeadline, DeadlineExceeded, type DeadlineTimers } from '../../src/shared/kernel/withDeadline.ts'

function fakeTimers() {
  const pending = new Map<number, () => void>(); let next = 1; const cleared: number[] = []
  const timers: DeadlineTimers = {
    set: (fn) => { const id = next++; pending.set(id, fn); return id },
    clear: (h) => { cleared.push(h as number); pending.delete(h as number) },
  }
  return { timers, fire: () => [...pending.values()].forEach((f) => f()), pending, cleared }
}

// Positif: selesai sebelum batas → nilai diteruskan dan pewaktu dibersihkan.
{ const f = fakeTimers(); assert.equal(await withDeadline(Promise.resolve('ok'), 1000, f.timers), 'ok'); assert.equal(f.pending.size, 0); assert.equal(f.cleared.length, 1) }
// Positif: galat asli diteruskan apa adanya (bukan diganti DeadlineExceeded).
{ const f = fakeTimers(); await assert.rejects(withDeadline(Promise.reject(new Error('boom')), 1000, f.timers), /boom/); assert.equal(f.pending.size, 0) }
// Negatif: janji menggantung → DeadlineExceeded setelah pewaktu berbunyi.
{ const f = fakeTimers(); const p = withDeadline(new Promise<never>(() => {}), 500, f.timers); f.fire()
  await assert.rejects(p, (e) => e instanceof DeadlineExceeded && e.ms === 500) }
// Berpasangan: janji yang sama tetapi selesai lebih dulu tidak ditolak.
{ const f = fakeTimers(); let ok!: (v: number) => void; const p = withDeadline(new Promise<number>((r) => { ok = r }), 500, f.timers); ok(7); assert.equal(await p, 7) }
// Batas: nol, negatif, NaN, Infinity ditolak tanpa memasang pewaktu.
for (const bad of [0, -1, NaN, Infinity]) { const f = fakeTimers(); await assert.rejects(withDeadline(Promise.resolve(1), bad, f.timers), RangeError); assert.equal(f.pending.size, 0) }
console.log('with-deadline: ok')
