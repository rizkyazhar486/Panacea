// Regresi keamanan: auto-resume tanpa kredensial (resolveAutoResumeAccount) pernah
// memberi peran `owner` + isOwner/isSubscriber hanya dari flag onboarding di
// localStorage (commit 71957cd). Uji ini mengunci perilaku fail-closed:
// tidak ada identitas pemilik sintetis, tidak ada peran owner/admin/klinis dari
// data localStorage yang bisa dipalsukan.
import assert from 'node:assert/strict'

const mem = new Map<string, string>()
globalThis.localStorage = {
  get length() { return mem.size },
  key(i: number) { return Array.from(mem.keys())[i] ?? null },
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)) },
  removeItem: (k: string) => { mem.delete(k) },
  clear: () => { mem.clear() },
} as unknown as Storage

const { resolveAutoResumeAccount, AUTO_RESUME_ROLE, REMEMBERED_ACCOUNTS_KEY } =
  await import('../../src/domains/identity/bootVitals.ts')

const OWNER = 'owner.qa@example.invalid'
const seedPatients = [{ id: 'p1', name: 'Seed Patient' }] as never
const onboardedWithTelemetry = () => {
  mem.clear()
  mem.set('panacea_onboarded_v1', '1')
  mem.set('pm_bodycomp_v1', JSON.stringify({ weightKg: 70 }))
}
const remember = (entries: unknown[]) => mem.set(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(entries))
const run = (name: string, fn: () => void) => { fn(); console.log(`  ✔ ${name}`) }

console.log('auto-resume-fail-closed')

run('menolak_sintesis_pemilik_tanpa_akun_teringat', () => {
  onboardedWithTelemetry()
  const before = JSON.stringify([...mem])
  assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER, patients: seedPatients }), null)
  assert.equal(JSON.stringify([...mem]), before, 'tanpa efek samping pada storage')
})

run('menerima_akun_teringat_sebagai_pasien', () => {
  onboardedWithTelemetry()
  remember([{ email: 'User.QA@example.invalid', name: 'QA User', role: 'pasien', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  const acc = resolveAutoResumeAccount({ ownerEmail: OWNER })
  assert.ok(acc)
  assert.equal(acc.email, 'user.qa@example.invalid')
  assert.equal(acc.id, 'local:user.qa%40example.invalid')
  assert.equal(acc.role, 'pasien')
  assert.equal(acc.patientId, 'self-u-local:user.qa%40example.invalid')
  assert.equal(acc.isOwner, false)
  assert.equal(acc.isSubscriber, false)
})

for (const forged of ['owner', 'admin', 'dokter', 'perawat'] as const) {
  run(`menolak_eskalasi_peran_${forged}_dari_localstorage`, () => {
    onboardedWithTelemetry()
    remember([{ email: OWNER, name: 'Forged', role: forged, lastLoginAt: '2026-11-01T00:00:00.000Z' }])
    const acc = resolveAutoResumeAccount({ ownerEmail: OWNER })
    assert.ok(acc, 'resume tetap boleh, hanya tanpa otoritas')
    assert.equal(acc.role, AUTO_RESUME_ROLE)
    assert.equal(AUTO_RESUME_ROLE, 'pasien')
    assert.equal(acc.isOwner, false, 'email pemilik saja tidak memberi isOwner')
    assert.equal(acc.isSubscriber, false)
  })
}

run('menolak_profil_pemilik_tanpa_peran_owner', () => {
  onboardedWithTelemetry()
  const acc = resolveAutoResumeAccount({ ownerEmail: OWNER, profiles: { [OWNER]: {} } as never })
  assert.ok(acc)
  assert.equal(acc.role, 'pasien')
  assert.equal(acc.isOwner, false)
})

run('batas_tanpa_onboarding_dan_profil_kesehatan_tidak_resume', () => {
  mem.clear()
  mem.set('pm_bodycomp_v1', JSON.stringify({ weightKg: 70 }))
  remember([{ email: 'user.qa@example.invalid', name: 'QA', role: 'pasien', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER }), null)
})

run('batas_onboarded_tanpa_telemetri_tidak_resume', () => {
  mem.clear()
  mem.set('panacea_onboarded_v1', '1')
  remember([{ email: 'user.qa@example.invalid', name: 'QA', role: 'pasien', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER }), null)
})

run('menolak_resume_setelah_logout_eksplisit', () => {
  onboardedWithTelemetry()
  remember([{ email: 'user.qa@example.invalid', name: 'QA', role: 'pasien', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  mem.set('panacea.explicit_logout.v1', '1')
  assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER }), null)
})

run('menolak_entri_teringat_tanpa_email_valid', () => {
  onboardedWithTelemetry()
  remember([{ email: 'not-an-email', name: 'X', role: 'owner', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  assert.equal(resolveAutoResumeAccount({ ownerEmail: OWNER, patients: seedPatients }), null)
})

run('deterministik_dua_kali_hasil_identik_kecuali_waktu', () => {
  onboardedWithTelemetry()
  remember([{ email: 'user.qa@example.invalid', name: 'QA', role: 'pasien', lastLoginAt: '2026-11-01T00:00:00.000Z' }])
  const strip = (a: ReturnType<typeof resolveAutoResumeAccount>) => ({ ...a, loggedAt: undefined })
  assert.deepEqual(strip(resolveAutoResumeAccount({ ownerEmail: OWNER })), strip(resolveAutoResumeAccount({ ownerEmail: OWNER })))
})

console.log('auto-resume-fail-closed: PASS')
