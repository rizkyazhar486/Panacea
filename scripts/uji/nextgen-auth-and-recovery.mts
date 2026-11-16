import assert from 'node:assert/strict'
import {
  buildOtpAuthUri,
  computeTotpToken,
  encodePairingQrPayload,
  generateTotpSecret,
  parsePairingQrPayload,
  verifyTotpCode,
} from '../../src/domains/identity/webAuthnTotp.ts'
import { bindPersonalHealthAccount } from '../../src/shared/kernel/personalHealthStorageScope.ts'
import { getVitals } from '../../src/lib/healthVitals.ts'
import { ambilRiwayat } from '../../src/lib/riwayatVitals.ts'
import { ambilLab } from '../../src/lib/lab.ts'
import { getWorkouts } from '../../src/lib/workoutStore.ts'
import { discoverConnectedDevices, recordConnectedDevice } from '../../src/domains/devices/adapters/deviceRegistry.ts'
import {
  exportFullLocalVault,
  readUnifiedLocalVitals,
  recoverSameUserVitalsIntoScope,
  resolveAutoResumeAccount,
  restoreFullLocalVault,
} from '../../src/domains/identity/localRecovery.ts'

// Install isolated localStorage mock for pure contract execution
const mem = new Map<string, string>()
globalThis.localStorage = {
  get length() { return mem.size },
  key(i: number) { return Array.from(mem.keys())[i] ?? null },
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)) },
  removeItem: (k: string) => { mem.delete(k) },
  clear: () => { mem.clear() },
} as unknown as Storage

// 1. RFC 6238 TOTP generation + time-step verification (using synthetic RFC 2606 domain)
const secret = generateTotpSecret()
assert.ok(/^[A-Z2-7]{32}$/.test(secret), 'TOTP secret must be 32-char Base32')
const uri = buildOtpAuthUri({ email: 'qa.user@example.invalid', secret })
assert.ok(uri.startsWith('otpauth://totp/PanaceaMed:qa.user%40example.invalid?secret='))

const now = Date.parse('2026-11-16T12:00:00Z')
const token = await computeTotpToken(secret, now)
assert.match(token, /^\d{6}$/, 'computed TOTP code must be 6 numeric digits')
assert.equal(await verifyTotpCode(secret, token, now), true, 'exact window token verifies')
assert.equal(await verifyTotpCode(secret, token, now + 29_000), true, 'adjacent step window verifies')
assert.equal(await verifyTotpCode(secret, '000000', now), false, 'wrong static token fails closed')

// 2. QR & Barcode Pairing token roundtrip & fail-closed checks
const pairToken = encodePairingQrPayload({
  email: 'qa.pair@example.invalid',
  name: 'QA Pair',
  role: 'dokter',
  patientId: 'self-u-local%3Aqa.pair%40example.invalid',
})
const decoded = parsePairingQrPayload(pairToken)
assert.ok(decoded && decoded.email === 'qa.pair@example.invalid' && decoded.role === 'dokter')
assert.equal(parsePairingQrPayload('PANACEA:PAIR:v1:invalid-base64!!!'), null)
assert.equal(parsePairingQrPayload('https://untrusted.example.invalid'), null)

// 3. Whole-system recovery (datas, daily logs, lab logs, workout logs, connected devices) vs foreign isolation
const myEmail = 'user.recover@example.invalid'
const enc = encodeURIComponent(myEmail)
const targetId = `local:${enc}`
const targetPatientId = `self-u-${targetId}`
const oldToken = encodeURIComponent(JSON.stringify([`acc-owner-${enc}`, 'p1']))

mem.set('panaceamed.session.v1', JSON.stringify({
  account: { id: targetId, email: myEmail, name: 'QA Recover', role: 'owner', patientId: targetPatientId },
  loginAt: now,
}))
bindPersonalHealthAccount({ id: targetId, patientId: targetPatientId })

// Seed legacy role data, history, lab & workouts belonging to SAME email AND a foreign bucket for user B
mem.set(`pmd_vitals_scope_v1:${oldToken}`, JSON.stringify({
  ownerAccountId: `acc-owner-${enc}`,
  steps: 8420,
  vo2max: 49.5,
  source: 'WHOOP 4.0',
}))
mem.set(`pmd_riwayat_vitals_scope_v1:${oldToken}`, JSON.stringify({
  version: 1,
  ownerAccountId: `acc-owner-${enc}`,
  subjectId: 'p1',
  history: [{ tanggal: '2026-11-10', nilai: { steps: 7900, restingHr: 55 } }],
}))
mem.set(`pmd_lab_scope_v1:${oldToken}`, JSON.stringify({
  ownerAccountId: `acc-owner-${enc}`,
  subjectId: 'p1',
  log: { hba1c: [{ tanggal: '2026-11-01', nilai: 5.2 }] },
}))
mem.set(`pmd_workouts_v1:scope_v1:${oldToken}`, JSON.stringify({
  version: 1,
  ownerAccountId: `acc-owner-${enc}`,
  subjectId: 'p1',
  items: [{ id: 'w-1', jenis: 'Run', mulai: '2026-11-10T06:00:00Z', akhir: '2026-11-10T06:40:00Z', durasiDetik: 2400, sourceName: 'Garmin Forerunner' }],
}))

// Foreign user B records (MUST NEVER BE ADOPTED!)
mem.set('pmd_vitals_scope_v1:local%3Aforeign%40example.invalid::self-foreign', JSON.stringify({
  ownerAccountId: 'local:foreign@example.invalid',
  restingHr: 199,
  steps: 99999,
}))
mem.set('pmd_health_profile', JSON.stringify({
  weightKg: 71.5,
  restingHr: 54,
  remH: 1.8,
  deepH: 1.4,
  history: [{ date: '2026-11-12', vo2max: 50, restingHr: 53, hrvMs: 68, sleepH: 7.5 }],
}))
mem.set('pmd_auto_sync_status_v2', JSON.stringify({ state: 'ok', lastSuccess: '2026-11-16T08:00:00Z', profileFields: 14, workoutsPulled: 3, notificationsPulled: 0, errors: [] }))
mem.set('panacea_onboarded_v1', '1')

recordConnectedDevice({ id: 'ble:polar h10', name: 'Polar H10', transport: 'ble_gatt', batteryPercent: 88, ownerEmail: myEmail })

const acc = { id: targetId, email: myEmail, name: 'QA Recover', role: 'owner' as const, isSubscriber: false, patientId: targetPatientId }
const summary = recoverSameUserVitalsIntoScope(acc)

assert.ok(summary.mergedFieldsCount >= 3, 'same-email + health profile telemetry merged')
assert.equal(summary.historyDaysRecovered, 2, 'same-email + pmd_health_profile.history daily logs recovered')
assert.equal(summary.labsRecovered, 1, 'same-email lab marker recovered')
assert.equal(summary.workoutsRecovered, 1, 'same-email workout recovered')
assert.ok(summary.devicesDiscovered >= 2, 'Polar H10 + WHOOP 4.0 + Garmin discovered')

const recoveredVitals = getVitals({ id: targetId, patientId: targetPatientId })
assert.equal(recoveredVitals.steps, 8420)
assert.equal(recoveredVitals.vo2max, 49.5)
assert.equal(recoveredVitals.weightKg, 71.5)
assert.equal(recoveredVitals.sleepRemH, 1.8)
assert.equal(recoveredVitals.sleepDeepH, 1.4)
assert.equal(recoveredVitals.restingHr, 54, 'foreign user 199 bpm never adopted into owner scope')

const unified = readUnifiedLocalVitals(acc)
assert.equal(unified.steps, 8420)

assert.equal(ambilRiwayat().length, 2, 'recovered history readable via canonical ambilRiwayat')
assert.equal(ambilLab().hba1c?.[0]?.nilai, 5.2, 'recovered lab readable via canonical ambilLab')
assert.equal(getWorkouts().length, 1, 'recovered workout readable via canonical getWorkouts')

const discovered = await discoverConnectedDevices({ ownerEmail: myEmail, vitalsSource: 'WHOOP 4.0' })
assert.ok(discovered.some((d) => d.name === 'Polar H10' && d.batteryPercent === 88))
assert.ok(discovered.some((d) => d.name === 'WHOOP 4.0'))
assert.ok(discovered.some((d) => d.id === 'sync:auto-health-bridge'), 'pmd_auto_sync_status_v2 surfaced in connected devices')

// Auto-resume respects onboarded telemetry presence AND explicit logout flag
const autoResumed = resolveAutoResumeAccount({ ownerEmail: 'owner.qa@example.invalid' })
assert.ok(autoResumed && autoResumed.id && autoResumed.patientId)
mem.set('panacea.explicit_logout.v1', '1')
assert.equal(resolveAutoResumeAccount({ ownerEmail: 'owner.qa@example.invalid' }), null, 'explicit logout prevents unwanted auto-login')
mem.delete('panacea.explicit_logout.v1')

// 4. Vault Backup Export / Restore roundtrip + email mismatch guard
const backup = exportFullLocalVault(acc)
assert.ok(backup && backup.schema === 'panacea_vault_backup_v1' && backup.workouts.length === 1)
const okRestore = restoreFullLocalVault(JSON.stringify(backup), acc)
assert.equal(okRestore.ok, true)
const wrongAccount = restoreFullLocalVault(JSON.stringify(backup), { ...acc, email: 'other@example.invalid' })
assert.equal(wrongAccount.ok, false, 'mismatched backup owner rejected fail-closed')

import {
  HOLISTIC_RECOVERY_MODALITIES,
  analyzePrePostRecovery,
  computeHbotInspiredPo2MmHg,
  computePbmFluenceJcm2,
  createRecoveryLedgerTransaction,
} from '../../src/domains/personal-health/engine/holisticRecoveryProtocol.ts'
import { appendRecoveryLedgerEntry, readRecoveryLedger } from '../../src/domains/personal-health/adapters/recoveryLedgerStorage.ts'

// 5. Holistic Recovery 5-modality engine & Biometric Ledger
assert.equal(HOLISTIC_RECOVERY_MODALITIES.length, 5, 'all 5 recovery modalities defined')
assert.equal(computeHbotInspiredPo2MmHg(2.0, 1.0), 1473, 'alveolar inspired PO2 follows Henry/Dalton physics')
assert.equal(computePbmFluenceJcm2(80, 600), 48, 'PBM fluence = mW/cm2 * s / 1000')
const hbotCorr = analyzePrePostRecovery({
  modalityId: 'hbot',
  durationMin: 60,
  primaryValue: 1.8,
  secondaryValue: 100,
  pre: { hrvMs: 42, restingHr: 60, spo2Pct: 97, lactateMmolL: 3.1 },
  post: { hrvMs: 55, restingHr: 54, spo2Pct: 99, lactateMmolL: 1.6 },
  linkedWorkoutLabel: 'Morning Run',
})
assert.equal(hbotCorr.deltaHrvMs, 13)
assert.equal(hbotCorr.deltaRestingHr, -6)
assert.equal(hbotCorr.truthClass, 'recorded_delta')
assert.equal(hbotCorr.clinicallyReviewed, false)
const tx = createRecoveryLedgerTransaction(targetId, {
  modalityId: 'hbot',
  durationMin: 60,
  primaryValue: 1.8,
  secondaryValue: 100,
  pre: { hrvMs: 42 },
  post: { hrvMs: 55 },
}, hbotCorr, '2026-11-16T12:00:00Z', 'Polar H10')
assert.equal(tx.luhnCheckValid, true, 'recovery ledger token is Luhn valid')
appendRecoveryLedgerEntry(tx)
assert.equal(readRecoveryLedger().length, 1, 'recovery ledger persisted under active owner scope')

bindPersonalHealthAccount(undefined)
console.log('nextgen-auth-and-recovery: 5/5 TOTP, QR pairing, whole-system data/logs/devices recovery, backup & 5-modality holistic recovery PASS.')
process.exit(0)
