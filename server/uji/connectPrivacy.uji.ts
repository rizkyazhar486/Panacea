import assert from 'node:assert/strict'
import {
  TUJUAN_WAJIB,
  VERSI_PEMBERITAHUAN,
  ajukanVerifikasi,
  blokir,
  bukaBlokir,
  ikatTelepon,
  isiConnect,
  kunciSosial,
  muatConnect,
  persetujuanAktif,
  profilPublik,
  putuskanVerifikasi,
  ringkasanSaya,
  setelRadius,
  tarikPersetujuan,
  terblokir,
} from '../src/connect.js'

const GARAM_TEST = 'panacea-connect-regression-salt-2026-'.padEnd(64, 'x')

function resetConnect() {
  muatConnect({ akun: {}, laporan: [], garam: GARAM_TEST })
}

function ajuan(emailTag: string, telepon = '081234567890') {
  return {
    nama: `User ${emailTag}`,
    tempatLahir: 'Jakarta',
    tanggalLahir: '1996-01-01',
    umur: 30,
    pekerjaan: 'Dokter',
    status: 'lajang',
    preferensi: 'straight' as const,
    pendidikanTerakhir: 'S1',
    tempatTinggal: 'Jakarta, Indonesia',
    sosialMedia: [`https://instagram.com/${emailTag}`],
    selfieUrl: `https://example.test/${emailTag}-selfie.jpg`,
    telepon,
    persetujuan: [...TUJUAN_WAJIB],
  }
}

resetConnect()
const tanpaPersetujuan = ajukanVerifikasi('consent@example.test', {
  ...ajuan('consent'),
  persetujuan: ['biometrik_selfie'],
})
assert.deepEqual(tanpaPersetujuan, { ok: false, galat: 'persetujuan_belum_lengkap' })
assert.equal(isiConnect().akun['consent@example.test']?.data, undefined)
assert.equal(isiConnect().akun['consent@example.test']?.teleponSidik, undefined)
assert.deepEqual(persetujuanAktif('consent@example.test'), [])

resetConnect()
assert.deepEqual(ikatTelepon('phone-a@example.test', '081234567890'), { ok: true })
assert.deepEqual(
  ikatTelepon('phone-b@example.test', '+6281234567890'),
  { ok: false, galat: 'telepon_sudah_dipakai' },
)
const phoneAccount = isiConnect().akun['phone-a@example.test']
assert.equal(phoneAccount.teleponAkhir, '7890')
assert.match(phoneAccount.teleponSidik ?? '', /^[a-f0-9]{64}$/)
assert.doesNotMatch(JSON.stringify(phoneAccount), /081234567890|6281234567890/)

assert.equal(kunciSosial('https://instagram.com/Budi/'), 'instagram|budi')
assert.equal(kunciSosial('https://www.instagram.com/budi?hl=id'), 'instagram|budi')
assert.equal(kunciSosial('https://m.facebook.com/profile.php?id=12345#about'), 'facebook|12345')
assert.equal(kunciSosial('https://linkedin.com/in/Dr-Rizky/'), 'linkedin|in/dr-rizky')
assert.equal(kunciSosial('https://instagram.com.evil.example/budi'), null)
assert.equal(kunciSosial('javascript:alert(1)'), null)

resetConnect()
const form = ajuan('verified')
assert.deepEqual(ajukanVerifikasi('verified@example.test', form), { ok: true })
const waiting = isiConnect().akun['verified@example.test']
assert.equal(waiting.status, 'menunggu')
assert.equal(waiting.teleponAkhir, '7890')
assert.equal(Object.prototype.hasOwnProperty.call(waiting.data ?? {}, 'telepon'), false)
assert.equal(Object.prototype.hasOwnProperty.call(waiting.data ?? {}, 'persetujuan'), false)
assert.deepEqual(new Set(persetujuanAktif('verified@example.test')), new Set(TUJUAN_WAJIB))
assert.ok(waiting.persetujuan.every((record) => record.versiPemberitahuan === VERSI_PEMBERITAHUAN))

assert.deepEqual(putuskanVerifikasi('verified@example.test', true), { ok: true })
const approved = isiConnect().akun['verified@example.test']
assert.equal(approved.status, 'terverifikasi')
assert.equal(approved.data?.selfieUrl, '')

const publicProfile = profilPublik('verified@example.test')
assert.ok(publicProfile)
assert.deepEqual(
  Object.keys(publicProfile!).sort(),
  ['email', 'nama', 'umur', 'pekerjaan', 'pendidikan', 'kota', 'terverifikasi', 'kredit'].sort(),
)
const publicJson = JSON.stringify(publicProfile)
for (const forbidden of ['preferensi', 'tanggalLahir', 'tempatLahir', 'telepon', 'selfie', 'sosialMedia']) {
  assert.equal(publicJson.includes(forbidden), false, `public profile leaked ${forbidden}`)
}

assert.deepEqual(tarikPersetujuan('verified@example.test'), { ok: true })
const withdrawn = isiConnect().akun['verified@example.test']
assert.equal(withdrawn.status, 'belum')
assert.equal(withdrawn.data, undefined)
assert.equal(withdrawn.teleponSidik, undefined)
assert.equal(withdrawn.teleponAkhir, undefined)
assert.deepEqual(persetujuanAktif('verified@example.test'), [])
assert.ok(withdrawn.persetujuan.length >= TUJUAN_WAJIB.length)
assert.ok(withdrawn.persetujuan.every((record) => typeof record.dicabutPada === 'string'))
assert.equal(ringkasanSaya('verified@example.test').teleponTerdaftar, false)

resetConnect()
assert.deepEqual(blokir('alice@example.test', 'bob@example.test'), { ok: true })
assert.equal(terblokir('alice@example.test', 'bob@example.test'), true)
assert.equal(terblokir('bob@example.test', 'alice@example.test'), true)
assert.deepEqual(blokir('alice@example.test', 'alice@example.test'), { ok: false, galat: 'tidak_bisa_blokir_diri' })
assert.deepEqual(bukaBlokir('alice@example.test', 'bob@example.test'), { ok: true })
assert.equal(terblokir('alice@example.test', 'bob@example.test'), false)

assert.equal(setelRadius('radius@example.test', -100), 1)
assert.equal(setelRadius('radius@example.test', 9999), 500)
assert.equal(setelRadius('radius@example.test', 42.4), 42)

console.log('Connect consent, identity minimization, retention, public-redaction, blocking, and radius invariants verified.')
