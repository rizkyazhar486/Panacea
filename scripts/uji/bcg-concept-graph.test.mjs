import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CARDIOVASCULAR_SPEC, buildConceptGraph, pathFromRoot, drillDownOptions, descendants, relationsOf, commonAncestor, conceptsAtScale,
  buildDeepLink, parseDeepLink, breadcrumb, resolveLessonLinks, checkAssetBindings, computeCardiacOutput, CARDIAC_OUTPUT_MODEL,
} from '../../src/domains/biological-concept-graph/index.ts'

const clone = () => structuredClone(CARDIOVASCULAR_SPEC)
const build = (s) => buildConceptGraph(s)
const codes = (s) => build(s).issues.map((i) => i.code)
const G = build(CARDIOVASCULAR_SPEC)

test('seed graph validates and spans every scale from body to gene', () => {
  assert.equal(G.ok, true)
  for (const s of ['whole_body', 'organ_system', 'organ', 'substructure', 'tissue', 'cell', 'organelle', 'molecular_structure', 'pathway', 'gene']) assert.ok(conceptsAtScale(G.graph, s).length > 0, s)
})

test('deep path: body → … → sarcomere keeps strictly ordered scales with no skipped level', () => {
  const p = pathFromRoot(G.graph, 'pcg:sarcomere')
  assert.deepEqual(p.value.map((x) => x.id), ['pcg:human_body', 'pcg:cardiovascular_system', 'pcg:heart', 'pcg:myocardium', 'pcg:cardiomyocyte', 'pcg:sarcomere'])
  assert.deepEqual(breadcrumb(G.graph, 'pcg:troponin_c').slice(-2), ['pcg:sarcomere', 'pcg:troponin_c'])
})

test('drill-down from cardiomyocyte lists organelles then pathway/gene, sorted by scale', () => {
  const ids = drillDownOptions(G.graph, 'pcg:cardiomyocyte').value.map((x) => x.id)
  assert.equal(ids[0].startsWith('pcg:'), true)
  assert.ok(ids.includes('pcg:sarcoplasmic_reticulum') && ids.includes('pcg:excitation_contraction_coupling'))
  assert.ok(ids.indexOf('pcg:mitochondrion') < ids.indexOf('pcg:excitation_contraction_coupling'))
  assert.equal(drillDownOptions(G.graph, 'pcg:nope').ok, false)
})

test('descendants honour depth bound; common ancestor of RyR2 and L-type channel is cardiomyocyte', () => {
  assert.equal(descendants(G.graph, 'pcg:heart', 1).value.length, 4)
  assert.ok(descendants(G.graph, 'pcg:heart').value.length > 15)
  assert.equal(commonAncestor(G.graph, 'pcg:ryanodine_receptor_2', 'pcg:ltype_calcium_channel').value.id, 'pcg:cardiomyocyte')
})

test('typed relations resolve their references and carry evidence grade', () => {
  const rel = relationsOf(G.graph, 'pcg:ryanodine_receptor_2')
  assert.deepEqual(rel.map((r) => r.edge.type).sort(), ['encoded_by', 'participates_in'])
  assert.ok(rel.every((r) => r.references.length > 0 && r.edge.grade === 'established'))
})

test('NEG: circular hierarchy rejected', () => {
  const s = clone(); s.nodes.find((x) => x.id === 'pcg:human_body').parentId = 'pcg:sarcomere'
  assert.ok(codes(s).includes('cycle'))
})
test('NEG: invalid / duplicate identity, orphan parent, multiple roots', () => {
  let s = clone(); s.nodes[1].id = 'Heart!'; assert.ok(codes(s).includes('bad_id'))
  s = clone(); s.nodes.push({ ...s.nodes[2] }); assert.ok(codes(s).includes('duplicate_id'))
  s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').parentId = 'pcg:ghost'; assert.ok(codes(s).includes('orphan_parent'))
  s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').parentId = null; assert.ok(codes(s).includes('multiple_roots'))
})
test('NEG: scale order violation (organelle containing an organ)', () => {
  const s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').parentId = 'pcg:sarcomere'
  assert.ok(codes(s).includes('scale_order_violation'))
})
test('NEG: absent or unknown scientific source', () => {
  let s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').referenceIds = []; assert.ok(codes(s).includes('missing_reference'))
  s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').referenceIds = ['ref:made_up']; assert.ok(codes(s).includes('unknown_reference'))
})
test('NEG: edge rules — cross-scale invention, missing endpoint, ungrounded grade, duplicate, self loop', () => {
  let s = clone(); s.edges.push({ from: 'pcg:heart', type: 'encoded_by', to: 'pcg:gene_ryr2', grade: 'established', referenceIds: ['ref:openstax-ap2e'] }); assert.ok(codes(s).includes('edge_scale_rule'))
  s = clone(); s.edges.push({ from: 'pcg:heart', type: 'supplied_by', to: 'pcg:ghost', grade: 'unknown', referenceIds: [] }); assert.ok(codes(s).includes('edge_unknown_endpoint'))
  s = clone(); s.edges[0].referenceIds = []; assert.ok(codes(s).includes('edge_grade_without_evidence'))
  s = clone(); s.edges.push({ ...s.edges[0] }); assert.ok(codes(s).includes('edge_duplicate'))
  s = clone(); s.edges.push({ from: 'pcg:heart', type: 'regulates', to: 'pcg:heart', grade: 'unknown', referenceIds: [] }); assert.ok(codes(s).includes('edge_self_loop'))
  s = clone(); s.edges[0].grade = 'certain'; assert.ok(codes(s).includes('edge_bad_grade'))
})
test('an explicit unknown-grade edge needs no reference (unknown stays unknown, not fabricated evidence)', () => {
  const s = clone(); s.edges.push({ from: 'pcg:serca2a', type: 'regulates', to: 'pcg:excitation_contraction_coupling', grade: 'unknown', referenceIds: [] })
  assert.equal(build(s).ok, true)
})
test('NEG: visualization binding cannot claim spatial precision without a 3D asset', () => {
  let s = clone(); s.nodes.find((x) => x.id === 'pcg:left_ventricle').visualization = { representation: 'schematic', spatialPrecision: 'organ_level' }; assert.ok(codes(s).includes('binding_precision_without_asset'))
  s = clone(); s.nodes.find((x) => x.id === 'pcg:left_ventricle').visualization = { representation: 'anatomical_3d', spatialPrecision: 'none' }; assert.ok(codes(s).includes('binding_asset_mismatch'))
})
test('NEG: bad ontology id and incompatible schema major', () => {
  let s = clone(); s.nodes.find((x) => x.id === 'pcg:heart').ontologyId = 'UBERON:12'; assert.ok(codes(s).includes('bad_ontology_id'))
  s = clone(); s.schemaVersion = '2.0.0'; assert.ok(codes(s).includes('schema_version_incompatible'))
})
test('failed build returns no partial graph', () => {
  const s = clone(); s.nodes.pop(); s.nodes[0].id = 'x'
  const r = build(s); assert.equal(r.ok, false); assert.equal(r.graph, null)
})

test('deep links round-trip and preserve the return anatomical context', () => {
  const l = buildDeepLink(G.graph, '/learn', { surface: 'lesson', conceptId: 'pcg:excitation_contraction_coupling', returnConceptId: 'pcg:left_ventricle' })
  const p = parseDeepLink(G.graph, l.url)
  assert.deepEqual([p.ctx.conceptId, p.ctx.returnConceptId, p.ctx.surface], ['pcg:excitation_contraction_coupling', 'pcg:left_ventricle', 'lesson'])
})
test('NEG: broken, tampered, stale-version deep links fail closed', () => {
  assert.equal(parseDeepLink(G.graph, '/learn?concept=pcg:ghost&surface=body&v=1.0.0').error, 'unknown_concept')
  assert.equal(parseDeepLink(G.graph, '/learn?concept=pcg:heart&surface=body&v=1.0.0&return=pcg:ghost').error, 'unknown_return_concept')
  assert.equal(parseDeepLink(G.graph, '/learn?concept=pcg:heart&surface=admin&v=1.0.0').error, 'bad_surface')
  assert.equal(parseDeepLink(G.graph, '/learn?concept=pcg:heart&surface=body&v=9.0.0').error, 'incompatible_version')
  assert.equal(parseDeepLink(G.graph, '/learn').error, 'malformed')
  assert.equal(buildDeepLink(G.graph, '/b', { surface: 'body', conceptId: 'pcg:ghost', returnConceptId: null }).ok, false)
})
test('lesson link resolution reports unknown lessons/concepts instead of dropping them', () => {
  const r = resolveLessonLinks(G.graph, [{ conceptId: 'pcg:heart', lessonId: 'L1' }, { conceptId: 'pcg:heart', lessonId: 'L9' }, { conceptId: 'pcg:ghost', lessonId: 'L1' }], new Set(['L1']))
  assert.equal(r.resolved.length, 1); assert.deepEqual(r.broken.map((b) => b.reason), ['unknown_lesson', 'unknown_concept'])
})
test('asset binding check flags a mesh missing from the registry', () => {
  assert.deepEqual(checkAssetBindings(G.graph, new Set(['adult_male.cardiovascular', 'adult_male.surface'])), [])
  assert.ok(checkAssetBindings(G.graph, new Set()).length >= 2)
})
test('seed provenance is honest: references flagged as cited, not verified', () => {
  assert.ok([...G.graph.references.values()].every((r) => r.verification === 'cited_not_retrieved'))
})

test('cardiac output: CO = HR×SV/1000 with unit-correct reference cases', () => {
  const r = computeCardiacOutput({ hrBpm: 70, svMl: 70 })
  assert.equal(r.coLMin, 4.9); assert.equal(r.ciLMinM2, null); assert.equal(r.clinicallyReviewed, false)
  assert.equal(computeCardiacOutput({ hrBpm: 60, svMl: 80, bsaM2: 2 }).ciLMinM2, 2.4)
  assert.equal(CARDIAC_OUTPUT_MODEL.conceptId, 'pcg:left_ventricle')
  assert.ok(G.graph.nodes.has(CARDIAC_OUTPUT_MODEL.conceptId) && G.graph.references.has(CARDIAC_OUTPUT_MODEL.referenceId))
})
test('NEG: cardiac output rejects (never clamps) bad inputs; boundaries inclusive', () => {
  for (const [i, f] of [[{ hrBpm: NaN, svMl: 70 }, 'hrBpm'], [{ hrBpm: 19, svMl: 70 }, 'hrBpm'], [{ hrBpm: 301, svMl: 70 }, 'hrBpm'], [{ hrBpm: 70, svMl: 4 }, 'svMl'], [{ hrBpm: 70, svMl: Infinity }, 'svMl'], [{ hrBpm: 70, svMl: 70, bsaM2: 0 }, 'bsaM2']]) {
    const r = computeCardiacOutput(i); assert.equal(r.ok, false); assert.equal(r.field, f)
  }
  assert.equal(computeCardiacOutput({ hrBpm: 20, svMl: 5 }).ok, true); assert.equal(computeCardiacOutput({ hrBpm: 300, svMl: 250 }).ok, true)
})
