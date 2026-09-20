import {
  ARTICULAR_SOURCE_CANDIDATE,
} from './articularSourceCandidate'
import {
  FASCIAL_SOURCE_CANDIDATES,
  FASCIAL_SOURCE_PROVENANCE,
  type FascialSourceDomain,
} from './fascialSourceCandidate'
import {
  auditMacroArticularFascialReadiness,
  type MacroDomain,
  type MacroTargetReadiness,
} from './macroArticularFascialReadiness'

export type MacroEvidenceDebtField =
  | 'source-candidate'
  | 'exact-asset-source'
  | 'source-revision'
  | 'license'
  | 'license-scope-verification'
  | 'attribution'
  | 'transformation-history'
  | 'qualified-reviewer'
  | 'review-date'
  | 'review-scope'
  | 'review-disposition'

export interface MacroEvidenceDebtEntry {
  targetId: string
  label: string
  domain: MacroDomain
  regions: readonly string[]
  sourceFiles: readonly string[]
  matchedSourceNames: readonly string[]
  readinessStatus: MacroTargetReadiness['status']
  missingFields: readonly MacroEvidenceDebtField[]
  publicationBlocked: true
}

const REVIEW_AND_CONVERSION_DEBT: readonly MacroEvidenceDebtField[] = [
  'license-scope-verification',
  'transformation-history',
  'qualified-reviewer',
  'review-date',
  'review-scope',
  'review-disposition',
]

interface PinnedSourceMetadataState {
  sourceCandidate: boolean
  exactAssetSource: boolean
  sourceRevision: boolean
  license: boolean
  attribution: boolean
}

function articularPinnedSourceMetadata(): PinnedSourceMetadataState {
  return {
    sourceCandidate: Boolean(
      ARTICULAR_SOURCE_CANDIDATE.upstreamPath
      && ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha,
    ),
    exactAssetSource: Boolean(
      ARTICULAR_SOURCE_CANDIDATE.upstreamPath
      && ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha
      && ARTICULAR_SOURCE_CANDIDATE.upstreamBytes > 0,
    ),
    sourceRevision: Boolean(ARTICULAR_SOURCE_CANDIDATE.upstreamCommit),
    license: Boolean(
      ARTICULAR_SOURCE_CANDIDATE.licensePolicy
      && ARTICULAR_SOURCE_CANDIDATE.attribution.some((line) => /CC-BY-SA/i.test(line)),
    ),
    attribution: ARTICULAR_SOURCE_CANDIDATE.attribution.length > 0,
  }
}

function fascialDomainFromTargetId(targetId: string): FascialSourceDomain | null {
  if (!targetId.startsWith('fascial:')) return null
  const domain = targetId.slice('fascial:'.length)
  return FASCIAL_SOURCE_CANDIDATES.some((candidate) => candidate.domain === domain)
    ? domain as FascialSourceDomain
    : null
}

function fascialPinnedSourceMetadata(targetId: string): PinnedSourceMetadataState {
  const domain = fascialDomainFromTargetId(targetId)
  const candidate = domain
    ? FASCIAL_SOURCE_CANDIDATES.find((entry) => entry.domain === domain)
    : undefined
  const candidateFound = candidate?.availability === 'candidate-found'

  return {
    sourceCandidate: candidateFound,
    exactAssetSource: Boolean(
      candidateFound
      && candidate?.upstreamPath
      && candidate.upstreamBlobSha
      && (candidate.upstreamBytes ?? 0) > 0,
    ),
    sourceRevision: Boolean(FASCIAL_SOURCE_PROVENANCE.upstreamCommit),
    license: Boolean(FASCIAL_SOURCE_PROVENANCE.repositoryLicense),
    attribution: Boolean(FASCIAL_SOURCE_PROVENANCE.attribution),
  }
}

function sourceMetadataState(entry: MacroTargetReadiness): PinnedSourceMetadataState {
  return entry.target.domain === 'articular'
    ? articularPinnedSourceMetadata()
    : fascialPinnedSourceMetadata(entry.target.id)
}

function missingSourceMetadataFields(
  metadata: PinnedSourceMetadataState,
): MacroEvidenceDebtField[] {
  const missing: MacroEvidenceDebtField[] = []
  if (!metadata.sourceCandidate) missing.push('source-candidate')
  if (!metadata.exactAssetSource) missing.push('exact-asset-source')
  if (!metadata.sourceRevision) missing.push('source-revision')
  if (!metadata.license) missing.push('license')
  if (!metadata.attribution) missing.push('attribution')
  return missing
}

/**
 * Machine-readable debt ledger for organism-scale articular/fascial closure.
 *
 * Pinned upstream provenance and current shipped-bundle readiness are separate
 * facts. A target may have an exact upstream source candidate while still being
 * absent from the shipped atlas. This ledger records only genuinely missing
 * evidence and never upgrades geometry, license scope, or academic review.
 */
export function buildMacroEvidenceDebtLedger(): readonly MacroEvidenceDebtEntry[] {
  return auditMacroArticularFascialReadiness().map((entry) => {
    const missingFields: MacroEvidenceDebtField[] = [
      ...missingSourceMetadataFields(sourceMetadataState(entry)),
      ...REVIEW_AND_CONVERSION_DEBT,
    ]

    return {
      targetId: entry.target.id,
      label: entry.target.label,
      domain: entry.target.domain,
      regions: entry.target.regions,
      sourceFiles: entry.target.sourceFiles,
      matchedSourceNames: entry.matchedSourceNames,
      readinessStatus: entry.status,
      missingFields,
      publicationBlocked: true as const,
    }
  })
}

export function summarizeMacroEvidenceDebt() {
  const entries = buildMacroEvidenceDebtLedger()
  const byDomain = (domain: MacroDomain) => {
    const scoped = entries.filter((entry) => entry.domain === domain)
    return {
      targetCount: scoped.length,
      sourceCandidateMissing: scoped.filter((entry) => entry.missingFields.includes('source-candidate')).length,
      exactAssetSourceMissing: scoped.filter((entry) => entry.missingFields.includes('exact-asset-source')).length,
      licenseScopeVerificationRequired: scoped.filter((entry) => entry.missingFields.includes('license-scope-verification')).length,
      publicationBlocked: scoped.filter((entry) => entry.publicationBlocked).length,
    }
  }

  return {
    totalTargets: entries.length,
    articular: byDomain('articular'),
    fascial: byDomain('fascial'),
    allPublicationBlocked: entries.length > 0 && entries.every((entry) => entry.publicationBlocked),
  } as const
}
