import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  effectiveRoleForRequest,
  hasVerifiedProfessionalRole,
  isConfiguredOwner,
  roleForLogin,
  selfServiceRole,
} from '../src/accessControl'
import type { User } from '../src/store'

function user(role: User['role'], email = `${role}@example.test`): User {
  return { id: `u-${role}`, email, name: role, role, createdAt: '2026-01-01T00:00:00.000Z' }
}

const ownerEmail = 'owner@example.test'
assert.equal(selfServiceRole('pasien'), 'pasien')
assert.equal(selfServiceRole('dokter'), 'dokter')
assert.equal(selfServiceRole('kontributor'), 'kontributor')
assert.equal(selfServiceRole('verifikator'), 'verifikator')
assert.equal(selfServiceRole('admin'), 'pasien')
assert.equal(selfServiceRole('owner'), 'pasien')
assert.equal(selfServiceRole('anything-else'), 'pasien')

const existingDoctor = user('dokter')
assert.equal(roleForLogin(existingDoctor, 'owner'), 'dokter')
assert.equal(roleForLogin(existingDoctor, 'pasien'), 'dokter')
assert.equal(roleForLogin(undefined, 'owner'), 'pasien')
assert.equal(isConfiguredOwner(user('pasien', 'OWNER@example.test'), ownerEmail), true)
assert.equal(isConfiguredOwner(user('owner', 'attacker@example.test'), ownerEmail), false)

assert.equal(hasVerifiedProfessionalRole(user('dokter'), undefined, 'dokter'), false)
assert.equal(hasVerifiedProfessionalRole(user('dokter'), { strStatus: 'pending' }, 'dokter'), false)
assert.equal(hasVerifiedProfessionalRole(user('dokter'), { strStatus: 'verified' }, 'dokter'), true)
assert.equal(hasVerifiedProfessionalRole(user('verifikator'), { strStatus: 'verified' }, 'verifikator'), true)

assert.equal(effectiveRoleForRequest(user('dokter'), undefined, ownerEmail), 'pasien')
assert.equal(effectiveRoleForRequest(user('dokter'), { strStatus: 'pending' }, ownerEmail), 'pasien')
assert.equal(effectiveRoleForRequest(user('dokter'), { strStatus: 'verified' }, ownerEmail), 'dokter')
assert.equal(effectiveRoleForRequest(user('verifikator'), undefined, ownerEmail), 'pasien')
assert.equal(effectiveRoleForRequest(user('verifikator'), { strStatus: 'verified' }, ownerEmail), 'verifikator')
assert.equal(effectiveRoleForRequest(user('dokter'), undefined, ownerEmail, true), 'dokter')
assert.equal(effectiveRoleForRequest(user('verifikator'), undefined, ownerEmail, true), 'verifikator')
assert.equal(effectiveRoleForRequest(user('owner', 'attacker@example.test'), undefined, ownerEmail), 'pasien')
assert.equal(effectiveRoleForRequest(user('admin', 'attacker@example.test'), undefined, ownerEmail), 'pasien')
assert.equal(effectiveRoleForRequest(user('pasien', ownerEmail), undefined, ownerEmail), 'owner')
assert.equal(effectiveRoleForRequest(user('owner', ownerEmail), undefined, ownerEmail), 'owner')

const authSource = readFileSync('src/auth.ts', 'utf8')
const otpSource = readFileSync('src/otp.ts', 'utf8')
assert.match(authSource, /ALLOW_DEV_LOGIN === 'true'/)
assert.match(authSource, /NODE_ENV !== 'production'/)
assert.match(authSource, /effectiveRoleForRequest/)
assert.match(authSource, /req\.method === 'POST' && req\.path === '\/api\/applications'/)
assert.match(authSource, /const SESSION_COOKIE_ATTRIBUTES = \{/)
assert.match(authSource, /path: '\/'/)
assert.match(authSource, /res\.cookie\(COOKIE, token, \{\s*\.\.\.SESSION_COOKIE_ATTRIBUTES,/)
assert.match(authSource, /res\.clearCookie\(COOKIE, SESSION_COOKIE_ATTRIBUTES\)/)
assert.match(otpSource, /randomInt\(100000, 1_000_000\)/)
assert.doesNotMatch(otpSource, /Math\.random\(/)
assert.match(otpSource, /roleForLogin\(existing, b\.role\)/)
assert.match(otpSource, /emailCodes\.delete\(email\)/)

console.log('Authentication privilege, session-cookie, and OTP security boundaries verified.')
