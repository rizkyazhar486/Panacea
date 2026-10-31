import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AHA17_CORONARY_TERRITORY_TABLE,
  ATLAS_REFERENCE_LABEL,
  evaluateAHA17PerfusionBurden,
  mapCoronaryToAHA17,
} from '../../src/domains/body-exposure/index.ts'

test('BX-2 1. Golden case: right, left, and codominant AHA-17 territories match cited table and partition segments 1..17', () => {
  const rcaRight = mapCoronaryToAHA17('RCA', 'right')
  assert.strictEqual(rcaRight.ok, true)
  assert.strictEqual(rcaRight.artery, 'RCA')
  assert.strictEqual(rcaRight.chosenVariant, 'right')
  assert.strictEqual(rcaRight.dominanceVariant, 'right')
  assert.strictEqual(rcaRight.truthClass, 'reference')
  assert.strictEqual(rcaRight.label, ATLAS_REFERENCE_LABEL)
  assert.deepStrictEqual(rcaRight.segments, [3, 4, 9, 10, 15])
  assert.strictEqual(rcaRight.coverageFraction, 5 / 17)

  const lcxRight = mapCoronaryToAHA17('LCX', 'right')
  assert.strictEqual(lcxRight.ok, true)
  assert.deepStrictEqual(lcxRight.segments, [5, 6, 11, 12, 16])

  const ladRight = mapCoronaryToAHA17('LAD', 'right')
  assert.strictEqual(ladRight.ok, true)
  assert.deepStrictEqual(ladRight.segments, [1, 2, 7, 8, 13, 14, 17])

  for (const dominance of ['right', 'left', 'codominant']) {
    const combined = [
      ...mapCoronaryToAHA17('LAD', dominance).segments,
      ...mapCoronaryToAHA17('RCA', dominance).segments,
      ...mapCoronaryToAHA17('LCX', dominance).segments,
    ].sort((a, b) => a - b)
    assert.deepStrictEqual(
      combined,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    )
  }
})

test('BX-2 2. Paired test: changing only dominance from right to left or unknown shifts inferior PDA segments without choosing a variant on unknown', () => {
  const goldenRight = mapCoronaryToAHA17('RCA', 'right')
  const pairedLeft = mapCoronaryToAHA17('RCA', 'left')
  const pairedUnknown = mapCoronaryToAHA17('RCA', 'unknown')

  assert.strictEqual(goldenRight.ok, true)
  assert.strictEqual(pairedLeft.ok, true)
  assert.strictEqual(pairedUnknown.ok, true)

  assert.deepStrictEqual(goldenRight.segments, [3, 4, 9, 10, 15])
  assert.deepStrictEqual(pairedLeft.segments, [3, 9])

  assert.strictEqual(pairedUnknown.chosenVariant, null)
  assert.strictEqual(pairedUnknown.dominanceVariant, 'unknown')
  assert.deepStrictEqual(pairedUnknown.segments, [])
  assert.strictEqual(pairedUnknown.coverageFraction, 0)
  assert.deepStrictEqual(pairedUnknown.allVariants, {
    right: [3, 4, 9, 10, 15],
    left: [3, 9],
    codominant: [3, 4, 9, 10],
  })
})

test('BX-2 3. Boundary +-epsilon: evaluateAHA17PerfusionBurden accepts exact [0, 1] bounds and rejects -epsilon and 1+epsilon', () => {
  const eps = 1e-6

  const atZeroAndOne = evaluateAHA17PerfusionBurden({
    artery: 'RCA',
    dominance: 'right',
    segmentDeficits: { 3: 0, 4: 1, 9: eps, 10: 1 - eps },
  })
  assert.strictEqual(atZeroAndOne.ok, true)
  assert.deepStrictEqual(atZeroAndOne.matchedSegments, [4, 9, 10])
  assert.strictEqual(atZeroAndOne.hitCount, 3)
  assert.strictEqual(atZeroAndOne.territoryDeficitSum, 2)
  assert.strictEqual(atZeroAndOne.territoryMeanDeficit, 2 / 5)
  assert.strictEqual(atZeroAndOne.totalMyocardialFraction, 2 / 17)
  assert.strictEqual(atZeroAndOne.truthClass, 'derived')

  const belowZero = evaluateAHA17PerfusionBurden({
    artery: 'RCA',
    dominance: 'right',
    segmentDeficits: { 3: -eps },
  })
  assert.strictEqual(belowZero.ok, false)
  assert.strictEqual(belowZero.reason, 'invalid-input')

  const aboveOne = evaluateAHA17PerfusionBurden({
    artery: 'RCA',
    dominance: 'right',
    segmentDeficits: { 3: 1 + eps },
  })
  assert.strictEqual(aboveOne.ok, false)
  assert.strictEqual(aboveOne.reason, 'invalid-input')
})

test('BX-2 4. Invalid inputs: NaN, Infinity, unknown artery/dominance, out-of-range segment IDs, and inverted ranges fail closed', () => {
  const nanWeight = evaluateAHA17PerfusionBurden({
    artery: 'LAD',
    dominance: 'right',
    segmentDeficits: { 1: Number.NaN },
  })
  assert.strictEqual(nanWeight.ok, false)
  assert.strictEqual(nanWeight.reason, 'invalid-input')

  const infWeight = evaluateAHA17PerfusionBurden({
    artery: 'LAD',
    dominance: 'right',
    segmentDeficits: { 1: Number.POSITIVE_INFINITY },
  })
  assert.strictEqual(infWeight.ok, false)
  assert.strictEqual(infWeight.reason, 'invalid-input')

  const unknownArtery = mapCoronaryToAHA17('FEMORAL', 'right')
  assert.strictEqual(unknownArtery.ok, false)
  assert.strictEqual(unknownArtery.reason, 'unknown-artery')

  const badSegmentId = evaluateAHA17PerfusionBurden({
    artery: 'LAD',
    dominance: 'right',
    segmentDeficits: { 18: 0.5 },
  })
  assert.strictEqual(badSegmentId.ok, false)
  assert.strictEqual(badSegmentId.reason, 'invalid-input')

  const invertedRange = evaluateAHA17PerfusionBurden({
    artery: 'LAD',
    dominance: 'right',
    segmentDeficits: { 1: 0.5 },
    weightRange: [0.8, 0.2],
  })
  assert.strictEqual(invertedRange.ok, false)
  assert.strictEqual(invertedRange.reason, 'inverted-range')
})

test('BX-2 5. No-hit and unverified source table: disjoint deficits return 0 hits and unverified table returns source-not-verified', () => {
  const noHit = evaluateAHA17PerfusionBurden({
    artery: 'RCA',
    dominance: 'left',
    segmentDeficits: { 1: 1, 2: 0.5, 17: 1 },
  })
  assert.strictEqual(noHit.ok, true)
  assert.strictEqual(noHit.hitCount, 0)
  assert.deepStrictEqual(noHit.matchedSegments, [])
  assert.strictEqual(noHit.territoryDeficitSum, 0)

  const unverifiedTable = {
    ...AHA17_CORONARY_TERRITORY_TABLE,
    LAD: {
      ...AHA17_CORONARY_TERRITORY_TABLE.LAD,
      source: {
        citation: 'Unverified draft table',
        section: 'N/A',
        verifiedFrom: 'unverified',
        tableVerified: false,
      },
    },
  }
  const unverifiedRes = mapCoronaryToAHA17('LAD', 'right', { table: unverifiedTable })
  assert.strictEqual(unverifiedRes.ok, false)
  assert.strictEqual(unverifiedRes.reason, 'source-not-verified')
})
