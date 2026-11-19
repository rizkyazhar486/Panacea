import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  computeBinaryClassificationMetrics,
  computeBlandAltman,
  computeBrierScore,
  computeExpectedCalibrationError,
  computeValidationManifestSha256,
  evaluateEvidenceMaturity,
  verifyLongitudinalRepeatedMeasures,
} from '../../src/domains/science/reproducibleValidationEngine.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('reproducibleValidationEngine: computes Brier, ECE, zero-denominator null-safe confusion metrics & Bland-Altman', () => {
  // Positive Brier & ECE
  const brier = computeBrierScore([0.9, 0.1, 0.8, 0.2], [1, 0, 1, 0])
  assert.equal(brier.ok, true)
  if (brier.ok) assert.ok(Math.abs(brier.brierScore - 0.025) < 1e-4)

  const ece = computeExpectedCalibrationError([0.85, 0.15, 0.85, 0.15], [1, 0, 1, 0], 5)
  assert.equal(ece.ok, true)
  if (ece.ok) assert.ok(ece.ece >= 0 && ece.ece < 0.2)

  // Negative/boundary Brier failure
  assert.equal(computeBrierScore([1.2], [1]).ok, false)
  assert.equal(computeBrierScore([0.5], [2]).ok, false)

  // Zero-denominator classification returns explicit null, NEVER 0
  const zeroDen = computeBinaryClassificationMetrics({ tp: 0, fp: 0, tn: 10, fn: 2 })
  assert.equal(zeroDen.ok, true)
  if (zeroDen.ok) {
    assert.equal(zeroDen.ppv, null)
    assert.equal(zeroDen.specificity, 1)
  }

  // Bland-Altman fails closed for n < 3, computes exact bias/LoA for n >= 3
  assert.equal(computeBlandAltman([120, 130], [121, 131]).ok, false)
  const ba = computeBlandAltman([120, 125, 130, 135], [122, 126, 131, 137])
  assert.equal(ba.ok, true)
  if (ba.ok) {
    assert.equal(ba.bias, 1.5)
    assert.ok(ba.loaUpper > ba.bias && ba.loaLower < ba.bias)
  }

  const anova = verifyLongitudinalRepeatedMeasures(
    ['T0', 'T1', 'T2'],
    [
      [60, 68, 76],
      [62, 70, 78],
      [64, 72, 80],
    ],
  )
  assert.equal(anova.ok, true)
})

test('reproducibleValidationEngine: E3/E4 state machine fails closed without verified SHA-256 external manifest & n>=30', () => {
  const baseManifest = {
    datasetRef: 'physionet-study-v1',
    sampleSizeN: 120,
    ethicsApprovalRef: 'IRB-2026-0042',
    protocolVersion: '1.0.0',
    reproductionCommand: 'node scripts/qa/reproducible-validation.test.mjs',
  }
  const digest = computeValidationManifestSha256(baseManifest)

  // E3 granted only when canary passed + SHA-256 matches + n >= 30
  const granted = evaluateEvidenceMaturity({
    requestedTier: 'E3',
    internalCanaryPassed: true,
    externalValidationManifest: { ...baseManifest, manifestSha256: digest },
  })
  assert.equal(granted.grantedTier, 'E3')
  assert.equal(granted.validated, true)

  // Tampered hash fails closed to E2
  const tampered = evaluateEvidenceMaturity({
    requestedTier: 'E4',
    internalCanaryPassed: true,
    externalValidationManifest: { ...baseManifest, manifestSha256: 'deadbeef' },
  })
  assert.equal(tampered.grantedTier, 'E2')
  assert.equal(tampered.validated, false)

  // Small sample fails closed to E2
  const smallN = evaluateEvidenceMaturity({
    requestedTier: 'E3',
    internalCanaryPassed: true,
    externalValidationManifest: {
      ...baseManifest,
      sampleSizeN: 12,
      manifestSha256: computeValidationManifestSha256({ ...baseManifest, sampleSizeN: 12 }),
    },
  })
  assert.equal(smallN.grantedTier, 'E2')
  assert.equal(smallN.validated, false)

  // Failed internal canary drops to E0
  const canaryFail = evaluateEvidenceMaturity({
    requestedTier: 'E2',
    internalCanaryPassed: false,
  })
  assert.equal(canaryFail.grantedTier, 'E0')
})

test('Purity guard: reproducibleValidationEngine contains zero forbidden globals', () => {
  const raw = readFileSync(join(ROOT, 'src/domains/science/reproducibleValidationEngine.ts'), 'utf8')
  const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
  for (const pattern of [
    /(?<![\w.$])window(?:\.[A-Za-z_$]|\[)/,
    /(?<![\w.$])document(?:\.[A-Za-z_$]|\[)/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /(?<![\w.$])fetch\s*\(/,
  ]) {
    assert.equal(pattern.test(stripped), false, `Purity violation: ${pattern}`)
  }
})
