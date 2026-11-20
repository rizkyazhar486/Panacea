import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import {
  buildNeonOutboxEvent,
  evaluateGtaCharacterPersonification,
  evaluateLongeviumCounterfactual,
} from '../../src/domains/character/gtaCharacterPersonificationEngine.ts'
import { evaluateFasciaKineticChain } from '../../src/domains/body-exposure/fasciaKineticChainEngine.ts'
import { validateSchemaLocally } from '../db/push-neon.mjs'

test('GTA 6 character personification engine: deterministic cores, morph, QR/Barcode pass, and fail-closed bounds', () => {
  const res = evaluateGtaCharacterPersonification({
    profileKey: 'rizkyazhar486',
    mrn: 'PMD-000486',
    heightCm: 173,
    weightKg: 68,
    bodyFatPct: 16,
    restingHrBpm: 58,
    hrvMs: 74,
    vo2max: 52,
    dailySteps: 9200,
    sleepHours: 7.8,
    hydrationLiters: 2.4,
    posturalAlignment01: 0.82,
    turntablePreset: 'anterior',
  })
  assert.equal(res.ok, true)
  if (res.ok) {
    assert.equal(res.truthClass, 'estimated')
    assert.equal(res.clinicallyReviewed, false)
    assert.ok(res.cores.healthCore >= 70 && res.cores.healthCore <= 100)
    assert.ok(res.cores.staminaCore >= 70 && res.cores.staminaCore <= 100)
    assert.ok(res.cores.focusCore >= 70 && res.cores.focusCore <= 100)
    assert.equal(res.needs.hydrationStatus, 'optimal')
    assert.equal(res.morph.leanMassPct, 84)
    assert.match(res.qrPassPayload, /^PANACEA-PASS-V1\|PMD-000486\|rizkyazhar486\|R\d+\|[0-9A-F]{8}$/)
    assert.match(res.barcodePayload, /^PMD-000486-[0-9A-F]{4}$/)
    // Determinism check
    const res2 = evaluateGtaCharacterPersonification({
      profileKey: 'rizkyazhar486',
      mrn: 'PMD-000486',
      heightCm: 173,
      weightKg: 68,
      bodyFatPct: 16,
      restingHrBpm: 58,
      hrvMs: 74,
      vo2max: 52,
      dailySteps: 9200,
      sleepHours: 7.8,
      hydrationLiters: 2.4,
      posturalAlignment01: 0.82,
      turntablePreset: 'anterior',
    })
    assert.deepEqual(res, res2)
  }

  // Negative & boundary fail-closed checks
  assert.equal(evaluateGtaCharacterPersonification({ profileKey: 'a', heightCm: Number.NaN, weightKg: 68 }).ok, false)
  assert.equal(evaluateGtaCharacterPersonification({ profileKey: 'a', heightCm: 173, weightKg: -5 }).ok, false)
  assert.equal(evaluateGtaCharacterPersonification({ profileKey: 'a', heightCm: 173, weightKg: 68, bodyFatPct: 95 }).ok, false)
  assert.equal(evaluateGtaCharacterPersonification({ profileKey: 'a', heightCm: 173, weightKg: 68, posturalAlignment01: 1.5 }).ok, false)
})

test('Longevium counterfactual simulator & Neon outbox event builder stay pure and simulated', () => {
  const cf = evaluateLongeviumCounterfactual({
    chronologicalAgeYears: 32,
    biologicalAgeYears: 34.5,
    cardiovascularRiskPct: 7.4,
    metabolicRiskPct: 11.2,
    hsCrpMgL: 1.85,
    interventions: ['weight_recomp', 'sleep_lock', 'zone2_resistance'],
  })
  assert.equal(cf.ok, true)
  if (cf.ok) {
    assert.equal(cf.truthClass, 'simulated')
    assert.equal(cf.clinicallyReviewed, false)
    assert.equal(cf.rows.length, 4)
    for (const row of cf.rows) {
      assert.ok(row.afterValue < row.nowValue, `${row.marker} should improve under positive simulated interventions`)
    }
  }
  assert.equal(
    evaluateLongeviumCounterfactual({
      chronologicalAgeYears: 10,
      biologicalAgeYears: 30,
      cardiovascularRiskPct: 5,
      metabolicRiskPct: 5,
      hsCrpMgL: 1,
      interventions: [],
    }).ok,
    false,
  )

  const ev = buildNeonOutboxEvent({
    profileKey: 'rizkyazhar486',
    entityType: 'panacea_profiles',
    payload: { fullName: 'dr. Rizky Muhammad Azrissal' },
    createdAtIso: '2026-11-19T08:00:00.000Z',
  })
  assert.equal(ev.status, 'pending')
  assert.match(ev.eventId, /^NEON-[0-9A-F]{8}$/)
})

test('Feet-to-Face Fascia Kinetic Chain engine enforces simulated truthClass & non-osteogenesis boundary', () => {
  const comp = evaluateFasciaKineticChain({
    plantarArchActivation01: 0.25,
    rotationalThoracicMobility01: 0.3,
    palatalTonguePosture01: 0.2,
    facialMyofascialRelease01: 0.25,
  })
  const aligned = evaluateFasciaKineticChain({
    plantarArchActivation01: 0.9,
    rotationalThoracicMobility01: 0.85,
    palatalTonguePosture01: 0.88,
    facialMyofascialRelease01: 0.82,
  })
  assert.equal(comp.regime, 'compensated')
  assert.equal(aligned.regime, 'aligned')
  assert.equal(aligned.truthClass, 'simulated')
  assert.match(aligned.epistemicNotice, /not adult cranial bone osteogenesis/i)
  assert.equal(aligned.superficialFrontLine.length, 7)
  assert.equal(aligned.protocolSteps.length, 4)
  assert.ok(aligned.metrics.plantarArchStabilityPct > comp.metrics.plantarArchStabilityPct)
  assert.ok(aligned.metrics.submentalSoftTissueLiftPct > comp.metrics.submentalSoftTissueLiftPct)
})

test('Domain purity guard: GTA character & Fascia engines contain zero forbidden browser/clock/random globals', () => {
  for (const relPath of [
    'src/domains/character/gtaCharacterPersonificationEngine.ts',
    'src/domains/body-exposure/fasciaKineticChainEngine.ts',
  ]) {
    const raw = readFileSync(relPath, 'utf8')
    const codeOnly = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.doesNotMatch(codeOnly, /\b(window|document|localStorage|sessionStorage|Math\.random|Date\.now|fetch)\b/, `${relPath} violated domain purity`)
    assert.doesNotMatch(codeOnly, /new\s+Date\s*\(\s*\)/, `${relPath} called new Date() without injected timestamp`)
  }
})

test('Neon schema & push-neon --dry-run verify all 12 idempotent tables and canonical seed without secrets', () => {
  const schemaCheck = validateSchemaLocally()
  assert.equal(schemaCheck.ok, true)
  assert.equal(schemaCheck.tableCount, 12)
  const out = execFileSync(process.execPath, ['scripts/db/push-neon.mjs', '--dry-run'], { encoding: 'utf8' })
  const parsed = JSON.parse(out)
  assert.equal(parsed.status, 'SCHEMA_AND_SEED_VERIFIED')
  assert.equal(parsed.tableCount, 12)
})
