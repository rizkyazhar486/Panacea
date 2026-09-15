export interface SyntheticNeurovascularInput {
  systemicPressureDrive: number
  intracranialVolumeLoad: number
  baselineVascularResistance: number
  arterialOxygenContent: number
  metabolicDemand: number
  autoregulatoryReserve: number
}

export interface SyntheticNeurovascularState {
  cerebralPerfusionPressureSignal: number
  effectiveVascularResistanceSignal: number
  cerebralBloodFlowSignal: number
  oxygenDeliverySignal: number
  autoregulationStrainSignal: number
  intracranialComplianceStress: number
  metabolicMismatchSignal: number
}

export interface NeurovascularRelationship {
  id: string
  expression: string
  meaning: string
  boundary: string
}

export interface NeurovascularNetworkNode {
  id: string
  label: string
  layer: 'systemic' | 'intracranial' | 'vascular' | 'delivery' | 'metabolic'
  role: string
}

export interface NeurovascularEvidenceAnchor {
  pmid: string
  title: string
  role: string
  url: string
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export const NEUROVASCULAR_RELATIONSHIPS: readonly NeurovascularRelationship[] = [
  {
    id: 'cpp',
    expression: 'CPP = MAP − ICP',
    meaning: 'Cerebral perfusion pressure is conventionally conceptualized as mean arterial pressure minus intracranial pressure when venous pressure is not the dominant downstream pressure.',
    boundary: 'Shown as a physiology relationship only. This workbench uses normalized inputs and does not calculate a patient CPP or treatment target.',
  },
  {
    id: 'cbf-resistance',
    expression: 'CBF ∝ CPP / CVR',
    meaning: 'A pressure-gradient/resistance relationship links cerebral perfusion pressure to cerebral blood flow while cerebrovascular resistance changes through vascular tone and autoregulatory responses.',
    boundary: 'Conceptual proportionality only; the synthetic flow signal is not mL/100 g/min and cannot diagnose hypo- or hyperperfusion.',
  },
  {
    id: 'oxygen-delivery',
    expression: 'cerebral O₂ delivery ∝ CBF × arterial O₂ content',
    meaning: 'Oxygen delivery depends jointly on cerebral blood flow and the oxygen content carried by arterial blood.',
    boundary: 'Educational coupling only; no patient arterial oxygen content, extraction fraction, tissue oxygen tension or ischemic threshold is estimated.',
  },
  {
    id: 'monro-kellie',
    expression: 'intracranial volume ≈ brain tissue + blood + CSF',
    meaning: 'The simplified Monro–Kellie framework treats major intracranial components as sharing a constrained cranial volume, with compensatory reserve becoming important as one component expands.',
    boundary: 'Conceptual intracranial-dynamics model only; it does not estimate intracranial pressure, compliance, herniation risk or need for intervention.',
  },
] as const

export const NEUROVASCULAR_NETWORK: readonly NeurovascularNetworkNode[] = [
  {
    id: 'systemic-pressure',
    label: 'Systemic pressure drive',
    layer: 'systemic',
    role: 'Provides the upstream pressure component that contributes to the cerebral perfusion gradient.',
  },
  {
    id: 'intracranial-pressure-context',
    label: 'Intracranial pressure / volume context',
    layer: 'intracranial',
    role: 'Represents downstream pressure and compliance context created by interactions among brain tissue, blood and CSF volumes.',
  },
  {
    id: 'autoregulation',
    label: 'Autoregulatory vascular tone',
    layer: 'vascular',
    role: 'Adjusts cerebrovascular resistance across changing perfusion pressure to buffer cerebral blood flow within physiologic reserve.',
  },
  {
    id: 'cerebral-flow',
    label: 'Cerebral blood flow',
    layer: 'delivery',
    role: 'Carries oxygen and metabolic substrate from arterial circulation into the neurovascular unit.',
  },
  {
    id: 'oxygen-delivery',
    label: 'Oxygen delivery',
    layer: 'delivery',
    role: 'Couples flow to arterial oxygen content before tissue extraction and cellular utilization.',
  },
  {
    id: 'metabolic-demand',
    label: 'Neural metabolic demand',
    layer: 'metabolic',
    role: 'Represents synthetic tissue demand that must remain matched to substrate and oxygen delivery for homeostasis.',
  },
] as const

export const NEUROVASCULAR_EVIDENCE: readonly NeurovascularEvidenceAnchor[] = [
  {
    pmid: '38471987',
    title: 'Monitoring of cerebral blood flow autoregulation: physiologic basis, measurement, and clinical implications',
    role: 'Supports the core concept that cerebral autoregulation modulates blood flow across changing cerebral perfusion pressure and that individual autoregulatory limits vary substantially.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38471987/',
  },
  {
    pmid: '40474297',
    title: 'Monro-Kellie 4.0: moving from intracranial pressure to intracranial dynamics',
    role: 'Supports a modern systems view of intracranial dynamics involving brain tissue, blood, CSF, compliance, cerebrovascular autoregulation and compartment interactions.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40474297/',
  },
  {
    pmid: '36762674',
    title: 'Beyond intracranial pressure: monitoring cerebral perfusion and autoregulation in severe traumatic brain injury',
    role: 'Supports interpreting intracranial pressure and cerebral perfusion pressure within the broader context of cerebral autoregulation rather than as isolated static numbers.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36762674/',
  },
] as const

export const NEUROVASCULAR_PERFUSION_BOUNDARY =
  'Educational neurovascular physiology sandbox only. Inputs and outputs are normalized synthetic signals, not mmHg, cerebral blood-flow measurements, oxygenation values or clinical targets. It does not diagnose intracranial hypertension, ischemia, autoregulatory failure, stroke severity, herniation risk or treatment eligibility.'

export function simulateSyntheticNeurovascularState(input: SyntheticNeurovascularInput): SyntheticNeurovascularState {
  const systemicPressureDrive = clamp01(input.systemicPressureDrive)
  const intracranialVolumeLoad = clamp01(input.intracranialVolumeLoad)
  const baselineVascularResistance = clamp01(input.baselineVascularResistance)
  const arterialOxygenContent = clamp01(input.arterialOxygenContent)
  const metabolicDemand = clamp01(input.metabolicDemand)
  const autoregulatoryReserve = clamp01(input.autoregulatoryReserve)

  const cerebralPerfusionPressureSignal = clamp01(0.14 + systemicPressureDrive * 0.74 - intracranialVolumeLoad * 0.52)
  const pressureError = cerebralPerfusionPressureSignal - 0.54
  const autoregulatoryAdjustment = pressureError * autoregulatoryReserve * 0.38
  const effectiveVascularResistanceSignal = clamp01(0.20 + baselineVascularResistance * 0.52 + autoregulatoryAdjustment)
  const cerebralBloodFlowSignal = clamp01(0.16 + cerebralPerfusionPressureSignal * 0.74 - effectiveVascularResistanceSignal * 0.42)
  const oxygenDeliverySignal = clamp01(0.08 + cerebralBloodFlowSignal * 0.58 + arterialOxygenContent * 0.38)
  const autoregulationStrainSignal = clamp01(Math.abs(pressureError) * (0.80 - autoregulatoryReserve * 0.36) + intracranialVolumeLoad * 0.18)
  const intracranialComplianceStress = clamp01(0.06 + intracranialVolumeLoad * 0.82 + cerebralBloodFlowSignal * 0.10)
  const metabolicMismatchSignal = clamp01(0.10 + metabolicDemand * 0.74 - oxygenDeliverySignal * 0.62)

  return {
    cerebralPerfusionPressureSignal,
    effectiveVascularResistanceSignal,
    cerebralBloodFlowSignal,
    oxygenDeliverySignal,
    autoregulationStrainSignal,
    intracranialComplianceStress,
    metabolicMismatchSignal,
  }
}

export function buildAutoregulationTeachingCurve(
  baselineVascularResistance: number,
  intracranialVolumeLoad: number,
  autoregulatoryReserve: number,
): readonly { pressureDrive: number; flowSignal: number }[] {
  return Array.from({ length: 11 }, (_, index) => {
    const pressureDrive = index / 10
    const state = simulateSyntheticNeurovascularState({
      systemicPressureDrive: pressureDrive,
      intracranialVolumeLoad,
      baselineVascularResistance,
      arterialOxygenContent: 0.62,
      metabolicDemand: 0.55,
      autoregulatoryReserve,
    })
    return { pressureDrive, flowSignal: state.cerebralBloodFlowSignal }
  })
}
