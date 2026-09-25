import type { BodySystemId } from './bodySystemSourceWave'

export type MusculoskeletalNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type MusculoskeletalEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface MusculoskeletalEducationNode {
  id: string
  label: string
  kind: MusculoskeletalNodeKind
  evidenceState: MusculoskeletalEvidenceState
  evidence: readonly { kind: 'atlas-source' | 'pubmed'; id: string; url?: string; note: string }[]
  boundary: string
}

export interface MusculoskeletalEducationEdge {
  from: string
  to: string
  relationship: 'educational-context'
  note: string
}

export const MUSCULOSKELETAL_SYSTEM_ID: BodySystemId = 'musculoskeletal'

export const MUSCULOSKELETAL_EDUCATION_NODES: readonly MusculoskeletalEducationNode[] = [
  {
    id: 'musculoskeletal-gross-reference',
    label: 'Skeleton and major-muscle reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [
      { kind: 'atlas-source', id: 'skeletal.glb', note: 'Repository source bundle provides gross skeletal orientation.' },
      { kind: 'atlas-source', id: 'muscular.glb', note: 'Repository source bundle provides gross major-muscle orientation.' },
    ],
    boundary: 'Reference atlas geometry only; it is not patient-specific anatomy and does not imply microscopic cartilage, tendon, ligament, muscle-fiber, marrow, or bone detail.',
  },
  {
    id: 'musculoskeletal-excitation-contraction',
    label: 'Skeletal-muscle excitation-contraction context',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '25294644', url: 'https://pubmed.ncbi.nlm.nih.gov/25294644/', note: 'Review covers skeletal-muscle structure and function, including excitation-contraction coupling.' }],
    boundary: 'Educational physiology only; no individual force, torque, activation, fatigue, fiber type, performance capacity, or exercise response is inferred.',
  },
  {
    id: 'musculoskeletal-osteoarthritis-context',
    label: 'Osteoarthritis whole-joint context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '33560326', url: 'https://pubmed.ncbi.nlm.nih.gov/33560326/', note: 'Review describes osteoarthritis as a whole-joint disorder involving multiple tissues.' }],
    boundary: 'Mechanism education only; no diagnosis, cartilage grade, pain source, instability, inflammation severity, progression, or individual joint state is inferred.',
  },
  {
    id: 'musculoskeletal-pharmacology-boundary',
    label: 'Musculoskeletal pharmacology relationship boundary',
    kind: 'pharmacology',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Relationship placeholder only; no medication choice, dose, route, duration, eligibility, safety assessment, monitoring plan, or individual therapy is produced.',
  },
  {
    id: 'musculoskeletal-imaging-boundary',
    label: 'Musculoskeletal imaging relationship boundary',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Relationship placeholder only; no radiograph, CT, MRI, ultrasound, nuclear image, segmentation, fracture detection, cartilage grade, tendon assessment, or lesion localization is represented.',
  },
] as const

export const MUSCULOSKELETAL_EDUCATION_EDGES: readonly MusculoskeletalEducationEdge[] = [
  { from: 'musculoskeletal-gross-reference', to: 'musculoskeletal-excitation-contraction', relationship: 'educational-context', note: 'Gross muscle orientation provides context for physiology without claiming microscopic continuity or measured function.' },
  { from: 'musculoskeletal-gross-reference', to: 'musculoskeletal-osteoarthritis-context', relationship: 'educational-context', note: 'Reference joint orientation frames disease education without implying pathology in atlas geometry or an individual.' },
  { from: 'musculoskeletal-osteoarthritis-context', to: 'musculoskeletal-pharmacology-boundary', relationship: 'educational-context', note: 'Disease context may lead to pharmacology education only after evidence is attached; this edge is not a treatment recommendation.' },
  { from: 'musculoskeletal-gross-reference', to: 'musculoskeletal-imaging-boundary', relationship: 'educational-context', note: 'Reference anatomy may orient future source-backed imaging education while remaining separate from individual imaging.' },
] as const

export function validateMusculoskeletalEducationGraph() {
  const ids = new Set(MUSCULOSKELETAL_EDUCATION_NODES.map((node) => node.id))
  return {
    duplicateIds: ids.size !== MUSCULOSKELETAL_EDUCATION_NODES.length,
    danglingEdges: MUSCULOSKELETAL_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to)),
    unsupportedLiteratureNodes: MUSCULOSKELETAL_EDUCATION_NODES.filter((node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed')),
    sourceBackedWithoutAtlas: MUSCULOSKELETAL_EDUCATION_NODES.filter((node) => node.evidenceState === 'source-backed' && !node.evidence.some((item) => item.kind === 'atlas-source')),
    boundaryMissing: MUSCULOSKELETAL_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 20),
  }
}
