import { hantaranOksigen } from '../hemodinamik.ts'
import type { DomainEngineContract, PhysiologicalValue } from './runtime.ts'
import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  oxygenContentConvention,
  oxygenContentMlDl,
} from './oxygenContentConventions.ts'

export const OXYGEN_TRANSPORT_EVIDENCE = [
  {
    id: 'statpearls-oxygen-transport',
    reference: 'NCBI Bookshelf NBK538336 / PMID 30855920',
    role: 'Supports CaO2 as hemoglobin-bound plus dissolved oxygen and systemic oxygen delivery as cardiac output times arterial oxygen content.',
  },
] as const

interface AlgebraicState { steps: number }

function field(inputs: Readonly<Record<string, PhysiologicalValue>>, name: string): PhysiologicalValue {
  const value = inputs[name]
  if (!value) throw new Error(`oxygen transport input missing: ${name}`)
  return value
}

export function arterialOxygenContentEngine(): DomainEngineContract<AlgebraicState> {
  const convention = oxygenContentConvention(DEFAULT_OXYGEN_CONTENT_CONVENTION)
  return {
    id: 'oxygen.arterial-content',
    modelId: 'arterial-oxygen-content',
    modelVersion: '1.0.0',
    parameterSetId: DEFAULT_OXYGEN_CONTENT_CONVENTION,
    validationClass: 'published-model-reproduction',
    fidelity: 'mechanistic-research',
    dtSeconds: 1,
    consumes: [
      { name: 'blood.hemoglobin', unit: 'g/dL' },
      { name: 'arterial.oxygen_saturation', unit: '1' },
      { name: 'arterial.po2', unit: 'mmHg' },
    ],
    produces: [
      { name: 'arterial.oxygen_content', unit: 'mL O2/dL', truthClass: 'model-derived' },
    ],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => {
      const hb = field(inputs, 'blood.hemoglobin')
      const saturation = field(inputs, 'arterial.oxygen_saturation')
      const po2 = field(inputs, 'arterial.po2')
      const caO2 = oxygenContentMlDl(
        DEFAULT_OXYGEN_CONTENT_CONVENTION,
        { value: hb.value, unit: 'g/dL' },
        saturation.value,
        po2.value,
      )
      const sigma = hb.sigma !== null && saturation.sigma !== null && po2.sigma !== null
        ? Math.hypot(
          convention.hufnerMlO2PerGHb * saturation.value * hb.sigma,
          convention.hufnerMlO2PerGHb * hb.value * saturation.sigma,
          convention.dissolvedMlO2PerDlPerMmHg * po2.sigma,
        )
        : null
      return {
        state: { steps: state.steps + 1 },
        outputs: [{ name: 'arterial.oxygen_content', unit: 'mL O2/dL', value: caO2, sigma }],
      }
    },
  }
}

export function systemicOxygenDeliveryEngine(): DomainEngineContract<AlgebraicState> {
  return {
    id: 'oxygen.systemic-delivery',
    modelId: 'systemic-oxygen-delivery',
    modelVersion: '1.0.0',
    parameterSetId: 'litre-decilitre-conversion-v1',
    validationClass: 'published-model-reproduction',
    fidelity: 'mechanistic-research',
    dtSeconds: 1,
    consumes: [
      { name: 'cardio.cardiac_output', unit: 'L/min' },
      { name: 'arterial.oxygen_content', unit: 'mL O2/dL' },
    ],
    produces: [
      { name: 'systemic.oxygen_delivery', unit: 'mL O2/min', truthClass: 'model-derived' },
    ],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => {
      const co = field(inputs, 'cardio.cardiac_output')
      const caO2 = field(inputs, 'arterial.oxygen_content')
      if (!(co.value > 0) || caO2.value < 0) {
        throw new Error(`oxygen transport input outside supported bounds: CO=${co.value}, CaO2=${caO2.value}`)
      }
      const delivery = hantaranOksigen(co.value, caO2.value)
      const sigma = co.sigma !== null && caO2.sigma !== null
        ? 10 * Math.hypot(caO2.value * co.sigma, co.value * caO2.sigma)
        : null
      return {
        state: { steps: state.steps + 1 },
        outputs: [{ name: 'systemic.oxygen_delivery', unit: 'mL O2/min', value: delivery, sigma }],
      }
    },
  }
}
