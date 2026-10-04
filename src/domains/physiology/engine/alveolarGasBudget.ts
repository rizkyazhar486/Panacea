import { tekananInspirasi, TETAPAN_GAS } from '../../../lib/gasAlveolar'
import { createDomainEngineRegistry, runPhysiologicalSimulation, type DomainEngineContract } from '../../../lib/physiology/runtime'
import { MODEL } from '../../../lib/ecmo/bukti'

/** Scenario parameters, never a sensor, patient record, or ventilator prescription. */
export interface AlveolarGasScenario {
  tidalVolumeMl: number
  deadSpaceMl: number
  breathsPerMinute: number
  co2ProductionMlMinStpd: number
  inspiredOxygenFraction: number
  respiratoryQuotient: number
}

export const ALVEOLAR_GAS_DEFAULTS: Readonly<AlveolarGasScenario> = {
  tidalVolumeMl: 500, deadSpaceMl: 150, breathsPerMinute: 12,
  co2ProductionMlMinStpd: 200, inspiredOxygenFraction: 0.21, respiratoryQuotient: 0.8,
}

// Software teaching envelope, not clinical normal ranges or treatment targets.
export const ALVEOLAR_GAS_CONTROLS = [
  { key: 'tidalVolumeMl', label: 'Tidal volume', unit: 'mL BTPS', min: 200, max: 1000, step: 10 },
  { key: 'deadSpaceMl', label: 'Physiological dead space', unit: 'mL BTPS', min: 0, max: 900, step: 10 },
  { key: 'breathsPerMinute', label: 'Breathing frequency', unit: '/min', min: 4, max: 40, step: 1 },
  { key: 'co2ProductionMlMinStpd', label: 'CO₂ production', unit: 'mL/min STPD', min: 50, max: 1000, step: 10 },
  { key: 'inspiredOxygenFraction', label: 'Inspired O₂ fraction', unit: 'fraction', min: 0.21, max: 1, step: 0.01 },
  { key: 'respiratoryQuotient', label: 'Respiratory quotient', unit: 'ratio', min: 0.7, max: 1, step: 0.01 },
] as const

export const ALVEOLAR_GAS_MODEL_IDS = ['alveolar-ventilation-budget', 'alveolar-gas-budget'] as const
export const ALVEOLAR_GAS_MODELS = ALVEOLAR_GAS_MODEL_IDS.map(id => MODEL[id])
export const ALVEOLAR_GAS_BOUNDARY = 'Synthetic educational steady-state scenario at sea level and 37 °C. BTPS ventilation and STPD CO₂ production are distinct. No arterial PaO₂, SpO₂, pH, diffusion, shunt, regional V/Q distribution, disease diagnosis, treatment or patient trajectory is inferred. Zero ventilation and impossible gas budgets remain unsupported; no output is clamped into a plausible value. Uncertainty is unknown, not zero. Source equations are reproduced; clinical or educational efficacy has not been validated.'

export type AlveolarGasBudget =
  | { ok: true; minuteVentilationLMin: number; deadSpaceVentilationLMin: number; alveolarVentilationLMin: number; alveolarCo2MmHg: number; alveolarO2MmHg: number; inspiredO2MmHg: number; truthClass: 'simulated'; simulation: ReturnType<typeof runPhysiologicalSimulation> }
  | { ok: false; reason: 'invalid-input' | 'no-alveolar-ventilation' | 'unsupported-gas-budget'; detail: string }

interface StaticState { evaluations: number }

function engines(scenario: AlveolarGasScenario): readonly DomainEngineContract<StaticState>[] {
  const parameterSetId = `educational-sea-level-37C-v1:${JSON.stringify(scenario)}`
  const common = { modelVersion: '1.0.0', parameterSetId, validationClass: 'published-model-reproduction' as const, fidelity: 'educational-reference' as const, dtSeconds: 1, initialize: () => ({ evaluations: 0 }) }
  return [
    {
      ...common, id: 'respiratory.ventilation-budget', modelId: ALVEOLAR_GAS_MODEL_IDS[0], consumes: [],
      produces: ['minute', 'dead_space', 'alveolar'].map(name => ({ name: `respiratory.ventilation.${name}`, unit: 'L/min BTPS', truthClass: 'simulated' as const })),
      step: ({ state }) => ({
        state: { evaluations: state.evaluations + 1 },
        outputs: [
          { name: 'respiratory.ventilation.minute', value: scenario.tidalVolumeMl * scenario.breathsPerMinute / 1000 },
          { name: 'respiratory.ventilation.dead_space', value: scenario.deadSpaceMl * scenario.breathsPerMinute / 1000 },
          { name: 'respiratory.ventilation.alveolar', value: (scenario.tidalVolumeMl - scenario.deadSpaceMl) * scenario.breathsPerMinute / 1000 },
        ].map(output => ({ ...output, unit: 'L/min BTPS', sigma: null })),
      }),
    },
    {
      ...common, id: 'respiratory.alveolar-gas-budget', modelId: ALVEOLAR_GAS_MODEL_IDS[1],
      consumes: [{ name: 'respiratory.ventilation.alveolar', unit: 'L/min BTPS' }],
      produces: ['co2', 'o2', 'inspired_o2'].map(name => ({ name: `respiratory.gas.${name}`, unit: 'mmHg', truthClass: 'simulated' as const })),
      step: ({ state, inputs }) => {
        const ventilation = inputs['respiratory.ventilation.alveolar'].value
        // 863 uses L/min for BOTH gas flows; 0.863 accommodates VCO₂ in mL/min.
        const co2 = 0.863 * scenario.co2ProductionMlMinStpd / ventilation
        const inspired = tekananInspirasi(scenario.inspiredOxygenFraction, TETAPAN_GAS.PATM_LAUT)
        // Rearranged ideal alveolar-air RER equation, including the FiO₂ correction.
        const o2 = inspired - co2 * (scenario.inspiredOxygenFraction + (1 - scenario.inspiredOxygenFraction) / scenario.respiratoryQuotient)
        return {
          state: { evaluations: state.evaluations + 1 },
          outputs: [{ name: 'respiratory.gas.co2', value: co2 }, { name: 'respiratory.gas.o2', value: o2 }, { name: 'respiratory.gas.inspired_o2', value: inspired }].map(output => ({ ...output, unit: 'mmHg', sigma: null })),
        }
      },
    },
  ]
}

export function evaluateAlveolarGasBudget(scenario: AlveolarGasScenario): AlveolarGasBudget {
  for (const control of ALVEOLAR_GAS_CONTROLS) {
    const value = scenario[control.key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max) {
      return { ok: false, reason: 'invalid-input', detail: `${control.label} must be finite and within the teaching envelope ${control.min}–${control.max} ${control.unit}.` }
    }
  }
  if (scenario.deadSpaceMl >= scenario.tidalVolumeMl) return { ok: false, reason: 'no-alveolar-ventilation', detail: 'Dead-space volume must be below tidal volume; this steady-state model cannot solve apnea or zero alveolar ventilation.' }
  const simulation = runPhysiologicalSimulation({ registry: createDomainEngineRegistry(engines(scenario)), untilSeconds: 0 })
  const value = (name: string) => simulation.latest[name].value
  const co2 = value('respiratory.gas.co2'), o2 = value('respiratory.gas.o2')
  if (o2 < 0 || co2 + o2 > TETAPAN_GAS.PATM_LAUT - TETAPAN_GAS.PH2O_37C) return { ok: false, reason: 'unsupported-gas-budget', detail: 'The assumed steady state has no physically admissible alveolar gas mixture; change the scenario rather than normalize the result.' }
  return {
    ok: true, minuteVentilationLMin: value('respiratory.ventilation.minute'), deadSpaceVentilationLMin: value('respiratory.ventilation.dead_space'), alveolarVentilationLMin: value('respiratory.ventilation.alveolar'), alveolarCo2MmHg: co2, alveolarO2MmHg: o2, inspiredO2MmHg: value('respiratory.gas.inspired_o2'), truthClass: 'simulated', simulation,
  }
}

/** Same evaluator powers every curve point; unsupported points are gaps, never zeros. */
export function alveolarFrequencySweep(scenario: AlveolarGasScenario) {
  return Array.from({ length: 37 }, (_, i) => {
    const breathsPerMinute = i + 4
    const result = evaluateAlveolarGasBudget({ ...scenario, breathsPerMinute })
    return { breathsPerMinute, co2MmHg: result.ok ? result.alveolarCo2MmHg : null, o2MmHg: result.ok ? result.alveolarO2MmHg : null }
  })
}
