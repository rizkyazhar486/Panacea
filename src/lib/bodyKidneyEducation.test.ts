import { describe, expect, it } from 'vitest'
import {
  KIDNEY_EDUCATION_EDGES,
  KIDNEY_EDUCATION_NODES,
  KIDNEY_SYSTEM_ID,
  validateKidneyEducationGraph,
} from './bodyKidneyEducation'

describe('kidney Body Exposure education graph', () => {
  it('keeps graph integrity and all five organ-specific education domains', () => {
    expect(KIDNEY_SYSTEM_ID).toBe('urinary')
    for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
      expect(KIDNEY_EDUCATION_NODES.some((node) => node.kind === kind)).toBe(true)
    }
    expect(validateKidneyEducationGraph()).toEqual({
      duplicateIds: false,
      danglingEdges: [],
      sourceBackedWithoutSource: [],
      educationalWithSourceClaim: [],
      boundaryMissing: [],
    })
  })

  it('limits source-backed anatomy to reference atlas geometry', () => {
    const anatomy = KIDNEY_EDUCATION_NODES.find((node) => node.id === 'kidney-gross-reference')
    expect(anatomy).toMatchObject({ evidenceState: 'source-backed', sourceId: 'visceral.glb' })
    expect(anatomy?.boundary).toMatch(/not patient-specific anatomy/i)
    expect(anatomy?.boundary).toMatch(/nephron microstructure/i)
  })

  it('keeps non-anatomy claims educational-only and source-free', () => {
    for (const node of KIDNEY_EDUCATION_NODES.filter((item) => item.kind !== 'anatomy')) {
      expect(node.evidenceState).toBe('educational-only')
      expect(node.sourceId).toBeUndefined()
    }
    expect(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'physiology')?.boundary).toMatch(/no GFR/i)
    expect(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')?.boundary).toMatch(/no drug selection/i)
    expect(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'imaging')?.boundary).toMatch(/no CT, MRI, ultrasound/i)
  })

  it('keeps relationships bounded and non-self-referential', () => {
    for (const edge of KIDNEY_EDUCATION_EDGES) {
      expect(edge.from).not.toBe(edge.to)
      expect(edge.note.length).toBeGreaterThan(40)
    }
    expect(KIDNEY_EDUCATION_EDGES.find((edge) => edge.relationship === 'supports')?.note).toMatch(/no diagnosis or patient-state inference/i)
  })
})
