import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_STRUCTURAL_WAVE2 } from './eyeStructuralWave2'
import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'
import { EYE_CELL_ORGANELLE_WAVE4 } from './eyeCellOrganelleWave4'
import { EYE_MOLECULAR_WAVE5_EDGES, EYE_MOLECULAR_WAVE5_NODES } from './eyeMolecularWave5'
import type { EyeLearningViewState } from './eyeLearningViewContract'

function requireVisible(id: string) {
  const node = EYE_VISIBLE_WAVE1.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye visible node: ${id}`)
  return node
}

function requireStructural(id: string) {
  const node = EYE_STRUCTURAL_WAVE2.find((item) => item.id === id)
  if (!node) throw new Error(`Missing Eye structural node: ${id}`)
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

function staticView(
  id: string,
  label: string,
  scale: EyeLearningViewState['scale'],
  canonicalNodeIds: readonly string[],
  evidenceRefs: readonly string[],
): EyeLearningViewState {
  return {
    id,
    label,
    scale,
    canonicalNodeIds,
    evidenceRefs,
    motion: 'static',
    reviewStatus: 'academic-review-pending',
    patientSpecific: false,
    functionalInferenceAllowed: false,
    lesionLocalizationAllowed: false,
    publicationReady: false,
  }
}

const globe = requireVisible('globe')
const retina = requireVisible('retina')
const cornea = requireVisible('cornea')
const lens = requireVisible('lens')
const ciliaryBody = requireVisible('ciliary-body')
const anteriorChamber = requireVisible('anterior-chamber')
const opticNerve = requireVisible('optic-nerve')
const opticChiasm = requireVisible('optic-chiasm')
const opticTract = requireVisible('optic-tract')

const photoreceptorLayer = requireHistology('photoreceptor-layer')
const rodPhotoreceptors = requireHistology('rod-photoreceptors')
const rodOuterSegmentDiscs = requireCellular('rod-outer-segment-discs')
const rhodopsin = requireMolecular('rho-protein')
const rhoLocalization = EYE_MOLECULAR_WAVE5_EDGES.find((item) => item.id === 'rho-localized-disc')
if (!rhoLocalization || rhoLocalization.from !== rhodopsin.id || rhoLocalization.to !== rodOuterSegmentDiscs.id) {
  throw new Error('Missing reviewed Eye molecular-to-cellular localization bridge')
}

const cornealEpithelium = requireStructural('corneal-epithelium')
const bowmanLayer = requireStructural('bowman-layer')
const cornealStroma = requireStructural('corneal-stroma')
const descemetMembrane = requireStructural('descemet-membrane')
const cornealEndothelium = requireStructural('corneal-endothelium')
const cornealBasalCells = requireHistology('corneal-basal-epithelial-cells')
const cornealKeratocytes = requireHistology('corneal-keratocytes')
const cornealEndothelialCells = requireHistology('corneal-endothelial-cells')

const lensCapsule = requireStructural('lens-capsule')
const lensAnteriorEpithelium = requireStructural('lens-anterior-epithelium')
const lensCortex = requireStructural('lens-cortex')
const lensNucleus = requireStructural('lens-nucleus')
const lensFibers = requireStructural('lens-fibers')

const ciliaryProcesses = requireStructural('ciliary-processes')
const nonPigmentedCiliaryEpithelium = requireStructural('nonpigmented-ciliary-epithelium')
const trabecularMeshwork = requireStructural('trabecular-meshwork')
const juxtacanalicularTissue = requireStructural('juxtacanalicular-tissue')
const schlemmCanal = requireStructural('schlemm-canal')
const collectorChannels = requireStructural('collector-channels')
const aqueousVeins = requireStructural('aqueous-veins')

/**
 * Evidence-backed vertical learning routes through content already present in Panacea.
 * These catalogs link existing records only; they do not synthesize anatomy, geometry,
 * physiology, pressure, flow, disease, lesion localization, or patient-specific state.
 */
export const EYE_RETINA_MULTISCALE_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  staticView('eye-route-globe', globe.label, 'organ', [globe.id], [globe.evidenceAnchor]),
  staticView('eye-route-retina', retina.label, 'suborgan', [retina.id], [retina.evidenceAnchor]),
  staticView(
    'eye-route-photoreceptor-layer',
    photoreceptorLayer.label,
    'tissue',
    [photoreceptorLayer.id],
    [photoreceptorLayer.evidenceAnchor],
  ),
  staticView(
    'eye-route-rod-photoreceptor',
    `${rodPhotoreceptors.label} — ${rodOuterSegmentDiscs.label}`,
    'cellular',
    [rodPhotoreceptors.id, rodOuterSegmentDiscs.id],
    [rodPhotoreceptors.evidenceAnchor, rodOuterSegmentDiscs.evidenceAnchor],
  ),
  staticView(
    'eye-route-rhodopsin',
    rhodopsin.label,
    'molecular',
    [rhodopsin.id],
    [rhodopsin.externalIdentifier, `${rhoLocalization.evidence.source}:${rhoLocalization.evidence.locator}`],
  ),
] as const

export const EYE_CORNEA_MULTISCALE_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  staticView('eye-cornea-globe', globe.label, 'organ', [globe.id], [globe.evidenceAnchor]),
  staticView('eye-cornea-surface', cornea.label, 'suborgan', [cornea.id], [cornea.evidenceAnchor]),
  staticView(
    'eye-cornea-five-layer-stack',
    'Corneal five-layer structural stack',
    'tissue',
    [cornealEpithelium.id, bowmanLayer.id, cornealStroma.id, descemetMembrane.id, cornealEndothelium.id],
    [
      cornealEpithelium.evidenceAnchor,
      bowmanLayer.evidenceAnchor,
      cornealStroma.evidenceAnchor,
      descemetMembrane.evidenceAnchor,
      cornealEndothelium.evidenceAnchor,
    ],
  ),
  staticView(
    'eye-cornea-cellular-reference',
    'Corneal epithelial, stromal and endothelial cell references',
    'cellular',
    [cornealBasalCells.id, cornealKeratocytes.id, cornealEndothelialCells.id],
    [cornealBasalCells.evidenceAnchor, cornealKeratocytes.evidenceAnchor, cornealEndothelialCells.evidenceAnchor],
  ),
] as const

export const EYE_LENS_STRUCTURAL_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  staticView('eye-lens-globe', globe.label, 'organ', [globe.id], [globe.evidenceAnchor]),
  staticView('eye-lens-organ', lens.label, 'suborgan', [lens.id], [lens.evidenceAnchor]),
  staticView(
    'eye-lens-structural-stack',
    'Lens capsule, epithelium, cortex, nucleus and fibers',
    'tissue',
    [lensCapsule.id, lensAnteriorEpithelium.id, lensCortex.id, lensNucleus.id, lensFibers.id],
    [
      lensCapsule.evidenceAnchor,
      lensAnteriorEpithelium.evidenceAnchor,
      lensCortex.evidenceAnchor,
      lensNucleus.evidenceAnchor,
      lensFibers.evidenceAnchor,
    ],
  ),
] as const

export const EYE_AQUEOUS_OUTFLOW_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  staticView('eye-aqueous-globe', globe.label, 'organ', [globe.id], [globe.evidenceAnchor]),
  staticView(
    'eye-aqueous-anterior-segment',
    'Ciliary body and anterior chamber',
    'suborgan',
    [ciliaryBody.id, anteriorChamber.id],
    [ciliaryBody.evidenceAnchor, anteriorChamber.evidenceAnchor],
  ),
  staticView(
    'eye-aqueous-source-and-outflow-structures',
    'Aqueous production and conventional outflow structures',
    'tissue',
    [
      ciliaryProcesses.id,
      nonPigmentedCiliaryEpithelium.id,
      trabecularMeshwork.id,
      juxtacanalicularTissue.id,
      schlemmCanal.id,
      collectorChannels.id,
      aqueousVeins.id,
    ],
    [
      ciliaryProcesses.evidenceAnchor,
      nonPigmentedCiliaryEpithelium.evidenceAnchor,
      trabecularMeshwork.evidenceAnchor,
      juxtacanalicularTissue.evidenceAnchor,
      schlemmCanal.evidenceAnchor,
      collectorChannels.evidenceAnchor,
      aqueousVeins.evidenceAnchor,
    ],
  ),
] as const

export const EYE_VISUAL_PATHWAY_LEARNING_ROUTE: readonly EyeLearningViewState[] = [
  staticView('eye-visual-pathway-globe', globe.label, 'organ', [globe.id], [globe.evidenceAnchor]),
  staticView(
    'eye-visual-pathway-neural-chain',
    'Retina to optic nerve, chiasm and tract',
    'suborgan',
    [retina.id, opticNerve.id, opticChiasm.id, opticTract.id],
    [retina.evidenceAnchor, opticNerve.evidenceAnchor, opticChiasm.evidenceAnchor, opticTract.evidenceAnchor],
  ),
] as const

export const EYE_MULTISCALE_LEARNING_ROUTES = {
  retina: EYE_RETINA_MULTISCALE_LEARNING_ROUTE,
  cornea: EYE_CORNEA_MULTISCALE_LEARNING_ROUTE,
  lens: EYE_LENS_STRUCTURAL_LEARNING_ROUTE,
  aqueousOutflow: EYE_AQUEOUS_OUTFLOW_LEARNING_ROUTE,
  visualPathway: EYE_VISUAL_PATHWAY_LEARNING_ROUTE,
} as const

export const EYE_MULTISCALE_CANONICAL_IDS = new Set(
  Object.values(EYE_MULTISCALE_LEARNING_ROUTES).flatMap((route) => route.flatMap((view) => view.canonicalNodeIds)),
)

// Compatibility export for the existing retina-only controller test.
export const EYE_RETINA_MULTISCALE_CANONICAL_IDS = new Set(
  EYE_RETINA_MULTISCALE_LEARNING_ROUTE.flatMap((view) => view.canonicalNodeIds),
)

export const EYE_MULTISCALE_LEARNING_CATALOG_BOUNDARY =
  'These routes connect existing evidence-backed Panacea Eye records across visible, structural, histologic, cellular and molecular scales. Reference-only and academic-review-pending records remain reference-only; the catalog never upgrades them to measured or verified 3D geometry, inferred physiology or pressure/flow, patient inference, lesion localization, diagnosis, treatment, surgery guidance, or publication readiness.'
