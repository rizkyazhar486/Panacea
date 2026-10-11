import { deriveCerebralPerfusionPressure } from './cerebralPerfusionCoupling.ts'
import type { DomainEngineContract, PhysiologicalValue } from './runtime.ts'

// Satu-satunya konstanta: 1 mmHg = 1333.22 dyn/cm² dan 1 L/min = 16.667 cm³/s,
// sehingga 1 mmHg·min/L = 79.99 dyn·s/cm⁵; konvensi klinis membulatkannya ke 80.
export const WOOD_TO_DYNE_SECOND_CM5 = 80

export const PRESSURE_FLOW_EVIDENCE = [
  {
    id: 'statpearls-svr',
    reference: 'NCBI Bookshelf NBK556075',
    title: 'Physiology, Systemic Vascular Resistance',
    role: 'Systemic vascular resistance relates the mean arterial-to-venous pressure drop to cardiac output.',
  },
  {
    id: 'statpearls-co',
    reference: 'NCBI Bookshelf NBK470455',
    title: 'Physiology, Cardiac Output',
    role: 'Cardiac output as the flow term of the pressure-flow relation.',
  },
  {
    id: 'statpearls-map',
    reference: 'NCBI Bookshelf NBK538226',
    title: 'Physiology, Mean Arterial Pressure',
    role: 'Mean arterial pressure as the driving pressure that perfuses organs.',
  },
  {
    id: 'statpearls-cpp',
    reference: 'NCBI Bookshelf NBK537271',
    title: 'Cerebral Perfusion Pressure',
    role: 'Gradient used by the cerebral stage of this chain.',
  },
] as const

export const PRESSURE_FLOW_BOUNDARY =
  'Steady-state algebraic pressure-flow identities only (MAP = CO × SVR / 80 + CVP; CPP = MAP − ICP). These are contemporaneous estimates from measured resistance and venous or intracranial pressure; they do not model pulsatility, compliance, baroreflex feedback, autoregulation, regional flow or any forecast. SVR here must be an observed value, not a population default. Outputs are model-derived, carry no clinical validation, and are not a diagnosis, a shock classification or a treatment target.'

export const SVR_UNIT = 'dyn*s/cm^5'

interface StepState { steps: number }

function need(inputs: Readonly<Record<string, PhysiologicalValue>>, name: string): PhysiologicalValue {
  const field = inputs[name]
  if (!field) throw new Error(`pressure-flow input missing: ${name}`)
  return field
}

function combine(...parts: Array<number | null>): number | null {
  return parts.every((part): part is number => part !== null) ? Math.hypot(...parts) : null
}

export function meanArterialPressureEngine(): DomainEngineContract<StepState> {
  return {
    id: 'hemodynamics.mean-arterial-pressure',
    modelId: 'map-from-flow-and-resistance',
    modelVersion: '1.0.0',
    parameterSetId: 'wood-unit-conversion-80-v1',
    validationClass: 'published-model-reproduction',
    fidelity: 'educational-reference',
    dtSeconds: 1,
    consumes: [
      { name: 'cardio.cardiac_output', unit: 'L/min' },
      { name: 'systemic.vascular_resistance', unit: SVR_UNIT },
      { name: 'venous.central_pressure', unit: 'mmHg' },
    ],
    produces: [{ name: 'arterial.mean_pressure', unit: 'mmHg', truthClass: 'model-derived' }],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => {
      const co = need(inputs, 'cardio.cardiac_output')
      const svr = need(inputs, 'systemic.vascular_resistance')
      const cvp = need(inputs, 'venous.central_pressure')
      if (!(co.value > 0) || !(svr.value > 0) || !Number.isFinite(cvp.value)) {
        throw new Error(`pressure-flow input outside supported bounds: CO=${co.value}, SVR=${svr.value}, CVP=${cvp.value}`)
      }
      const map = (co.value * svr.value) / WOOD_TO_DYNE_SECOND_CM5 + cvp.value
      if (!Number.isFinite(map) || map <= 0) throw new Error('mean arterial pressure is not a positive finite value for these inputs')
      const sigma = combine(
        co.sigma === null ? null : (svr.value / WOOD_TO_DYNE_SECOND_CM5) * co.sigma,
        svr.sigma === null ? null : (co.value / WOOD_TO_DYNE_SECOND_CM5) * svr.sigma,
        cvp.sigma,
      )
      return {
        state: { steps: state.steps + 1 },
        outputs: [{ name: 'arterial.mean_pressure', unit: 'mmHg', value: map, sigma }],
      }
    },
  }
}

export function cerebralPerfusionPressureEngine(): DomainEngineContract<StepState> {
  return {
    id: 'hemodynamics.cerebral-perfusion-pressure',
    modelId: 'cpp-map-minus-icp',
    modelVersion: '1.0.0',
    parameterSetId: 'no-fitted-parameters-v1',
    validationClass: 'published-model-reproduction',
    fidelity: 'educational-reference',
    dtSeconds: 1,
    consumes: [
      { name: 'arterial.mean_pressure', unit: 'mmHg' },
      { name: 'intracranial.pressure', unit: 'mmHg' },
    ],
    produces: [{ name: 'cerebral.perfusion_pressure', unit: 'mmHg', truthClass: 'model-derived' }],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => {
      const map = need(inputs, 'arterial.mean_pressure')
      const icp = need(inputs, 'intracranial.pressure')
      // Menggunakan fungsi yang sama dengan kopling serebral mandiri agar satu definisi CPP.
      const { cerebralPerfusionPressureMmHg } = deriveCerebralPerfusionPressure({
        meanArterialPressureMmHg: map.value,
        intracranialPressureMmHg: icp.value,
      })
      return {
        state: { steps: state.steps + 1 },
        outputs: [{ name: 'cerebral.perfusion_pressure', unit: 'mmHg', value: cerebralPerfusionPressureMmHg, sigma: combine(map.sigma, icp.sigma) }],
      }
    },
  }
}
