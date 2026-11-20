import assert from 'node:assert/strict'
import {
  clampStoredRole,
  listRememberedAccounts,
  resolveAutoResumeAccount,
  resolveLegacySessionAccount,
} from '../../src/domains/identity/bootVitals.ts'
import type { Patient } from '../../src/lib/types.ts'

// Penyimpanan di memori: tanpa jaringan, tanpa waktu nyata (nowIso disuntikkan).
const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size },
}

const OWNER = 'owner@panaceamed.test'
const NOW = '2026-11-20T00:00:00.000Z'
const reset = () => store.clear()
const put = (k: string, v: unknown) => store.set(k, typeof v === 'string' ? v : JSON.stringify(v))
const patients = [{ id: 'p1', name: 'Keluarga A' }] as unknown as Patient[]

// ── clampStoredRole ────────────────────────────────────────────────────────────
assert.equal(clampStoredRole('dokter', 'ani@example.com', OWNER), 'dokter', 'peran klinis biasa tetap')
assert.equal(clampStoredRole('pasien', 'ani@example.com', OWNER), 'pasien')
assert.equal(clampStoredRole('owner', 'ani@example.com', OWNER), 'pasien', 'owner dari penyimpanan ditolak untuk email lain')
assert.equal(clampStoredRole('admin', 'ani@example.com', OWNER), 'pasien', 'admin dari penyimpanan ditolak')
assert.equal(clampStoredRole(undefined, 'ani@example.com', OWNER), 'pasien')
assert.equal(clampStoredRole('pasien', OWNER.toUpperCase(), OWNER), 'owner', 'email owner sendiri (tanpa beda huruf) tetap owner')

// ── resolveLegacySessionAccount: gagal tertutup ────────────────────────────────
reset()
put('panacea_onboarded_v1', '1')
assert.equal(resolveLegacySessionAccount(OWNER, NOW), null, 'tanpa email tersimpan tidak ada yang diadopsi (bukan owner)')

reset()
put('panacea_onboarded_v1', '1')
put('pmd_profile', { name: 'Ani', email: 'bukan-email' })
assert.equal(resolveLegacySessionAccount(OWNER, NOW), null, 'email tidak valid ditolak')

reset()
put('pmd_profile', { name: 'Ani', email: 'ani@example.com' })
assert.equal(resolveLegacySessionAccount(OWNER, NOW), null, 'profil saja tanpa tanda pemakaian tidak cukup')

reset()
put('panacea_onboarded_v1', '1')
put('pmd_profile', 'bukan json {')
assert.equal(resolveLegacySessionAccount(OWNER, NOW), null, 'profil rusak = tanpa identitas')

// positif berpasangan (hanya beda pada email tersimpan)
reset()
put('panacea_onboarded_v1', '1')
put('pmd_profile', { name: '  Ani Wulandari  ', email: ' Ani@Example.com ' })
const ani = resolveLegacySessionAccount(OWNER, NOW)
assert.ok(ani)
assert.equal(ani.email, 'ani@example.com')
assert.equal(ani.id, 'local:ani%40example.com')
assert.equal(ani.name, 'Ani Wulandari')
assert.equal(ani.role, 'pasien')
assert.equal(ani.isOwner, false)
assert.equal(ani.isSubscriber, false)
assert.equal(ani.loggedAt, NOW)

// peran dari penyimpanan tidak bisa menaikkan hak
reset()
put('panacea_onboarded_v1', '1')
put('pmd_profile', { email: 'ani@example.com', role: 'owner' })
assert.equal(resolveLegacySessionAccount(OWNER, NOW)?.role, 'pasien')
put('pmd_profile', { email: 'ani@example.com', role: 'admin' })
assert.equal(resolveLegacySessionAccount(OWNER, NOW)?.role, 'pasien')
put('pmd_profile', { email: 'ani@example.com', role: 'dokter' })
assert.equal(resolveLegacySessionAccount(OWNER, NOW)?.role, 'dokter')

// perangkat pemilik sendiri tetap pulih (data lama tidak hilang)
put('pmd_profile', { email: OWNER, name: 'Pemilik' })
const own = resolveLegacySessionAccount(OWNER, NOW)
assert.equal(own?.role, 'owner')
assert.equal(own?.isOwner, true)

// logout eksplisit dihormati (pasangan: kondisi lain identik dengan kasus positif di atas)
put('panacea.explicit_logout.v1', '1')
assert.equal(resolveLegacySessionAccount(OWNER, NOW), null)

// ── listRememberedAccounts: tidak mengarang owner ──────────────────────────────
reset()
assert.deepEqual(listRememberedAccounts({ ownerEmail: OWNER, patients }), [], 'ada pasien tetapi tak ada akun tersimpan -> kosong, bukan owner')
put('panacea.remembered_accounts.v1', [{ email: 'ani@example.com', name: 'Ani', role: 'pasien', lastLoginAt: NOW }])
const remembered = listRememberedAccounts({ ownerEmail: OWNER, patients })
assert.deepEqual(remembered.map((r) => r.email), ['ani@example.com'])

// ── resolveAutoResumeAccount ───────────────────────────────────────────────────
reset()
put('panacea_onboarded_v1', '1')
put('pmd_health_profile', { weightKg: 70 })
assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER, patients }), null, 'tanpa akun tersimpan tidak masuk sebagai owner')

put('panacea.remembered_accounts.v1', [{ email: 'ani@example.com', name: 'Ani', role: 'owner', lastLoginAt: NOW }])
const resumed = resolveAutoResumeAccount({ ownerEmail: OWNER, patients })
assert.equal(resumed?.email, 'ani@example.com')
assert.equal(resumed?.role, 'pasien', 'peran owner tersimpan untuk email lain diturunkan')
assert.equal(resumed?.isOwner, false)
assert.equal(resumed?.isSubscriber, false)

put('panacea.remembered_accounts.v1', [{ email: OWNER, name: 'Pemilik', role: 'owner', lastLoginAt: NOW }])
assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER, patients })?.isOwner, true, 'akun pemilik yang memang tersimpan tetap pulih')

put('panacea.explicit_logout.v1', '1')
assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER, patients }), null, 'logout eksplisit dihormati')

// determinisme
reset()
put('panacea_onboarded_v1', '1')
put('pmd_profile', { email: 'ani@example.com' })
assert.deepEqual(resolveLegacySessionAccount(OWNER, NOW), resolveLegacySessionAccount(OWNER, NOW))

console.log('identity-no-default-owner: OK')
