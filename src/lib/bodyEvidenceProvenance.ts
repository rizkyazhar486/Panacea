import { BODY_PATHOPHYSIOLOGY_NETWORK, type BodyPathophysiologyScenarioId } from './bodyPathophysiologyNetwork'
import { BODY_PHARMACOLOGY_MECHANISM_NETWORK, type PharmacologyMechanismId } from './bodyPharmacologyMechanismNetwork'
import { BODY_MECHANISM_CAUSAL_BRIDGE } from './bodyMechanismCausalBridge'

export type BodyEvidenceClaimKind = 'pathophysiology' | 'pharmacology' | 'causal-intersection'

export interface BodyEvidenceSource {
  pmid: string
  title: string
  year: number
  url: string
  usedByClaimIds: readonly string[]
  roles: readonly string[]
}

export interface BodyEvidenceClaimRecord {
  id: string
  kind: BodyEvidenceClaimKind
  label: string
  summary: string
  evidencePmids: readonly string[]
  provenanceMode: 'direct' | 'inherited-union'
  derivation: string
  boundary: string
}

export interface BodyEvidenceCoverageStats {
  totalClaims: number
  evidenceAnchoredClaims: number
  uniquePubMedSources: number
  coverageFraction: number
  claimCounts: Readonly<Record<BodyEvidenceClaimKind, number>>
}

const claims: BodyEvidenceClaimRecord[] = []
const sourceAccumulator = new Map<string, { title: string; year: number; url: string; claimIds: Set<string>; roles: Set<string> }>()

function registerSource(
  claimId: string,
  source: { pmid: string; title: string; year: number; url: string; role: string },
) {
  const existing = sourceAccumulator.get(source.pmid) ?? {
    title: source.title,
    year: source.year,
    url: source.url,
    claimIds: new Set<string>(),
    roles: new Set<string>(),
  }
  existing.claimIds.add(claimId)
  existing.roles.add(source.role)
  sourceAccumulator.set(source.pmid, existing)
}

for (const scenario of BODY_PATHOPHYSIOLOGY_NETWORK) {
  const claimId = `pathophysiology:${scenario.id}`
  claims.push({
    id: claimId,
    kind: 'pathophysiology',
    label: scenario.title,
    summary: scenario.summary,
    evidencePmids: scenario.evidence.map((source) => source.pmid),
    provenanceMode: 'direct',
    derivation: 'Evidence anchors are declared directly by the curated pathophysiology scenario.',
    boundary: 'PMID presence supports provenance and auditability; it does not convert this educational cascade into a patient-specific diagnostic model or prove that one paper validates every node in the cascade.',
  })
  for (const source of scenario.evidence) registerSource(claimId, source)
}

for (const mechanism of BODY_PHARMACOLOGY_MECHANISM_NETWORK) {
  const claimId = `pharmacology:${mechanism.id}`
  claims.push({
    id: claimId,
    kind: 'pharmacology',
    label: mechanism.classLabel,
    summary: mechanism.summary,
    evidencePmids: mechanism.evidence.map((source) => source.pmid),
    provenanceMode: 'direct',
    derivation: 'Evidence anchors are declared directly by the curated pharmacology mechanism record.',
    boundary: 'PMID provenance documents class-level mechanism context only; it does not establish prescribing eligibility, comparative efficacy, dosing, contraindications or individual treatment response.',
  })
  for (const source of mechanism.evidence) registerSource(claimId, source)
}

for (const link of BODY_MECHANISM_CAUSAL_BRIDGE) {
  const scenario = BODY_PATHOPHYSIOLOGY_NETWORK.find((candidate) => candidate.id === link.scenarioId)
  const mechanism = BODY_PHARMACOLOGY_MECHANISM_NETWORK.find((candidate) => candidate.id === link.pharmacologyMechanismId)
  if (!scenario || !mechanism) throw new Error(`Causal bridge ${link.id} references missing evidence domain`)

  const claimId = `causal-intersection:${link.id}`
  const evidence = [...scenario.evidence, ...mechanism.evidence]
  const evidencePmids = [...new Set(evidence.map((source) => source.pmid))]
  claims.push({
    id: claimId,
    kind: 'causal-intersection',
    label: link.title,
    summary: link.explanation,
    evidencePmids,
    provenanceMode: 'inherited-union',
    derivation: `Inherited union of the ${scenario.shortLabel} pathophysiology evidence set and the ${mechanism.classLabel} pharmacology evidence set. The causal edge itself remains a curated mechanistic interpretation, not a newly generated clinical trial claim.`,
    boundary: link.doesNotImply,
  })
  for (const source of evidence) registerSource(claimId, source)
}

export const BODY_EVIDENCE_CLAIM_LEDGER: readonly BodyEvidenceClaimRecord[] = claims

export const BODY_EVIDENCE_SOURCE_LEDGER: readonly BodyEvidenceSource[] = [...sourceAccumulator.entries()]
  .map(([pmid, source]) => ({
    pmid,
    title: source.title,
    year: source.year,
    url: source.url,
    usedByClaimIds: [...source.claimIds],
    roles: [...source.roles],
  }))
  .sort((a, b) => b.year - a.year || a.pmid.localeCompare(b.pmid))

export const BODY_EVIDENCE_PROVENANCE_BOUNDARY =
  'Evidence observatory for provenance QA only. Source counts, citation reuse, coverage fraction and publication year are metadata about the educational knowledge base; they are not evidence grades, certainty scores, guideline classes, levels of recommendation, effect sizes, risk estimates, diagnostic probabilities or patient-specific clinical conclusions.'

export function getBodyEvidenceClaim(id: string): BodyEvidenceClaimRecord {
  const claim = BODY_EVIDENCE_CLAIM_LEDGER.find((candidate) => candidate.id === id)
  if (!claim) throw new Error(`Unknown Body Exposure evidence claim: ${id}`)
  return claim
}

export function getBodyEvidenceSource(pmid: string): BodyEvidenceSource {
  const source = BODY_EVIDENCE_SOURCE_LEDGER.find((candidate) => candidate.pmid === pmid)
  if (!source) throw new Error(`Unknown Body Exposure PMID: ${pmid}`)
  return source
}

export function listBodyEvidenceClaimsByKind(kind: BodyEvidenceClaimKind): readonly BodyEvidenceClaimRecord[] {
  return BODY_EVIDENCE_CLAIM_LEDGER.filter((claim) => claim.kind === kind)
}

export function listBodyEvidenceClaimsForScenario(scenarioId: BodyPathophysiologyScenarioId): readonly BodyEvidenceClaimRecord[] {
  return BODY_EVIDENCE_CLAIM_LEDGER.filter(
    (claim) => claim.id === `pathophysiology:${scenarioId}` || claim.id.startsWith('causal-intersection:') && BODY_MECHANISM_CAUSAL_BRIDGE.some((link) => `causal-intersection:${link.id}` === claim.id && link.scenarioId === scenarioId),
  )
}

export function listBodyEvidenceClaimsForPharmacology(mechanismId: PharmacologyMechanismId): readonly BodyEvidenceClaimRecord[] {
  return BODY_EVIDENCE_CLAIM_LEDGER.filter(
    (claim) => claim.id === `pharmacology:${mechanismId}` || claim.id.startsWith('causal-intersection:') && BODY_MECHANISM_CAUSAL_BRIDGE.some((link) => `causal-intersection:${link.id}` === claim.id && link.pharmacologyMechanismId === mechanismId),
  )
}

export function getBodyEvidenceCoverageStats(): BodyEvidenceCoverageStats {
  const totalClaims = BODY_EVIDENCE_CLAIM_LEDGER.length
  const evidenceAnchoredClaims = BODY_EVIDENCE_CLAIM_LEDGER.filter((claim) => claim.evidencePmids.length > 0).length
  const claimCounts: Record<BodyEvidenceClaimKind, number> = {
    pathophysiology: 0,
    pharmacology: 0,
    'causal-intersection': 0,
  }
  for (const claim of BODY_EVIDENCE_CLAIM_LEDGER) claimCounts[claim.kind] += 1
  return {
    totalClaims,
    evidenceAnchoredClaims,
    uniquePubMedSources: BODY_EVIDENCE_SOURCE_LEDGER.length,
    coverageFraction: totalClaims === 0 ? 0 : evidenceAnchoredClaims / totalClaims,
    claimCounts,
  }
}
