import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bolehAksesPasien, idPasienDiri, idPasienDiriLegacy } from '../../server/src/aksesKlinis.ts'

const u = { id: 'user-7f91', email: 'lama@example.com', role: 'pasien' }
const stable = idPasienDiri(u.id)
const legacy = idPasienDiriLegacy(u.email)
const owner = (patientId: string) => patientId === stable || patientId === legacy ? { id: u.id } : undefined

assert.equal(stable, 'self-u-user-7f91')
assert.equal(bolehAksesPasien(u, stable, false, owner), true)
assert.equal(bolehAksesPasien(u, legacy, false, owner), true, 'legacy self record must remain readable during migration')

const afterEmailChange = { ...u, email: 'baru@example.com' }
assert.equal(bolehAksesPasien(afterEmailChange, stable, false, owner), true, 'stable self id must survive an email change')
assert.equal(bolehAksesPasien(afterEmailChange, legacy, false, owner), false, 'old email alias must not remain an identity credential')

const types = readFileSync('src/lib/types.ts', 'utf8')
const api = readFileSync('src/lib/api.ts', 'utf8')
const store = readFileSync('src/lib/store.tsx', 'utf8')
const serverStore = readFileSync('server/src/store.ts', 'utf8')

assert.match(types, /id\?: string[\s\S]*email: string/, 'Account must carry the server-stable id')
assert.match(api, /function toAccount\(u: BackendUser\)[\s\S]*id: u\.id/, 'auth mapping dropped BackendUser.id')
assert.match(store, /self-u-\$\{stable\}/, 'patientFromAccount must prefer the stable server id')
assert.doesNotMatch(store, /id:\s*'self-'\s*\+\s*account\.email/, 'email-derived self id became primary again')
assert.match(serverStore, /patientId\.startsWith\('self-u-'\)/, 'server reverse lookup must resolve stable self ids')
assert.match(store, /pindahkanKunciPasien\(st\.records, legacyId, self\.id\)/, 'legacy local EMR state must be re-keyed without overwrite')

console.log('id-rekam-diri-stabil: stable user identity is primary; legacy email ids are migration-only')
