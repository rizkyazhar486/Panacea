import assert from 'node:assert/strict'
import { LYMPHATIC_EDUCATION_MODEL, deriveLymphaticTeachingState } from '../../src/lib/lymphaticFluidImmuneModel.ts'

assert.equal(LYMPHATIC_EDUCATION_MODEL.systemId, 'lymphatic')
assert.ok(LYMPHATIC_EDUCATION_MODEL.evidence.every((source) => /^\d+$/.test(source.pmid)))
assert.ok(LYMPHATIC_EDUCATION_MODEL.boundary.includes('not patient-specific'))

const baseline = deriveLymphaticTeachingState({ filtrationLoad: 0.5, collectingPump: 0.5, skeletalMotion: 0.5, nodalTransit: 0.5 })
const moreLoad = deriveLymphaticTeachingState({ filtrationLoad: 0.9, collectingPump: 0.5, skeletalMotion: 0.5, nodalTransit: 0.5 })
const morePump = deriveLymphaticTeachingState({ filtrationLoad: 0.5, collectingPump: 0.9, skeletalMotion: 0.5, nodalTransit: 0.5 })
const moreTransit = deriveLymphaticTeachingState({ filtrationLoad: 0.5, collectingPump: 0.5, skeletalMotion: 0.5, nodalTransit: 0.9 })

assert.ok(moreLoad.interstitialBurden > baseline.interstitialBurden)
assert.ok(morePump.returnCapacity > baseline.returnCapacity)
assert.ok(morePump.interstitialBurden < baseline.interstitialBurden)
assert.ok(moreTransit.immuneTransit > baseline.immuneTransit)
assert.ok(Object.values(moreLoad).every((value) => value >= 0 && value <= 1))

console.log('lymphatic fluid-immune model: ok')
