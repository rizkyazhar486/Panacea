import { auditDigestiveSourceAcceptance, DIGESTIVE_SOURCE_TARGETS } from './digestiveSourceAcceptance'

export type DigestiveSourceReadiness = 'ready' | 'blocked'

export interface DigestiveSourceReadinessRecord {
  readonly module: string
  readonly label: string
  readonly expectedSource: string
  readonly readiness: DigestiveSourceReadiness
  readonly blockers: readonly string[]
}

/**
 * Organ-lane source readiness projection.
 *
 * This is deliberately an engineering/provenance view over the existing source
 * acceptance gate. It does not add anatomy, infer missing structures, promote
 * academic review, or claim patient-specific geometry.
 */
export function buildDigestiveSourceReadiness(): readonly DigestiveSourceReadinessRecord[] {
  const audits = auditDigestiveSourceAcceptance()
  return DIGESTIVE_SOURCE_TARGETS.map((target) => {
    const audit = audits.find((item) => item.module === target.module)
    if (!audit) {
      return {
        module: target.module,
        label: target.label,
        expectedSource: target.expectedSource,
        readiness: 'blocked' as const,
        blockers: ['MISSING_SOURCE_AUDIT'],
      }
    }
    return {
      module: target.module,
      label: target.label,
      expectedSource: target.expectedSource,
      readiness: audit.renderEligible ? 'ready' as const : 'blocked' as const,
      blockers: audit.blockers,
    }
  })
}

export const DIGESTIVE_SOURCE_READINESS_BOUNDARY =
  'Engineering source readiness only. It does not establish anatomical completeness, academic review, clinical validation, patient-specific anatomy, or permission to invent missing structures.'
