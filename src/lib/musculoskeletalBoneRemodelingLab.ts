export type MusculoskeletalBoneRemodelingInputs = {
  ranklDrive: number
  opgBrake: number
  osteoclastCapacity: number
  osteoblastCapacity: number
}

export type MusculoskeletalBoneRemodelingSignals = {
  resorptionSignal: number
  formationSignal: number
  couplingSignal: number
  balanceSignal: number
}

export const MUSCULOSKELETAL_REMODELING_DEFAULTS: MusculoskeletalBoneRemodelingInputs = {
  ranklDrive: 0.58,
  opgBrake: 0.48,
  osteoclastCapacity: 0.62,
  osteoblastCapacity: 0.68,
}

export const MUSCULOSKELETAL_REMODELING_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '29368538',
    doi: '10.1177/0004563218759371',
    citation: 'Kenkre JS, Bassett JHD. Ann Clin Biochem. 2018;55(3):308-327.',
    supports: 'Bone remodeling is a coordinated cycle in which osteoclastic resorption is coupled to osteoblastic formation; RANK/RANKL/OPG signaling is a key regulator of osteoclast-mediated resorption.',
    reviewState: 'Published peer-reviewed review; source anchor only, not Panaceamed clinical validation or human review.',
  },
] as const

export const MUSCULOSKELETAL_REMODELING_BOUNDARY =
  'Educational bone-remodeling model using synthetic dimensionless signals only. It does not calculate or infer patient bone turnover markers, calcium, phosphate, vitamin D, PTH, bone mineral density, fracture risk, osteoporosis, malignancy, healing state, imaging findings, diagnosis, prognosis, medication response, dose, exercise prescription, or patient-specific clinical decisions. RANKL/OPG and osteoblast/osteoclast relationships are schematic physiology, not measured concentrations, validated kinetics, or anatomical geometry.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeBoneRemodelingInputs(input: Partial<MusculoskeletalBoneRemodelingInputs> = {}): MusculoskeletalBoneRemodelingInputs {
  return {
    ranklDrive: clamp01(input.ranklDrive ?? MUSCULOSKELETAL_REMODELING_DEFAULTS.ranklDrive),
    opgBrake: clamp01(input.opgBrake ?? MUSCULOSKELETAL_REMODELING_DEFAULTS.opgBrake),
    osteoclastCapacity: clamp01(input.osteoclastCapacity ?? MUSCULOSKELETAL_REMODELING_DEFAULTS.osteoclastCapacity),
    osteoblastCapacity: clamp01(input.osteoblastCapacity ?? MUSCULOSKELETAL_REMODELING_DEFAULTS.osteoblastCapacity),
  }
}

export function deriveBoneRemodeling(raw: Partial<MusculoskeletalBoneRemodelingInputs> = {}): MusculoskeletalBoneRemodelingSignals {
  const input = normalizeBoneRemodelingInputs(raw)
  const effectiveRankl = clamp01(input.ranklDrive * (1 - 0.78 * input.opgBrake))
  const resorptionSignal = clamp01(effectiveRankl * input.osteoclastCapacity)
  const couplingSignal = resorptionSignal
  const formationSignal = clamp01(input.osteoblastCapacity * (0.45 + 0.55 * couplingSignal))
  const balanceSignal = clamp01(0.5 + 0.5 * (formationSignal - resorptionSignal))
  return { resorptionSignal, formationSignal, couplingSignal, balanceSignal }
}
