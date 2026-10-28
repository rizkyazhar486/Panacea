import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSync } from 'esbuild'

const load = async name => {
  const { outputFiles } = buildSync({ entryPoints: [`src/domains/scientific-research/model/${name}.ts`], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}
const { CASCADE_GRAPH, SCIENTIFIC_SOURCES, validateScientificGraph } = await load('scientificGraph')
const { runCascade, firstCrossing } = await load('ischemiaCascade')
const { rk4, seededEulerMaruyama } = await load('numerics')
const parameters = { delivery: 0.2, responseGain: 0.4, reperfusion: true }
const copy = () => structuredClone(CASCADE_GRAPH)
const decay = step => rk4({ initial: [1], start: 0, end: 2, step, drift: (_t, [x]) => [-x] }).at(-1).state[0]

test('curated graph retains provenance, explicit gaps and no fabricated numerical confidence', () => {
  assert.deepEqual(validateScientificGraph(CASCADE_GRAPH), [])
  assert.equal(CASCADE_GRAPH.nodes.length, 8)
  assert.ok(CASCADE_GRAPH.nodes.every(n => n.ontology === null && n.unit === null))
  assert.ok(CASCADE_GRAPH.edges.every(e => e.confidence === null && e.temporalLag === null))
  assert.equal(CASCADE_GRAPH.nodes.find(n => n.id === 'clinical').evidenceStatus, 'UNKNOWN')
  assert.equal(CASCADE_GRAPH.edges.find(e => e.id === 'inflammation-organ').relationshipType, 'unknown')
  assert.equal(new Set(SCIENTIFIC_SOURCES.map(s => s.doi)).size, 4)
})
for (const [name, mutate, reason] of [
  ['duplicate node', g => g.nodes.push(g.nodes[0]), 'DUPLICATE_OR_MISSING_NODE_ID'],
  ['duplicate edge', g => g.edges.push(g.edges[0]), 'DUPLICATE_OR_MISSING_EDGE_ID'],
  ['dangling edge', g => { g.edges[0].target = 'invented' }, 'DANGLING_EDGE'],
  ['missing reference', g => { g.nodes[0].provenance = [] }, 'INVALID_NODE_PROVENANCE'],
  ['fabricated reference', g => { g.edges[0].evidenceReferences = ['not-a-source'] }, 'INVALID_EDGE_PROVENANCE'],
  ['missing evidence', g => { g.edges[0].evidenceReferences = [] }, 'INVALID_EDGE_PROVENANCE'],
  ['association promoted to cause', g => { g.edges[0].relationshipType = 'statistical-association' }, 'UNSUPPORTED_CAUSAL_ESCALATION'],
  ['unknown promoted to cause', g => { g.edges[0].relationshipType = 'unknown' }, 'UNSUPPORTED_CAUSAL_ESCALATION'],
  ['missing limitations', g => { delete g.edges[0].doesNotImply }, 'EDGE_MISSING_doesNotImply'],
  ['missing uncertainty', g => { g.nodes[0].uncertainty = '' }, 'NODE_MISSING_uncertainty'],
  ['nonfinite confidence', g => { g.edges[0].confidence = NaN }, 'INVALID_CONFIDENCE'],
  ['invalid confidence', g => { g.edges[0].confidence = 1.01 }, 'INVALID_CONFIDENCE'],
  ['negative delay', g => { g.edges[0].temporalLag = -1 }, 'INVALID_LAG'],
  ['invented confidence', g => { g.edges[0].confidence = 0.99 }, 'UNSOURCED_QUANTIFICATION'],
  ['invented delay', g => { g.edges[0].temporalLag = 1 }, 'UNSOURCED_QUANTIFICATION'],
  ['promoted organ translation', g => { Object.assign(g.edges.find(e => e.id === 'inflammation-organ'), { relationshipType: 'experimental-mechanism', direction: 'source-to-target', effectSign: 'increases' }) }, 'UNVALIDATED_TRANSLATION'],
]) test(`graph rejects ${name}`, () => { const g = copy(); mutate(g); assert.ok(validateScientificGraph(g).includes(reason)) })

test('associations remain representable without a causal arrow or effect sign', () => {
  const g = copy()
  Object.assign(g.edges[0], { relationshipType: 'statistical-association', direction: 'unresolved', effectSign: 'unknown' })
  assert.deepEqual(validateScientificGraph(g), [])
  for (const bad of [null, {}, { nodes: [], edges: [] }, { nodes: [null], edges: [null] }]) assert.ok(validateScientificGraph(bad).length)
})

test('RK4 matches analytic exponential decay and converges at fourth order', () => {
  const coarse = Math.abs(decay(0.5) - Math.exp(-2))
  const fine = Math.abs(decay(0.25) - Math.exp(-2))
  assert.ok(fine < 0.00002)
  assert.ok(coarse / fine > 12, `convergence ratio ${coarse / fine}`)
})
test('RK4 solves a coupled oscillator and includes the exact final time', () => {
  const points = rk4({ initial: [1, 0], start: 0, end: Math.PI / 2, step: 0.03, drift: (_t, [x, y]) => [y, -x] })
  assert.equal(points.at(-1).t, Math.PI / 2)
  assert.ok(Math.abs(points.at(-1).state[0]) < 1e-6)
  assert.ok(Math.abs(points.at(-1).state[1] + 1) < 1e-6)
})
for (const [name, options, reason] of [
  ['zero step', { step: 0 }, 'INVALID_INTEGRATION_INTERVAL'],
  ['negative step', { step: -0.1 }, 'INVALID_INTEGRATION_INTERVAL'],
  ['nonfinite end', { end: Infinity }, 'INVALID_INTEGRATION_INTERVAL'],
  ['empty state', { initial: [] }, 'DIMENSION_BUDGET'],
  ['nonfinite state', { initial: [NaN] }, 'NONFINITE_OR_MISMATCHED_VECTOR'],
  ['unbounded work', { step: 1e-10 }, 'STEP_BUDGET'],
  ['dimension mismatch', { drift: () => [0, 0] }, 'NONFINITE_OR_MISMATCHED_VECTOR'],
  ['nonfinite derivative', { drift: () => [Infinity] }, 'NONFINITE_OR_MISMATCHED_VECTOR'],
]) test(`both solvers reject ${name}`, () => {
  const p = { initial: [1], start: 0, end: 1, step: 0.1, drift: () => [0], ...options }
  assert.throws(() => rk4(p), new RegExp(reason))
  assert.throws(() => seededEulerMaruyama({ ...p, diffusion: () => [0], seed: 1 }), new RegExp(reason))
})
test('seeded stochastic integration is reproducible, seed-sensitive and distinct from RK4', () => {
  const p = { initial: [0], start: 0, end: 1, step: 0.01, drift: () => [0], diffusion: () => [1], seed: 42 }
  assert.deepEqual(seededEulerMaruyama(p), seededEulerMaruyama(p))
  assert.notDeepEqual(seededEulerMaruyama(p), seededEulerMaruyama({ ...p, seed: 43 }))
  const zeroNoise = seededEulerMaruyama({ ...p, diffusion: () => [0], drift: () => [2] })
  assert.deepEqual(zeroNoise, rk4({ ...p, drift: () => [2] }))
  assert.throws(() => seededEulerMaruyama({ ...p, diffusion: () => [NaN] }), /NONFINITE_OR_MISMATCHED_VECTOR/)
  for (const seed of [-1, NaN, 0.5, 4294967296]) assert.throws(() => seededEulerMaruyama({ ...p, seed }), /INVALID_SEED/)
})
test('seeded Brownian increments have the expected ensemble mean and variance', () => {
  // Ensemble deterministik menguji skala sqrt(h), tanpa uji acak yang labil.
  const values = Array.from({ length: 2000 }, (_, seed) => seededEulerMaruyama({ initial: [0], start: 0, end: 0.25, step: 0.25, drift: () => [0], diffusion: () => [1], seed }).at(-1).state[0])
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  assert.ok(Math.abs(mean) < 0.04)
  assert.ok(variance > 0.22 && variance < 0.28, `variance ${variance}`)
})
test('baseline remains at equilibrium; disturbance changes only toy indices', () => {
  const baseline = runCascade({ ...parameters, delivery: 1 })
  assert.ok(baseline.points.every(p => p.reserve === 1 && p.stress === 0 && p.response === 0))
  const run = runCascade(parameters)
  assert.deepEqual(run, runCascade(parameters))
  assert.equal(run.points.length, 241)
  assert.equal(run.points.at(-1).t, 24)
  assert.ok(run.points.filter(p => p.t <= 4).every(p => p.reserve === 1 && p.stress === 0))
  assert.ok(run.points.find(p => p.t === 12).stress > 0.3)
  assert.ok(run.points.at(-1).reserve > run.points.find(p => p.t === 12).reserve)
  assert.equal(run.mode, 'illustrative')
  assert.equal(run.timeUnit, 'model-time')
  assert.equal(run.clinically_reviewed, false)
  assert.ok(!('atp' in run.points[0]) && !('organFunction' in run.points[0]))
})
test('no-restoration scenario differs and sensitivity encloses only the chosen response', () => {
  const restored = runCascade(parameters)
  const ongoing = runCascade({ ...parameters, reperfusion: false })
  assert.ok(ongoing.points.at(-1).stress > restored.points.at(-1).stress)
  for (let i = 0; i < restored.points.length; i++) {
    const p = restored.points[i], band = restored.sensitivity[i]
    assert.ok(band.low <= p.response + 1e-14 && band.high >= p.response - 1e-14)
  }
  for (const delivery of [0, 1]) for (const responseGain of [0, 1]) for (const reperfusion of [false, true]) {
    assert.ok(runCascade({ delivery, responseGain, reperfusion }).points.every(p => [p.reserve, p.stress, p.response].every(v => Number.isFinite(v) && v >= 0 && v <= 1)))
  }
})
test('invalid scenario inputs fail closed instead of being clamped or defaulted', () => {
  for (const value of [NaN, Infinity, -0.01, 1.01, '0.2', null, undefined]) for (const key of ['delivery', 'responseGain']) {
    assert.throws(() => runCascade({ ...parameters, [key]: value }), /INVALID_CASCADE_PARAMETERS/)
  }
  assert.throws(() => runCascade({ ...parameters, reperfusion: 'true' }), /INVALID_CASCADE_PARAMETERS/)
  assert.throws(() => runCascade({ ...parameters, patientId: 'synthetic-no-patient-identity' }), /INVALID_CASCADE_PARAMETERS/)
})
test('threshold crossing is interpolated, absent stays null and invalid series is rejected', () => {
  const points = [0, 1, 2].map(t => ({ t, reserve: 1, stress: t / 2, response: 0 }))
  assert.equal(firstCrossing(points, 'stress', 0.25), 0.5)
  assert.equal(firstCrossing(points, 'stress', 0), 0)
  assert.equal(firstCrossing(points, 'response', 0.5), null)
  assert.throws(() => firstCrossing(points, 'stress', NaN), /INVALID_THRESHOLD_INPUT/)
  assert.throws(() => firstCrossing([...points, { ...points[0], t: 0 }], 'stress', 0), /INVALID_THRESHOLD_SERIES/)
  assert.throws(() => firstCrossing([{ ...points[0], stress: NaN }], 'stress', 0.5), /INVALID_THRESHOLD_SERIES/)
  assert.equal(firstCrossing([{ ...points[0], t: -1e308 }, { ...points[2], t: 1e308 }], 'stress', 0.5), 0)
})
