import assert from 'node:assert/strict'
import { SHIPPED_SOURCE_TOPOLOGY } from '../../src/lib/anatomy/sourceTopologyCompiler.ts'
import {
  SHIPPED_SOURCE_HIERARCHY,
  buildSourceHierarchyFocus,
  buildSourcePairComparison,
  pairingStatus,
  sourceHierarchyAncestors,
  validateSourceHierarchy,
  type SourceHierarchy,
  type SourceHierarchyNode,
} from '../../src/lib/anatomy/sourceHierarchyCompiler.ts'

// Gerbang asli (high-end-source-hierarchy) hanya kasus positif. Di sini: validator HARUS menolak
// hierarki rusak (kerusakan disuntikkan satu per satu pada salinan), dan status pasangan kiri/kanan
// diperiksa terhadap oracle independen yang dihitung ulang dari lateralitas tiap mesh.

const index = SHIPPED_SOURCE_TOPOLOGY
const good = SHIPPED_SOURCE_HIERARCHY

type Mutable = { -readonly [K in keyof SourceHierarchyNode]: SourceHierarchyNode[K] }

function mutate(fn: (nodes: Mutable[], maps: { structureGroupByLeafId: Map<string, string> }, rootId: { value: string }) => void): SourceHierarchy {
  const nodes: Mutable[] = good.nodes.map((n) => ({ ...n, children: [...n.children] }))
  const structureGroupByLeafId = new Map(good.structureGroupByLeafId)
  const rootId = { value: good.rootId }
  fn(nodes, { structureGroupByLeafId }, rootId)
  return {
    ...good,
    rootId: rootId.value,
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n as SourceHierarchyNode])),
    parentById: good.parentById,
    structureGroupByLeafId,
  }
}
const issuesOf = (h: SourceHierarchy) => validateSourceHierarchy(h, index)
const has = (issues: string[], re: RegExp) => issues.some((i) => re.test(i))

// ── Positif: referensi utuh tidak punya temuan ───────────────────────────────
assert.deepEqual(issuesOf(good), [], 'the shipped hierarchy must validate with no issues')

const firstMesh = good.nodes.find((n) => n.kind === 'mesh')!
const someStructure = good.nodes.find((n) => n.kind === 'structure' && n.children.length > 0)!
const someRegion = good.nodes.find((n) => n.kind === 'region')!

// ── Negatif berpasangan: tepat satu kerusakan, tepat satu jenis temuan ───────
{
  const issues = issuesOf(mutate((nodes) => { nodes.push({ ...nodes[1] }) }))
  assert.ok(has(issues, /Duplicate source hierarchy id/), 'a duplicated node id must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.find((n) => n.id === firstMesh.id)!.parentId = 'no-such-parent' }))
  assert.ok(has(issues, /Missing source hierarchy parent/), 'a node pointing at a missing parent must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.find((n) => n.id === someStructure.id)!.children.push('ghost-child') }))
  assert.ok(has(issues, /Missing source hierarchy child/), 'a child id that does not exist must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.find((n) => n.id === firstMesh.id)!.parentId = someRegion.id }))
  assert.ok(has(issues, /Non-reciprocal source hierarchy edge/), 'a child whose parentId disagrees with its parent list must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.find((n) => n.id === someRegion.id)!.triangleCount = -1 }))
  assert.ok(has(issues, /Invalid source hierarchy aggregate/), 'a negative aggregate must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.find((n) => n.id === someRegion.id)!.meshCount = -5 }))
  assert.ok(has(issues, /Invalid source hierarchy aggregate/), 'a negative mesh count must be reported')
}
{
  const issues = issuesOf(mutate((nodes) => { nodes.splice(nodes.findIndex((n) => n.id === firstMesh.id), 1) }))
  assert.ok(has(issues, /Mesh leaf coverage mismatch/), 'dropping a mesh node must break leaf coverage')
}
{
  const issues = issuesOf(mutate((nodes) => {
    const other = nodes.filter((n) => n.kind === 'mesh')[1]
    other.leafId = nodes.find((n) => n.id === firstMesh.id)!.leafId
  }))
  assert.ok(has(issues, /represented more than once/), 'two mesh nodes sharing a leaf must be reported')
}
{
  const issues = issuesOf(mutate((_n, maps) => { maps.structureGroupByLeafId.delete(firstMesh.leafId!) }))
  assert.ok(has(issues, /Missing structure group for source leaf/), 'a leaf without a structure group must be reported')
}
{
  const issues = issuesOf(mutate((nodes, _m, root) => { nodes.find((n) => n.id === root.value)!.meshCount += 1 }))
  assert.ok(has(issues, /root mesh count does not equal/), 'a root mesh count that drifts from the topology must be reported')
}
{
  const issues = issuesOf(mutate((nodes, _m, root) => { nodes.find((n) => n.id === root.value)!.triangleCount += 1 }))
  assert.ok(has(issues, /root triangle count does not equal/), 'a root triangle count that drifts from the topology must be reported')
}
{
  const issues = issuesOf(mutate((nodes, _m, root) => { nodes.find((n) => n.id === root.value)!.parentId = firstMesh.id }))
  assert.ok(has(issues, /cycle detected/), 'a parent cycle must be reported (and must terminate)')
}
{
  const issues = issuesOf(mutate((_n, _m, root) => { root.value = 'no-such-root' }))
  assert.ok(has(issues, /root is missing or invalid/), 'a missing root must be reported')
}
{
  const issues = issuesOf(mutate((nodes, _m, root) => { nodes.find((n) => n.id === root.value)!.kind = 'layer' }))
  assert.ok(has(issues, /root is missing or invalid/), 'a root of the wrong kind must be reported')
}

// ── Ancestors dan fokus: id tak dikenal gagal tertutup ───────────────────────
assert.deepEqual(sourceHierarchyAncestors('no-such-node'), [], 'ancestors of an unknown node are empty, not an error')
assert.equal(buildSourcePairComparison('no-such-leaf'), null, 'a pair comparison for an unknown leaf is null')
assert.equal(buildSourceHierarchyFocus('no-such-leaf'), null, 'a hierarchy focus for an unknown leaf is null')
{
  const cyc = mutate((nodes, _m, root) => { nodes.find((n) => n.id === root.value)!.parentId = firstMesh.id })
  const chain = sourceHierarchyAncestors(`source-mesh-node:${firstMesh.leafId}`, cyc)
  assert.ok(chain.length < good.nodes.length + 2, 'walking ancestors through a cycle must terminate')
}

// ── Tabel kebenaran klasifikator: kedelapan kombinasi (kiri, kanan, tengah) ───
{
  const side = (l: boolean, r: boolean, m: boolean) => [
    ...(l ? [{ laterality: 'kiri' as const }] : []), ...(r ? [{ laterality: 'kanan' as const }] : []), ...(m ? [{ laterality: 'tengah' as const }] : []),
  ]
  const table: Array<[boolean, boolean, boolean, string]> = [
    [false, false, false, 'unknown'],
    [true, false, false, 'left-only'],
    [false, true, false, 'right-only'],
    [false, false, true, 'midline-only'],
    [true, true, false, 'bilateral-pair'],
    [true, false, true, 'mixed'],
    [false, true, true, 'mixed'],
    [true, true, true, 'mixed'],
  ]
  for (const [l, r, m, want] of table) {
    assert.equal(pairingStatus(side(l, r, m)), want, `pairing truth table: left=${l} right=${r} midline=${m} must be ${want}`)
  }
}

// ── Oracle independen: status pasangan = himpunan lateralitas mesh anak ──────
const expectedStatus = (sides: Set<string>) => {
  const l = sides.has('kiri'), r = sides.has('kanan'), m = sides.has('tengah')
  if (l && r && !m) return 'bilateral-pair'
  if (!l && !r && m) return 'midline-only'
  if (l && !r && !m) return 'left-only'
  if (!l && r && !m) return 'right-only'
  return sides.size ? 'mixed' : 'unknown'
}
const seenStatus = new Set<string>()
let checked = 0
for (const node of good.nodes) {
  if (node.kind !== 'structure') continue
  const sides = new Set<string>()
  for (const childId of node.children) {
    const leafId = good.byId.get(childId)?.leafId
    const leaf = leafId ? index.byId.get(leafId) : undefined
    assert.ok(leaf, `structure ${node.id} child ${childId} must resolve to a shipped leaf`)
    sides.add(leaf!.laterality)
  }
  assert.equal(node.pairingStatus, expectedStatus(sides), `${node.id}: pairing status must match the lateralities of its meshes`)
  seenStatus.add(node.pairingStatus!)
  checked += 1
}
assert.ok(checked > 100, 'the oracle must cover the shipped structure groups, not a handful')
for (const s of ['bilateral-pair', 'midline-only']) assert.ok(seenStatus.has(s), `the shipped data must contain at least one ${s} group (guards against a classifier that collapses everything)`)

console.log(`source hierarchy integrity: 14 injected corruptions detected, unknown ids fail closed, ${checked} structure groups match the independent laterality oracle (${[...seenStatus].sort().join(', ')})`)
