import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const secure = readFileSync(new URL('../../src/lib/secureCareOutbox.ts', import.meta.url), 'utf8')
const ui = readFileSync(new URL('../../src/components/CekHarian.tsx', import.meta.url), 'utf8')

test('offline clinical answers use authenticated encryption and a non-extractable key', () => {
  assert.match(secure, /AES-GCM/)
  assert.match(secure, /length: 256/)
  assert.match(secure, /false, \/\/ non-extractable/)
  assert.match(secure, /getRandomValues\(new Uint8Array\(12\)\)/)
  assert.match(secure, /additionalData/)
  assert.match(secure, /SHA-256/)
  assert.match(secure, /IndexedDB ciphertext/)
})

test('production daily check-in has no plaintext queue fallback', () => {
  assert.match(ui, /sendOrQueueEncryptedCareReport/)
  assert.match(ui, /drainEncryptedCareOutbox/)
  assert.match(ui, /readEncryptedCareQueue/)
  assert.match(ui, /migrateLegacyPlaintextCareQueue/)
  assert.doesNotMatch(ui, /bacaAntrean\(localStorage\)/)
  assert.doesNotMatch(ui, /kirimAtauAntre\(localStorage/)
  assert.doesNotMatch(ui, /kurasAntrean\(localStorage/)
  assert.match(ui, /never saved as plaintext/)
})

test('legacy plaintext is removed only after encrypted migration succeeds', () => {
  const migrationStart = secure.indexOf('export async function migrateLegacyPlaintextCareQueue')
  const migrationEnd = secure.indexOf('export async function queueEncryptedCareReport', migrationStart)
  const migration = secure.slice(migrationStart, migrationEnd)
  assert.ok(migrationStart >= 0 && migrationEnd > migrationStart)
  assert.match(migration, /for \(const item of items\) await queueEncryptedCareReport\(item\)/)
  const encryptIndex = migration.indexOf('for (const item of items) await queueEncryptedCareReport(item)')
  const removeIndex = migration.lastIndexOf('storage.removeItem(KUNCI_ANTREAN)')
  assert.ok(removeIndex > encryptIndex, 'legacy plaintext must not be deleted before all encrypted writes complete')
  assert.match(migration, /secureCareOutboxSupported\(\)/)
})

test('network failure without secure storage fails closed', () => {
  assert.match(secure, /Offline and secure encrypted storage is unavailable/)
  assert.match(secure, /Your answers were not stored/)
  assert.doesNotMatch(secure, /setItem\(KUNCI_ANTREAN/)
})

test('successful replay keeps idempotency receipt and removes ciphertext', () => {
  assert.match(secure, /putReceipt\(db, item\.clientId\)/)
  assert.match(secure, /removeEncryptedCareReport\(item, true\)/)
  assert.match(secure, /idempotency remains clientId-based/)
})
