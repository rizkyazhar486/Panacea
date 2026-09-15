import assert from 'node:assert/strict'
import {
  RENAL_EVIDENCE,
  RENAL_HOMEOSTASIS_BOUNDARY,
  RENAL_HOMEOSTASIS_DEFAULTS,
  RENAL_TEACHING_EQUATIONS,
  deriveRenalHomeostasis,
  normalizeRenalHomeostasisInputs,
} from '../../src/lib/renalHomeostasisLab.ts'

const baseline = deriveRenalHomeostasis(RENAL_HOMEOSTASIS_DEFAULTS)
for (const [key, value] of Object.entries(baseline)) {
  if (key === 'dominantAxis') continue
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1, `${key} must remain a normalized 0–1 teaching signal`)
}

const lowPerfusion = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, perfusionDrive: 0.1 })
const highPerfusion = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, perfusionDrive: 0.9 })
assert.ok(highPerfusion.filtrationSignal > lowPerfusion.filtrationSignal, 'higher perfusion drive must raise filtration signal')

const lowCapacity = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, filtrationCapacity: 0.1 })
const highCapacity = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, filtrationCapacity: 0.9 })
assert.ok(highCapacity.filtrationSignal > lowCapacity.filtrationSignal, 'higher filtration capacity must raise filtration signal')

const lowSodium = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, sodiumReabsorption: 0.1 })
const highSodium = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, sodiumReabsorption: 0.9 })
assert.ok(highSodium.sodiumRetentionSignal > lowSodium.sodiumRetentionSignal, 'higher sodium reabsorption drive must raise sodium-retention signal')
assert.ok(highSodium.volumeConservationSignal > lowSodium.volumeConservationSignal, 'higher sodium reabsorption drive must raise volume-conservation signal')

const lowWater = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, waterReabsorption: 0.1 })
const highWater = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, waterReabsorption: 0.9 })
assert.ok(highWater.waterRetentionSignal > lowWater.waterRetentionSignal, 'higher water reabsorption drive must raise water-retention signal')
assert.ok(highWater.concentratingSignal > lowWater.concentratingSignal, 'higher water reabsorption drive must raise concentrating signal')

const lowRaas = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, raasDrive: 0.1 })
const highRaas = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, raasDrive: 0.9 })
assert.ok(highRaas.sodiumRetentionSignal > lowRaas.sodiumRetentionSignal, 'higher RAAS drive must raise sodium-retention signal')
assert.ok(highRaas.waterRetentionSignal > lowRaas.waterRetentionSignal, 'higher RAAS drive must raise water-retention signal')

const lowAcid = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, acidExcretion: 0.1 })
const highAcid = deriveRenalHomeostasis({ ...RENAL_HOMEOSTASIS_DEFAULTS, acidExcretion: 0.9 })
assert.ok(highAcid.acidBaseSupportSignal > lowAcid.acidBaseSupportSignal, 'higher synthetic acid-excretion support must raise acid-base support signal')

const normalized = normalizeRenalHomeostasisInputs({ perfusionDrive: 4, filtrationCapacity: -3, acidExcretion: Number.NaN })
assert.equal(normalized.perfusionDrive, 1)
assert.equal(normalized.filtrationCapacity, 0)
assert.equal(normalized.acidExcretion, 0)

for (const token of ['GFR ∝ Kf × net filtration pressure', 'filtered load = GFR × plasma concentration', 'excretion = filtration + secretion − reabsorption', 'Cₓ = Uₓ × V / Pₓ']) {
  assert.ok(RENAL_TEACHING_EQUATIONS.some((item) => item.expression === token), `formula ledger must preserve ${token}`)
}

assert.deepEqual(RENAL_EVIDENCE.map((item) => item.pmid), ['40700075', '40175029', '25502115'])
for (const source of RENAL_EVIDENCE) assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
assert.match(RENAL_HOMEOSTASIS_BOUNDARY, /synthetic dimensionless signals/i)
assert.match(RENAL_HOMEOSTASIS_BOUNDARY, /does not calculate measured or estimated GFR/i)
assert.match(RENAL_HOMEOSTASIS_BOUNDARY, /patient-specific diagnosis or treatment/i)

console.log('renal homeostasis lab: directional physiology, formula ledger, provenance and safety boundary locked')
