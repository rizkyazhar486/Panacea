// Runtime registry over the organ-specific scientific evidence seeds under
// data/body-knowledge/*.json. See bodyKnowledgeEvidenceContract.ts for why
// this exists and what it guarantees; this file only wires the contract to
// the actual JSON seeds so a future organ adapter, coverage dashboard, or
// evidence-debt report has one canonical place to enumerate what body
// knowledge evidence exists on main, instead of each PR's data staying
// reachable only by its own isolated contract test.
//
// Adding a new organ evidence seed means adding its import below AND its
// disk file; scripts/uji/body-knowledge-evidence-registry.mts fails closed
// if the two ever disagree (a file on disk with no registry entry, or a
// registry entry with no file), so this list cannot silently go stale the
// way the five seeds already on main did before this module existed.

import {
  buildBodyKnowledgeEvidenceRegistry,
  type BodyKnowledgeOrganEvidenceSeed,
  type BodyKnowledgeOrganEvidenceSummary,
} from './bodyKnowledgeEvidenceContract'

import digestiveLiver from '../../../data/body-knowledge/digestive-liver-evidence.json' with { type: 'json' }
import endocrinePituitary from '../../../data/body-knowledge/endocrine-pituitary-evidence.json' with { type: 'json' }
import respiratoryLung from '../../../data/body-knowledge/respiratory-lung-evidence.json' with { type: 'json' }
import urinaryKidney from '../../../data/body-knowledge/urinary-kidney-evidence.json' with { type: 'json' }

const ORGAN_EVIDENCE_SEEDS = [
  digestiveLiver,
  endocrinePituitary,
  respiratoryLung,
  urinaryKidney,
] as unknown as readonly BodyKnowledgeOrganEvidenceSeed[]

/** One summary per organ evidence seed on main, validated against the shared contract. */
export const BODY_KNOWLEDGE_ORGAN_EVIDENCE: readonly BodyKnowledgeOrganEvidenceSummary[] =
  buildBodyKnowledgeEvidenceRegistry(ORGAN_EVIDENCE_SEEDS)

export function getBodyKnowledgeEvidenceForOrgan(
  system: string,
  organ: string,
): BodyKnowledgeOrganEvidenceSummary | undefined {
  return BODY_KNOWLEDGE_ORGAN_EVIDENCE.find((entry) => entry.system === system && entry.organ === organ)
}

// The UI's organ identifiers (OrganDossier.tsx's `organKey`, e.g. from
// organFocus.ts) predate this registry and do not always match the seed's
// own `system`/`organ` strings 1:1 (plural UI keys like "lungs"/"kidneys"
// vs. the seed's singular "lung"/"kidney"). This map is the single place
// that reconciles the two vocabularies, so a UI surface can look evidence
// up by the identifier it already has instead of every caller re-deriving
// its own guess at the mapping.
const ORGAN_KEY_TO_EVIDENCE_LOOKUP: Readonly<Record<string, { system: string; organ: string }>> = {
  liver: { system: 'digestive', organ: 'liver' },
  pituitary: { system: 'endocrine', organ: 'pituitary' },
  lungs: { system: 'respiratory', organ: 'lung' },
  kidneys: { system: 'urinary', organ: 'kidney' },
}

/**
 * Looks evidence up by the UI's organKey (as used in OrganDossier.tsx and
 * organFocus.ts), not the seed's own system/organ strings. Returns
 * undefined — never a guess — when no seed exists for that organ yet, so a
 * caller can fail closed rather than render evidence for the wrong organ.
 */
export function getBodyKnowledgeEvidenceForOrganKey(
  organKey: string,
): BodyKnowledgeOrganEvidenceSummary | undefined {
  const target = ORGAN_KEY_TO_EVIDENCE_LOOKUP[organKey]
  if (!target) return undefined
  return getBodyKnowledgeEvidenceForOrgan(target.system, target.organ)
}

export { type BodyKnowledgeOrganEvidenceSummary } from './bodyKnowledgeEvidenceContract'
