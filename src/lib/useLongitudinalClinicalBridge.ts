import { useEffect } from 'react'
import { useStore } from './store'
import {
  createLongitudinalSignal,
  readLongitudinalSignals,
  replaceSubjectSignals,
  type LongitudinalSignal,
} from './longitudinalPatientState'

const SOURCE = 'Panacea clinical record'
const SOURCE_TAG = 'panacea-clinical-bridge'
const MAX_VITAL_ROWS = 24
const MAX_SUPPORTIVE_ROWS = 24

export function useLongitudinalClinicalBridge() {
  const store = useStore()
  const patient = store.activePatient
  const account = store.account
  const vitals = store.state.vitals[patient.id] ?? []
  const supportive = store.state.supportive[patient.id] ?? []

  useEffect(() => {
    const consentGranted = Boolean(account?.consentAt)
    const consent = {
      granted: consentGranted,
      scope: consentGranted ? 'Panacea longitudinal care context' : 'Local display only until consent is available',
    }
    const evidence = 'Direct structured value from the active patient record. Confidence represents record fidelity, not measurement validity or clinical certainty.'
    const next: LongitudinalSignal[] = []

    for (const vital of vitals.slice(-MAX_VITAL_ROWS)) {
      const base = {
        subjectId: patient.id,
        domain: 'vitals' as const,
        measuredAt: vital.takenAt,
        source: SOURCE,
        provenance: { kind: 'clinical' as const, sourceId: vital.id, evidence },
        confidence: 1,
        consent,
        tags: [SOURCE_TAG, 'structured-vital'],
      }
      next.push(
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:sbp`, metric: 'Systolic blood pressure', value: vital.systolic, unit: 'mmHg' }),
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:dbp`, metric: 'Diastolic blood pressure', value: vital.diastolic, unit: 'mmHg' }),
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:hr`, metric: 'Heart rate', value: vital.heartRate, unit: 'bpm' }),
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:rr`, metric: 'Respiratory rate', value: vital.respRate, unit: '/min' }),
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:temp`, metric: 'Temperature', value: vital.tempC, unit: '°C' }),
        createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:spo2`, metric: 'SpO₂', value: vital.spo2, unit: '%' }),
      )
      if (typeof vital.glucose === 'number') {
        next.push(createLongitudinalSignal({ ...base, id: `${patient.id}:${vital.id}:glucose`, metric: 'Blood glucose', value: vital.glucose, unit: 'mg/dL' }))
      }
    }

    for (const result of supportive.slice(-MAX_SUPPORTIVE_ROWS)) {
      next.push(createLongitudinalSignal({
        id: `${patient.id}:${result.id}:supportive`,
        subjectId: patient.id,
        domain: 'clinical',
        metric: result.name,
        value: result.value,
        unit: result.unit,
        measuredAt: result.takenAt,
        source: SOURCE,
        provenance: { kind: 'clinical', sourceId: result.id, evidence },
        confidence: 1,
        consent,
        tags: [SOURCE_TAG, result.category.toLowerCase(), result.flag ? `flag:${result.flag}` : 'flag:unknown'],
      }))
    }

    const existing = readLongitudinalSignals(patient.id).filter((signal) => !signal.tags?.includes(SOURCE_TAG))
    replaceSubjectSignals(patient.id, [...next, ...existing])
  }, [account?.consentAt, patient.id, supportive, vitals])
}

export default useLongitudinalClinicalBridge
