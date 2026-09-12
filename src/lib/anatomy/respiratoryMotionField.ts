import { respiratorySegmentRuntime } from './respiratoryHighEndRuntime'

/**
 * Continuous, dimensionless respiratory animation field.
 *
 * This is a graphics/education signal generator, NOT a pulmonary-function model.
 * It deliberately contains no litres, cmH2O, mL/s, compliance, resistance,
 * perfusion, gas tension, or patient-specific value.
 *
 * Normalized volume-like animation envelope:
 *   E(t) = 0.5 - 0.5 cos(2πt),  t ∈ [0,1)
 * Signed flow-like animation direction:
 *   F(t) = sin(2πt)
 *
 * E is used only to coordinate visual expansion/contraction. F is used only to
 * choose inward/outward particle direction and must never be labelled as flow.
 */

export type RespiratoryMotionChannel =
  | 'airway-lumen'
  | 'lung-envelope'
  | 'diaphragm'
  | 'pleural-envelope'
  | 'acinar-reference'
  | 'gas-exchange-reference'

export interface RespiratoryMotionSample {
  cycleFraction: number
  expansion01: number
  signedDirection: number
  inwardWeight01: number
  outwardWeight01: number
  diaphragmDescent01: number
  chestExpansion01: number
  acinarExpansion01: number
  modelStatus: 'dimensionless-animation-reference'
  quantitative: false
}

export interface RespiratoryMotionBinding {
  channel: RespiratoryMotionChannel
  nodeIds: readonly string[]
  amplitude01: number
  phaseOffsetCycles: number
  spatialMeaning: string
  quantitative: false
}

export interface RespiratoryMotionFieldPlan {
  sample: RespiratoryMotionSample
  bindings: readonly RespiratoryMotionBinding[]
  selectedSegmentNodeId?: string
  airwayRoute: readonly string[]
  warnings: readonly string[]
}

const TAU = Math.PI * 2
const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const wrap01 = (value: number) => ((value % 1) + 1) % 1

function smooth01(value: number) {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}

export function sampleRespiratoryMotion(cycleFraction: number): RespiratoryMotionSample {
  const t = wrap01(cycleFraction)
  const expansion01 = clamp01(0.5 - 0.5 * Math.cos(TAU * t))
  const signedDirection = Math.max(-1, Math.min(1, Math.sin(TAU * t)))
  const inwardWeight01 = clamp01(signedDirection)
  const outwardWeight01 = clamp01(-signedDirection)

  // Non-linear easing prevents a mechanical-looking hard reversal at the ends
  // while remaining a dimensionless graphics signal.
  const easedExpansion = smooth01(expansion01)
  return {
    cycleFraction: t,
    expansion01,
    signedDirection,
    inwardWeight01,
    outwardWeight01,
    diaphragmDescent01: easedExpansion,
    chestExpansion01: easedExpansion,
    acinarExpansion01: easedExpansion,
    modelStatus: 'dimensionless-animation-reference',
    quantitative: false,
  }
}

const WHOLE_RESPIRATORY_BINDINGS: readonly RespiratoryMotionBinding[] = [
  {
    channel: 'airway-lumen',
    nodeIds: ['resp:larynx', 'resp:trachea', 'resp:carina', 'resp:right-main-bronchus', 'resp:left-main-bronchus'],
    amplitude01: 0.18,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Subtle lumen emphasis and directional particle cue; no airway calibre claim.',
    quantitative: false,
  },
  {
    channel: 'lung-envelope',
    nodeIds: ['resp:right-lung', 'resp:left-lung', 'resp:right-upper-lobe', 'resp:right-middle-lobe', 'resp:right-lower-lobe', 'resp:left-upper-lobe', 'resp:left-lower-lobe'],
    amplitude01: 0.32,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Coordinated educational expansion envelope; no regional ventilation measurement.',
    quantitative: false,
  },
  {
    channel: 'diaphragm',
    nodeIds: ['resp:diaphragm', 'he:diaphragm-muscle'],
    amplitude01: 0.38,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Normalized descent/return animation; no excursion distance is encoded.',
    quantitative: false,
  },
  {
    channel: 'pleural-envelope',
    nodeIds: ['resp:pleura', 'resp:visceral-pleura', 'resp:parietal-pleura'],
    amplitude01: 0.08,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Pleural coupling cue only; no pleural pressure value is represented.',
    quantitative: false,
  },
  {
    channel: 'acinar-reference',
    nodeIds: ['he:pulmonary-acinus', 'deep:terminal-bronchiole', 'deep:respiratory-bronchiole', 'deep:alveolar-duct', 'deep:alveolar-sac'],
    amplitude01: 0.22,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Conceptual distal-airway/acinar expansion cue; no distal generation geometry is invented.',
    quantitative: false,
  },
  {
    channel: 'gas-exchange-reference',
    nodeIds: ['resp:alveolar-capillary-unit', 'he:alveolar-blood-gas-barrier', 'deep:pulmonary-capillary-bed'],
    amplitude01: 0.16,
    phaseOffsetCycles: 0,
    spatialMeaning: 'Educational gas-exchange emphasis only; no diffusion, perfusion, or gas-tension value is encoded.',
    quantitative: false,
  },
] as const

export function buildRespiratoryMotionField(options: {
  cycleFraction: number
  selectedSegmentNodeId?: string
  channels?: readonly RespiratoryMotionChannel[]
}): RespiratoryMotionFieldPlan {
  const sample = sampleRespiratoryMotion(options.cycleFraction)
  const selectedSegment = options.selectedSegmentNodeId
    ? respiratorySegmentRuntime(options.selectedSegmentNodeId)
    : undefined
  const channelFilter = options.channels?.length ? new Set(options.channels) : undefined
  const bindings = WHOLE_RESPIRATORY_BINDINGS
    .filter((binding) => !channelFilter || channelFilter.has(binding.channel))
    .map((binding) => {
      if (!selectedSegment || binding.channel !== 'airway-lumen') return binding
      return {
        ...binding,
        nodeIds: [...new Set([...binding.nodeIds, ...selectedSegment.bronchoscopicRoute])],
      }
    })

  const warnings = [
    'Respiratory motion field is dimensionless and intended only for educational animation timing.',
    'No pressure, flow, volume, compliance, resistance, perfusion, diffusion, or patient-specific value is generated.',
  ]
  if (options.selectedSegmentNodeId && !selectedSegment) {
    warnings.push(`Unknown bronchopulmonary segment runtime id: ${options.selectedSegmentNodeId}`)
  }

  return {
    sample,
    bindings,
    selectedSegmentNodeId: selectedSegment?.atlasNodeId,
    airwayRoute: selectedSegment?.bronchoscopicRoute ?? ['resp:larynx', 'resp:trachea', 'resp:carina'],
    warnings,
  }
}

export function validateRespiratoryMotionField(plan: RespiratoryMotionFieldPlan): string[] {
  const issues: string[] = []
  const scalarValues = [
    plan.sample.cycleFraction,
    plan.sample.expansion01,
    plan.sample.inwardWeight01,
    plan.sample.outwardWeight01,
    plan.sample.diaphragmDescent01,
    plan.sample.chestExpansion01,
    plan.sample.acinarExpansion01,
  ]
  if (scalarValues.some((value) => value < 0 || value > 1 || !Number.isFinite(value))) {
    issues.push('Respiratory animation scalar escaped normalized [0,1] bounds.')
  }
  if (plan.sample.signedDirection < -1 || plan.sample.signedDirection > 1 || !Number.isFinite(plan.sample.signedDirection)) {
    issues.push('Respiratory signed animation direction escaped [-1,1] bounds.')
  }
  if (plan.sample.quantitative !== false) issues.push('Respiratory motion field must remain explicitly non-quantitative.')

  const channels = new Set<RespiratoryMotionChannel>()
  for (const binding of plan.bindings) {
    if (channels.has(binding.channel)) issues.push(`Duplicate respiratory motion channel: ${binding.channel}`)
    channels.add(binding.channel)
    if (!(binding.amplitude01 >= 0 && binding.amplitude01 <= 1)) issues.push(`Invalid normalized respiratory animation amplitude: ${binding.channel}`)
    if (!binding.nodeIds.length) issues.push(`Respiratory motion binding has no anatomy nodes: ${binding.channel}`)
    if (binding.quantitative !== false) issues.push(`Respiratory motion binding must remain non-quantitative: ${binding.channel}`)
  }
  return [...new Set(issues)]
}
