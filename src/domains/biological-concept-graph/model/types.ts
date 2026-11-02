// Shared biological concept contract (owner: body-exposure × Prometheus). Pure types: no DOM, network, clock or RNG.
// Version bump rule: additive fields = minor; any change to id format, scale order or relation semantics = major.

export const CONCEPT_GRAPH_SCHEMA_VERSION = '1.0.0' as const

/** Strict coarse→fine order. A part_of child must sit at a deeper scale than its parent (substructure may nest in substructure). */
export const SCALES = ['whole_body', 'organ_system', 'organ', 'substructure', 'tissue', 'cell', 'organelle', 'molecular_structure', 'pathway', 'gene'] as const
export type Scale = (typeof SCALES)[number]
export const SCALE_RANK: Readonly<Record<Scale, number>> = Object.freeze(Object.fromEntries(SCALES.map((s, i) => [s, i])) as Record<Scale, number>)

/** Non-hierarchical typed relations. Hierarchy itself is the single `parentId` (part_of) per node. */
export const RELATION_TYPES = ['composed_of_tissue', 'contains_cell_type', 'contains_organelle', 'participates_in', 'encoded_by', 'regulates', 'supplied_by', 'innervated_by'] as const
export type RelationType = (typeof RELATION_TYPES)[number]

/** Which scale pair each relation may connect (from → to). Prevents invented cross-scale links. */
export const RELATION_SCALE_RULES: Readonly<Record<RelationType, { from: readonly Scale[]; to: readonly Scale[] }>> = Object.freeze({
  composed_of_tissue: { from: ['organ', 'substructure'], to: ['tissue'] },
  contains_cell_type: { from: ['tissue', 'substructure'], to: ['cell'] },
  contains_organelle: { from: ['cell'], to: ['organelle'] },
  participates_in: { from: ['cell', 'organelle', 'molecular_structure', 'tissue'], to: ['pathway'] },
  encoded_by: { from: ['molecular_structure'], to: ['gene'] },
  regulates: { from: ['molecular_structure', 'pathway', 'gene'], to: ['molecular_structure', 'pathway', 'gene'] },
  supplied_by: { from: ['organ', 'substructure', 'tissue'], to: ['substructure'] },
  innervated_by: { from: ['organ', 'substructure', 'tissue'], to: ['substructure'] },
})

export const EVIDENCE_GRADES = ['established', 'observational', 'hypothesis', 'unknown'] as const
export type EvidenceGrade = (typeof EVIDENCE_GRADES)[number]

/** `cited_not_retrieved`: the citation is recorded but its text was not machine-verified against the source in this repo. */
export type ReferenceVerification = 'cited_not_retrieved' | 'verified_in_repo'
export interface ScientificReference {
  id: string
  citation: string
  kind: 'peer_reviewed' | 'open_textbook'
  doi?: string
  url?: string
  license: string
  verification: ReferenceVerification
}

export type Representation = 'anatomical_3d' | 'schematic' | 'conceptual'
export interface VisualizationBinding {
  representation: Representation
  /** Key into the repo-backed body asset registry; only valid with `anatomical_3d`. */
  assetKey?: string
  /** Spatial precision claim. `none` unless a mesh really exists; never inferred. */
  spatialPrecision: 'none' | 'organ_level' | 'structure_level'
  note?: string
}

export interface ConceptNode {
  id: string
  label: string
  scale: Scale
  parentId: string | null
  definition: string
  /** Optional external ontology id (UBERON/CL/GO). Format-checked only; not live-resolved. */
  ontologyId?: string
  function?: string
  pathophysiology?: string
  learningObjectives: readonly string[]
  referenceIds: readonly string[]
  visualization: VisualizationBinding
}

export interface ConceptEdge {
  from: string
  type: RelationType
  to: string
  grade: EvidenceGrade
  referenceIds: readonly string[]
  note?: string
}

export interface ConceptGraphSpec {
  schemaVersion: string
  datasetVersion: string
  references: readonly ScientificReference[]
  nodes: readonly ConceptNode[]
  edges: readonly ConceptEdge[]
}

export interface ConceptGraph {
  schemaVersion: string
  datasetVersion: string
  rootId: string
  nodes: ReadonlyMap<string, ConceptNode>
  children: ReadonlyMap<string, readonly string[]>
  edgesFrom: ReadonlyMap<string, readonly ConceptEdge[]>
  edgesTo: ReadonlyMap<string, readonly ConceptEdge[]>
  references: ReadonlyMap<string, ScientificReference>
}

export type GraphIssueCode =
  | 'schema_version_incompatible' | 'bad_id' | 'duplicate_id' | 'unknown_scale' | 'no_root' | 'multiple_roots' | 'orphan_parent' | 'cycle'
  | 'scale_order_violation' | 'bad_ontology_id' | 'missing_reference' | 'unknown_reference' | 'duplicate_reference' | 'empty_text'
  | 'edge_unknown_endpoint' | 'edge_self_loop' | 'edge_duplicate' | 'edge_scale_rule' | 'edge_grade_without_evidence' | 'edge_bad_grade' | 'edge_bad_type'
  | 'binding_asset_mismatch' | 'binding_precision_without_asset' | 'unreachable_node'
export interface GraphIssue { code: GraphIssueCode; subject: string; message: string }
export type BuildResult = { ok: true; graph: ConceptGraph; issues: readonly [] } | { ok: false; graph: null; issues: readonly GraphIssue[] }
