import { curahJantung, fraksiEjeksi, isiSekuncup } from '../hemodinamik.ts'
import type { DomainEngineContract, PhysiologicalValue } from './runtime.ts'

export const CARDIOVASCULAR_IDENTITY_EVIDENCE = [
  {
    pmid: '27598497',
    title: 'Ventricular contractility: Physiology and clinical projection',
    role: 'Ventricular ejection volume depends on contractility and loading conditions; pressure-volume analysis supports ventricular hemodynamic assessment.',
  },
  {
    pmid: '26436838',
    title: 'Cardiac Pressure-Volume Loop Analysis Using Conductance Catheters in Mice',
    role: 'Pressure-volume analysis provides load-dependent and load-independent ventricular systolic and diastolic measures.',
  },
] as const

interface CardiovascularIdentityState { steps: number }

function value(inputs: Readonly<Record<string, PhysiologicalValue>>, name: string): PhysiologicalValue {
  const field = inputs[name]
  if (!field) throw new Error(`cardiovascular identity input missing: ${name}`)
  return field
}

export function cardiovascularIdentityEngine(): DomainEngineContract<CardiovascularIdentityState> {
  return {
    id: 'cardiovascular.identities',
    modelId: 'cardiovascular-algebraic-identities',
    modelVersion: '1.0.0',
    parameterSetId: 'identity-no-fitted-parameters-v1',
    validationClass: 'published-model-reproduction',
    fidelity: 'mechanistic-research',
    dtSeconds: 1,
    consumes: [
      { name: 'cardio.heart_rate', unit: 'bpm' },
      { name: 'cardio.lv.edv', unit: 'mL' },
      { name: 'cardio.lv.esv', unit: 'mL' },
    ],
    produces: [
      { name: 'cardio.lv.stroke_volume', unit: 'mL', truthClass: 'model-derived' },
      { name: 'cardio.cardiac_output', unit: 'L/min', truthClass: 'model-derived' },
      { name: 'cardio.lv.ejection_fraction', unit: '1', truthClass: 'model-derived' },
    ],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => {
      const hrField = value(inputs, 'cardio.heart_rate')
      const edvField = value(inputs, 'cardio.lv.edv')
      const esvField = value(inputs, 'cardio.lv.esv')
      const hr = hrField.value
      const edv = edvField.value
      const esv = esvField.value
      if (!(hr > 0) || !(edv > 0) || esv < 0 || esv > edv) {
        throw new Error(`cardiovascular identity input outside supported physiological bounds: HR=${hr}, EDV=${edv}, ESV=${esv}`)
      }

      const sv = isiSekuncup(edv, esv)
      const co = curahJantung(hr, sv)
      const ef = fraksiEjeksi(sv, edv)
      if (![sv, co, ef].every(Number.isFinite)) throw new Error('cardiovascular identity calculation produced a non-finite result')

      const edvSigma = edvField.sigma
      const esvSigma = esvField.sigma
      const hrSigma = hrField.sigma
      const svSigma = edvSigma !== null && esvSigma !== null
        ? Math.hypot(edvSigma, esvSigma)
        : null
      const coSigma = hrSigma !== null && svSigma !== null
        ? Math.hypot((sv / 1000) * hrSigma, (hr / 1000) * svSigma)
        : null
      // EF = 1 - ESV/EDV. First-order propagation assumes EDV and ESV input errors are independent.
      const efSigma = edvSigma !== null && esvSigma !== null
        ? Math.hypot((esv / (edv * edv)) * edvSigma, (1 / edv) * esvSigma)
        : null

      return {
        state: { steps: state.steps + 1 },
        outputs: [
          { name: 'cardio.lv.stroke_volume', unit: 'mL', value: sv, sigma: svSigma },
          { name: 'cardio.cardiac_output', unit: 'L/min', value: co, sigma: coSigma },
          { name: 'cardio.lv.ejection_fraction', unit: '1', value: ef, sigma: efSigma },
        ],
      }
    },
  }
}
