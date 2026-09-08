import { DRUG_TARGETS } from './drugTargets'
import { ORGAN_FOCUS } from './organFocus'

export interface DrugAnatomyCrosswalk {
  drugId: string
  desiredEffectOrganKeys: string[]
  adverseEffectOrganKeys: string[]
  status: 'verified-curated' | 'unmapped'
  provenance: string
}

const ORGAN_KEYS = new Set(ORGAN_FOCUS.map((organ) => organ.key))
const TARGET_BY_ID = new Map(DRUG_TARGETS.map((drug) => [drug.id, drug]))

function validKeys(keys: string[]): string[] {
  return keys.filter((key) => ORGAN_KEYS.has(key))
}

/**
 * Resolve anatomy only from the repository's curated pharmacology table.
 * Free text, label mechanism text, diagnosis names, and AI output are never
 * converted into anatomy targets here. Unknown IDs fail closed as `unmapped`.
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
      provenance: 'No curated Panacea drug-target anatomy mapping is recorded for this drug ID.',
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
      provenance: 'Curated mapping references an anatomy focus key that is not available in the current Z-Anatomy focus registry.',
    }
  }

  return {
    drugId: id,
    desiredEffectOrganKeys: desired,
    adverseEffectOrganKeys: adverse,
    status: 'verified-curated',
    provenance: 'Panacea DRUG_TARGETS → ORGAN_FOCUS curated crosswalk; anatomy focus keys resolve to the repository Z-Anatomy layer/keyword registry.',
  }
}
