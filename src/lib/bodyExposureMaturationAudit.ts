import { MULTISYSTEM_DOMAINS, type KnowledgeScale } from './multisystemKnowledgeGraph.ts'

export const BODY_EXPOSURE_CORE_SCALE_PATH: readonly KnowledgeScale[] = [
  'whole-body',
  'system',
  'organ',
  'tissue',
  'cell',
  'organelle',
  'molecular-pathway',
  'protein',
  'rna',
  'dna-epigenome',
]

export const BODY_EXPOSURE_ANATOMICAL_DOMAINS = [
  'integumentary',
  'musculoskeletal',
  'cardiovascular',
  'respiratory',
  'digestive-hepatobiliary',
  'renal-urinary',
  'hematologic-immune-lymphatic',
  'endocrine',
  'nervous-system',
  'sensory',
  'reproductive-developmental',
] as const

export const BODY_EXPOSURE_REQUIRED_REFERENCES = [
  {
    id: 'thebuggeddev-anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    role: 'architecture-reference',
    reusePolicy: 'reference-only-unless-license-and-asset-provenance-are-separately-verified',
  },
  {
    id: 'breath-atlas-thebuggeddev',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    role: 'respiratory-ux-reference',
    reusePolicy: 'interaction-reference-not-authoritative-physiology-evidence',
  },
  {
    id: 'aycibatuhan-nervous-system-atlas',
    url: 'https://github.com/aycibatuhan/nervous-system-atlas',
    role: 'neuroanatomy-architecture-taxonomy-reference',
    reusePolicy: 'source-code-apache-2.0-content-and-generated-data-separately-licensed-cc-by-sa-4.0-do-not-copy-content-by-default',
  },
] as const

export interface BodyDomainMaturity {
  domainId: string
  label: string
  coveredScales: readonly KnowledgeScale[]
  missingScales: readonly KnowledgeScale[]
  coveredScaleCount: number
  targetScaleCount: number
  coverageFraction: number
  wholeBodyFirstReady: boolean
  grossToOrganReady: boolean
  microReady: boolean
  molecularToDnaReady: boolean
}

const DOMAIN_SET = new Set<string>(BODY_EXPOSURE_ANATOMICAL_DOMAINS)

function hasEvery(scales: ReadonlySet<KnowledgeScale>, required: readonly KnowledgeScale[]) {
  return required.every((scale) => scales.has(scale))
}

/**
 * Product maturation coverage:
 * `Coverage = covered canonical scale slots / total canonical scale slots`.
 * This is implementation coverage only, not anatomical accuracy, evidence
 * quality, clinical validity, or academic-review status.
 */
export function auditBodyExposureMaturation() {
  const domains: BodyDomainMaturity[] = MULTISYSTEM_DOMAINS
    .filter((domain) => DOMAIN_SET.has(domain.id))
    .map((domain) => {
      const available = new Set(domain.scales)
      const coveredScales = BODY_EXPOSURE_CORE_SCALE_PATH.filter((scale) => available.has(scale))
      const missingScales = BODY_EXPOSURE_CORE_SCALE_PATH.filter((scale) => !available.has(scale))
      return {
        domainId: domain.id,
        label: domain.label,
        coveredScales,
        missingScales,
        coveredScaleCount: coveredScales.length,
        targetScaleCount: BODY_EXPOSURE_CORE_SCALE_PATH.length,
        coverageFraction: coveredScales.length / BODY_EXPOSURE_CORE_SCALE_PATH.length,
        wholeBodyFirstReady: available.has('whole-body') && available.has('system'),
        grossToOrganReady: hasEvery(available, ['system', 'organ']),
        microReady: hasEvery(available, ['tissue', 'cell', 'organelle']),
        molecularToDnaReady: hasEvery(available, ['molecular-pathway', 'protein', 'rna', 'dna-epigenome']),
      }
    })
    .sort((left, right) => left.coverageFraction - right.coverageFraction || left.domainId.localeCompare(right.domainId))

  const totalSlots = domains.length * BODY_EXPOSURE_CORE_SCALE_PATH.length
  const coveredSlots = domains.reduce((sum, domain) => sum + domain.coveredScaleCount, 0)
  const missingDomainIds = BODY_EXPOSURE_ANATOMICAL_DOMAINS.filter((id) => !domains.some((domain) => domain.domainId === id))

  return {
    domains,
    domainCount: domains.length,
    targetDomainCount: BODY_EXPOSURE_ANATOMICAL_DOMAINS.length,
    totalScaleSlots: totalSlots,
    coveredScaleSlots: coveredSlots,
    coverageFraction: totalSlots ? coveredSlots / totalSlots : 0,
    missingDomainIds,
    requiredReferences: BODY_EXPOSURE_REQUIRED_REFERENCES,
    boundary: {
      coverageIsImplementationMaturityOnly: true as const,
      anatomicalAccuracyClaim: false as const,
      clinicalValidityClaim: false as const,
      humanReviewClaim: false as const,
    },
  }
}

export function listBodyExposureScaleGaps() {
  return auditBodyExposureMaturation().domains.flatMap((domain) =>
    domain.missingScales.map((scale) => ({ domainId: domain.domainId, scale })),
  )
}
