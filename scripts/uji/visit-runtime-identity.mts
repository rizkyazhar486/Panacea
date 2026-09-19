import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  resolveVisitRuntimeIdentity,
} from '../../src/lib/visitRuntimeIdentity.ts'
import type { Account, Role } from '../../src/lib/types.ts'

function account(role: Role, email = ' Doctor@Example.COM '): Account {
  return {
    email,
    name: 'Authenticated actor',
    role,
    isSubscriber: false,
    loggedAt: '2026-09-19T01:55:00.000Z',
  }
}

const doctor = resolveVisitRuntimeIdentity(account('dokter'), 'patient-001')
assert.deepEqual(doctor, {
  ok: true,
  clinicianId: 'account:doctor@example.com',
  subjectId: 'patient-001',
  source: 'authenticated-account',
})

assert.deepEqual(resolveVisitRuntimeIdentity(null, 'patient-001'), {
  ok: false,
  reason: 'not-authenticated',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('pasien'), 'patient-001'), {
  ok: false,
  reason: 'clinician-role-required',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('owner'), 'patient-001'), {
  ok: false,
  reason: 'clinician-role-required',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('verifikator'), 'patient-001'), {
  ok: false,
  reason: 'clinician-role-required',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('dokter', '   '), 'patient-001'), {
  ok: false,
  reason: 'not-authenticated',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('dokter'), 'none'), {
  ok: false,
  reason: 'patient-required',
})
assert.deepEqual(resolveVisitRuntimeIdentity(account('dokter'), '   '), {
  ok: false,
  reason: 'patient-required',
})

const commandCenter = readFileSync(
  new URL('../../src/components/VisitCommandCenter.tsx', import.meta.url),
  'utf8',
)
assert.match(
  commandCenter,
  /resolveVisitRuntimeIdentity/,
  'VisitCommandCenter must consume the authenticated identity resolver',
)
assert.doesNotMatch(
  commandCenter,
  /local-clinician/,
  'VisitCommandCenter must not invent a clinician identity',
)
assert.doesNotMatch(
  commandCenter,
  /state\.settings\.doctorName\.trim\(\)\s*\|\|/,
  'Display settings must not be used as clinician identity fallback',
)

console.log(
  'Visit runtime identity verified: clinician identity is authenticated doctor state + active patient state, never room/display fallback.',
)
