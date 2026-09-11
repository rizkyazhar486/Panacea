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

const PUBLICATION_FIELDS: readonly MacroEvidenceDebtField[] = [
  'exact-asset-source',
  'source-revision',
  'license',
  'attribution',
  'transformation-history',
  'qualified-reviewer',
  'review-date',
  'review-scope',
  'review-disposition',
]

/**
 * Machine-readable debt ledger for organism-scale articular/fascial closure.
 * It records what is missing; it never upgrades geometry or review status.
 */
export function buildMacroEvidenceDebtLedger(): readonly MacroEvidenceDebtEntry[] {
  return auditMacroArticularFascialReadiness().map((entry) => {
    const missingFields: MacroEvidenceDebtField[] = entry.status === 'source-candidate-missing'
      ? ['source-candidate', ...PUBLICATION_FIELDS]
      : [...PUBLICATION_FIELDS]

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