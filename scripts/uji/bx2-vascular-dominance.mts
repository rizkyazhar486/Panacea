import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AHA17_CORONARY_TERRITORY_TABLE,
  ATLAS_REFERENCE_LABEL,
  evaluateAHA17PerfusionBurden,
  mapCoronaryToAHA17,
} from '../../src/domains/body-exposure/engine/vascularTerritoryEngine.ts'

// Dipindah dari bx2-vascular-territory.test.mjs, yang tidak dijalankan runner mana pun (uji hanya menjalankan .mts) dan mengunci kolom
// dominansi kiri/ko-dominan tanpa sumber (berlabel 'abstract' padahal rekaman PubMed Cerqueira 2002 tidak punya abstrak).

test('BX-2 1. Golden case: the sourced default AHA assignment (right-dominant anatomy) partitions segments 1..17', () => {
  const rcaRight = mapCoronaryToAHA17('RCA', 'right')
  assert.strictEqual(rcaRight.ok, true)
  assert.strictEqual(rcaRight.artery, 'RCA')
  assert.strictEqual(rcaRight.chosenVariant, 'right')
  assert.strictEqual(rcaRight.dominanceVariant, 'right')
  assert.strictEqual(rcaRight.truthClass, 'reference')
  assert.strictEqual(rcaRight.label, ATLAS_REFERENCE_LABEL)
  assert.deepStrictEqual(rcaRight.segments, [3, 4, 9, 10, 15])
  assert.strictEqual(rcaRight.coverageFraction, 5 / 17)
  assert.strictEqual(rcaRight.source.verifiedFrom, 'reference-table')
  assert.match(rcaRight.source.citation, /PMC6932424/)
  assert.match(rcaRight.source.citation, /no PubMed abstract/)

  assert.deepStrictEqual(mapCoronaryToAHA17('LCX', 'right').segments, [5, 6, 11, 12, 16])
  assert.deepStrictEqual(mapCoronaryToAHA17('LAD', 'right').segments, [1, 2, 7, 8, 13, 14, 17])
  const combined = ['LAD', 'RCA', 'LCX'].flatMap((a) => mapCoronaryToAHA17(a, 'right').segments).sort((a, b) => a - b)
  assert.deepStrictEqual(combined, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
})

test('BX-2 2. Paired: changing only dominance to left or co-dominant refuses as unsourced; unknown shows the sourced column and no invented ones', () => {
  for (const dominance of ['left', 'codominant'] as const) {
    for (const artery of ['LAD', 'RCA', 'LCX']) {
      const r = mapCoronaryToAHA17(artery, dominance)
      assert.strictEqual(r.ok, false, `${artery}/${dominance}`)
      assert.strictEqual(r.reason, 'source-not-verified')
      assert.deepStrictEqual(r.segments, [], 'no segments are guessed')
      assert.strictEqual(r.chosenVariant, null)
      assert.match(r.detail, /Ortiz-Pérez 2008/)
    }
  }
  const unknown = mapCoronaryToAHA17('RCA', 'unknown')
  assert.strictEqual(unknown.ok, true)
  assert.strictEqual(unknown.chosenVariant, null)
  assert.deepStrictEqual(unknown.segments, [])
  assert.strictEqual(unknown.coverageFraction, 0)
  assert.deepStrictEqual(unknown.allVariants, { right: [3, 4, 9, 10, 15], left: null, codominant: null })
  assert.ok(unknown.ok && unknown.limitations.some((l) => /not shown: no source table/.test(l)))
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
    dominance: 'right',
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

test('BX-2 6. Perfusion burden refuses an unsourced dominance instead of computing on invented columns', () => {
  const r = evaluateAHA17PerfusionBurden({ artery: 'LCX', dominance: 'left', segmentDeficits: { 4: 1, 10: 1, 15: 1 } })
  assert.strictEqual(r.ok, false)
  assert.strictEqual(r.reason, 'source-not-verified')
})

