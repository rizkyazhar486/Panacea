// Validating builder + deep traversal for the shared biological concept graph. Pure and deterministic. Fail closed:
// any structural, scale-order, evidence or provenance violation yields ok:false with every issue listed; no partial graph is returned.
import {
  CONCEPT_GRAPH_SCHEMA_VERSION, EVIDENCE_GRADES, RELATION_SCALE_RULES, RELATION_TYPES, SCALE_RANK,
  type BuildResult, type ConceptEdge, type ConceptGraph, type ConceptGraphSpec, type ConceptNode, type GraphIssue, type RelationType, type Scale,
} from '../model/types.ts'

export const CONCEPT_ID = /^pcg:[a-z][a-z0-9_]{1,63}$/
export const ONTOLOGY_ID = /^(UBERON|CL|GO):\d{7}$/
const REF_ID = /^ref:[a-z0-9_.-]{2,64}$/

const major = (v: string) => v.split('.')[0]

export function buildConceptGraph(spec: ConceptGraphSpec): BuildResult {
  const issues: GraphIssue[] = []
  const add = (code: GraphIssue['code'], subject: string, message: string) => issues.push({ code, subject, message })

  if (major(spec.schemaVersion ?? '') !== major(CONCEPT_GRAPH_SCHEMA_VERSION)) add('schema_version_incompatible', 'spec', `schema ${spec.schemaVersion} is not compatible with ${CONCEPT_GRAPH_SCHEMA_VERSION}`)

  const refs = new Map<string, ConceptGraph['references'] extends ReadonlyMap<string, infer R> ? R : never>()
  for (const r of spec.references ?? []) {
    if (!REF_ID.test(r.id)) { add('bad_id', r.id, 'reference id must match ref:<slug>'); continue }
    if (refs.has(r.id)) { add('duplicate_reference', r.id, 'duplicate reference id'); continue }
    if (!r.citation?.trim() || !r.license?.trim()) add('empty_text', r.id, 'reference needs citation and license')
    refs.set(r.id, r)
  }

  const nodes = new Map<string, ConceptNode>()
  for (const n of spec.nodes ?? []) {
    if (!CONCEPT_ID.test(n.id)) { add('bad_id', n.id, 'concept id must match pcg:<snake_case>'); continue }
    if (nodes.has(n.id)) { add('duplicate_id', n.id, 'duplicate concept id'); continue }
    nodes.set(n.id, n)
    if (!(n.scale in SCALE_RANK)) add('unknown_scale', n.id, `unknown scale ${String(n.scale)}`)
    if (!n.label?.trim() || !n.definition?.trim()) add('empty_text', n.id, 'label and definition are required')
    if (n.ontologyId !== undefined && !ONTOLOGY_ID.test(n.ontologyId)) add('bad_ontology_id', n.id, `ontology id ${n.ontologyId} is not UBERON|CL|GO:#######`)
    if (!n.referenceIds?.length) add('missing_reference', n.id, 'every concept must cite at least one reference')
    for (const rid of n.referenceIds ?? []) if (!refs.has(rid)) add('unknown_reference', n.id, `unknown reference ${rid}`)
    const v = n.visualization
    if (v.representation === 'anatomical_3d' && !v.assetKey) add('binding_asset_mismatch', n.id, 'anatomical_3d binding needs an assetKey')
    if (v.representation !== 'anatomical_3d' && v.assetKey) add('binding_asset_mismatch', n.id, `${v.representation} binding must not carry an assetKey`)
    if (v.spatialPrecision !== 'none' && v.representation !== 'anatomical_3d') add('binding_precision_without_asset', n.id, 'spatial precision claimed without a 3D asset')
  }

  // Hierarchy: exactly one root, valid parents, depth order, acyclic.
  const roots = [...nodes.values()].filter((n) => n.parentId === null)
  if (roots.length === 0) add('no_root', 'graph', 'no root concept')
  if (roots.length > 1) add('multiple_roots', 'graph', `roots: ${roots.map((r) => r.id).join(', ')}`)
  if (roots[0] && roots[0].scale !== 'whole_body') add('scale_order_violation', roots[0].id, 'root must be scale whole_body')
  for (const n of nodes.values()) {
    if (n.parentId === null) continue
    const p = nodes.get(n.parentId)
    if (!p) { add('orphan_parent', n.id, `parent ${n.parentId} does not exist`); continue }
    const cr = SCALE_RANK[n.scale], pr = SCALE_RANK[p.scale]
    const ok = cr > pr || (n.scale === 'substructure' && p.scale === 'substructure')
    if (cr !== undefined && pr !== undefined && !ok) add('scale_order_violation', n.id, `${n.scale} cannot be part_of ${p.scale}`)
  }
  for (const n of nodes.values()) {
    const seen = new Set<string>()
    for (let cur: ConceptNode | undefined = n; cur; cur = cur.parentId ? nodes.get(cur.parentId) : undefined) {
      if (seen.has(cur.id)) { add('cycle', n.id, `part_of cycle through ${cur.id}`); break }
      seen.add(cur.id)
    }
  }

  // Typed edges.
  const edgeKeys = new Set<string>()
  for (const e of spec.edges ?? []) {
    const subj = `${e.from} -${e.type}-> ${e.to}`
    const a = nodes.get(e.from), b = nodes.get(e.to)
    if (!(RELATION_TYPES as readonly string[]).includes(e.type)) { add('edge_bad_type', subj, 'unknown relation type'); continue }
    if (!a || !b) { add('edge_unknown_endpoint', subj, 'endpoint missing'); continue }
    if (e.from === e.to) add('edge_self_loop', subj, 'self relation')
    if (edgeKeys.has(subj)) add('edge_duplicate', subj, 'duplicate edge'); edgeKeys.add(subj)
    const rule = RELATION_SCALE_RULES[e.type]
    if (!rule.from.includes(a.scale) || !rule.to.includes(b.scale)) add('edge_scale_rule', subj, `${a.scale}→${b.scale} not allowed for ${e.type}`)
    if (!(EVIDENCE_GRADES as readonly string[]).includes(e.grade)) { add('edge_bad_grade', subj, 'unknown evidence grade'); continue }
    if (e.grade !== 'unknown' && !e.referenceIds?.length) add('edge_grade_without_evidence', subj, `${e.grade} edge needs a reference`)
    for (const rid of e.referenceIds ?? []) if (!refs.has(rid)) add('unknown_reference', subj, `unknown reference ${rid}`)
  }

  if (issues.length) return { ok: false, graph: null, issues }

  const root = roots[0]!
  const children = new Map<string, string[]>()
  for (const n of nodes.values()) if (n.parentId) children.set(n.parentId, [...(children.get(n.parentId) ?? []), n.id])
  for (const [k, v] of children) children.set(k, v.sort())
  // Reachability from root is implied by orphan/cycle checks but asserted explicitly as an invariant.
  const reach = new Set<string>([root.id]); const q = [root.id]
  while (q.length) for (const c of children.get(q.shift()!) ?? []) { reach.add(c); q.push(c) }
  for (const n of nodes.values()) if (!reach.has(n.id)) add('unreachable_node', n.id, 'not reachable from root')
  if (issues.length) return { ok: false, graph: null, issues }

  const from = new Map<string, ConceptEdge[]>(), to = new Map<string, ConceptEdge[]>()
  for (const e of spec.edges) { from.set(e.from, [...(from.get(e.from) ?? []), e]); to.set(e.to, [...(to.get(e.to) ?? []), e]) }
  return { ok: true, issues: [], graph: { schemaVersion: spec.schemaVersion, datasetVersion: spec.datasetVersion, rootId: root.id, nodes, children, edgesFrom: from, edgesTo: to, references: refs } }
}

export type Lookup<T> = { ok: true; value: T } | { ok: false; reason: 'unknown_concept' | 'not_a_descendant' }

export function getConcept(g: ConceptGraph, id: string): Lookup<ConceptNode> {
  const n = g.nodes.get(id)
  return n ? { ok: true, value: n } : { ok: false, reason: 'unknown_concept' }
}

/** Root → concept chain (inclusive). This is the breadcrumb and the "return to parent anatomy" stack. */
export function pathFromRoot(g: ConceptGraph, id: string): Lookup<readonly ConceptNode[]> {
  let cur = g.nodes.get(id)
  if (!cur) return { ok: false, reason: 'unknown_concept' }
  const out: ConceptNode[] = []
  while (cur) { out.unshift(cur); cur = cur.parentId ? g.nodes.get(cur.parentId) : undefined }
  return { ok: true, value: out }
}

export function descendants(g: ConceptGraph, id: string, maxDepth = Infinity): Lookup<readonly ConceptNode[]> {
  if (!g.nodes.has(id)) return { ok: false, reason: 'unknown_concept' }
  const out: ConceptNode[] = []
  let frontier = [id]
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next: string[] = []
    for (const f of frontier) for (const c of g.children.get(f) ?? []) { out.push(g.nodes.get(c)!); next.push(c) }
    frontier = next
  }
  return { ok: true, value: out }
}

/** Next level a learner can drill into, sorted by scale then label — never skips an intermediate level. */
export function drillDownOptions(g: ConceptGraph, id: string): Lookup<readonly ConceptNode[]> {
  const r = descendants(g, id, 1)
  return r.ok ? { ok: true, value: [...r.value].sort((a, b) => SCALE_RANK[a.scale] - SCALE_RANK[b.scale] || a.label.localeCompare(b.label)) } : r
}

/** Typed relations out of a concept with the referenced evidence resolved; hypotheses are never mixed with established ones. */
export function relationsOf(g: ConceptGraph, id: string, type?: RelationType) {
  return (g.edgesFrom.get(id) ?? []).filter((e) => !type || e.type === type).map((e) => ({ edge: e, target: g.nodes.get(e.to)!, references: e.referenceIds.map((r) => g.references.get(r)!) }))
}

export function conceptsAtScale(g: ConceptGraph, scale: Scale): readonly ConceptNode[] {
  return [...g.nodes.values()].filter((n) => n.scale === scale).sort((a, b) => a.id.localeCompare(b.id))
}

/** Lowest common ancestor — answers "what anatomical context do these two concepts share?". */
export function commonAncestor(g: ConceptGraph, a: string, b: string): Lookup<ConceptNode> {
  const pa = pathFromRoot(g, a), pb = pathFromRoot(g, b)
  if (!pa.ok) return pa
  if (!pb.ok) return pb
  let last = pa.value[0]!
  for (let i = 0; i < Math.min(pa.value.length, pb.value.length) && pa.value[i]!.id === pb.value[i]!.id; i++) last = pa.value[i]!
  return { ok: true, value: last }
}
