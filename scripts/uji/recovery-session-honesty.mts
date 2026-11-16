import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HOLISTIC_RECOVERY_MODALITIES,
  analyzePrePostRecovery,
  computeHbotInspiredPo2MmHg,
  computePbmFluenceJcm2,
  createRecoveryLedgerTransaction,
} from '../../src/domains/personal-health/engine/holisticRecoveryProtocol.ts'
import {
  appendRecoveryLedgerEntry,
  readRecoveryLedger,
} from '../../src/domains/personal-health/adapters/recoveryLedgerStorage.ts'

// Isolated localStorage shim (node-only, zero network/browser dependency)
const mem = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    get length() { return mem.size },
    key: (i: number) => Array.from(mem.keys())[i] ?? null,
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, String(v)) },
    removeItem: (k: string) => { mem.delete(k) },
    clear: () => { mem.clear() },
  },
  configurable: true,
})

test('physics helpers clamp invalid/extreme bounds without NaN propagation', () => {
  assert.equal(computeHbotInspiredPo2MmHg(Number.NaN, Number.NaN), 1093)
  assert.equal(computeHbotInspiredPo2MmHg(5.0, 2.0), 2233) // clamped to 3.0 ATA, FiO2 1.0
  assert.equal(computePbmFluenceJcm2(-10, 600), 0)
  assert.equal(computePbmFluenceJcm2(80, Number.NaN), 0)
  assert.equal(computePbmFluenceJcm2(80, 600), 48)
})

test('analyzePrePostRecovery distinguishes protocol_reference vs recorded_delta and checks boundary warnings', () => {
  assert.equal(HOLISTIC_RECOVERY_MODALITIES.length, 5)

  const noPost = analyzePrePostRecovery({
    modalityId: 'whole_body_cryo',
    durationMin: 3,
    primaryValue: -120,
    pre: { hrvMs: 48, restingHr: 56 },
    post: {},
  })
  assert.equal(noPost.truthClass, 'protocol_reference')
  assert.equal(noPost.boundsStatus, 'within_reference_range')
  assert.equal(noPost.warnings.length, 0)
  assert.equal(noPost.clinicallyReviewed, false)
  assert.equal(noPost.deltaHrvMs, null)

  // PBM fluence boundary (>60 J/cm2 triggers caution_upper_bound)
  const highFluence = analyzePrePostRecovery({
    modalityId: 'red_light_pbm',
    durationMin: 15,
    primaryValue: 100, // 100 mW/cm2 * 900s / 1000 = 90 J/cm2 > 60
    pre: { hrvMs: 45, restingHr: 60 },
    post: { hrvMs: 52, restingHr: 57 },
  })
  assert.equal(highFluence.truthClass, 'recorded_delta')
  assert.equal(highFluence.boundsStatus, 'caution_upper_bound')
  assert.equal(highFluence.deltaHrvMs, 7)
  assert.equal(highFluence.deltaRestingHr, -3)
  assert.ok(highFluence.warnings.some((w) => w.includes('90 J/cm²')))
})

test('createRecoveryLedgerTransaction emits non-financial local digest (never Mastercard BIN 529910)', () => {
  const analysis = analyzePrePostRecovery({
    modalityId: 'hbot',
    durationMin: 60,
    primaryValue: 1.8,
    secondaryValue: 100,
    pre: { hrvMs: 40 },
    post: { hrvMs: 51 },
  })
  const tx = createRecoveryLedgerTransaction(
    'local:qa%40example.invalid',
    {
      modalityId: 'hbot',
      durationMin: 60,
      primaryValue: 1.8,
      secondaryValue: 100,
      pre: { hrvMs: 40 },
      post: { hrvMs: 51 },
    },
    analysis,
    '2026-11-16T10:00:00.000Z',
  )
  assert.equal(tx.clinicallyReviewed, false)
  assert.equal(tx.luhnCheckValid, true)
  assert.ok(tx.sessionDigest.startsWith('LOG-'))
  assert.ok(tx.emvReceiptToken.startsWith('LOG-'))
  assert.equal(tx.emvReceiptToken.includes('5299'), false, 'must not fabricate card-network BIN tokens')
})

test('recoveryLedgerStorage isolates entries per signed-in session and fails closed on missing/expired session', () => {
  mem.clear()
  assert.deepEqual(readRecoveryLedger(), [], 'unauthenticated session reads empty ledger')

  const now = Date.now()
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({
    loginAt: now,
    account: { id: 'acc-1', email: 'user1@example.invalid', role: 'pasien', patientId: 'pat-1' },
  }))

  const analysis = analyzePrePostRecovery({
    modalityId: 'x_cryo',
    durationMin: 4,
    primaryValue: -25,
    anatomicalSite: 'Achilles',
    pre: {},
    post: {},
  })
  const tx = createRecoveryLedgerTransaction('acc-1', {
    modalityId: 'x_cryo',
    durationMin: 4,
    primaryValue: -25,
    anatomicalSite: 'Achilles',
    pre: {},
    post: {},
  }, analysis, '2026-11-16T10:00:00.000Z')

  appendRecoveryLedgerEntry(tx)
  assert.equal(readRecoveryLedger().length, 1)

  // Switch to another user -> must fail closed and return 0
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({
    loginAt: now,
    account: { id: 'acc-2', email: 'user2@example.invalid', role: 'pasien', patientId: 'pat-2' },
  }))
  assert.deepEqual(readRecoveryLedger(), [], 'different account cannot read prior account recovery ledger')

  // Malformed session fails closed
  localStorage.setItem('panaceamed.session.v1', '{not-json')
  assert.deepEqual(readRecoveryLedger(), [])
})

test('edited UI surfaces keep >=44px touch targets, theme-safe WCAG contrast tokens, and honest labels', () => {
  const modalities = readFileSync('src/components/HolisticRecoveryModalities.tsx', 'utf8')
  const qrModal = readFileSync('src/components/QrHealthPassModal.tsx', 'utf8')
  const recoveryPage = readFileSync('src/pages/bodyhub/Recovery.tsx', 'utf8')
  const localHub = readFileSync('src/domains/body-exposure/ui/BodyExposureLocalHub.tsx', 'utf8')

  for (const [name, src] of [
    ['HolisticRecoveryModalities.tsx', modalities],
    ['QrHealthPassModal.tsx', qrModal],
  ] as const) {
    assert.doesNotMatch(src, /minHeight:\s*(?:[1-3]?\d|4[0-3])\b/, `${name} must not use inline minHeight < 44px`)
    assert.doesNotMatch(src, /color:\s*['"]#00BF63['"]/i, `${name} must use var(--teks-ok) instead of low-contrast #00BF63 foreground`)
    assert.doesNotMatch(src, /from\s+['"]\.\.\/domains\/identity\/localRecovery['"]/, `${name} must not statically import localRecovery`)
  }

  assert.doesNotMatch(modalities, /Computed Dose:/, 'HolisticRecoveryModalities must not claim computed clinical dosing')
  assert.doesNotMatch(modalities, /Verified Biometric Recovery Ledger|✓ LUHN/, 'HolisticRecoveryModalities must not claim Visa/LUHN clearinghouse verification')
  assert.doesNotMatch(modalities, /clinicians_reviewed/, 'HolisticRecoveryModalities keeps canonical clinically_reviewed spelling')
  assert.doesNotMatch(qrModal, /Next-Gen Identity & EMV Pass|EMV QR|EMV Payload/, 'QrHealthPassModal must not claim financial EMV card status')
  assert.doesNotMatch(localHub, /EMV QR & Barcode|Rotating EMV Pass|kartu EMVCo|ISO\/IEC 7812 Luhn Checksum PASS/)
  assert.match(recoveryPage, /min-h-\[44px\] flex-1 accent-brand/, 'Recovery ambient volume range input keeps >=44px touch target')
})
