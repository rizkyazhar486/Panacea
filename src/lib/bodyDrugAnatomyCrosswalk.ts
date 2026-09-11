import { DRUG_TARGETS } from './drugTargets'
import { ORGAN_FOCUS } from './organFocus'

export interface DrugAnatomyCrosswalk {
  drugId: string
  desiredEffectOrganKeys: string[]
  adverseEffectOrganKeys: string[]
  status: 'curated-reference' | 'unmapped'
  evidenceStatus: 'reference-only' | 'unmapped'
  publishableAsEvidence: false
  provenance: string
}

const ORGAN_KEYS = new Set(ORGAN_FOCUS.map((organ) => organ.key))
const TARGET_BY_ID = new Map(DRUG_TARGETS.map((drug) => [drug.id, drug]))

function validKeys(keys: string[]): string[] {
  return keys.filter((key) => ORGAN_KEYS.has(key))
}

/**
 * Resolve anatomy only from the repository's curated pharmacology table.
 *
 * This crosswalk is a navigation/reference aid, not publication evidence.
 * Free text, label mechanism text, diagnosis names, and AI output are never
 * converted into anatomy targets here. A drug/adverse-effect overlay can only
 * become evidence-publishable through the separate BodyEvidenceMapping gate
 * with pinned source identity/version/locator and the required review metadata.
 * Unknown IDs fail closed as `unmapped`.
 */
export function anatomyForCuratedDrugId(rawId: string): DrugAnatomyCrosswalk {
  const id = rawId.trim().toLocaleLowerCase('en-US')
  const drug = TARGET_BY_ID.get(id)
  if (!drug) {
    return {
      drugId: id,
      desiredEffectOrganKeys: [],
      adverseEffectOrganKeys: [],
      status: 'unmapped',
      evidenceStatus: 'unmapped',
      publishableAsEvidence: false,
      provenance: 'No curated Panacea drug-target anatomy reference is recorded for this drug ID.',
    }
  }

  const desired = validKeys(drug.sites)
  const adverse = validKeys(drug.efekSamping)
  if (desired.length !== drug.sites.length || adverse.length !== drug.efekSamping.length) {
    return {
      drugId: id,
      desiredEffectOrganKeys: [],
      adverseEffectOrganKeys: [],
      status: 'unmapped',
      evidenceStatus: 'unmapped',
      publishableAsEvidence: false,
      provenance: 'Curated reference mapping contains an anatomy focus key that is not available in the current Z-Anatomy focus registry.',
    }
  }

  return {
    drugId: id,
    desiredEffectOrganKeys: desired,
    adverseEffectOrganKeys: adverse,
    status: 'curated-reference',
    evidenceStatus: 'reference-only',
    publishableAsEvidence: false,
    provenance: 'Panacea DRUG_TARGETS → ORGAN_FOCUS internal curated reference only; this is not source/version/citation-bearing evidence and must not be presented as verified drug localization.',
  }
}
