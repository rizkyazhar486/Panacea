import type { DomainEngineContract } from './runtime.ts'

interface SyntheticState { steps: number }

/**
 * Synthetic, dimensionless fixtures for testing runtime composition only.
 * They do not represent human physiology and must never be used for clinical prediction.
 */
export function syntheticCoupledEngines(): readonly DomainEngineContract<SyntheticState>[] {
  const drive: DomainEngineContract<SyntheticState> = {
    id: 'synthetic.drive',
    modelId: 'synthetic-linear-drive',
    modelVersion: '1.0.0',
    parameterSetId: 'fixture-only-v1',
    validationClass: 'synthetic',
    fidelity: 'infrastructure-fixture',
    dtSeconds: 1,
    consumes: [{ name: 'boundary.input', unit: '1' }],
    produces: [{ name: 'synthetic.drive.value', unit: '1', truthClass: 'simulated' }],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => ({
      state: { steps: state.steps + 1 },
      outputs: [{ name: 'synthetic.drive.value', unit: '1', value: inputs['boundary.input'].value * 1.5, sigma: inputs['boundary.input'].sigma }],
    }),
  }

  const response: DomainEngineContract<SyntheticState> = {
    id: 'synthetic.response',
    modelId: 'synthetic-linear-response',
    modelVersion: '1.0.0',
    parameterSetId: 'fixture-only-v1',
    validationClass: 'synthetic',
    fidelity: 'infrastructure-fixture',
    dtSeconds: 2,
    consumes: [{ name: 'synthetic.drive.value', unit: '1' }],
    produces: [{ name: 'synthetic.response.value', unit: '1', truthClass: 'simulated' }],
    initialize: () => ({ steps: 0 }),
    step: ({ state, inputs }) => ({
      state: { steps: state.steps + 1 },
      outputs: [{ name: 'synthetic.response.value', unit: '1', value: inputs['synthetic.drive.value'].value + 0.25, sigma: inputs['synthetic.drive.value'].sigma }],
    }),
  }

  return [drive, response]
}
