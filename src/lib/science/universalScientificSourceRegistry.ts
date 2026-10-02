export type ScientificDomain =
  | 'element'
  | 'isotope'
  | 'compound'
  | 'drug'
  | 'gene'
  | 'variant'
  | 'protein'
  | 'amino-acid'
  | 'peptide'
  | 'metabolite'
  | 'lipid'
  | 'carbohydrate'
  | 'nucleic-acid'
  | 'pathway'
  | 'reaction'
  | 'target'
  | 'interaction'
  | 'disease-association'
  | 'molecular-structure'

export type StructureEvidence = 'experimental' | 'predicted' | 'mixed' | 'not-applicable'
export type IntegrationState = 'reference-candidate' | 'adapter-planned' | 'active-verified'

export interface ScientificSourceDefinition {
  id: string
  label: string
  domains: ScientificDomain[]
  canonicalIdExamples: string[]
  structureEvidence: StructureEvidence
  integrationState: IntegrationState
  sourceUrl: string
  versionPolicy: string
  accessBoundary: string
  evidenceBoundary: string
}

/**
 * Registry of authoritative/public-or-authorized source candidates for Panacea's
 * federated scientific knowledge layer.
 *
 * Presence here never means the full upstream database has been mirrored,
 * licensed for redistribution, or validated for clinical use. An ACTIVE adapter
 * requires separate source/version/license checks, bounded retrieval, provenance,
 * normalization, regression coverage, and domain-specific review.
 */
export const UNIVERSAL_SCIENTIFIC_SOURCE_REGISTRY: ScientificSourceDefinition[] = [
  {
    id: 'pubchem',
    label: 'PubChem',
    domains: ['compound', 'drug', 'molecular-structure', 'target'],
    canonicalIdExamples: ['CID'],
    structureEvidence: 'mixed',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://pubchem.ncbi.nlm.nih.gov/',
    versionPolicy: 'Record source identity and retrieval timestamp; never assume the upstream corpus is static.',
    accessBoundary: 'Use only public/authorized interfaces and preserve upstream attribution/terms.',
    evidenceBoundary: 'Chemical records and links are source data, not proof of mechanism, efficacy, safety, or patient relevance.',
  },
  {
    id: 'chebi',
    label: 'ChEBI',
    domains: ['compound', 'metabolite', 'lipid', 'carbohydrate', 'amino-acid'],
    canonicalIdExamples: ['CHEBI'],
    structureEvidence: 'mixed',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.ebi.ac.uk/chebi/',
    versionPolicy: 'Preserve upstream identifier and source release/version where exposed.',
    accessBoundary: 'Confirm exact API/data-use terms before activation or redistribution.',
    evidenceBoundary: 'Ontology/classification does not establish clinical effect or causal biology.',
  },
  {
    id: 'chembl',
    label: 'ChEMBL',
    domains: ['compound', 'drug', 'target', 'interaction'],
    canonicalIdExamples: ['CHEMBL'],
    structureEvidence: 'mixed',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.ebi.ac.uk/chembl/',
    versionPolicy: 'Pin upstream release/version for reproducible cross-database mappings.',
    accessBoundary: 'Confirm exact API/data-use terms before activation or redistribution.',
    evidenceBoundary: 'Bioactivity records require assay/context interpretation and are not clinical efficacy claims.',
  },
  {
    id: 'ncbi-gene',
    label: 'NCBI Gene',
    domains: ['gene'],
    canonicalIdExamples: ['GeneID'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/gene/',
    versionPolicy: 'Preserve GeneID plus retrieval/update metadata and species context.',
    accessBoundary: 'Use supported public interfaces and respect NCBI usage guidance.',
    evidenceBoundary: 'Gene annotation is not deterministic phenotype or disease causation.',
  },
  {
    id: 'hgnc',
    label: 'HGNC',
    domains: ['gene'],
    canonicalIdExamples: ['HGNC'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.genenames.org/',
    versionPolicy: 'Preserve approved symbol, HGNC ID, aliases, and retrieval metadata.',
    accessBoundary: 'Confirm exact API/data-use terms before activation.',
    evidenceBoundary: 'Nomenclature authority does not itself prove biological function or disease mechanism.',
  },
  {
    id: 'ensembl',
    label: 'Ensembl',
    domains: ['gene', 'variant', 'nucleic-acid'],
    canonicalIdExamples: ['ENSG', 'ENST'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.ensembl.org/',
    versionPolicy: 'Pin assembly/release and species; never merge identifiers across assemblies silently.',
    accessBoundary: 'Use public/authorized APIs and retain assembly/release provenance.',
    evidenceBoundary: 'Annotation/variant location is not equivalent to pathogenicity or patient-specific interpretation.',
  },
  {
    id: 'clinvar',
    label: 'ClinVar',
    domains: ['variant', 'disease-association'],
    canonicalIdExamples: ['VariationID', 'VCV'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/',
    versionPolicy: 'Preserve accession/version, review status, condition, assertion source, and date.',
    accessBoundary: 'Use supported public interfaces; never discard assertion/review provenance.',
    evidenceBoundary: 'Conflicting classifications and review status must remain visible; no automatic patient diagnosis.',
  },
  {
    id: 'uniprot',
    label: 'UniProt',
    domains: ['protein', 'amino-acid', 'peptide', 'target'],
    canonicalIdExamples: ['UniProtKB accession'],
    structureEvidence: 'mixed',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.uniprot.org/',
    versionPolicy: 'Preserve accession, sequence/version, organism, reviewed/unreviewed state, and retrieval metadata.',
    accessBoundary: 'Confirm exact API/data-use terms before bulk mirroring or redistribution.',
    evidenceBoundary: 'Annotation quality/status must remain explicit; sequence annotation is not patient-specific function.',
  },
  {
    id: 'rcsb-pdb',
    label: 'RCSB Protein Data Bank',
    domains: ['protein', 'molecular-structure', 'interaction'],
    canonicalIdExamples: ['PDB ID'],
    structureEvidence: 'experimental',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.rcsb.org/',
    versionPolicy: 'Preserve PDB ID, deposition/revision state, method, resolution where applicable, construct/state, and retrieval metadata.',
    accessBoundary: 'Use public/authorized coordinate access and preserve source attribution.',
    evidenceBoundary: 'An experimental structure represents a particular construct/state/condition, not a universal in-vivo conformation.',
  },
  {
    id: 'alphafold-db',
    label: 'AlphaFold Protein Structure Database',
    domains: ['protein', 'molecular-structure'],
    canonicalIdExamples: ['UniProt accession'],
    structureEvidence: 'predicted',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://alphafold.ebi.ac.uk/',
    versionPolicy: 'Preserve model/database version, target accession, confidence metadata, and retrieval date.',
    accessBoundary: 'Confirm exact data-use terms before redistribution or embedding.',
    evidenceBoundary: 'Predicted coordinates must never be relabelled as experimental or treated as proof of binding/mechanism.',
  },
  {
    id: 'rxnorm',
    label: 'RxNorm',
    domains: ['drug'],
    canonicalIdExamples: ['RxCUI'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://www.nlm.nih.gov/research/umls/rxnorm/',
    versionPolicy: 'Preserve RxCUI, term type, source vocabulary links, and release/retrieval metadata.',
    accessBoundary: 'Use supported NLM access; source vocabularies may have separate licensing constraints.',
    evidenceBoundary: 'Normalized medication identity is not prescribing guidance or evidence of indication/effect.',
  },
  {
    id: 'dailymed',
    label: 'DailyMed',
    domains: ['drug'],
    canonicalIdExamples: ['SPL set ID'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://dailymed.nlm.nih.gov/',
    versionPolicy: 'Preserve SPL identity/version/date and label section provenance.',
    accessBoundary: 'Use public/authorized interfaces and retain label provenance.',
    evidenceBoundary: 'Label content must remain jurisdiction/version specific and is not a patient-specific recommendation.',
  },
  {
    id: 'openfda',
    label: 'openFDA',
    domains: ['drug', 'disease-association'],
    canonicalIdExamples: ['FDA record identifiers'],
    structureEvidence: 'not-applicable',
    integrationState: 'reference-candidate',
    sourceUrl: 'https://open.fda.gov/',
    versionPolicy: 'Preserve endpoint/dataset identity, query time, record provenance, and upstream update semantics.',
    accessBoundary: 'Use supported public APIs and respect documented rate/data limitations.',
    evidenceBoundary: 'Regulatory/adverse-event records do not establish causality, incidence, or patient-specific risk by themselves.',
  },
]

export interface CoverageSnapshot {
  sourceId: string
  indexedEntities: number
  exposedEntities: number | null
  measuredAt: string
  sourceVersion: string | null
}

export function coverageFraction(snapshot: CoverageSnapshot): number | null {
  if (snapshot.exposedEntities == null || snapshot.exposedEntities <= 0) return null
  if (!Number.isFinite(snapshot.indexedEntities) || snapshot.indexedEntities < 0) return null
  return Math.min(1, snapshot.indexedEntities / snapshot.exposedEntities)
}

export function mayClaimSourceComplete(snapshot: CoverageSnapshot): boolean {
  const fraction = coverageFraction(snapshot)
  return fraction === 1 && Boolean(snapshot.sourceVersion) && Boolean(snapshot.measuredAt)
}

export function sourceById(id: string): ScientificSourceDefinition | null {
  return UNIVERSAL_SCIENTIFIC_SOURCE_REGISTRY.find((source) => source.id === id) ?? null
}

export const UNIVERSAL_SCIENTIFIC_COVERAGE_BOUNDARY =
  'Panacea targets broad federated coverage from public or authorized sources. It must not claim that every scientific database, compound, atom, gene, protein, drug, structure, interaction, or association on Earth has been indexed unless the claim is directly measured and versioned.'
