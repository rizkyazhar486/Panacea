import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'
import { EYE_CELL_ORGANELLE_WAVE4 } from './eyeCellOrganelleWave4'
import { EYE_MOLECULAR_WAVE5_EDGES, EYE_MOLECULAR_WAVE5_NODES } from './eyeMolecularWave5'
import type { EyeLearningViewState } from './eyeLearningViewContract'

function requireVisible(id: string) {
  const node = EYE_VISIBLE_WAVE1.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye visible node: ${id}`)
  return node
}

function requireHistology(id: string) {
  const node = EYE_HISTOLOGY_WAVE3.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye histology node: ${id}`)
  return node
}

function requireCellular(id: string) {
  const node = EYE_CELL_ORGANELLE_WAVE4.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye cellular node: ${id}`)
  return node
}

function requireMolecular(id: string) {
  const node = EYE_MOLECULAR_WAVE5_NODES.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye molecular node: ${id}`)
  return node
}

const globe = requireVisible('globe')
const retina = requireVisible('retina')
const photoreceptorLayer = requireHistology('photoreceptor-layer')
const rodPhotoreceptors = requireHistology('rod-photoreceptors')
const rodOuterSegmentDiscs = requireCellular('rod-outer-segment-discs')
const rhodopsin = requireMolecular('rho-protein')
const rhoLocalization = EYE_MOLECULAR_WAVE5_EDGES.find((item) => item.id === 'rho-localized-disc')
if (!rhoLocalization || rhoLocalization.from !== rhodopsin.id || rhoLocalization.to !== rodOuterSegmentDiscs.id) {
  throw new Error('Missing reviewed Eye molecular-to-cellular localization bridge')
}

/**
 * One evidence-backed vertical learning route through content already present in Panacea.
 * This catalog links existing records only; it does not synthesize new anatomy or geometry.
 */
export const EYE_RETINA_MULTISCALE_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  {
    id: 'eye-route-globe',
    label: globe.label,
    scale: 'organ',
    canonicalNodeIds: [globe.id],
    evidenceRefs: [globe.evidenceAnchor],
    motion: 'static',
    reviewStatus: globe.reviewStatus,
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  },
  {
    id: 'eye-route-retina',
    label: retina.label,
    scale: 'suborgan',
    canonicalNodeIds: [retina.id],
    evidenceRefs: [retina.evidenceAnchor],
    motion: 'static',
    reviewStatus: retina.reviewStatus,
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  },
  {
    id: 'eye-route-photoreceptor-layer',
    label: photoreceptorLayer.label,
    scale: 'tissue',
    canonicalNodeIds: [photoreceptorLayer.id],
    evidenceRefs: [photoreceptorLayer.evidenceAnchor],
    motion: 'static',
    reviewStatus: photoreceptorLayer.reviewStatus,
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  },
  {
    id: 'eye-route-rod-photoreceptor',
    label: `${rodPhotoreceptors.label} — ${rodOuterSegmentDiscs.label}`,
    scale: 'cellular',
    canonicalNodeIds: [rodPhotoreceptors.id, rodOuterSegmentDiscs.id],
    evidenceRefs: [rodPhotoreceptors.evidenceAnchor, rodOuterSegmentDiscs.evidenceAnchor],
    motion: 'static',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  },
  {
    id: 'eye-route-rhodopsin',
    label: rhodopsin.label,
    scale: 'molecular',
    canonicalNodeIds: [rhodopsin.id],
    evidenceRefs: [
      rhodopsin.externalIdentifier,
      `${rhoLocalization.evidence.source}:${rhoLocalization.evidence.locator}`,
    ],
    motion: 'static',
    reviewStatus: rhodopsin.reviewStatus,
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  },
] as const

export const EYE_RETINA_MULTISCALE_CANONICAL_IDS = new Set(
  EYE_RETINA_MULTISCALE_LEARNING_ROUTE.flatMap((view) => view.canonicalNodeIds),
)

export const EYE_MULTISCALE_LEARNING_CATALOG_BOUNDARY =
  'This route connects existing evidence-backed Panacea Eye records from globe to retina, photoreceptor tissue, rod cellular structures, and rhodopsin reference data. Histology, cellular and molecular stages remain reference-only and academic-review-pending; this route never upgrades them to measured or verified 3D geometry, patient inference, lesion localization, diagnosis, treatment, or publication readiness.'
