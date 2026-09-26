import type { BodySystemId } from './bodySystemSourceWave'

export type OrganEvidenceDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface OrganEvidenceSource {
  kind: 'pubmed'
  pmid: string
  title: string
  url: string
}

export interface OrganEvidenceRelationship {
  id: string
  domain: OrganEvidenceDomain
  from: string
  to: string
  teachingRelationship: string
  sourcePmids: readonly string[]
  boundary: string
}

export interface OrganSystemEvidenceProfile {
  systemId: BodySystemId
  label: string
  structures: readonly string[]
  relationships: readonly OrganEvidenceRelationship[]
  sources: readonly OrganEvidenceSource[]
  reviewState: 'literature-anchored-unreviewed'
}

/**
 * Organ/system-specific educational relationships.
 *
 * These records deliberately do not contain coordinates, patient findings,
 * diagnostic probabilities, doses, treatment recommendations, or claims of
 * qualified-human review. A PMID anchors the teaching relationship; it does
 * not prove Panacea's geometry or confer clinical validation.
 */
export const ORGAN_SYSTEM_EVIDENCE_PROFILES: readonly OrganSystemEvidenceProfile[] = [
  {
    systemId: 'integumentary-surface',
    label: 'Integumentary / Surface',
    structures: ['stratum corneum', 'viable epidermis', 'dermis', 'cutaneous barrier'],
    reviewState: 'literature-anchored-unreviewed',
    sources: [
      { kind: 'pubmed', pmid: '19043850', title: 'The skin: an indispensable barrier.', url: 'https://pubmed.ncbi.nlm.nih.gov/19043850/' },
      { kind: 'pubmed', pmid: '38643989', title: 'Skin Barrier in Atopic Dermatitis.', url: 'https://pubmed.ncbi.nlm.nih.gov/38643989/' },
    ],
    relationships: [
      { id: 'skin-barrier-function', domain: 'physiology', from: 'stratum corneum', to: 'cutaneous barrier', teachingRelationship: 'The stratum corneum is a principal interface for permeability-barrier function.', sourcePmids: ['19043850'], boundary: 'General educational physiology; not a measurement of an individual skin barrier.' },
      { id: 'skin-barrier-atopic', domain: 'pathophysiology', from: 'cutaneous barrier', to: 'atopic dermatitis', teachingRelationship: 'Barrier dysfunction is one component of atopic-dermatitis pathobiology.', sourcePmids: ['38643989'], boundary: 'Mechanistic teaching link only; not diagnostic or patient-specific.' },
    ],
  },
  {
    systemId: 'lymphatic-immune',
    label: 'Lymphatic / Immune',
    structures: ['lymphatic vessels', 'lymph nodes', 'lymph', 'immune-cell traffic'],
    reviewState: 'literature-anchored-unreviewed',
    sources: [
      { kind: 'pubmed', pmid: '39441893', title: 'Transport and Immune Functions of the Lymphatic System.', url: 'https://pubmed.ncbi.nlm.nih.gov/39441893/' },
    ],
    relationships: [
      { id: 'lymph-transport-immune', domain: 'physiology', from: 'lymphatic vessels', to: 'immune-cell traffic', teachingRelationship: 'Lymphatic transport couples interstitial-fluid return with immune-cell and antigen trafficking.', sourcePmids: ['39441893'], boundary: 'Conceptual physiology relationship; no patient immune-state inference.' },
      { id: 'lymph-node-interface', domain: 'anatomy', from: 'lymphatic vessels', to: 'lymph nodes', teachingRelationship: 'Lymphatic vessels route lymph through nodal immune interfaces as part of the transport network.', sourcePmids: ['39441893'], boundary: 'Topology teaching only; not a geometry or drainage-territory assertion for a patient.' },
    ],
  },
  {
    systemId: 'reproductive',
    label: 'Reproductive',
    structures: ['ovarian follicles', 'ovary', 'antral follicle cohort', 'dominant follicle'],
    reviewState: 'literature-anchored-unreviewed',
    sources: [
      { kind: 'pubmed', pmid: '22068695', title: 'Ovarian antral folliculogenesis during the human menstrual cycle: a review.', url: 'https://pubmed.ncbi.nlm.nih.gov/22068695/' },
    ],
    relationships: [
      { id: 'ovarian-folliculogenesis', domain: 'physiology', from: 'antral follicle cohort', to: 'dominant follicle', teachingRelationship: 'Antral follicle development across the menstrual cycle includes recruitment and selection dynamics.', sourcePmids: ['22068695'], boundary: 'Educational cycle physiology; not fertility prediction, cycle dating, or treatment guidance.' },
      { id: 'follicle-ovary', domain: 'anatomy', from: 'ovarian follicles', to: 'ovary', teachingRelationship: 'Follicular development is represented within ovarian context rather than as a detached endocrine event.', sourcePmids: ['22068695'], boundary: 'Conceptual organ relationship; no invented follicle count, size, or spatial coordinate.' },
    ],
  },
  {
    systemId: 'sensory-ent',
    label: 'Sensory / ENT',
    structures: ['cochlea', 'inner hair cell synapse', 'auditory nerve', 'auditory pathway'],
    reviewState: 'literature-anchored-unreviewed',
    sources: [
      { kind: 'pubmed', pmid: '26891769', title: 'Auditory neuropathy--neural and synaptic mechanisms.', url: 'https://pubmed.ncbi.nlm.nih.gov/26891769/' },
    ],
    relationships: [
      { id: 'cochlear-neural-transmission', domain: 'physiology', from: 'inner hair cell synapse', to: 'auditory nerve', teachingRelationship: 'Synaptic transmission from cochlear inner hair cells is an upstream step in neural auditory signaling.', sourcePmids: ['26891769'], boundary: 'Educational physiology only; not an audiogram, lesion localization, or hearing diagnosis.' },
      { id: 'auditory-neuropathy-mechanism', domain: 'pathophysiology', from: 'inner hair cell synapse', to: 'auditory neuropathy', teachingRelationship: 'Synaptic and neural dysfunction can contribute to auditory-neuropathy mechanisms.', sourcePmids: ['26891769'], boundary: 'Mechanism relationship only; no patient-specific localization or diagnostic inference.' },
    ],
  },
] as const

export function getOrganSystemEvidenceProfile(systemId: BodySystemId) {
  return ORGAN_SYSTEM_EVIDENCE_PROFILES.find((profile) => profile.systemId === systemId) ?? null
}

export function validateOrganSystemEvidenceProfiles() {
  const failures: string[] = []
  const ids = new Set<string>()
  for (const profile of ORGAN_SYSTEM_EVIDENCE_PROFILES) {
    const sourcePmids = new Set(profile.sources.map((source) => source.pmid))
    for (const relationship of profile.relationships) {
      if (ids.has(relationship.id)) failures.push(`duplicate relationship id: ${relationship.id}`)
      ids.add(relationship.id)
      if (!relationship.sourcePmids.length) failures.push(`missing source: ${relationship.id}`)
      for (const pmid of relationship.sourcePmids) {
        if (!sourcePmids.has(pmid)) failures.push(`unknown PMID ${pmid}: ${relationship.id}`)
      }
      if (!relationship.boundary) failures.push(`missing boundary: ${relationship.id}`)
    }
  }
  return { valid: failures.length === 0, failures }
}
