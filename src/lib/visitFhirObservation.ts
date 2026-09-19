import type { LongitudinalEvent } from './panaceaLongitudinalState.ts'
import type { VisitDeviceMetric } from './visitOperatingSystem.ts'

const LOINC = 'http://loinc.org'
const UCUM = 'http://unitsofmeasure.org'
const OBSERVATION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category'
const REVIEW_STATE = 'https://panaceamed.id/fhir/CodeSystem/review-state'
const PROVENANCE_CLASS = 'https://panaceamed.id/fhir/CodeSystem/provenance-class'

interface VerifiedVisitFhirMetric {
  loinc: string
  display: string
  internalUnit: string
  ucum: string
}

export const VERIFIED_VISIT_FHIR_METRICS: Readonly<
  Partial<Record<VisitDeviceMetric, VerifiedVisitFhirMetric>>
> = Object.freeze({
  'heart-rate': { loinc: '8867-4', display: 'Heart rate', internalUnit: 'bpm', ucum: '/min' },
  'ecg-heart-rate': { loinc: '8867-4', display: 'Heart rate', internalUnit: 'bpm', ucum: '/min' },
  spo2: {
    loinc: '59408-5',
    display: 'Oxygen saturation in Arterial blood by Pulse oximetry',
    internalUnit: '%',
    ucum: '%',
  },
  'respiratory-rate': {
    loinc: '9279-1',
    display: 'Respiratory rate',
    internalUnit: '/min',
    ucum: '/min',
  },
  'blood-pressure-systolic': {
    loinc: '8480-6',
    display: 'Systolic blood pressure',
    internalUnit: 'mmHg',
    ucum: 'mm[Hg]',
  },
  'blood-pressure-diastolic': {
    loinc: '8462-4',
    display: 'Diastolic blood pressure',
    internalUnit: 'mmHg',
    ucum: 'mm[Hg]',
  },
  temperature: {
    loinc: '8310-5',
    display: 'Body temperature',
    internalUnit: '°C',
    ucum: 'Cel',
  },
  weight: {
    loinc: '29463-7',
    display: 'Body weight',
    internalUnit: 'kg',
    ucum: 'kg',
  },
})

export interface VisitFhirReferences {
  patientReference: string
  encounterReference: string
  practitionerReference: string
  deviceReference: string
}

export interface VisitFhirObservation {
  resourceType: 'Observation'
  id: string
  meta: {
    tag: Array<{ system: string; code: string; display?: string }>
  }
  identifier: Array<{ system: string; value: string }>
  status: 'final'
  category: Array<{ coding: Array<{ system: string; code: 'vital-signs'; display: string }> }>
  code: { coding: Array<{ system: string; code: string; display: string }>; text: string }
  subject: { reference: string }
  encounter: { reference: string }
  effectiveDateTime: string
  issued: string
  performer: Array<{ reference: string }>
  device: { reference: string }
  valueQuantity: {
    value: number
    unit: string
    system: string
    code: string
  }
  note: Array<{ text: string }>
}

function fhirReference(reference: string, type: 'Patient' | 'Encounter' | 'Practitioner' | 'Device'): string {
  const value = reference.trim()
  if (!value) throw new Error(`${type} reference must not be blank`)
  if (!value.startsWith(`${type}/`) && !value.startsWith('urn:uuid:')) {
    throw new Error(`${type} reference must be ${type}/<id> or urn:uuid:<id>`)
  }
  return value
}

function iso(value: string, field: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid ISO timestamp`)
  return new Date(parsed).toISOString()
}

/**
 * Convert one clinician-accepted Visit OS longitudinal event into a FHIR R4
 * Observation suitable for the existing SATUSEHAT transport layer.
 *
 * This function performs no network I/O. It fails closed unless the metric has
 * an explicitly verified LOINC+UCUM mapping and the event is already accepted
 * by a named human reviewer.
 */
export function buildAcceptedVisitFhirObservation(
  event: LongitudinalEvent<number>,
  refs: VisitFhirReferences,
): VisitFhirObservation {
  if (event.review.state !== 'accepted' || !event.review.reviewerId?.trim() || !event.review.reviewedAt) {
    throw new Error('visit_fhir_requires_clinician_accepted_event')
  }
  if (event.provenance.sourceKind !== 'device') {
    throw new Error('visit_fhir_requires_device_provenance')
  }
  if (typeof event.value !== 'number' || !Number.isFinite(event.value)) {
    throw new Error('visit_fhir_requires_finite_value')
  }

  const metric = event.metric as VisitDeviceMetric
  const verified = VERIFIED_VISIT_FHIR_METRICS[metric]
  if (!verified) throw new Error(`visit_fhir_metric_not_verified:${event.metric}`)
  if (event.unit !== verified.internalUnit) {
    throw new Error(`visit_fhir_unit_mismatch:${event.metric}`)
  }

  const patientReference = fhirReference(refs.patientReference, 'Patient')
  const encounterReference = fhirReference(refs.encounterReference, 'Encounter')
  const practitionerReference = fhirReference(refs.practitionerReference, 'Practitioner')
  const deviceReference = fhirReference(refs.deviceReference, 'Device')
  const effectiveDateTime = iso(event.recordedAt, 'event.recordedAt')
  const issued = iso(event.review.reviewedAt, 'event.review.reviewedAt')

  return {
    resourceType: 'Observation',
    id: event.id.replace(/[^A-Za-z0-9\-.]/g, '-').slice(0, 64),
    meta: {
      tag: [
        { system: REVIEW_STATE, code: 'accepted', display: 'Clinician accepted' },
        { system: PROVENANCE_CLASS, code: 'device', display: 'Device observation' },
      ],
    },
    identifier: [
      { system: 'https://panaceamed.id/fhir/identifier/visit-observation', value: event.id },
    ],
    status: 'final',
    category: [{
      coding: [{
        system: OBSERVATION_CATEGORY,
        code: 'vital-signs',
        display: 'Vital Signs',
      }],
    }],
    code: {
      coding: [{ system: LOINC, code: verified.loinc, display: verified.display }],
      text: verified.display,
    },
    subject: { reference: patientReference },
    encounter: { reference: encounterReference },
    effectiveDateTime,
    issued,
    performer: [{ reference: practitionerReference }],
    device: { reference: deviceReference },
    valueQuantity: {
      value: event.value,
      unit: event.unit,
      system: UCUM,
      code: verified.ucum,
    },
    note: [{
      text: `Clinician-reviewed Visit OS observation. Source ${event.provenance.sourceId}; review state accepted.`,
    }],
  }
}

export const VISIT_FHIR_PUBLICATION_BOUNDARY =
  'Only clinician-accepted device observations with an explicitly verified LOINC/UCUM mapping may be converted by this module. Conversion does not submit to SATUSEHAT, reconcile IHS identities, or certify conformance.'
