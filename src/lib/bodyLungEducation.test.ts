import { describe, expect, it } from 'vitest'
import { LUNG_EDUCATION_EDGES, LUNG_EDUCATION_NODES, validateLungEducationGraph } from './bodyLungEducation'

describe('lung education provenance boundaries', () => {
  it('keeps the graph internally valid and explicitly educational-only', () => {
    const validation = validateLungEducationGraph()
    expect(validation.duplicateIds).toBe(false)
    expect(validation.danglingEdges).toEqual([])
    expect(validation.nonEducationalNodes).toEqual([])
    expect(validation.boundaryMissing).toEqual([])
    expect(LUNG_EDUCATION_NODES.every((node) => node.evidenceState === 'educational-only')).toBe(true)
  })

  it('does not attach source identifiers or patient-specific claims to educational nodes', () => {
    for (const node of LUNG_EDUCATION_NODES) {
      expect(node).not.toHaveProperty('sourceId')
      expect(node.boundary.toLowerCase()).toMatch(/educational|placeholder|no /)
    }
  })

  it('keeps every relationship bounded away from diagnosis and patient-state inference', () => {
    expect(LUNG_EDUCATION_EDGES.length).toBeGreaterThan(0)
    for (const edge of LUNG_EDUCATION_EDGES) {
      expect(edge.note.length).toBeGreaterThan(40)
      expect(edge.note.toLowerCase()).toMatch(/education|no |without /)
    }
  })
})
