import assert from 'node:assert/strict'
import { DEVICE_GUEST_DOMAIN, deviceGuestProfile } from '../../src/domains/identity/deviceGuest.ts'

// positif: id valid -> pasien biasa, email di domain khusus, bukan owner
const p = deviceGuestProfile('a1b2c3d4e5f6')
assert.ok(p)
assert.equal(p.role, 'pasien')
assert.equal(p.email, `guest-a1b2c3d4e5f6@${DEVICE_GUEST_DOMAIN}`)
assert.match(p.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'lolos validasi email form login')
assert.equal(p.name, 'Guest')

// normalisasi: huruf besar & simbol dibuang, panjang dibatasi
assert.equal(deviceGuestProfile('A1-B2_C3 D4!E5')?.email, `guest-a1b2c3d4e5@${DEVICE_GUEST_DOMAIN}`)
assert.ok((deviceGuestProfile('x'.repeat(200))?.email.length ?? 0) <= `guest-${'x'.repeat(24)}@${DEVICE_GUEST_DOMAIN}`.length)

// batas: 7 karakter ditolak, 8 diterima (±1 dari batas)
assert.equal(deviceGuestProfile('abcdefg'), null)
assert.ok(deviceGuestProfile('abcdefgh'))

// negatif: kosong / simbol saja / bukan string -> ditolak, tidak ada akun bersama
assert.equal(deviceGuestProfile(''), null)
assert.equal(deviceGuestProfile('!!!!!!!!!!'), null)
assert.equal(deviceGuestProfile(undefined as unknown as string), null)
assert.equal(deviceGuestProfile(42 as unknown as string), null)

// keselamatan: tidak pernah menghasilkan peran istimewa atau identitas orang bernama, apa pun masukannya
for (const id of ['owner', 'admin', 'dokter', 'rizkyazhar486', 'dr.rizkymuhammadazrissal', 'owner@panaceamed.id']) {
  const g = deviceGuestProfile(id.padEnd(8, '0'))
  assert.ok(g && g.role === 'pasien' && g.name === 'Guest' && g.email.endsWith(`@${DEVICE_GUEST_DOMAIN}`), id)
}

// determinisme & id berbeda -> akun berbeda
assert.deepEqual(deviceGuestProfile('abcdefgh12'), deviceGuestProfile('abcdefgh12'))
assert.notEqual(deviceGuestProfile('abcdefgh12')?.email, deviceGuestProfile('abcdefgh13')?.email)
console.log('device-guest: OK')
