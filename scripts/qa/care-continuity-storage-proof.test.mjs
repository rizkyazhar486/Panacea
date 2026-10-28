import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'

const { deriveCareContinuityState } = await loadTypeScriptSubject(
  fileURLToPath(new URL('../../src/domains/clinical-operations/model/careContinuityProjection.ts', import.meta.url)),
)

const encounter = {
  patientId: 'synthetic-storage-patient',
  evaluatedAt: '2026-10-27T08:00:00.000Z',
}
const acknowledgedResult = {
  id: 'synthetic-storage-result',
  takenAt: '2026-10-27T07:00:00.000Z',
  category: 'Lab',
  name: 'Synthetic transport fixture',
  value: 'fixture',
}

for (const connectivity of ['online', 'degraded', 'offline']) {
  test(`${connectivity}: missing storage evidence cannot authorize offline continuation`, () => {
    for (const evidence of [{}, { secureLocalStorageAvailable: undefined }, { secureLocalStorageAvailable: null }]) {
      for (const supportiveResults of [[], [acknowledgedResult]]) {
        const { episodeResilience } = deriveCareContinuityState({
          ...encounter, connectivity, supportiveResults, ...evidence,
        })
        assert.equal(episodeResilience.safeToContinueOffline, false)
        assert.equal(episodeResilience.state, connectivity === 'offline' ? 'blocked' : connectivity === 'degraded' ? 'degraded' : 'ready')
        if (connectivity === 'offline') assert.match(episodeResilience.nextOperationalAction, /secure durable offline storage/)
      }
    }
  })

  test(`${connectivity}: explicit secure storage preserves empty and acknowledged transport behavior`, () => {
    for (const supportiveResults of [[], [acknowledgedResult]]) {
      const { episodeResilience } = deriveCareContinuityState({
        ...encounter, connectivity, supportiveResults, secureLocalStorageAvailable: true,
      })
      assert.equal(episodeResilience.safeToContinueOffline, true)
      assert.equal(episodeResilience.state, connectivity === 'online' ? 'ready' : 'degraded')
      assert.equal(episodeResilience.acknowledgedCount, supportiveResults.length)
    }
  })

  test(`${connectivity}: explicit unavailable storage remains unsafe offline`, () => {
    const { episodeResilience } = deriveCareContinuityState({
      ...encounter, connectivity, secureLocalStorageAvailable: false,
    })
    assert.equal(episodeResilience.safeToContinueOffline, false)
    assert.equal(episodeResilience.state, connectivity === 'offline' ? 'blocked' : connectivity === 'degraded' ? 'degraded' : 'ready')
  })
}

test('malformed runtime storage claims are rejected instead of becoming proof', () => {
  for (const secureLocalStorageAvailable of ['true', 'false', 0, 1, {}, []]) {
    assert.throws(() => deriveCareContinuityState({ ...encounter, secureLocalStorageAvailable }), /secureLocalStorageAvailable must be a boolean/)
  }
})
