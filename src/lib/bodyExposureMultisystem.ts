import type { StrukturTubuh } from './bodySearch'
import {
  MULTISYSTEM_KNOWLEDGE_GRAPH,
  getMultisystemDomain,
  type KnowledgeScale,
  type MultisystemDomain,
} from './multisystemKnowledgeGraph'

export interface BodyExposureKnowledgeContext {
  domainIds: readonly string[]
  domains: readonly MultisystemDomain[]
  scales: readonly KnowledgeScale[]
  educationalOnly: true
  patientSpecificInference: false
  diagnosisOrTreatment: false
  academicAccuracyGateRequiredForHighRiskClinicalUse: true
}

const DIRECT_LAYER_DOMAINS: Partial<Record<StrukturTubuh['l'], readonly string[]>> = {
  skeletal: ['musculoskeletal'],
  muscular: ['musculoskeletal'],
  cardiovascular: ['cardiovascular'],
  nervous: ['nervous-system'],
  lymphoid: ['hematologic-immune-lymphatic'],
  surface: ['integumentary'],
}

const VISCERAL_RULES: ReadonlyArray<{ terms: readonly string[]; domains: readonly string[] }> = [
  { terms: ['heart'], domains: ['cardiovascular'] },
  { terms: ['lung', 'bronch', 'trache', 'larynx', 'pharynx'], domains: ['respiratory'] },
  { terms: ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum', 'liver', 'gallbladder'], domains: ['digestive-hepatobiliary'] },
  { terms: ['pancreas'], domains: ['digestive-hepatobiliary', 'endocrine'] },
  { terms: ['kidney', 'renal', 'ureter', 'bladder', 'urethra'], domains: ['renal-urinary'] },
  { terms: ['pituitary', 'thyroid', 'parathyroid', 'adrenal'], domains: ['endocrine'] },
  { terms: ['brain', 'spinal cord'], domains: ['nervous-system'] },
  { terms: ['spleen', 'thymus'], domains: ['hematologic-immune-lymphatic'] },
  { terms: ['ovary', 'uterus', 'cervix', 'vagina', 'testis', 'penis', 'prostate', 'seminal vesicle'], domains: ['reproductive-developmental'] },
]

function normalizeStructureText(structure: StrukturTubuh): string {
  return `${structure.b} ${structure.n}`.toLowerCase()
}

export function getBodyExposureDomainIds(structure: StrukturTubuh): readonly string[] {
  const direct = DIRECT_LAYER_DOMAINS[structure.l]
  if (direct) return direct
  if (structure.l !== 'visceral') return []

  const text = normalizeStructureText(structure)
  const matched = VISCERAL_RULES.find((rule) => rule.terms.some((term) => text.includes(term)))
  return matched?.domains ?? []
}

export function getBodyExposureKnowledgeContext(structure: StrukturTubuh): BodyExposureKnowledgeContext {
  const domainIds = getBodyExposureDomainIds(structure)
  const domains = domainIds
    .map((id) => getMultisystemDomain(id))
    .filter((domain): domain is MultisystemDomain => Boolean(domain))
  const allowed = new Set<KnowledgeScale>()
  for (const domain of domains) for (const scale of domain.scales) allowed.add(scale)
  const scales = MULTISYSTEM_KNOWLEDGE_GRAPH.scales.filter((scale) => allowed.has(scale))

  return {
    domainIds,
    domains,
    scales,
    educationalOnly: true,
    patientSpecificInference: false,
    diagnosisOrTreatment: false,
    academicAccuracyGateRequiredForHighRiskClinicalUse: true,
  }
}
