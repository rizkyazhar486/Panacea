import assert from 'node:assert/strict'
import {
  WORKOUT_LOG_BACKUP_KEY,
  WORKOUT_LOG_KEY,
  repairWorkoutLogStorage,
  sanitizeWorkoutLog,
} from '../../src/lib/workoutLogGuard.ts'

class MemoryStorage {
  private data = new Map<string, string>()
  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) this.data.set(key, value)
  }
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

const valid = {
  id: 'log-1',
  exId: 'squat',
  date: '2026-09-08T06:00:00.000Z',
  sets: 3,
  reps: 8,
  weight: 80,
}

assert.deepEqual(sanitizeWorkoutLog([valid]), [valid])
assert.deepEqual(sanitizeWorkoutLog({ entries: [valid] }), [])
assert.deepEqual(sanitizeWorkoutLog([{ ...valid, reps: Number.NaN }]), [])
assert.deepEqual(sanitizeWorkoutLog([{ ...valid, date: 'not-a-date' }]), [])
assert.deepEqual(sanitizeWorkoutLog([{ ...valid, weight: -1 }]), [])

const malformed = new MemoryStorage({ [WORKOUT_LOG_KEY]: '{broken' })
const malformedResult = repairWorkoutLogStorage(malformed)
assert.equal(malformedResult.repaired, true)
assert.equal(malformedResult.reason, 'invalid-json')
assert.equal(malformed.getItem(WORKOUT_LOG_KEY), '[]')
assert.equal(malformed.getItem(WORKOUT_LOG_BACKUP_KEY), '{broken')

const wrongShapeRaw = JSON.stringify({ entries: [valid] })
const wrongShape = new MemoryStorage({ [WORKOUT_LOG_KEY]: wrongShapeRaw })
const wrongShapeResult = repairWorkoutLogStorage(wrongShape)
assert.equal(wrongShapeResult.reason, 'invalid-shape')
assert.equal(wrongShape.getItem(WORKOUT_LOG_KEY), '[]')
assert.equal(wrongShape.getItem(WORKOUT_LOG_BACKUP_KEY), wrongShapeRaw)

const mixedRaw = JSON.stringify([valid, { ...valid, id: 'bad', sets: 0 }])
const mixed = new MemoryStorage({ [WORKOUT_LOG_KEY]: mixedRaw })
const mixedResult = repairWorkoutLogStorage(mixed)
assert.equal(mixedResult.repaired, true)
assert.equal(mixedResult.reason, 'invalid-entry')
assert.equal(mixedResult.dropped, 1)
assert.deepEqual(JSON.parse(mixed.getItem(WORKOUT_LOG_KEY) ?? '[]'), [valid])
assert.equal(mixed.getItem(WORKOUT_LOG_BACKUP_KEY), mixedRaw)

// A prior backup is evidence and must not be overwritten by a later repair.
const priorBackup = new MemoryStorage({
  [WORKOUT_LOG_KEY]: '{again',
  [WORKOUT_LOG_BACKUP_KEY]: 'older-source-data',
})
repairWorkoutLogStorage(priorBackup)
assert.equal(priorBackup.getItem(WORKOUT_LOG_BACKUP_KEY), 'older-source-data')

const untouchedRaw = JSON.stringify([valid])
const untouched = new MemoryStorage({ [WORKOUT_LOG_KEY]: untouchedRaw })
const untouchedResult = repairWorkoutLogStorage(untouched)
assert.equal(untouchedResult.repaired, false)
assert.equal(untouched.getItem(WORKOUT_LOG_KEY), untouchedRaw)
assert.equal(untouched.getItem(WORKOUT_LOG_BACKUP_KEY), null)

console.log('Workout local-history schema and recovery guards verified.')
