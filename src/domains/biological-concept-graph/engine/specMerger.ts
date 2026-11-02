// Spec merger for compositional multi-system concept graphs.
// Pure and deterministic: combines independent anatomical/physiological vertical slices
// (e.g., cardiovascular, neuromuscular, pulmonary) into a coherent, single-root whole-body graph.
import {
  CONCEPT_GRAPH_SCHEMA_VERSION,
  type ConceptEdge,
  type ConceptGraphSpec,
  type ConceptNode,
  type ScientificReference,
} from '../model/types.ts'

export interface MergeResult {
  ok: boolean
  spec?: ConceptGraphSpec
  errors?: readonly string[]
}

export function mergeConceptSpecs(
  specs: readonly ConceptGraphSpec[],
  datasetVersion = '2026.11.02-unified-atlas'
): MergeResult {
  if (!specs || specs.length === 0) {
    return { ok: false, errors: ['No specs provided to merge'] }
  }

  const errors: string[] = []
  const major = (v: string) => (v ?? '').split('.')[0]

  for (const s of specs) {
    if (major(s.schemaVersion) !== major(CONCEPT_GRAPH_SCHEMA_VERSION)) {
      errors.push(`Spec schemaVersion ${s.schemaVersion} is incompatible with ${CONCEPT_GRAPH_SCHEMA_VERSION}`)
    }
  }

  if (errors.length) return { ok: false, errors }

  // 1. Merge References
  const refMap = new Map<string, ScientificReference>()
  for (const s of specs) {
    for (const r of s.references) {
      const existing = refMap.get(r.id)
      if (!existing) {
        refMap.set(r.id, r)
      } else if (existing.citation !== r.citation || existing.license !== r.license) {
        errors.push(`Conflicting reference definitions for ${r.id}`)
      }
    }
  }

  // 2. Merge Nodes (pcg:human_body is shared across all slices)
  const nodeMap = new Map<string, ConceptNode>()
  for (const s of specs) {
    for (const n of s.nodes) {
      const existing = nodeMap.get(n.id)
      if (!existing) {
        nodeMap.set(n.id, n)
      } else {
        // Must agree on scale and parentId
        if (existing.scale !== n.scale) {
          errors.push(`Conflicting scale for node ${n.id}: ${existing.scale} vs ${n.scale}`)
        }
        if (existing.parentId !== n.parentId) {
          errors.push(`Conflicting parentId for node ${n.id}: ${existing.parentId} vs ${n.parentId}`)
        }
        // Union references and learning objectives
        const mergedRefs = Array.from(new Set([...existing.referenceIds, ...n.referenceIds]))
        const mergedObjs = Array.from(new Set([...existing.learningObjectives, ...n.learningObjectives]))
        nodeMap.set(n.id, {
          ...existing,
          referenceIds: mergedRefs,
          learningObjectives: mergedObjs,
        })
      }
    }
  }

  // 3. Merge Edges
  const edgeMap = new Map<string, ConceptEdge>()
  for (const s of specs) {
    for (const e of s.edges) {
      const key = `${e.from} -${e.type}-> ${e.to}`
      const existing = edgeMap.get(key)
      if (!existing) {
        edgeMap.set(key, e)
      } else {
        const mergedRefs = Array.from(new Set([...existing.referenceIds, ...e.referenceIds]))
        edgeMap.set(key, {
          ...existing,
          referenceIds: mergedRefs,
        })
      }
    }
  }

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    spec: {
      schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION,
      datasetVersion,
      references: Array.from(refMap.values()),
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    },
  }
}
