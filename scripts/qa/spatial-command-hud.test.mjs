import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  COMMAND_MODES,
  getCommandModeProfile,
  getRadialCommandDeck,
  buildEnsembleTelemetrySeries,
  solveHolotableCounterfactualTrajectories,
  buildKnowledgeConstellationGraph,
  buildDailyProtocolTimeline,
  buildSpatialNeonSnapshotEvent,
  buildCommandModePrefOutboxEvent,
} from '../../src/domains/spatial-os/index.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('spatial-os: all 5 CommandOperatingModes return distinct deterministic profiles and valid thresholds', () => {
  assert.deepEqual([...COMMAND_MODES], ['SLEEP', 'RECOVERY', 'LIFE', 'CLINICAL', 'FOCUS'])

  const seenIndices = new Set()
  for (const mode of COMMAND_MODES) {
    const a = getCommandModeProfile(mode)
    const b = getCommandModeProfile(mode)
    assert.deepEqual(a, b, `mode ${mode} must be strictly deterministic`)
    assert.equal(a.mode, mode)
    assert.equal(a.truthClass, 'curated_physiology')
    assert.ok(a.primaryWidgets.length > 0)
    assert.ok(a.thresholds.hrHighBpm >= 60 && a.thresholds.hrHighBpm <= 120)
    assert.ok(a.thresholds.spo2MinPct >= 90 && a.thresholds.spo2MinPct <= 99)
    assert.ok(!seenIndices.has(a.modeIndex), `duplicate modeIndex ${a.modeIndex}`)
    seenIndices.add(a.modeIndex)
  }
})

test('spatial-os: radial command deck exposes 5 top arc nodes and 8 indexed launcher slots (01-08)', () => {
  const deck = getRadialCommandDeck('CLINICAL')
  assert.equal(deck.mode, 'CLINICAL')
  assert.equal(deck.activeArcId, 'CLINICAL')
  assert.equal(deck.arcNodes.length, 5)
  assert.deepEqual(
    deck.arcNodes.map((n) => n.label),
    ['SYSTEM', 'MY BODY', 'MASTER', 'CLINICAL', '3D LAB'],
  )
  assert.equal(deck.arcNodes.filter((n) => n.active).length, 1)

  assert.equal(deck.launcherSlots.length, 8)
  assert.deepEqual(
    deck.launcherSlots.map((s) => `${s.index} ${s.label}`),
    [
      '01 PROFILE',
      '02 DIGITAL TWIN',
      '03 FASCIA',
      '04 VISIT OS',
      '05 LABS',
      '06 3D ATLAS',
      '07 WEARABLES',
      '08 NEON SYNC',
    ],
  )
  for (const slot of deck.launcherSlots) {
    assert.ok(slot.route.startsWith('/'), `route ${slot.route} must start with /`)
  }
})

test('spatial-os: ensemble telemetry preserves null for missing signals (never blank-to-zero)', () => {
  const empty = buildEnsembleTelemetrySeries([])
  assert.equal(empty.observedPointCount, 0)
  assert.equal(empty.latestEnsembleScore, null)
  assert.equal(empty.clinicallyReviewed, false)

  const series = buildEnsembleTelemetrySeries([
    { label: 'Mon', steps: null, sleepHours: undefined, restingHrBpm: null, hrvMs: null, vo2max: null, readinessCore: null },
    { label: 'Tue', steps: 9600, sleepHours: 7.8, restingHrBpm: 58, hrvMs: 68, vo2max: 48 },
    { label: 'Wed', steps: Number.NaN, sleepHours: 7.4, restingHrBpm: null, hrvMs: null, readinessCore: 82 },
  ])

  assert.equal(series.totalPointCount, 3)
  assert.equal(series.observedPointCount, 2)
  assert.equal(series.coveragePct, 67)
  assert.equal(series.clinicallyReviewed, false)

  // Missing day must remain strictly null across all channels, NEVER coerced to 0
  assert.equal(series.points[0].stepsNorm, null)
  assert.equal(series.points[0].sleepNorm, null)
  assert.equal(series.points[0].restingHrNorm, null)
  assert.equal(series.points[0].hrvNorm, null)
  assert.equal(series.points[0].ensembleScore, null)

  // Observed measured day stays bounded [0..100] and carries truthClass='measured'
  assert.equal(series.points[1].truthClass, 'measured')
  assert.ok(series.points[1].ensembleScore !== null && series.points[1].ensembleScore >= 0 && series.points[1].ensembleScore <= 100)

  // Mixed observed + GTA core day rejects NaN steps as null and marks 'estimated'
  assert.equal(series.points[2].stepsNorm, null)
  assert.equal(series.points[2].truthClass, 'estimated')
  assert.equal(series.points[2].gtaCoreNorm, 82)
})

test('spatial-os: holotable counterfactual solver computes bounded 3D curves with truthClass=simulated and fails closed on invalid inputs', () => {
  const invalid = solveHolotableCounterfactualTrajectories({
    chronologicalAgeYears: Number.NaN,
    baselineBiologicalAgeYears: 32,
    baselineCardiovascularRiskPct: 5,
    baselineMetabolicRiskPct: 8,
    baselineFasciaAlignmentPct: 62,
    activeLevers: ['sleep_lock'],
  })
  assert.equal(invalid.ok, false)

  const resA = solveHolotableCounterfactualTrajectories({
    chronologicalAgeYears: 32,
    baselineBiologicalAgeYears: 33.2,
    baselineCardiovascularRiskPct: 6.4,
    baselineMetabolicRiskPct: 9.2,
    baselineFasciaAlignmentPct: 60,
    baselineHrvMs: 54,
    baselineGaitRecoilPct: 62,
    baselineHsCrpMgL: 1.5,
    activeLevers: ['sleep_lock', 'zone2_cardio', 'fascia_decompression'],
    horizonMonths: 36,
  })
  const resB = solveHolotableCounterfactualTrajectories({
    chronologicalAgeYears: 32,
    baselineBiologicalAgeYears: 33.2,
    baselineCardiovascularRiskPct: 6.4,
    baselineMetabolicRiskPct: 9.2,
    baselineFasciaAlignmentPct: 60,
    baselineHrvMs: 54,
    baselineGaitRecoilPct: 62,
    baselineHsCrpMgL: 1.5,
    activeLevers: ['sleep_lock', 'zone2_cardio', 'fascia_decompression'],
    horizonMonths: 36,
  })

  assert.equal(resA.ok, true)
  assert.deepEqual(resA, resB, 'holotable trajectory solver must be deterministic')
  if (!resA.ok) return

  assert.equal(resA.truthClass, 'simulated')
  assert.equal(resA.clinicallyReviewed, false)
  assert.equal(resA.curve.length, 13)
  assert.equal(resA.deltas.length, 7)

  const start = resA.curve[0]
  const end = resA.curve[resA.curve.length - 1]
  assert.equal(start.month, 0)
  assert.equal(end.month, 36)
  assert.ok(end.optimizedBioAge < end.baselineBioAge, 'active levers should reduce simulated biological age drift')
  assert.ok(end.optimizedCvRiskPct < end.baselineCvRiskPct, 'active levers should reduce simulated CV risk')
  assert.ok(end.optimizedMetabolicRiskPct < end.baselineMetabolicRiskPct, 'active levers should reduce simulated metabolic risk')
  assert.ok(end.optimizedFasciaAlignmentPct > end.baselineFasciaAlignmentPct, 'fascia decompression should raise simulated alignment')
  assert.ok(end.bioAgeCiHigh - end.bioAgeCiLow > start.bioAgeCiHigh - start.bioAgeCiLow, 'confidence bounds must widen over horizon')
})

test('spatial-os: knowledge constellation, daily timeline, and Neon outbox builders enforce schema & truthClass', () => {
  const graph = buildKnowledgeConstellationGraph({
    restingHrBpm: 60,
    hrvMs: 66,
    sleepHours: 7.5,
    vo2max: 46,
    fasciaAlignmentPct: 72,
  })
  assert.ok(graph.nodes.length >= 10)
  assert.ok(graph.edges.length >= 10)
  assert.equal(graph.clinicallyReviewed, false)
  assert.ok(graph.nodes.every((n) => ['measured', 'estimated', 'simulated', 'curated_physiology'].includes(n.truthClass)))

  const timeline = buildDailyProtocolTimeline('RECOVERY')
  assert.ok(timeline.length >= 6)

  const snapEvent = buildSpatialNeonSnapshotEvent({
    profileKey: 'rizkyazhar486',
    mode: 'FOCUS',
    recordedAtIso: '2026-11-20T01:00:00.000Z',
    horizonMonths: 36,
    activeLevers: ['sleep_lock'],
    deltas: [],
  })
  assert.equal(snapEvent.table, 'panacea_digital_twin_snapshots')
  assert.equal(snapEvent.truthClass, 'simulated')
  assert.equal(snapEvent.clinicallyReviewed, false)
  assert.ok(snapEvent.id.startsWith('SNAP-'))

  const prefEvent = buildCommandModePrefOutboxEvent({
    profileKey: 'rizkyazhar486',
    mode: 'CLINICAL',
    recordedAtIso: '2026-11-20T01:00:00.000Z',
  })
  assert.equal(prefEvent.table, 'panacea_sync_outbox')
  assert.equal(prefEvent.clinicallyReviewed, false)
  assert.ok(prefEvent.id.startsWith('MODE-'))
})

test('spatial-os: strict purity invariant (zero DOM, storage, clock, RNG, or fetch calls)', () => {
  const engineFiles = [
    'src/domains/spatial-os/spatialCommandHudEngine.ts',
    'src/domains/spatial-os/index.ts',
  ]
  const forbidden = [
    /(?<![\w.$])window(?:\.[A-Za-z_$]|\[)/,
    /(?<![\w.$])document(?:\.[A-Za-z_$]|\[)/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /(?<![\w.$])fetch\s*\(/,
  ]

  for (const rel of engineFiles) {
    const raw = readFileSync(join(ROOT, rel), 'utf8')
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    for (const pattern of forbidden) {
      assert.equal(pattern.test(stripped), false, `${rel} violated purity rule ${pattern}`)
    }
  }
})
