import assert from 'node:assert/strict'
import { decideAccess, buildAuditRecord, guardCapability, type Principal, type CapabilityPolicy, type AuditRecord } from '../src/shared/restrictedCapability.js'

const now = new Date('2026-10-02T10:00:00Z')
const policy: CapabilityPolicy = { capability: 'cap-x', allowedRoles: ['dokter', 'verifikator'], requireStr: true, requireSip: true }
const ok: Principal = { userId: 'u1', role: 'dokter', str: { status: 'verified', expiresOn: '2027-01-01' }, sip: { status: 'verified', expiresOn: '2027-01-01' } }
const deny = (p: Principal | null | undefined, pol = policy) => decideAccess(p, pol, now)

// Positif
assert.deepEqual(deny(ok), { allow: true }, 'verified doctor with valid STR and SIP is allowed')
assert.deepEqual(deny({ ...ok, role: 'verifikator' }), { allow: true }, 'second allowed role is allowed')
assert.deepEqual(deny({ ...ok, sip: undefined }, { ...policy, requireSip: false }), { allow: true }, 'SIP is not demanded when the policy does not require it')

// Negatif berpasangan: hanya satu kondisi berbeda dari `ok`
assert.deepEqual(deny(null), { allow: false, reason: 'no-identity' })
assert.deepEqual(deny({ ...ok, userId: '  ' }), { allow: false, reason: 'no-identity' })
assert.deepEqual(deny({ ...ok, role: 'pasien' }), { allow: false, reason: 'role-not-allowed' }, 'patient role is refused')
assert.deepEqual(deny({ ...ok, role: 'owner' }), { allow: false, reason: 'role-not-allowed' }, 'owner is not implicitly allowed')
for (const status of ['unverified', 'pending', 'revoked'] as const) {
  assert.deepEqual(deny({ ...ok, str: { status, expiresOn: '2027-01-01' } }), { allow: false, reason: 'str-not-verified' }, `STR ${status} refused`)
  assert.deepEqual(deny({ ...ok, sip: { status, expiresOn: '2027-01-01' } }), { allow: false, reason: 'sip-not-verified' }, `SIP ${status} refused`)
}
assert.deepEqual(deny({ ...ok, str: undefined }), { allow: false, reason: 'str-not-verified' }, 'missing STR refused')
assert.deepEqual(deny({ ...ok, sip: undefined }), { allow: false, reason: 'sip-not-verified' }, 'missing SIP refused')

// Batas tanggal
assert.deepEqual(deny({ ...ok, sip: { status: 'verified', expiresOn: '2026-10-02' } }), { allow: true }, 'licence is valid on its last day')
assert.deepEqual(deny({ ...ok, sip: { status: 'verified', expiresOn: '2026-10-01' } }), { allow: false, reason: 'sip-expired' }, 'licence expired one day ago is refused')
assert.deepEqual(deny({ ...ok, str: { status: 'verified', expiresOn: '2026-10-01' } }), { allow: false, reason: 'str-expired' })
assert.deepEqual(deny({ ...ok, sip: { status: 'verified' } }), { allow: false, reason: 'sip-expired' }, 'verified without expiry is not trusted')
assert.deepEqual(deny({ ...ok, sip: { status: 'verified', expiresOn: 'soon' } }), { allow: false, reason: 'sip-expired' }, 'malformed expiry is not trusted')
assert.deepEqual(decideAccess(ok, policy, new Date('nope')), { allow: false, reason: 'invalid-policy' }, 'invalid clock fails closed')

// Kebijakan rusak = tolak (tidak boleh membuka akses karena salah konfigurasi)
assert.deepEqual(deny(ok, { ...policy, allowedRoles: [] }), { allow: false, reason: 'invalid-policy' })
assert.deepEqual(deny(ok, { ...policy, requireStr: false, requireSip: false }), { allow: false, reason: 'invalid-policy' }, 'a policy requiring no licence is invalid')
assert.deepEqual(deny(ok, { ...policy, capability: ' ' }), { allow: false, reason: 'invalid-policy' })

// Audit: tanpa nomor lisensi / data pasien
const rec = buildAuditRecord({ ...ok }, policy, deny(ok), now)
assert.deepEqual(rec, { at: '2026-10-02T10:00:00.000Z', userId: 'u1', capability: 'cap-x', decision: 'allow', reason: null })
assert.deepEqual(Object.keys(rec).sort(), ['at', 'capability', 'decision', 'reason', 'userId'], 'audit record carries no licence or patient fields')
assert.deepEqual(buildAuditRecord(null, policy, deny(null), now), { at: '2026-10-02T10:00:00.000Z', userId: 'anonymous', capability: 'cap-x', decision: 'deny', reason: 'no-identity' })

// guardCapability: audit ditulis untuk allow DAN deny; gagal audit => tolak
const log: AuditRecord[] = []
assert.deepEqual(await guardCapability(ok, policy, now, async (r) => { log.push(r) }), { allow: true })
assert.deepEqual(await guardCapability({ ...ok, role: 'pasien' }, policy, now, async (r) => { log.push(r) }), { allow: false, reason: 'role-not-allowed' })
assert.deepEqual(log.map((r) => r.decision), ['allow', 'deny'], 'both outcomes are audited')
assert.deepEqual(await guardCapability(ok, policy, now, async () => { throw new Error('disk full') }), { allow: false, reason: 'audit-unavailable' }, 'no access without an audit trail')
assert.deepEqual(await guardCapability(ok, policy, now, async (r) => { log.push(r) }), await guardCapability(ok, policy, now, async (r) => { log.push(r) }), 'deterministic')
console.log('Restricted capability gate verified: role, STR/SIP status and expiry, fail-closed policy, audit-or-deny.')
