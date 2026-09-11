import {
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  resolveAllAnatomySourceNodes,
  type AnatomySourceNodeBundle,
} from '../anatomySourceNodeRegistry'

export type MacroDomain = 'articular' | 'fascial'
export type MacroReadinessStatus = 'source-candidate-found' | 'source-candidate-missing' | 'blocked-provenance-review'

export interface MacroEvidenceRef {
  id: string
  locator: string
  scope: string
}

export interface MacroTarget {
  id: string
  label: string
  domain: MacroDomain
  regions: readonly string[]
  sourceFiles: readonly string[]
  nodeHints: readonly string[]
  evidence: readonly MacroEvidenceRef[]
  academicReviewStatus: 'pending'
  geometryStatus: 'verification-required'
}

const JOINT_EVIDENCE: readonly MacroEvidenceRef[] = [
  {
    id: 'NBK507893',
    locator: 'https://www.ncbi.nlm.nih.gov/books/NBK507893/',
    scope: 'Joint classification and synovial-joint structural context only.',
  },
]

const FASCIA_EVIDENCE: readonly MacroEvidenceRef[] = [
  {
    id: 'PMID:28167173',
    locator: 'https://pubmed.ncbi.nlm.nih.gov/28167173/',
    scope: 'Fascial-system terminology context; does not establish mesh identity.',
  },
  {
    id: 'PMID:39814456',
    locator: 'https://pubmed.ncbi.nlm.nih.gov/39814456/',
    scope: 'Contemporary fascial-system definition proposal; terminology remains contested.',
  },
]

/**
 * Macro targets deliberately stop at named gross structures. They are not a
 * substitute for verified asset provenance and may not promote source meshes to
 * verified anatomy merely because a generated source-name match exists.
 */
export const MACRO_ARTICULAR_FASCIAL_TARGETS: readonly MacroTarget[] = [
  { id: 'articular:tmj', label: 'Temporomandibular joints', domain: 'articular', regions: ['head'], sourceFiles: ['skeletal.glb'], nodeHints: ['temporomandibular', 'mandibular condyle'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:shoulder', label: 'Shoulder joint complexes', domain: 'articular', regions: ['upper-limb'], sourceFiles: ['skeletal.glb'], nodeHints: ['glenohumeral', 'acromioclavicular', 'sternoclavicular'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:elbow', label: 'Elbow joint complexes', domain: 'articular', regions: ['upper-limb'], sourceFiles: ['skeletal.glb'], nodeHints: ['elbow', 'humeroulnar', 'humeroradial'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:wrist-hand', label: 'Wrist and hand articulations', domain: 'articular', regions: ['hand'], sourceFiles: ['skeletal.glb'], nodeHints: ['radiocarpal', 'carpal', 'metacarpophalangeal', 'interphalangeal'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:spine', label: 'Vertebral articulations', domain: 'articular', regions: ['neck', 'thorax', 'back'], sourceFiles: ['skeletal.glb'], nodeHints: ['intervertebral', 'zygapophysial', 'facet joint'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:pelvis', label: 'Pelvic articulations', domain: 'articular', regions: ['pelvis'], sourceFiles: ['skeletal.glb'], nodeHints: ['sacroiliac', 'pubic symphysis'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:hip', label: 'Hip joints', domain: 'articular', regions: ['pelvis', 'lower-limb'], sourceFiles: ['skeletal.glb'], nodeHints: ['hip joint', 'acetabulum', 'femoral head'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:knee', label: 'Knee joint complexes', domain: 'articular', regions: ['lower-limb'], sourceFiles: ['skeletal.glb'], nodeHints: ['knee', 'tibiofemoral', 'patellofemoral'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'articular:ankle-foot', label: 'Ankle and foot articulations', domain: 'articular', regions: ['foot'], sourceFiles: ['skeletal.glb'], nodeHints: ['talocrural', 'subtalar', 'tarsal', 'metatarsophalangeal'], evidence: JOINT_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'fascial:superficial', label: 'Superficial fascial planes', domain: 'fascial', regions: ['whole-body'], sourceFiles: ['surface.glb'], nodeHints: ['superficial fascia', 'subcutaneous'], evidence: FASCIA_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'fascial:deep-msk', label: 'Deep musculoskeletal fascial compartments', domain: 'fascial', regions: ['whole-body'], sourceFiles: ['muscular.glb'], nodeHints: ['deep fascia', 'intermuscular septum', 'aponeurosis'], evidence: FASCIA_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'fascial:visceral', label: 'Visceral fascial planes', domain: 'fascial', regions: ['thorax', 'abdomen', 'pelvis'], sourceFiles: ['visceral.glb'], nodeHints: ['visceral fascia', 'organ fascia'], evidence: FASCIA_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
  { id: 'fascial:neural', label: 'Neural connective-tissue sheaths', domain: 'fascial', regions: ['head', 'neck', 'back', 'upper-limb', 'lower-limb'], sourceFiles: ['nervous.glb'], nodeHints: ['epineurium', 'nerve sheath'], evidence: FASCIA_EVIDENCE, academicReviewStatus: 'pending', geometryStatus: 'verification-required' },
]

function scopedBundles(target: MacroTarget, bundles: readonly AnatomySourceNodeBundle[]) {
  const allow = new Set(target.sourceFiles)
  return bundles.filter((bundle) => allow.has(bundle.file))
}

export interface MacroTargetReadiness {
  target: MacroTarget
  matchedSourceNames: readonly string[]
  status: MacroReadinessStatus
  verifiedGeometryAllowed: false
  reason: string
}

export function auditMacroArticularFascialReadiness(
  bundles: readonly AnatomySourceNodeBundle[] = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
): readonly MacroTargetReadiness[] {
  return MACRO_ARTICULAR_FASCIAL_TARGETS.map((target) => {
    const matches = resolveAllAnatomySourceNodes(target.nodeHints, scopedBundles(target, bundles), 16)
    const names = [...new Set(matches.flatMap((match) => match.names))].sort((a, b) => a.localeCompare(b))
    if (!names.length) {
      return {
        target,
        matchedSourceNames: names,
        status: 'source-candidate-missing' as const,
        verifiedGeometryAllowed: false as const,
        reason: 'No exact reviewed source-name candidate was found in the allowed shipped bundle.',
      }
    }
    return {
      target,
      matchedSourceNames: names,
      status: 'blocked-provenance-review' as const,
      verifiedGeometryAllowed: false as const,
      reason: 'Source-name candidates exist, but exact asset-level provenance, license, transformation history and qualified academic review are not established here.',
    }
  })
}
