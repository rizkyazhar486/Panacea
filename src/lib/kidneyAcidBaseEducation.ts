export interface KidneyAcidBaseEvidence {
  id: string
  pmid: string
  title: string
  role: string
  url: string
}

export interface KidneyAcidBaseRelationship {
  id: string
  label: string
  anatomy: readonly string[]
  physiology: readonly string[]
  disruption: readonly string[]
  educationalRelationships: readonly string[]
  evidence: readonly string[]
}

export const KIDNEY_ACID_BASE_EVIDENCE: readonly KidneyAcidBaseEvidence[] = [
  {
    id: 'pmid:38448728',
    pmid: '38448728',
    title: 'State of knowledge on ammonia handling by the kidney.',
    role: 'Review anchor for renal ammoniagenesis, nephron ammonia transport and ammonia contribution to net acid excretion.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38448728/',
  },
  {
    id: 'pmid:37016093',
    pmid: '37016093',
    title: 'The pathophysiology of distal renal tubular acidosis.',
    role: 'Review anchor for bicarbonate handling, collecting-duct acid secretion, type A intercalated cells and distal renal tubular acidosis.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37016093/',
  },
] as const

export const KIDNEY_ACID_BASE_RELATIONSHIPS: readonly KidneyAcidBaseRelationship[] = [
  {
    id: 'proximal-bicarbonate',
    label: 'Proximal bicarbonate handling',
    anatomy: ['Proximal tubule'],
    physiology: ['The proximal nephron participates in filtered bicarbonate reclamation and therefore contributes to systemic acid-base homeostasis.'],
    disruption: ['Impaired proximal bicarbonate handling can reduce bicarbonate conservation; this educational relationship is not a diagnosis of a tubular disorder.'],
    educationalRelationships: ['proximal tubular transport → bicarbonate reclamation → acid-base homeostasis'],
    evidence: ['pmid:37016093'],
  },
  {
    id: 'proximal-ammoniagenesis',
    label: 'Renal ammonia generation',
    anatomy: ['Proximal tubule', 'Nephron ammonia-transport pathway'],
    physiology: ['Proximal tubular ammoniagenesis supplies ammonia species that are subsequently transported along the nephron and contribute to urinary acid excretion.'],
    disruption: ['Changes in ammonia production or transport can alter renal net acid excretion; generic teaching state cannot quantify a patient acid-base disorder.'],
    educationalRelationships: ['proximal ammoniagenesis → nephron ammonia transport → urinary proton buffering'],
    evidence: ['pmid:38448728'],
  },
  {
    id: 'collecting-duct-acid-secretion',
    label: 'Collecting-duct acid secretion',
    anatomy: ['Collecting duct', 'Type A intercalated cell'],
    physiology: ['Active acid secretion by the collecting duct is a central distal component of renal acid-base regulation.'],
    disruption: ['Reduced acid-secretory function can impair urinary acidification, but this educational representation does not infer a patient phenotype.'],
    educationalRelationships: ['type A intercalated cell → distal acid secretion → urinary acidification'],
    evidence: ['pmid:37016093', 'pmid:38448728'],
  },
  {
    id: 'distal-rta-disruption',
    label: 'Distal renal tubular acidosis mechanism',
    anatomy: ['Collecting duct', 'Type A intercalated cell'],
    physiology: ['Distal acid secretion normally supports renal net acid excretion and systemic acid-base homeostasis.'],
    disruption: ['Distal renal tubular acidosis is associated with impaired collecting-duct acidification, including reduced function of acid-secretory type A intercalated cells.'],
    educationalRelationships: ['impaired distal acid secretion → impaired urinary acidification → distal renal tubular acidosis mechanism'],
    evidence: ['pmid:37016093'],
  },
] as const

export const KIDNEY_ACID_BASE_BOUNDARY = {
  purpose: 'Generic kidney anatomy, physiology and pathophysiology education for Body Exposure.',
  excludes: [
    'patient-specific diagnosis, acid-base classification or renal-function interpretation',
    'treatment selection, medication choice, dose, duration or prescribing',
    'patient-specific prognosis, electrolyte prediction or urine-pH prediction',
    'claim that this repository content has completed qualified human clinical review',
  ],
  provenance: 'Biomedical relationships are bounded to the cited PubMed review anchors; repository representation is not proof of clinical validity.',
} as const
