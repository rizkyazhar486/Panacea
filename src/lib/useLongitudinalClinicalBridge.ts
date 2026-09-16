import { useEffect } from 'react'
import { useStore } from './store'
import {
  createLongitudinalSignal,
  readLongitudinalSignals,
  replaceSubjectSignals,
  type LongitudinalDomain,
  type LongitudinalSignal,
  type ProvenanceKind,
} from './longitudinalPatientState'

const CLINICAL_SOURCE = 'Panacea clinical record'
const PERSONAL_SOURCE = 'Panacea Your Body'
const BRIDGE_TAG = 'panacea-longitudinal-bridge'
const MAX_ROWS = 24

function isoDate(date: string) {
  return date.includes('T') ? date : `${date}T12:00:00.000Z`
}

export function useLongitudinalClinicalBridge() {
  const store = useStore()
  const patient = store.activePatient
  const account = store.account
  const vitals = store.state.vitals[patient.id] ?? []
  const supportive = store.state.supportive[patient.id] ?? []
  const selfVitals = store.state.selfVitals
  const sleepLogs = store.state.sleepLogs
  const vo2maxLog = store.state.vo2maxLog
  const gpsActivities = store.state.gpsActivities
  const trainingLogs = store.state.trainingLogs
  const foods = store.state.foods
  const wellness = store.state.wellness

  useEffect(() => {
    const consentGranted = Boolean(account?.consentAt)
    const consent = {
      granted: consentGranted,
      scope: consentGranted ? 'Panacea longitudinal care context' : 'Local display only until consent is available',
    }
    const next: LongitudinalSignal[] = []
    const isSelfPatient = Boolean(account && (account.patientId === patient.id || patient.id.startsWith('self-')))

    const add = (input: {
      id: string
      domain: LongitudinalDomain
      metric: string
      value: number | string
      unit?: string
      measuredAt: string
      source: string
      sourceId: string
      provenance: ProvenanceKind
      evidence: string
      tags?: string[]
    }) => {
      next.push(createLongitudinalSignal({
        id: input.id,
        subjectId: patient.id,
        domain: input.domain,
        metric: input.metric,
        value: input.value,
        unit: input.unit,
        measuredAt: input.measuredAt,
        source: input.source,
        provenance: { kind: input.provenance, sourceId: input.sourceId, evidence: input.evidence },
        confidence: 1,
        consent,
        tags: [BRIDGE_TAG, ...(input.tags ?? [])],
      }))
    }

    const clinicalEvidence = 'Direct structured value from the active patient record. Fidelity 1.0 means the longitudinal copy matches the stored record; it does not assert device accuracy, diagnosis, prognosis or clinical certainty.'
    for (const vital of vitals.slice(-MAX_ROWS)) {
      const common = { measuredAt: vital.takenAt, source: CLINICAL_SOURCE, sourceId: vital.id, provenance: 'clinical' as const, evidence: clinicalEvidence, tags: ['structured-vital'] }
      add({ ...common, id: `${patient.id}:${vital.id}:sbp`, domain: 'vitals', metric: 'Systolic blood pressure', value: vital.systolic, unit: 'mmHg' })
      add({ ...common, id: `${patient.id}:${vital.id}:dbp`, domain: 'vitals', metric: 'Diastolic blood pressure', value: vital.diastolic, unit: 'mmHg' })
      add({ ...common, id: `${patient.id}:${vital.id}:hr`, domain: 'vitals', metric: 'Heart rate', value: vital.heartRate, unit: 'bpm' })
      add({ ...common, id: `${patient.id}:${vital.id}:rr`, domain: 'vitals', metric: 'Respiratory rate', value: vital.respRate, unit: '/min' })
      add({ ...common, id: `${patient.id}:${vital.id}:temp`, domain: 'vitals', metric: 'Temperature', value: vital.tempC, unit: '°C' })
      add({ ...common, id: `${patient.id}:${vital.id}:spo2`, domain: 'vitals', metric: 'SpO₂', value: vital.spo2, unit: '%' })
      if (typeof vital.glucose === 'number') add({ ...common, id: `${patient.id}:${vital.id}:glucose`, domain: 'vitals', metric: 'Blood glucose', value: vital.glucose, unit: 'mg/dL' })
    }

    for (const result of supportive.slice(-MAX_ROWS)) {
      add({
        id: `${patient.id}:${result.id}:supportive`, domain: 'clinical', metric: result.name, value: result.value, unit: result.unit,
        measuredAt: result.takenAt, source: CLINICAL_SOURCE, sourceId: result.id, provenance: 'clinical', evidence: clinicalEvidence,
        tags: [result.category.toLowerCase(), result.flag ? `flag:${result.flag}` : 'flag:unknown'],
      })
    }

    if (isSelfPatient) {
      const userEvidence = 'Direct user-entered value from Your Body. Fidelity 1.0 means the copy matches the stored entry; it is not a clinical-validity score.'
      const derivedEvidence = 'Stored value derived by an existing Panacea/GPS workflow. Fidelity 1.0 means the copy matches that stored result; the derivation itself may carry separate uncertainty.'

      for (const vital of selfVitals.slice(-MAX_ROWS)) {
        const common = { measuredAt: vital.at, source: PERSONAL_SOURCE, sourceId: vital.id, provenance: 'user' as const, evidence: userEvidence, tags: ['self-vital'] }
        add({ ...common, id: `${patient.id}:self:${vital.id}:sbp`, domain: 'vitals', metric: 'Systolic blood pressure', value: vital.systolic, unit: 'mmHg' })
        add({ ...common, id: `${patient.id}:self:${vital.id}:dbp`, domain: 'vitals', metric: 'Diastolic blood pressure', value: vital.diastolic, unit: 'mmHg' })
        add({ ...common, id: `${patient.id}:self:${vital.id}:hr`, domain: 'vitals', metric: 'Heart rate', value: vital.heartRate, unit: 'bpm' })
        add({ ...common, id: `${patient.id}:self:${vital.id}:spo2`, domain: 'vitals', metric: 'SpO₂', value: vital.spo2, unit: '%' })
        add({ ...common, id: `${patient.id}:self:${vital.id}:temp`, domain: 'vitals', metric: 'Temperature', value: vital.tempC, unit: '°C' })
      }

      for (const sleep of sleepLogs.slice(-MAX_ROWS)) {
        add({ id: `${patient.id}:sleep:${sleep.id}:hours`, domain: 'sleep', metric: 'Sleep duration', value: sleep.hours, unit: 'h', measuredAt: isoDate(sleep.date), source: PERSONAL_SOURCE, sourceId: sleep.id, provenance: 'user', evidence: userEvidence, tags: ['sleep-log'] })
        add({ id: `${patient.id}:sleep:${sleep.id}:consistency`, domain: 'sleep', metric: 'Bedtime consistency', value: sleep.bedtimeConsistent ? 'consistent' : 'variable', measuredAt: isoDate(sleep.date), source: PERSONAL_SOURCE, sourceId: sleep.id, provenance: 'user', evidence: userEvidence, tags: ['sleep-log'] })
      }

      for (const entry of vo2maxLog.slice(-MAX_ROWS)) {
        add({ id: `${patient.id}:vo2:${entry.id}`, domain: 'fitness', metric: 'VO₂max', value: entry.value, unit: 'mL/kg/min', measuredAt: entry.at, source: PERSONAL_SOURCE, sourceId: entry.id, provenance: 'derived', evidence: derivedEvidence, tags: ['vo2max', `method:${entry.method}`] })
      }

      const ownGps = account ? gpsActivities.filter((activity) => activity.email === account.email) : []
      for (const activity of ownGps.slice(-MAX_ROWS)) {
        const common = { measuredAt: activity.at, source: PERSONAL_SOURCE, sourceId: activity.id, provenance: 'derived' as const, evidence: derivedEvidence, tags: ['gps-activity', `sport:${activity.sportType}`] }
        add({ ...common, id: `${patient.id}:gps:${activity.id}:distance`, domain: 'activity', metric: 'Activity distance', value: activity.distKm, unit: 'km' })
        add({ ...common, id: `${patient.id}:gps:${activity.id}:duration`, domain: 'activity', metric: 'Activity duration', value: Math.round(activity.durSec / 60), unit: 'min' })
        add({ ...common, id: `${patient.id}:gps:${activity.id}:speed`, domain: 'fitness', metric: 'Average speed', value: activity.avgSpeedKmh, unit: 'km/h' })
        add({ ...common, id: `${patient.id}:gps:${activity.id}:kcal`, domain: 'activity', metric: 'Activity energy', value: activity.kcal, unit: 'kcal' })
        if (typeof activity.avgHr === 'number') add({ ...common, id: `${patient.id}:gps:${activity.id}:avgHr`, domain: 'fitness', metric: 'Activity average heart rate', value: activity.avgHr, unit: 'bpm' })
        if (typeof activity.maxHr === 'number') add({ ...common, id: `${patient.id}:gps:${activity.id}:maxHr`, domain: 'fitness', metric: 'Activity maximum heart rate', value: activity.maxHr, unit: 'bpm' })
      }

      for (const training of trainingLogs.slice(-MAX_ROWS)) {
        add({ id: `${patient.id}:training:${training.id}:rpe`, domain: 'fitness', metric: 'Training RPE', value: training.rpe, unit: '/10', measuredAt: isoDate(training.date), source: PERSONAL_SOURCE, sourceId: training.id, provenance: 'user', evidence: userEvidence, tags: ['training', `type:${training.type}`] })
      }

      for (const food of foods.slice(-MAX_ROWS)) {
        const common = { measuredAt: isoDate(food.date), source: PERSONAL_SOURCE, sourceId: food.id, provenance: 'user' as const, evidence: userEvidence, tags: ['nutrition', `food:${food.name}`] }
        add({ ...common, id: `${patient.id}:food:${food.id}:kcal`, domain: 'nutrition', metric: 'Food energy', value: food.kcal, unit: 'kcal' })
        add({ ...common, id: `${patient.id}:food:${food.id}:carbs`, domain: 'nutrition', metric: 'Carbohydrate', value: food.carbs, unit: 'g' })
        add({ ...common, id: `${patient.id}:food:${food.id}:protein`, domain: 'nutrition', metric: 'Protein', value: food.protein, unit: 'g' })
        add({ ...common, id: `${patient.id}:food:${food.id}:fat`, domain: 'nutrition', metric: 'Fat', value: food.fat, unit: 'g' })
      }

      for (const day of Object.values(wellness).slice(-MAX_ROWS)) {
        const measuredAt = isoDate(day.date)
        if (typeof day.sleepHr === 'number') add({ id: `${patient.id}:wellness:${day.date}:sleep`, domain: 'sleep', metric: 'Wellness sleep', value: day.sleepHr, unit: 'h', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'user', evidence: userEvidence, tags: ['wellness'] })
        if (typeof day.waterMl === 'number') add({ id: `${patient.id}:wellness:${day.date}:water`, domain: 'nutrition', metric: 'Water intake', value: day.waterMl, unit: 'mL', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'user', evidence: userEvidence, tags: ['wellness'] })
        if (typeof day.exerciseMin === 'number') add({ id: `${patient.id}:wellness:${day.date}:exerciseMin`, domain: 'activity', metric: 'Exercise duration', value: day.exerciseMin, unit: 'min', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'user', evidence: userEvidence, tags: ['wellness'] })
        if (typeof day.exerciseKcal === 'number') add({ id: `${patient.id}:wellness:${day.date}:exerciseKcal`, domain: 'activity', metric: 'Exercise energy', value: day.exerciseKcal, unit: 'kcal', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'user', evidence: userEvidence, tags: ['wellness'] })
        if (typeof day.metHours === 'number') add({ id: `${patient.id}:wellness:${day.date}:metHours`, domain: 'fitness', metric: 'MET-hours', value: day.metHours, unit: 'MET·h', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'derived', evidence: derivedEvidence, tags: ['wellness'] })
        if (typeof day.tenaga === 'number') add({ id: `${patient.id}:wellness:${day.date}:energy`, domain: 'mind', metric: 'Perceived energy', value: day.tenaga, unit: '/5', measuredAt, source: PERSONAL_SOURCE, sourceId: day.date, provenance: 'user', evidence: 'Self-reported perceived energy. It remains separate from measured/derived signals and is not treated as a physiological measurement.', tags: ['wellness', 'self-reported'] })
      }
    }

    const existing = readLongitudinalSignals(patient.id).filter((signal) => !signal.tags?.includes(BRIDGE_TAG))
    replaceSubjectSignals(patient.id, [...next, ...existing])
  }, [account, foods, gpsActivities, patient.id, selfVitals, sleepLogs, supportive, trainingLogs, vitals, vo2maxLog, wellness])
}

export default useLongitudinalClinicalBridge
