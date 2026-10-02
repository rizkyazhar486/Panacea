import assert from 'node:assert/strict'
import {
  MUSCULOSKELETAL_REMODELING_BOUNDARY,
  MUSCULOSKELETAL_REMODELING_DEFAULTS,
  MUSCULOSKELETAL_REMODELING_PROVENANCE,
  deriveBoneRemodeling,
  normalizeBoneRemodelingInputs,
} from '../../src/lib/musculoskeletalBoneRemodelingLab.ts'

const baseline = deriveBoneRemodeling(MUSCULOSKELETAL_REMODELING_DEFAULTS)
for (const value of [baseline.resorptionSignal, baseline.formationSignal, baseline.couplingSignal, baseline.balanceSignal]) {
  assert.ok(Number.isFinite(value) && value >= 0 && value <= 1)
}
const lowRankl = deriveBoneRemodeling({ ...MUSCULOSKELETAL_REMODELING_DEFAULTS, ranklDrive: 0.2 })
const highRankl = deriveBoneRemodeling({ ...MUSCULOSKELETAL_REMODELING_DEFAULTS, ranklDrive: 0.9 })
assert.ok(highRankl.resorptionSignal > lowRankl.resorptionSignal)
const lowOpg = deriveBoneRemodeling({ ...MUSCULOSKELETAL_REMODELING_DEFAULTS, opgBrake: 0.1 })
const highOpg = deriveBoneRemodeling({ ...MUSCULOSKELETAL_REMODELING_DEFAULTS, opgBrake: 0.9 })
assert.ok(highOpg.resorptionSignal < lowOpg.resorptionSignal)
const normalized = normalizeBoneRemodelingInputs({ ranklDrive: 7, opgBrake: -2, osteoblastCapacity: Number.NaN })
assert.equal(normalized.ranklDrive, 1)
assert.equal(normalized.opgBrake, 0)
assert.equal(normalized.osteoblastCapacity, 0)
assert.ok(MUSCULOSKELETAL_REMODELING_PROVENANCE.some((source) => source.pmid === '29368538'))
assert.match(MUSCULOSKELETAL_REMODELING_BOUNDARY, /synthetic dimensionless/i)
assert.match(MUSCULOSKELETAL_REMODELING_BOUNDARY, /not.*diagnos/i)
console.log('musculoskeletal bone-remodeling lab: coupling direction, normalization, provenance and educational boundary locked')
