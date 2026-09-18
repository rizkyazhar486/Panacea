import type {
  BodyClinicalBridgeProjection,
  BodyClinicalMarker,
  BodyClinicalMarkerStatus,
} from './bodyClinicalBridge'
import type { BodySystemId } from './bodySystemSourceWave'

type BodyClinicalSystemFocusDefinition = {
  label: string
  markerKeys: readonly string[]
}

/**
 * Navigation-only mapping between the source-backed Body Exposure system selector
 * and already-recorded physical-examination markers.
 *
 * This map does not infer anatomy, diagnosis, severity, lesion location or
 * organ-specific vital-sign meaning. It only chooses which existing AI-EMR
 * examination markers are most relevant to display for the selected system.
 */
const BODY_CLINICAL_SYSTEM_FOCUS: Record<BodySystemId, BodyClinicalSystemFocusDefinition> = {
  cardiovascular: {
    label: 'Cardiovascular',
    markerKeys: ['jantung', 'leher', 'ekstremitas'],
  },
  nervous: {
    label: 'Nervous',
    markerKeys: ['kepala', 'mata', 'ekstremitas'],
  },
  respiratory: {
    label: 'Respiratory',
    markerKeys: ['paru', 'leher'],
  },
  digestive: {
    label: 'Digestive',
    markerKeys: ['abdomen'],
  },
  urinary: {
    label: 'Urinary',
    markerKeys: ['abdomen', 'ekstremitas'],
  },
  endocrine: {
    label: 'Endocrine',
    markerKeys: ['leher', 'abdomen'],
  },
  reproductive: {
    label: 'Reproductive',
    markerKeys: ['abdomen'],
  },
  'lymphatic-immune': {
    label: 'Lymphatic / Immune',
    markerKeys: ['leher', 'tht', 'abdomen'],
  },
  musculoskeletal: {
    label: 'Musculoskeletal / Articular',
    markerKeys: ['ekstremitas'],
  },
  'sensory-ent': {
    label: 'Sensory / ENT',
    markerKeys: ['mata', 'tht', 'kepala'],
  },
  'integumentary-surface': {
    label: 'Integumentary / Surface',
    markerKeys: ['kulit', 'ekstremitas'],
  },
}

function countFocusedMarkers(markers: readonly BodyClinicalMarker[]) {
  return markers.reduce<Record<BodyClinicalMarkerStatus, number>>(
    (counts, marker) => {
      counts[marker.status] += 1
      return counts
    },
    { normal: 0, abnormal: 0, unchecked: 0 },
  )
}

export interface BodyClinicalSystemContext {
  systemId: BodySystemId
  label: string
  markers: readonly BodyClinicalMarker[]
  findingCounts: Record<BodyClinicalMarkerStatus, number>
  recordedFindings: number
  boundary: {
    filteringOnly: true
    vitalsRemainPatientWide: true
    diagnosticInferenceGenerated: false
    anatomicalLocalizationGenerated: false
  }
}

export function focusBodyClinicalProjection(
  projection: BodyClinicalBridgeProjection,
  systemId: BodySystemId,
): BodyClinicalSystemContext {
  const definition = BODY_CLINICAL_SYSTEM_FOCUS[systemId]
  const allowed = new Set(definition.markerKeys)
  const markers = projection.markers.filter((marker) => allowed.has(marker.key))
  const findingCounts = countFocusedMarkers(markers)

  return {
    systemId,
    label: definition.label,
    markers,
    findingCounts,
    recordedFindings: markers.length - findingCounts.unchecked,
    boundary: {
      filteringOnly: true,
      vitalsRemainPatientWide: true,
      diagnosticInferenceGenerated: false,
      anatomicalLocalizationGenerated: false,
    },
  }
}
