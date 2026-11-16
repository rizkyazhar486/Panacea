import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  TWENTY_FIVE_WEARABLE_CATALOG,
  buildVitalityBioScrollCards,
  computeLuhnCheckDigit,
  deriveTokenizedEmvPass,
  encodeCode128Pattern,
  encodeQrMatrix21,
  resolveWearableHubSnapshot,
  verifyLuhnCardNumber,
} from '../../src/domains/body-exposure/engine/localHubEngine.ts'

const gagal = (nama: string, fn: () => void) => {
  try { fn() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) }
}

// 1. 25-device catalog + zero invented metrics on empty input
gagal('katalog-25-perangkat-kosong-tetap-kosong', () => {
  assert.equal(TWENTY_FIVE_WEARABLE_CATALOG.length, 25)
  const snap = resolveWearableHubSnapshot({}, null)
  assert.equal(snap.totalCatalogDevices, 25)
  assert.equal(snap.devicesWithData, 0)
  assert.equal(snap.recordedSignalsCount, 0)
  assert.equal(snap.summaryVitals.hrBpm, null)
  assert.equal(snap.summaryVitals.hrvMs, null)
  assert.equal(snap.summaryVitals.spo2Pct, null)
  assert.equal(snap.summaryVitals.bpText, null)
})

// 2. Real positive vitals activate only matching devices
gagal('perangkat-aktif-hanya-untuk-sinyal-nyata', () => {
  const snap = resolveWearableHubSnapshot({ restingHr: 56, hrvMs: 68, spo2Pct: 98 }, null)
  assert.equal(snap.recordedSignalsCount, 3)
  const whoop = snap.devices.find((d) => d.device.id === 'W01_SHENZHEN_WHOOP_4')
  const bottle = snap.devices.find((d) => d.device.id === 'W24_SMART_BOTTLE')
  assert.equal(whoop?.hasRecordedSignal, true)
  assert.equal(bottle?.hasRecordedSignal, false)
  assert.equal(snap.summaryVitals.hrBpm, 56)
  assert.equal(snap.summaryVitals.hrvMs, 68)
})

// 3. EMV pass fails closed when unauthenticated
gagal('emv-pass-gagal-tertutup-tanpa-akun', () => {
  const res = deriveTokenizedEmvPass({ accountId: null, epochMs: 1_763_254_560_000 })
  assert.equal(res.ok, false)
  if (!res.ok) assert.equal(res.reason, 'unauthenticated')
})

// 4. EMV pass generates Luhn-valid dPAN and rotates every 15s bound to real account & allergies
gagal('emv-pass-luhn-valid-dan-rotasi-15-detik', () => {
  const base = {
    accountId: 'acc-real-123',
    accountName: 'Dr Rizky',
    mrn: 'MRN-2026-9981',
    role: 'dokter',
    allergies: ['Penicillin'],
    chronicConditions: [],
    epochMs: 1_763_254_560_000,
  }
  const a = deriveTokenizedEmvPass(base)
  const b = deriveTokenizedEmvPass({ ...base, epochMs: 1_763_254_576_000 })
  assert.equal(a.ok, true)
  assert.equal(b.ok, true)
  if (a.ok && b.ok) {
    assert.equal(verifyLuhnCardNumber(a.tokenizedDevicePanFull), true)
    assert.equal(computeLuhnCheckDigit(a.tokenizedDevicePanFull.slice(0, 15)), Number(a.tokenizedDevicePanFull[15]))
    assert.notEqual(a.arqcHex, b.arqcHex, 'token cryptogram must rotate across 15s windows')
    assert.equal(a.emergencyFacts.allergiesLabel, 'Penicillin')
    assert.equal(a.emergencyFacts.conditionsLabel, 'None recorded')
    assert.ok(!a.payloads.emergency.includes('O+'), 'never fabricate unrecorded blood group')
  }
})

// 5. QR 21x21 & Code-128 deterministic encoders
gagal('qr-21x21-dan-code128-deterministik', () => {
  const q1 = encodeQrMatrix21('PANACEA-A')
  const q2 = encodeQrMatrix21('PANACEA-B')
  assert.equal(q1.length, 21)
  assert.equal(q1[0].length, 21)
  assert.equal(q1[0][0], true, 'top-left finder corner present')
  assert.notDeepEqual(q1, q2)
  const c = encodeCode128Pattern('PM-1234-1000-888')
  assert.ok(c.bars.length > 20 && c.totalModules > 80)
})

// 6. Vitality Bio-Scrolling preserves empty/draft truth
gagal('vitality-cards-jujur-saat-kosong', () => {
  const ws = resolveWearableHubSnapshot({}, null)
  const emv = deriveTokenizedEmvPass({ accountId: null, epochMs: 1_763_254_560_000 })
  const cards = buildVitalityBioScrollCards({ wearableSnapshot: ws, emvPass: emv, longitudinal: null })
  assert.equal(cards.length, 3)
  assert.equal(cards[0].metrics[0].value, '—')
  assert.equal(cards[2].metrics[3].value, 'Draft only (false)')
})

// 7. React route wiring + vite.config allowedHosts
gagal('keterhubungan-vite-dan-rute-nyata', () => {
  const viteCfg = readFileSync('vite.config.ts', 'utf8')
  assert.ok(viteCfg.includes('allowedHosts: true'), 'vite.config.ts must allow panaceamed.id host')
  const route = readFileSync('src/app/BodyExposureAtlasRoute.tsx', 'utf8')
  assert.ok(route.includes('BodyExposureLocalHub'), 'BodyExposureAtlasRoute must integrate BodyExposureLocalHub')
  const bos = readFileSync('src/pages/bodyhub/BodyExposureOS.tsx', 'utf8')
  assert.ok(bos.includes('BodyExposureLocalHub'), 'BodyExposureOS must integrate BodyExposureLocalHub')
  const hp = readFileSync('src/pages/bodyhub/HealthProfile.tsx', 'utf8')
  assert.ok(hp.includes('BodyExposureLocalHub'), 'HealthProfile Data tab must integrate BodyExposureLocalHub')
})

console.log('body-exposure-local-hub: 7/7 unit & wiring assertions PASS.')
