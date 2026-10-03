import type {
  ParameterDeclaration,
  PersonalizationBlocker,
  PersonalizationBlockerCode,
  PersonalizationDecision,
  PersonalizationProposal,
} from '../model/personalization'

const isNonEmptyString = (x: unknown): x is string => typeof x === 'string' && x.trim() !== ''
const isFiniteNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const isStringList = (x: unknown): x is readonly string[] => Array.isArray(x) && x.every(isNonEmptyString)

function block(code: PersonalizationBlockerCode, detail: string): PersonalizationBlocker {
  return { code, detail }
}

function declarationProblems(d: ParameterDeclaration): PersonalizationBlocker[] {
  const out: PersonalizationBlocker[] = []
  if (!d || typeof d !== 'object') return [block('declaration-invalid', 'declaration is missing')]
  if (!isNonEmptyString(d.parameterId)) out.push(block('declaration-invalid', 'parameterId must be a non-empty string'))
  if (!isNonEmptyString(d.version)) out.push(block('declaration-invalid', 'version must be a non-empty string'))
  if (!isStringList(d.meaningSourceIds)) out.push(block('declaration-invalid', 'meaningSourceIds must be a list of non-empty strings'))
  if (!isStringList(d.identifiableFrom)) out.push(block('declaration-invalid', 'identifiableFrom must be a list of non-empty strings'))
  if (!Number.isInteger(d.minObservations) || d.minObservations < 1) out.push(block('declaration-invalid', 'minObservations must be an integer of at least 1'))
  if (!isFiniteNumber(d.maxRelativeStep) || d.maxRelativeStep <= 0) out.push(block('declaration-invalid', 'maxRelativeStep must be a finite number above 0'))
  if (typeof d.requiresHeldOutValidation !== 'boolean') out.push(block('declaration-invalid', 'requiresHeldOutValidation must be a boolean'))
  return out
}

function proposalProblems(p: PersonalizationProposal): PersonalizationBlocker[] {
  const out: PersonalizationBlocker[] = []
  if (!p || typeof p !== 'object') return [block('proposal-invalid', 'proposal is missing')]
  if (!isNonEmptyString(p.parameterId)) out.push(block('proposal-invalid', 'parameterId must be a non-empty string'))
  if (!isFiniteNumber(p.populationValue) || p.populationValue === 0) out.push(block('proposal-invalid', 'populationValue must be a finite, non-zero number'))
  if (!isFiniteNumber(p.proposedValue)) out.push(block('proposal-invalid', 'proposedValue must be a finite number'))
  if (!Array.isArray(p.observations) || !p.observations.every((o) => o && isNonEmptyString(o.id) && isNonEmptyString(o.kind))) {
    out.push(block('proposal-invalid', 'observations must be a list of { id, kind } with non-empty strings'))
  }
  return out
}

/**
 * Memutuskan apakah nilai personal boleh menggantikan nilai populasi. Fail-closed: setiap kondisi yang tidak terpenuhi
 * dilaporkan (tidak berhenti di yang pertama) dan nilai usulan tidak pernah bocor ketika diblokir.
 */
export function evaluatePersonalization(declaration: ParameterDeclaration, proposal: PersonalizationProposal): PersonalizationDecision {
  const invalid = [...declarationProblems(declaration), ...proposalProblems(proposal)]
  if (invalid.length > 0) return { eligible: false, personalValue: null, use: 'population-reference', blockers: invalid }

  const blockers: PersonalizationBlocker[] = []
  if (proposal.parameterId !== declaration.parameterId) {
    blockers.push(block('parameter-mismatch', `proposal is for "${proposal.parameterId}" but the declaration is for "${declaration.parameterId}"`))
  }
  if (declaration.meaningSourceIds.length === 0) blockers.push(block('meaning-unsupported', 'no evidence source supports the meaning of this parameter'))
  if (declaration.identifiableFrom.length === 0) blockers.push(block('not-identifiable', 'the declaration names no observation kind this parameter is identifiable from'))

  // Hanya observasi dari jenis yang membuat parameter teridentifikasi, dan tiap id sekali.
  const usable = new Set(proposal.observations.filter((o) => declaration.identifiableFrom.includes(o.kind)).map((o) => o.id))
  if (declaration.identifiableFrom.length > 0 && usable.size === 0 && proposal.observations.length > 0) {
    blockers.push(block('not-identifiable', 'none of the provided observations is of a kind this parameter is identifiable from'))
  }
  if (usable.size < declaration.minObservations) {
    blockers.push(block('insufficient-observations', `${usable.size} usable distinct observations, ${declaration.minObservations} required`))
  }

  const u = proposal.uncertainty
  if (u === null || u === undefined) blockers.push(block('uncertainty-missing', 'the estimate has no quantified uncertainty'))
  else if (!isFiniteNumber(u.lower) || !isFiniteNumber(u.upper) || u.lower > proposal.proposedValue || u.upper < proposal.proposedValue) {
    blockers.push(block('uncertainty-inconsistent', 'uncertainty must be a finite interval that contains the proposed value'))
  }

  if (!isNonEmptyString(proposal.provenanceId)) blockers.push(block('provenance-missing', 'the estimate has no provenance id'))

  const relativeStep = Math.abs(proposal.proposedValue - proposal.populationValue) / Math.abs(proposal.populationValue)
  if (relativeStep > declaration.maxRelativeStep) {
    blockers.push(block('update-unbounded', `relative step ${relativeStep} exceeds the declared maximum ${declaration.maxRelativeStep}`))
  }
  if (!isNonEmptyString(proposal.priorVersionId)) blockers.push(block('rollback-unavailable', 'no prior version to roll back to'))

  if (declaration.requiresHeldOutValidation) {
    const v = proposal.heldOutValidation
    if (v === null || v === undefined || v.performed !== true) blockers.push(block('held-out-validation-missing', 'held-out validation was not performed'))
    else if (v.passed !== true) blockers.push(block('held-out-validation-failed', 'held-out validation did not pass'))
  }

  if (blockers.length > 0) return { eligible: false, personalValue: null, use: 'population-reference', blockers }
  return {
    eligible: true,
    personalValue: proposal.proposedValue,
    truthClass: 'estimated-latent',
    parameterId: declaration.parameterId,
    declarationVersion: declaration.version,
  }
}
