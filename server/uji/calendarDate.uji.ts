import assert from 'node:assert/strict'
import { isRealCalendarDate } from '../src/shared/calendarDate.js'
import { decideAccess, type Principal, type CapabilityPolicy } from '../src/shared/restrictedCapability.js'

// Positif
for (const d of ['2026-10-10', '2024-02-29', '2000-02-29', '2026-12-31', '2026-01-01']) assert.equal(isRealCalendarDate(d), true, d)

// Negatif berpasangan: format sama, kalender tidak ada
assert.equal(isRealCalendarDate('2026-02-29'), false, 'non-leap Feb 29')
assert.equal(isRealCalendarDate('2024-02-29'), true, 'leap Feb 29 differs only by year')
assert.equal(isRealCalendarDate('1900-02-29'), false, 'century non-leap')
assert.equal(isRealCalendarDate('2026-02-30'), false)
assert.equal(isRealCalendarDate('2026-04-31'), false)
assert.equal(isRealCalendarDate('2026-04-30'), true)
assert.equal(isRealCalendarDate('2026-13-01'), false)
assert.equal(isRealCalendarDate('2026-00-10'), false)
assert.equal(isRealCalendarDate('2026-99-99'), false)
assert.equal(isRealCalendarDate('2026-10-00'), false)

// Bentuk salah / tipe salah
for (const v of ['', '2026-1-1', '2026-10-10T00:00:00Z', ' 2026-10-10', '20261010', null, undefined, 20261010, {}, ['2026-10-10']]) {
  assert.equal(isRealCalendarDate(v), false, String(v))
}

// Regresi keamanan: tanggal kedaluwarsa lisensi mustahil tidak boleh dianggap berlaku
const now = new Date('2026-10-02T10:00:00Z')
const policy: CapabilityPolicy = { capability: 'cap-x', allowedRoles: ['dokter'], requireStr: true, requireSip: false }
const dokter = (expiresOn: string): Principal => ({ userId: 'u1', role: 'dokter', str: { status: 'verified', expiresOn } })
assert.deepEqual(decideAccess(dokter('2099-12-31'), policy, now), { allow: true })
assert.deepEqual(decideAccess(dokter('2099-99-99'), policy, now), { allow: false, reason: 'str-expired' }, 'impossible far-future expiry refused')
assert.deepEqual(decideAccess(dokter('2027-02-30'), policy, now), { allow: false, reason: 'str-expired' }, 'impossible Feb 30 refused')

console.log('calendarDate.uji ok')
