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

export { type BodyKnowledgeOrganEvidenceSummary } from './bodyKnowledgeEvidenceContract'
