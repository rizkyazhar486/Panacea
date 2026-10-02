import {
  VISIT_DEVICE_METRICS,
  type DeviceEvidenceClass,
  type VisitDeviceClass,
  type VisitDeviceDescriptor,
  type VisitDeviceMetric,
  type VisitDeviceObservation,
  type VisitDeviceTransport,
} from './visitOperatingSystem.ts'

/**
 * Canonical boundary for device adapters feeding Visit OS.
 *
 * This module does not claim that any particular device or vendor is supported.
 * A real BLE/USB/network/vendor/FHIR implementation must first decode its
 * source payload and then pass a measurement through this boundary.
 */

export type VisitAdapterKind =
  | 'ble-gatt'
  | 'usb-serial'
  | 'local-network'
  | 'vendor-cloud'
  | 'fhir-r4'

const TRANSPORT_BY_ADAPTER: Record<VisitAdapterKind, VisitDeviceTransport> = {
  'ble-gatt': 'bluetooth-le',
  'usb-serial': 'usb',
  'local-network': 'local-network',
  'vendor-cloud': 'vendor-cloud',
  'fhir-r4': 'fhir',
}

export interface VisitAdapterIdentity {
  adapterId: string
  adapterKind: VisitAdapterKind
  adapterVersion: string
}

export interface VisitAdapterDeviceIdentity {
  id: string
  label: string
  deviceClass: VisitDeviceClass
  evidenceClass: DeviceEvidenceClass
  manufacturer?: string
  model?: string
  firmwareVersion?: string
  supports: readonly VisitDeviceMetric[]
}

export interface VisitAdapterMeasurementInput {
  adapter: VisitAdapterIdentity
  device: VisitAdapterDeviceIdentity
  sampleId: string
  visitId: string
  subjectId: string
  metric: VisitDeviceMetric
  value: number
  unit: string
  capturedAt: string
  receivedAt: string
  signalQuality: number | null
  standardCode?: VisitDeviceObservation['standardCode']
}

export interface NormalizedVisitAdapterMeasurement {
  adapter: Readonly<VisitAdapterIdentity>
  descriptor: VisitDeviceDescriptor
  observation: VisitDeviceObservation
}

function nonBlank(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function iso(value: string, field: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid ISO timestamp`)
  return parsed
}

function quality(value: number | null) {
  if (value == null) return
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('signalQuality must be null or a finite value in [0, 1]')
  }
}

function assertMetric(metric: VisitDeviceMetric) {
  const definition = VISIT_DEVICE_METRICS[metric]
  if (!definition) throw new Error('unsupported canonical Visit OS metric')
  return definition
}

export function normalizeVisitAdapterMeasurement(
  input: VisitAdapterMeasurementInput,
): NormalizedVisitAdapterMeasurement {
  const adapterId = nonBlank(input.adapter.adapterId, 'adapter.adapterId')
  const adapterVersion = nonBlank(input.adapter.adapterVersion, 'adapter.adapterVersion')
  const deviceId = nonBlank(input.device.id, 'device.id')
  const label = nonBlank(input.device.label, 'device.label')
  const sampleId = nonBlank(input.sampleId, 'sampleId')
  const visitId = nonBlank(input.visitId, 'visitId')
  const subjectId = nonBlank(input.subjectId, 'subjectId')

  const definition = assertMetric(input.metric)
  if (!input.device.supports.includes(input.metric)) {
    throw new Error(`device does not declare support for ${input.metric}`)
  }
  if (input.unit !== definition.unit) {
    throw new Error(`unit mismatch for ${input.metric}: expected ${definition.unit}`)
  }
  if (!Number.isFinite(input.value)) throw new Error('value must be finite')

  const capturedMs = iso(input.capturedAt, 'capturedAt')
  const receivedMs = iso(input.receivedAt, 'receivedAt')
  if (capturedMs > receivedMs) {
    throw new Error('capturedAt must not be later than receivedAt')
  }

  quality(input.signalQuality)

  if (input.standardCode) {
    nonBlank(input.standardCode.code, 'standardCode.code')
  }

  const descriptor: VisitDeviceDescriptor = {
    id: deviceId,
    label,
    deviceClass: input.device.deviceClass,
    evidenceClass: input.device.evidenceClass,
    transport: TRANSPORT_BY_ADAPTER[input.adapter.adapterKind],
    manufacturer: input.device.manufacturer?.trim() || undefined,
    model: input.device.model?.trim() || undefined,
    firmwareVersion: input.device.firmwareVersion?.trim() || undefined,
    supports: [...new Set(input.device.supports)],
  }

  const observation: VisitDeviceObservation = {
    id: sampleId,
    visitId,
    subjectId,
    deviceId,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    capturedAt: input.capturedAt,
    receivedAt: input.receivedAt,
    signalQuality: input.signalQuality,
    standardCode: input.standardCode ? { ...input.standardCode } : undefined,
  }

  return {
    adapter: Object.freeze({
      adapterId,
      adapterKind: input.adapter.adapterKind,
      adapterVersion,
    }),
    descriptor,
    observation,
  }
}

export const VISIT_DEVICE_ADAPTER_BOUNDARY =
  'BLE, USB, local-network, vendor-cloud and FHIR integrations are not considered supported merely because this contract exists. A source-specific adapter must decode real payloads, preserve device provenance, normalize into this contract, and pass deterministic fixtures before product support may be claimed.'
