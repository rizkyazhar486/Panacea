import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { clearWorkouts, getWorkouts, mergeWorkouts } from '../../src/lib/workoutStore.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'

const memory = new Map<string, string>()
const broadcastTypes: string[] = []

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)) },
    removeItem: (key: string) => { memory.delete(key) },
  },
})

Object.defineProperty(globalThis, 'BroadcastChannel', {
  configurable: true,
  value: undefined,
})

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    dispatchEvent: (event: Event) => { broadcastTypes.push(event.type); return true },
  },
})

memory.set('pmd_workouts_v1', JSON.stringify([
  {
    id: 'legacy-no-minute-proof',
    nama: 'Run',
    mulai: '2026-09-01T00:00:00.000Z',
    selesai: 'broken-end',
    durasi: 1800,
    hr: [],
    pemulihan: [{ t: 120, bpm: 100 }],
    hrr1: 99,
  },
  {
    id: 'validated-hrr',
    nama: 'Run',
    mulai: '2026-09-02T00:00:00.000Z',
    selesai: '2026-09-02T00:30:00.000Z',
    durasi: 1800,
    hr: [],
    pemulihan: [{ t: 60, bpm: 105 }],
    hrr1: 35,
  },
]))

const loaded = getWorkouts()
const legacy = loaded.find((w) => w.id === 'legacy-no-minute-proof')!
const valid = loaded.find((w) => w.id === 'validated-hrr')!
assert.equal(legacy.selesai, legacy.mulai, 'invalid cached end time must be neutralized without inventing duration')
assert.equal(legacy.hrr1, undefined, 'cached HRR1 without a 45–75s recovery sample must be removed')
assert.equal(valid.hrr1, 35, 'HRR1 with near-minute recovery provenance must be retained')

const incoming: ImportedWorkout = {
  id: 'new-session',
  nama: 'Run',
  mulai: '2026-09-03T00:00:00.000Z',
  selesai: '2026-09-03T00:30:00.000Z',
  durasi: 1800,
  hr: [],
  pemulihan: [],
}
assert.equal(mergeWorkouts([incoming]), 1)
assert.equal(broadcastTypes.filter((type) => type === 'panacea:health-updated').length, 1, 'workout merge must preserve one same-tab legacy health update')
assert.equal(broadcastTypes.filter((type) => type === 'panacea:data-updated').length, 1, 'workout merge must also publish one structured data update')
assert.ok(JSON.parse(memory.get('pmd_workouts_v1') ?? '[]').some((w: { id?: string }) => w.id === 'new-session'))

clearWorkouts()
assert.equal(broadcastTypes.filter((type) => type === 'panacea:health-updated').length, 2, 'clearing training data must broadcast one additional legacy refresh')
assert.equal(broadcastTypes.filter((type) => type === 'panacea:data-updated').length, 2, 'clearing training data must broadcast one additional structured refresh')
assert.deepEqual(getWorkouts(), [])

const component = readFileSync('src/components/CatatanLatihan.tsx', 'utf8')
for (const eventName of ['panacea:health-updated', 'storage', 'focus']) {
  assert.match(component, new RegExp(`addEventListener\\('${eventName}'`), `Today Training must subscribe to ${eventName}`)
  assert.match(component, new RegExp(`removeEventListener\\('${eventName}'`), `Today Training must clean up ${eventName}`)
}
assert.match(component, /<TrainingAnalyticsPanel untukKemarin=\{untukKemarin\} versi=\{versi\} \/>/)

console.log('Workout cache provenance and legacy + structured Training refresh events are verified.')