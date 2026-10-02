export type MusculoskeletalEcStep = {
  id: string
  label: string
  anatomyAnchors: readonly string[]
  relationship: string
  evidencePmids: readonly string[]
}

type EvidenceAnchor = {
  pmid: string
  url: string
  role: string
}

/**
 * Model edukasi generik; bukan model pasien, simulator gaya, atau alat keputusan klinis.
 */
export const MUSCULOSKELETAL_EC_COUPLING = {
  system: 'musculoskeletal',
  topic: 'skeletal-muscle-excitation-contraction-coupling',
  educationalOnly: true,
  patientSpecific: false,
  humanReview: {
    status: 'pending',
    claim: 'No qualified human anatomical/clinical review is represented by this record.',
  },
  steps: [
    {
      id: 'membrane-depolarization',
      label: 'Muscle-fibre membrane depolarization',
      anatomyAnchors: ['skeletal muscle fibre', 'sarcolemma', 'transverse tubule'],
      relationship: 'Electrical excitation reaches the transverse-tubule membrane and initiates excitation-contraction coupling.',
      evidencePmids: ['20599552'],
    },
    {
      id: 'sr-calcium-release',
      label: 'Sarcoplasmic-reticulum calcium release',
      anatomyAnchors: ['transverse tubule', 'sarcoplasmic reticulum', 'myoplasm'],
      relationship: 'Membrane depolarization is coupled to release of calcium from the sarcoplasmic reticulum into the myoplasm.',
      evidencePmids: ['20599552'],
    },
    {
      id: 'troponin-binding',
      label: 'Calcium binding at the thin filament',
      anatomyAnchors: ['myoplasm', 'thin filament', 'troponin'],
      relationship: 'Released calcium diffuses to thin filaments and binds regulatory sites on troponin.',
      evidencePmids: ['20599552'],
    },
    {
      id: 'thin-filament-activation',
      label: 'Thin-filament activation',
      anatomyAnchors: ['sarcomere', 'thin filament', 'troponin'],
      relationship: 'Troponin calcium binding activates the contractile thin-filament regulatory system; this record does not calculate force.',
      evidencePmids: ['20599552'],
    },
    {
      id: 'calcium-reuptake',
      label: 'Calcium re-sequestration',
      anatomyAnchors: ['myoplasm', 'sarcoplasmic reticulum'],
      relationship: 'Calcium is re-sequestered by sarcoplasmic-reticulum calcium-pump activity as the transient resolves.',
      evidencePmids: ['20599552'],
    },
  ] satisfies readonly MusculoskeletalEcStep[],
  evidence: [
    {
      pmid: '20599552',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20599552/',
      role: 'Review anchor for skeletal-muscle calcium signalling during excitation-contraction coupling, including SR release, troponin binding and re-sequestration.',
    },
  ] satisfies readonly EvidenceAnchor[],
  boundaries: [
    'Generic skeletal-muscle education only; anatomy anchors are semantic labels, not verified spatial coordinates or source-mesh bindings.',
    'No patient-specific weakness, injury, myopathy, calcium state, force, fatigue, prognosis, diagnosis, treatment, dose, rehabilitation load, or exercise prescription is inferred.',
    'The PubMed review supports the bounded scientific relationships above; it does not validate this repository implementation or its educational presentation.',
    'Software CI is not clinical validation, anatomical academic review, or evidence of therapeutic efficacy.',
  ] as const,
} as const
