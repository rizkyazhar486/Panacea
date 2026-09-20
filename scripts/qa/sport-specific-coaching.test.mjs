import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SPORT_COACHING_PLAYBOOKS,
  getSportCoachingPlaybook,
} from '../../src/lib/sportSpecificCoaching.ts'

test('requested sports have actionable playbooks', () => {
  for (const id of [
    'tennis','baseball','f1','motogp','running-road','road-cycling',
    'swimming-pool','triathlon','hyrox','scuba-diving','freediving','tactical-fitness',
  ]) {
    const p = getSportCoachingPlaybook(id)
    assert.ok(p, id)
    assert.ok(p.priorities.length >= 3, id)
    assert.ok(p.procedures.length >= 3, id)
    assert.ok(p.progression.length >= 1, id)
    assert.ok(p.track.length >= 4, id)
    assert.ok(p.reassess.length >= 1, id)
    assert.ok(p.safetyBoundary.length > 20, id)
  }
})

test('playbooks are broad but finite and reusable', () => {
  assert.ok(SPORT_COACHING_PLAYBOOKS.length >= 12)
})

test('tactical coaching boundary excludes operational harm', () => {
  const p = getSportCoachingPlaybook('tactical-fitness')
  assert.match(p?.safetyBoundary ?? '', /excludes weapons/i)
  assert.match(p?.safetyBoundary ?? '', /targeting/i)
  assert.match(p?.safetyBoundary ?? '', /mission planning/i)
})
