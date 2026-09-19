// Shared contract for the organ-specific scientific evidence seeds under
// data/body-knowledge/*.json (e.g. digestive-liver-evidence.json,
// urinary-kidney-evidence.json).
//
// WHY THIS FILE EXISTS. Each evidence seed has landed through its own
// isolated PR with its own isolated contract test
// (scripts/uji/body-<organ>-evidence.mts). That keeps each PR small and
// independently verifiable, but nothing generalizes the invariants those
// tests already enforce one file at a time, and nothing enumerates the full
// set in one place. Without a shared contract, a new seed can silently drift
// from the pattern (a missing provenance guard, a relationship pointing at
// an evidence id that does not exist) and only its own narrow test would
// ever notice — or, if a new seed skips writing a test, nothing notices.
//
// This module adds NO medical claims. It only packages the invariants the
// existing per-organ tests already assert (see e.g.
// scripts/uji/body-endocrine-evidence.mts) into one reusable, pure
// (no filesystem, no JSON import) contract that any evidence seed — present
// or future — can be checked against. It fails closed: a seed that does not
// satisfy the contract throws rather than being silently accepted.
//
// Deliberately kept free of JSON imports so it can be exercised directly
// from a Node test script (via readFileSync + JSON.parse, matching the
// existing per-organ test convention) without depending on Node's JSON
// import-attribute syntax.

export interface BodyKnowledgeEvidenceSource {
  readonly id: string
  readonly pmid: string
  readonly title: string
  readonly year: number
  readonly url: string
  readonly evidenceRole: string
  readonly sourceType: string
}

export interface BodyKnowledgeEvidenceRelationship {
  readonly id: string
  readonly domain: string
  readonly from: string
  readonly to: string
  readonly relationship: string
  readonly claim: string
  readonly evidence: readonly string[]
  readonly status: string
}

export interface BodyKnowledgeEvidenceProvenanceBoundary {
  readonly sourceCheckedMeans: string
  readonly sourceCheckedDoesNotMean: readonly string[]
  readonly forbiddenInferences: readonly string[]
}

/** Shape shared by every organ-specific seed (liver, pituitary, lung, kidney, ...). */
export interface BodyKnowledgeOrganEvidenceSeed {
  readonly version: number
  readonly updatedAt: string
  readonly system: string
  readonly organ: string
  readonly scope: string
  readonly relationships: readonly BodyKnowledgeEvidenceRelationship[]
  readonly sources: readonly BodyKnowledgeEvidenceSource[]
  readonly provenanceBoundary: BodyKnowledgeEvidenceProvenanceBoundary
}

export interface BodyKnowledgeOrganEvidenceSummary {
  readonly system: string
  readonly organ: string
  readonly updatedAt: string
  readonly relationshipCount: number
  readonly sourceCount: number
  readonly sourcePmids: readonly string[]
  readonly domains: readonly string[]
}

/**
 * The provenance guarantees every organ evidence seed must carry, verified
 * to already hold across every seed on main at the time this contract was
 * written (digestive-liver, endocrine-pituitary, respiratory-lung,
 * urinary-kidney). A seed missing any of these fails closed rather than
 * being treated as equivalent to one that carries the full boundary.
 */
export const REQUIRED_SOURCE_CHECKED_DOES_NOT_MEAN: readonly string[] = [
  'guideline-recommended',
  'clinically-validated-feature',
  'human-reviewed-in-panacea',
  'patient-specific',
  'asset-license-cleared',
  'diagnostic-or-treatment-advice',
]

export const REQUIRED_FORBIDDEN_INFERENCES: readonly string[] = [
  'generic-atlas-to-patient-specific-anatomy',
  'educational-relationship-to-diagnosis',
  'source-checked-to-human-reviewed',
]

/**
 * Validates one organ evidence seed against the shared contract and returns
 * its summary. Throws (fails closed) on any violation instead of returning
 * a partial or best-effort summary, so a caller can never mistake a
 * malformed seed for a verified one.
 */
export function summarizeBodyKnowledgeOrganEvidence(
  seed: BodyKnowledgeOrganEvidenceSeed,
): BodyKnowledgeOrganEvidenceSummary {
  const label = `${seed.system ?? '(missing system)'}/${seed.organ ?? '(missing organ)'}`

  if (!seed.system) throw new Error(`body knowledge evidence seed missing "system": ${label}`)
  if (!seed.organ) throw new Error(`body knowledge evidence seed missing "organ": ${label}`)
  if (!Array.isArray(seed.sources) || seed.sources.length === 0) {
    throw new Error(`${label}: evidence seed must cite at least one source`)
  }
  if (!Array.isArray(seed.relationships) || seed.relationships.length === 0) {
    throw new Error(`${label}: evidence seed must define at least one relationship`)
  }

  const sourceIds = new Set(seed.sources.map((source) => source.id))
  for (const source of seed.sources) {
    if (!/^pmid:\d+$/.test(source.id)) {
      throw new Error(`${label}: source id "${source.id}" is not a pmid:<digits> identifier`)
    }
    if (source.id !== `pmid:${source.pmid}`) {
      throw new Error(`${label}: source id "${source.id}" does not match its pmid field "${source.pmid}"`)
    }
    if (source.url !== `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`) {
      throw new Error(`${label}: source ${source.id} url does not match the expected PubMed URL`)
    }
  }

  for (const relationship of seed.relationships) {
    if (relationship.status !== 'source-checked') {
      throw new Error(`${label}: relationship ${relationship.id} has unexpected status "${relationship.status}"`)
    }
    if (!Array.isArray(relationship.evidence) || relationship.evidence.length === 0) {
      throw new Error(`${label}: relationship ${relationship.id} cites no evidence`)
    }
    for (const evidenceId of relationship.evidence) {
      if (!sourceIds.has(evidenceId)) {
        throw new Error(`${label}: relationship ${relationship.id} references unknown source "${evidenceId}"`)
      }
    }
  }

  const boundary = seed.provenanceBoundary
  if (!boundary) throw new Error(`${label}: evidence seed missing provenanceBoundary`)
  for (const required of REQUIRED_SOURCE_CHECKED_DOES_NOT_MEAN) {
    if (!boundary.sourceCheckedDoesNotMean?.includes(required)) {
      throw new Error(`${label}: provenanceBoundary.sourceCheckedDoesNotMean missing required guard "${required}"`)
    }
  }
  for (const required of REQUIRED_FORBIDDEN_INFERENCES) {
    if (!boundary.forbiddenInferences?.includes(required)) {
      throw new Error(`${label}: provenanceBoundary.forbiddenInferences missing required guard "${required}"`)
    }
  }

  return {
    system: seed.system,
    organ: seed.organ,
    updatedAt: seed.updatedAt,
    relationshipCount: seed.relationships.length,
    sourceCount: seed.sources.length,
    sourcePmids: seed.sources.map((source) => source.pmid),
    domains: [...new Set(seed.relationships.map((relationship) => relationship.domain))],
  }
}

/** Builds the full registry from a list of raw seeds, failing closed on any violation. */
export function buildBodyKnowledgeEvidenceRegistry(
  seeds: readonly BodyKnowledgeOrganEvidenceSeed[],
): readonly BodyKnowledgeOrganEvidenceSummary[] {
  const summaries = seeds.map(summarizeBodyKnowledgeOrganEvidence)

  const seen = new Set<string>()
  for (const summary of summaries) {
    const key = `${summary.system}/${summary.organ}`
    if (seen.has(key)) throw new Error(`duplicate body knowledge evidence entry for ${key}`)
    seen.add(key)
  }

  return summaries
}
