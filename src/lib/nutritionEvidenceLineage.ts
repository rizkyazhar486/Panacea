export type NutritionEvidenceLayer = 'food-reference' | 'literature-index'

export interface NutritionEvidenceSourcePointer {
  id: 'open_food_facts' | 'pubmed-ncbi-eutils' | 'europe-pmc-rest'
  layer: NutritionEvidenceLayer
  registryPath: string
  purpose: string
}

/**
 * Stable Source Registry identities only. Mutable licence/validation metadata
 * stays authoritative in data/source-registry and is deliberately not copied
 * into this browser-facing config.
 */
export const NUTRITION_EVIDENCE_SOURCE_POINTERS: readonly NutritionEvidenceSourcePointer[] = [
  {
    id: 'open_food_facts',
    layer: 'food-reference',
    registryPath: 'data/source-registry/nutrition/open-food-facts.json',
    purpose: 'Product identity and recorded nutrient-reference provenance.',
  },
  {
    id: 'pubmed-ncbi-eutils',
    layer: 'literature-index',
    registryPath: 'data/source-registry/evidence/pubmed-ncbi-eutils.json',
    purpose: 'Bibliographic provenance for nutrition literature discovery.',
  },
  {
    id: 'europe-pmc-rest',
    layer: 'literature-index',
    registryPath: 'data/source-registry/evidence/europe-pmc-rest.json',
    purpose: 'Publication metadata provenance for bounded literature discovery.',
  },
] as const

export const NUTRITION_EVIDENCE_BOUNDARIES = [
  'A food-reference record is not evidence that a health claim is true.',
  'A literature-index citation is a provenance pointer, not a study-quality or guideline verdict.',
  'Clinical or dietary claims require review of the original source, population, methods, outcomes, units, date, and applicability.',
] as const
