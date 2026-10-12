import { cardiovascularIdentityEngine } from './cardiovascularIdentityEngine.ts'
import { arterialOxygenContentEngine, systemicOxygenDeliveryEngine } from './oxygenTransportEngine.ts'
import { runCanonicalProjection, type CanonicalProjectionRequest } from './canonicalProjection.ts'

// Exact-unit bindings only. In particular, peripheral SpO2 is not arterial SaO2.
const FIELDS = [
  { name: 'cardio.heart_rate', unit: 'bpm', metrics: ['cardio.heart_rate', 'heart-rate', 'vital.hr'] },
  { name: 'cardio.lv.edv', unit: 'mL', metrics: ['cardio.lv.edv'] },
  { name: 'cardio.lv.esv', unit: 'mL', metrics: ['cardio.lv.esv'] },
  { name: 'blood.hemoglobin', unit: 'g/dL', metrics: ['blood.hemoglobin', 'lab.hb'] },
  { name: 'arterial.oxygen_saturation', unit: '1', metrics: ['arterial.oxygen_saturation'] },
  { name: 'arterial.po2', unit: 'mmHg', metrics: ['arterial.po2'] },
] as const

export type CanonicalOxygenDeliveryRequest = CanonicalProjectionRequest

export function runCanonicalOxygenDelivery(input: CanonicalOxygenDeliveryRequest) {
  return runCanonicalProjection(input, {
    fields: FIELDS,
    engines: [cardiovascularIdentityEngine(), arterialOxygenContentEngine(), systemicOxygenDeliveryEngine()],
    outputField: 'systemic.oxygen_delivery',
  })
}
