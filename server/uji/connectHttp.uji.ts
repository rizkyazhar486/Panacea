// Connect privacy over real HTTP: consent before any data is touched, no orientation/phone/selfie in any user-facing response,
// only verified and unblocked people are visible, deck filters run on the server, radius is validated, withdrawal erases.
// Synthetic accounts and phone numbers. Not a legal-compliance claim.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'
import { TUJUAN_WAJIB } from '../src/connect.ts'

const ownerEmail = 'connect-owner@localhost.test'
const running = await startIsolatedServer('connect-http', ownerEmail)
try {
  const { call } = running
  type Acc = { token: string; user: { id: string }; email: string }
  const login = async (email: string): Promise<Acc> => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role: 'pasien', name: email })
    assert.equal(r.status, 200); return { ...r.body, email }
  }
  const owner = await login(ownerEmail)
  const [a, b, c, d, e] = await Promise.all(['a', 'b', 'c', 'd', 'e'].map(n => login(`connect-${n}@localhost.test`)))
  const phones: Record<string, string> = { a: '081234567801', b: '081234567802', c: '081234567803', d: '081234567804', e: '081234567805' }
  const body = (who: string, o: Record<string, unknown> = {}) => ({
    nama: `Synthetic ${who}`, tempatLahir: 'Jakarta', tanggalLahir: '1995-05-05', umur: 30, pekerjaan: 'Synthetic job', status: 'lajang', preferensi: 'straight',
    pendidikanTerakhir: 'S1', tempatTinggal: 'Jakarta, DKI Jakarta', sosialMedia: [`https://instagram.com/synthetic.${who}`], selfieUrl: `https://example.test/selfie-${who}.jpg`,
    telepon: phones[who], persetujuan: [...TUJUAN_WAJIB], ...o,
  })
  const me = async (x: Acc) => (await call('GET', '/api/connect/saya', x.token)).body
  const verify = async (x: Acc, who: string, o: Record<string, unknown> = {}) => call('POST', '/api/connect/verifikasi', x.token, body(who, o))
  const approve = async (x: Acc) => call('POST', '/api/connect/tinjau/verifikasi', owner.token, { email: x.email, setuju: true })
  const deck = async (x: Acc) => (await call('GET', '/api/connect/dek', x.token)).body.kartu as any[]
  const profile = (viewer: Acc, target: Acc) => call('GET', `/api/connect/profil/${encodeURIComponent(target.email)}`, viewer.token)
  const SENSITIVE = ['preferensi', 'orientasi', 'agama', 'tanggalLahir', 'tempatLahir', 'teleponSidik', 'teleponAkhir', 'telepon', 'selfieUrl', 'sosialMedia', 'nik', 'status']

  // 1. Anonymous callers are refused on every user route; non-owners on every review route.
  for (const [m, p] of [['GET', '/api/connect/saya'], ['POST', '/api/connect/verifikasi'], ['POST', '/api/connect/radius'], ['POST', '/api/connect/tarik-persetujuan'], ['GET', '/api/connect/dek'], ['POST', '/api/connect/blokir'], ['POST', '/api/connect/lapor'], ['GET', '/api/connect/profil/x']] as const) {
    assert.equal((await call(m, p)).status, 401, `anonymous ${m} ${p}`)
  }
  for (const [m, p, bd] of [['GET', '/api/connect/tinjau', undefined], ['POST', '/api/connect/tinjau/verifikasi', { email: a.email, setuju: true }], ['POST', '/api/connect/tinjau/laporan', { id: 'x', poin: 1 }], ['POST', '/api/connect/tinjau/kredit', { email: a.email, poin: 5 }]] as const) {
    const r = await call(m, p, a.token, bd); assert.equal(r.status, 403, `non-owner ${m} ${p}`); assert.deepEqual(r.body, { error: 'forbidden' })
  }

  // 2. Consent comes first: any missing purpose is refused BEFORE data is stored; nothing about the applicant is kept.
  for (const missing of TUJUAN_WAJIB) {
    const r = await verify(a, 'a', { persetujuan: TUJUAN_WAJIB.filter(t => t !== missing) })
    assert.equal(r.status, 400, `without ${missing}`); assert.equal(r.body.error, 'persetujuan_belum_lengkap')
  }
  const untouched = await me(a)
  assert.equal(untouched.status, 'belum'); assert.equal(untouched.teleponTerdaftar, false); assert.deepEqual(untouched.persetujuan, [], 'no consent record for processing that never happened')
  for (const [label, o, why] of [['underage', { umur: 17 }, 'umur_minimal_18'], ['no selfie', { selfieUrl: '' }, 'selfie_wajib'], ['unknown social host', { sosialMedia: ['https://instagram.com.evil.test/x'] }, 'sosial_media_tidak_dikenal'], ['no social', { sosialMedia: [] }, 'sosial_media_wajib'], ['bad phone', { telepon: '12' }, 'telepon_tidak_sah'], ['no name', { nama: '  ' }, 'nama_wajib']] as const) {
    const r = await verify(a, 'a', o); assert.equal(r.status, 400, label); assert.equal(r.body.error, why, label)
  }
  assert.deepEqual((await me(a)).persetujuan, [], 'failed submissions leave no consent record')

  // 3. A valid submission: pending, consent recorded per purpose, the raw phone never comes back.
  assert.equal((await verify(a, 'a')).status, 200)
  const mine = await me(a)
  assert.equal(mine.status, 'menunggu'); assert.equal(mine.teleponTerdaftar, true); assert.equal(mine.teleponAkhir, '7801')
  assert.deepEqual(mine.persetujuan.map((p: any) => p.tujuan).sort(), [...TUJUAN_WAJIB].sort())
  assert.ok(!JSON.stringify(mine).includes('081234567801') && !JSON.stringify(mine).includes('6281234567801'), 'raw phone is not returned')
  assert.equal((await verify(a, 'a')).status, 200, 'a pending applicant may resubmit')
  // Same phone / same social account cannot be used by a second account; nothing is stored for the second.
  assert.equal((await verify(b, 'b', { telepon: phones.a })).body.error, 'telepon_sudah_dipakai')
  assert.equal((await verify(b, 'b', { sosialMedia: ['https://instagram.com/synthetic.a'] })).body.error, 'sosial_media_sudah_dipakai')
  assert.equal((await me(b)).status, 'belum')

  // 4. Owner review sees applicants but never the full phone; others cannot see a pending profile.
  assert.equal((await verify(b, 'b')).status, 200)
  const queue = (await call('GET', '/api/connect/tinjau', owner.token)).body
  assert.equal(queue.ajuan.length, 2); assert.ok(!JSON.stringify(queue).includes('0812345678'), 'review queue carries no raw phone')
  assert.equal((await profile(b, a)).status, 404, 'a pending applicant is not visible')
  assert.equal((await profile(b, a)).body.error, 'tidak_tersedia')
  assert.equal((await approve(a)).status, 200); assert.equal((await approve(b)).status, 200)
  assert.equal((await verify(a, 'a')).body.error, 'sudah_terverifikasi')

  // 5. Public profile: exactly the public fields, none of the sensitive ones.
  const pub = (await profile(b, a)).body.profil
  assert.deepEqual(Object.keys(pub).sort(), ['email', 'kota', 'kredit', 'nama', 'pekerjaan', 'pendidikan', 'terverifikasi', 'umur'])
  assert.equal(pub.kota, 'Jakarta')
  const wire = JSON.stringify(pub)
  for (const k of SENSITIVE) assert.ok(!(k in pub), `profile has no ${k}`)
  for (const secret of ['straight', '1995-05-05', 'selfie-a', 'instagram.com/synthetic', '7801']) assert.ok(!wire.includes(secret), `profile does not leak ${secret}`)

  // 6. Deck: verified, compatible, in BOTH radii, unblocked. Server-side, nothing sensitive on the card.
  assert.equal((await verify(c, 'c', { tempatTinggal: 'Depok, Jawa Barat' })).status, 200)
  assert.equal((await verify(d, 'd', { preferensi: 'gay' })).status, 200)
  assert.equal((await verify(e, 'e', { tempatTinggal: 'Bandung, Jawa Barat' })).status, 200)
  for (const x of [c, d, e]) assert.equal((await approve(x)).status, 200)
  const deckA = await deck(a)
  assert.deepEqual(deckA.map(k => k.email).sort(), [b.email, c.email].sort(), 'A sees B and C only: D is incompatible, E is outside the radius, self is absent')
  for (const k of deckA) { assert.deepEqual(Object.keys(k).sort(), ['email', 'jarakKm', 'kota', 'kredit', 'nama', 'pekerjaan', 'pendidikan', 'terverifikasi', 'umur']); for (const s of SENSITIVE) assert.ok(!(s in k), `card has no ${s}`) }
  assert.ok(deckA.find(k => k.email === c.email).jarakKm <= 25); assert.equal(deckA[0].jarakKm <= deckA[1].jarakKm, true, 'nearest first')
  assert.deepEqual((await deck(owner)), [], 'an unverified viewer gets an empty deck')

  // 7. Radius is validated, never stored as NaN, clamped to 1..500 and applied to BOTH sides.
  for (const bad of [{}, { km: 'abc' }, { km: null }, { km: 'Infinity' }]) {
    const r = await call('POST', '/api/connect/radius', a.token, bad); assert.equal(r.status, 400, JSON.stringify(bad)); assert.equal(r.body.error, 'km_tidak_sah')
    assert.equal((await me(a)).radiusKm, 25, `${JSON.stringify(bad)}: radius unchanged`)
  }
  assert.equal((await call('POST', '/api/connect/radius', a.token, { km: 0 })).body.radiusKm, 1); assert.equal((await call('POST', '/api/connect/radius', a.token, { km: 100000 })).body.radiusKm, 500)
  assert.equal((await call('POST', '/api/connect/radius', a.token, { km: '300' })).body.radiusKm, 300)
  assert.ok(!(await deck(a)).some(k => k.email === e.email), "E (default 25 km) does not see A's wide radius break through: both radii must hold")
  assert.ok(!(await deck(e)).some(k => k.email === a.email), 'and A is not shown to E either')
  assert.equal((await call('POST', '/api/connect/radius', e.token, { km: 300 })).status, 200)
  assert.ok((await deck(a)).some(k => k.email === e.email) && (await deck(e)).some(k => k.email === a.email), 'both radii wide enough: visible both ways')

  // 8. Blocking hides both directions, and also the profile.
  assert.equal((await call('POST', '/api/connect/blokir', a.token, {})).body.error, 'email_wajib')
  assert.equal((await call('POST', '/api/connect/blokir', a.token, { email: a.email })).body.error, 'tidak_bisa_blokir_diri')
  assert.equal((await call('POST', '/api/connect/blokir', a.token, { email: b.email })).status, 200)
  assert.ok(!(await deck(a)).some(k => k.email === b.email) && !(await deck(b)).some(k => k.email === a.email), 'blocked both ways in the deck')
  assert.equal((await profile(a, b)).status, 404); assert.equal((await profile(b, a)).status, 404, 'blocked profile is not viewable either way')
  assert.equal((await call('POST', '/api/connect/blokir', a.token, { email: b.email, buka: true })).status, 200)
  assert.equal((await profile(b, a)).status, 200, 'unblocking restores visibility')

  // 9. Reports and credit: a low-credit account stops circulating; owner-only actions are audited.
  assert.equal((await call('POST', '/api/connect/lapor', a.token, { email: c.email, alasan: '' })).status, 400)
  const cut = await call('POST', '/api/connect/tinjau/kredit', owner.token, { email: c.email, poin: 25, alasan: 'Synthetic' })
  assert.equal(cut.body.kredit, 75); assert.equal(cut.body.bahaya, true)
  assert.ok(!(await deck(a)).some(k => k.email === c.email), 'credit at or below 80 is not circulated')
  assert.equal((await call('POST', '/api/connect/tinjau/kredit', owner.token, { email: c.email, poin: 25, pulihkan: true })).body.kredit, 100)
  assert.ok((await deck(a)).some(k => k.email === c.email), 'restored credit circulates again')
  // Boundary, paired: exactly 80 (the danger threshold) is withheld, 81 circulates.
  assert.equal((await call('POST', '/api/connect/tinjau/kredit', owner.token, { email: c.email, poin: 20, alasan: 'Synthetic' })).body.kredit, 80)
  assert.ok(!(await deck(a)).some(k => k.email === c.email), 'credit exactly 80 is withheld')
  assert.equal((await call('POST', '/api/connect/tinjau/kredit', owner.token, { email: c.email, poin: 1, pulihkan: true })).body.kredit, 81)
  assert.ok((await deck(a)).some(k => k.email === c.email), 'credit 81 circulates')
  const actions = ((await call('GET', '/api/audit', owner.token)).body.entries as any[]).map(x => x.action)
  for (const act of ['connect_verifikasi_setuju', 'connect_kurangi_kredit', 'connect_pulihkan_kredit']) assert.ok(actions.includes(act), `${act} is audited`)

  // 10. Withdrawal of consent erases the data, the phone binding, and visibility at once; the phone can be reused.
  const wd = await call('POST', '/api/connect/tarik-persetujuan', d.token); assert.equal(wd.status, 200)
  const after = await me(d)
  assert.equal(after.status, 'belum'); assert.equal(after.teleponTerdaftar, false); assert.equal(after.teleponAkhir, undefined)
  assert.ok(after.persetujuan.length > 0 && after.persetujuan.every((p: any) => !!p.dicabutPada), 'consent records are kept as revoked, with the time')
  assert.equal((await profile(a, d)).status, 404); assert.ok(!(await deck(d)).length, 'a withdrawn account has an empty deck')
  assert.equal((await verify(owner, 'd')).status, 200, "the withdrawn account's phone number is free again")
  assert.ok(((await call('GET', '/api/audit', owner.token)).body.entries as any[]).some(x => x.action === 'connect_tarik_persetujuan'))

  console.log('connectHttp: 401/403 gates, consent before any data, failed submissions keep nothing, no phone/orientation/selfie/birth data in profile, deck or review queue, deck filters (orientation, both radii, block both ways, credit), radius validated, withdrawal erases and frees the phone; passed')
} finally {
  await running.stop()
}
