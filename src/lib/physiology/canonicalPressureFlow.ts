import { cardiovascularIdentityEngine } from './cardiovascularIdentityEngine.ts'
import { runCanonicalProjection, type CanonicalProjectionRequest } from './canonicalProjection.ts'
import { SVR_UNIT, cerebralPerfusionPressureEngine, meanArterialPressureEngine } from './pressureFlowCoupling.ts'

// Exact-unit bindings only. Resistance, venous and intracranial pressure must be observed
// by a measuring source; a cuff or monitor reading is never substituted for them.
const FLOW_FIELDS = [
  { name: 'cardio.heart_rate', unit: 'bpm', metrics: ['cardio.heart_rate', 'heart-rate', 'vital.hr'] },
  { name: 'cardio.lv.edv', unit: 'mL', metrics: ['cardio.lv.edv'] },
  { name: 'cardio.lv.esv', unit: 'mL', metrics: ['cardio.lv.esv'] },
  { name: 'systemic.vascular_resistance', unit: SVR_UNIT, metrics: ['systemic.vascular_resistance'] },
  { name: 'venous.central_pressure', unit: 'mmHg', metrics: ['venous.central_pressure'] },
] as const

const INTRACRANIAL_FIELD = { name: 'intracranial.pressure', unit: 'mmHg', metrics: ['intracranial.pressure'] } as const

/** MAP is observable (arterial line), so this prediction can later be compared in the Reality Error ledger. */
export function runCanonicalMeanArterialPressure(input: CanonicalProjectionRequest) {
  return runCanonicalProjection(input, {
    fields: FLOW_FIELDS,
    engines: [cardiovascularIdentityEngine(), meanArterialPressureEngine()],
    outputField: 'arterial.mean_pressure',
  })
}

export function runCanonicalCerebralPerfusionPressure(input: CanonicalProjectionRequest) {
  return runCanonicalProjection(input, {
    fields: [...FLOW_FIELDS, INTRACRANIAL_FIELD],
    engines: [cardiovascularIdentityEngine(), meanArterialPressureEngine(), cerebralPerfusionPressureEngine()],
    outputField: 'cerebral.perfusion_pressure',
  })
}
