import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CARDIOVASCULAR_SPEC,
  buildConceptGraph,
} from '../../src/domains/biological-concept-graph/index.ts'
import {
  CARDIOVASCULAR_CATALOG,
  HEART_FAILURE_CASE,
  searchEducationalUniverse,
  parseSearchQuery,
  tokenize,
} from '../../src/domains/prometheus-learning/index.ts'

const { graph } = buildConceptGraph(CARDIOVASCULAR_SPEC)
const catalog = CARDIOVASCULAR_CATALOG
const cases = [HEART_FAILURE_CASE]

test('tokenize: normalizes text into lower-case clean tokens', () => {
  assert.deepEqual(tokenize('Left Ventricle (LV) & CO-2!'), ['left', 'ventricle', 'lv', 'co', '2'])
})

test('parseSearchQuery: extracts facets and preserves clean query', () => {
  const parsed = parseSearchQuery('scale:cell calcium spark kind:teachable_figure ref:bers-2002')
  assert.equal(parsed.cleanQuery, 'calcium spark')
  assert.equal(parsed.filters.scale, 'cell')
  assert.equal(parsed.filters.kind, 'teachable_figure')
  assert.equal(parsed.filters.referenceId, 'ref:bers-2002')
})

test('search: finds heart biological concept and expands multiscale context', () => {
  const res = searchEducationalUniverse('heart', { graph, catalog, cases })
  assert.ok(res.results.length > 0)
  const top = res.results.find((r) => r.id === 'pcg:heart')
  assert.ok(top !== undefined)
  assert.equal(top.kind, 'biological_concept')
  assert.equal(top.scale, 'organ')
  assert.ok(top.multiscaleContext.ancestors.length >= 1)
  assert.ok(top.multiscaleContext.descendantsCount > 0)
  assert.ok(top.deepLink.startsWith('/body?concept=pcg%3Aheart'))
})

test('search: finds teachable figures when searching for simulation terms', () => {
  const res = searchEducationalUniverse('pv loop afterload', { graph, catalog, cases })
  const fig = res.results.find((r) => r.kind === 'teachable_figure')
  assert.ok(fig !== undefined)
  assert.equal(fig.id, 'fig:cardiac_pv_loop')
  assert.match(fig.title, /Frank-Starling/)
})

test('search: filters strictly by scale', () => {
  const res = searchEducationalUniverse('scale:gene', { graph, catalog, cases })
  assert.ok(res.results.length >= 3)
  assert.ok(res.results.every((r) => r.scale === 'gene'))
  assert.ok(res.results.some((r) => r.id === 'pcg:gene_ryr2'))
})

test('search: filters strictly by kind', () => {
  const res = searchEducationalUniverse('kind:clinical_case dyspnoea', { graph, catalog, cases })
  assert.equal(res.results.length, 1)
  assert.equal(res.results[0].kind, 'clinical_case')
  assert.equal(res.results[0].id, 'case:synthetic_exertional_dyspnoea')
})

test('search: facet counts match returned results', () => {
  const res = searchEducationalUniverse('', { graph, catalog, cases })
  assert.equal(res.facets.totalMatches, res.results.length)
  assert.ok(res.facets.byKind.biological_concept > 0)
  assert.ok(res.facets.byKind.prometheus_lesson > 0)
  assert.ok(res.facets.byKind.teachable_figure > 0)
})
