export type ExperimentalStructureMethod = 'X-RAY DIFFRACTION' | 'CRYO-ELECTRON MICROSCOPY' | 'SOLUTION NMR'

export interface VerifiedProteinStructureRecord {
  id: string
  pdbId: string
  title: string
  genes: readonly string[]
  proteins: readonly string[]
  ligands: readonly string[]
  organism: 'Homo sapiens'
  method: ExperimentalStructureMethod
  resolutionAngstrom: number | null
  released: string
  rcsbUrl: string
  pdbDoi: string
  evidenceState: 'experimental-atomic-coordinates'
  coordinateUse: 'allowed-with-provenance'
  clinicalInferenceAllowed: false
  molecularDynamicsClaimAllowed: false
  caveat: string
}

export const VERIFIED_PROTEIN_STRUCTURE_BOUNDARY =
  'Verified PDB coordinates are structural evidence for the deposited construct and experimental state only. They are not a complete representation of every isoform, mutation, conformational ensemble, cellular environment, disease mechanism, drug response, patient state or molecular-dynamics trajectory.' as const

export const VERIFIED_PROTEIN_STRUCTURES: readonly VerifiedProteinStructureRecord[] = [
  {
    id: 'mdm2-p53-1ycr',
    pdbId: '1YCR',
    title: 'MDM2 bound to the transactivation domain of p53',
    genes: ['MDM2', 'TP53'],
    proteins: ['E3 ubiquitin-protein ligase MDM2', 'p53 transactivation-domain peptide'],
    ligands: [],
    organism: 'Homo sapiens',
    method: 'X-RAY DIFFRACTION',
    resolutionAngstrom: 2.6,
    released: '1997-11-19',
    rcsbUrl: 'https://www.rcsb.org/structure/1YCR',
    pdbDoi: 'https://doi.org/10.2210/pdb1YCR/pdb',
    evidenceState: 'experimental-atomic-coordinates',
    coordinateUse: 'allowed-with-provenance',
    clinicalInferenceAllowed: false,
    molecularDynamicsClaimAllowed: false,
    caveat: 'This deposited complex represents one construct and bound state. It must not be treated as a universal p53/MDM2 conformation or as evidence of therapeutic efficacy.',
  },
  {
    id: 'drd2-risperidone-6cm4',
    pdbId: '6CM4',
    title: 'D2 dopamine receptor bound to risperidone',
    genes: ['DRD2'],
    proteins: ['Dopamine D2 receptor'],
    ligands: ['risperidone'],
    organism: 'Homo sapiens',
    method: 'X-RAY DIFFRACTION',
    resolutionAngstrom: 2.87,
    released: '2018-03-14',
    rcsbUrl: 'https://www.rcsb.org/structure/6CM4',
    pdbDoi: 'https://doi.org/10.2210/pdb6CM4/pdb',
    evidenceState: 'experimental-atomic-coordinates',
    coordinateUse: 'allowed-with-provenance',
    clinicalInferenceAllowed: false,
    molecularDynamicsClaimAllowed: false,
    caveat: 'This crystallographic receptor state is not receptor-density imaging, patient physiology, a complete signaling ensemble, or a one-receptor explanation of schizophrenia or antipsychotic response.',
  },
] as const

export function normalizedPdbId(input: string): string | null {
  const id = input.trim().toUpperCase()
  return /^[0-9][A-Z0-9]{3}$/.test(id) ? id : null
}

export function verifiedStructureByPdbId(input: string): VerifiedProteinStructureRecord | null {
  const pdbId = normalizedPdbId(input)
  if (!pdbId) return null
  return VERIFIED_PROTEIN_STRUCTURES.find((record) => record.pdbId === pdbId) ?? null
}

export function canonicalMmcifUrl(input: string): string | null {
  const record = verifiedStructureByPdbId(input)
  return record ? `https://files.rcsb.org/download/${record.pdbId}.cif` : null
}

export function experimentalCoordinatesAllowed(input: string): boolean {
  const record = verifiedStructureByPdbId(input)
  return Boolean(
    record
      && record.evidenceState === 'experimental-atomic-coordinates'
      && record.coordinateUse === 'allowed-with-provenance'
      && record.rcsbUrl.includes(`/structure/${record.pdbId}`)
      && record.pdbDoi.includes(`pdb${record.pdbId}`),
  )
}

export const UNVERIFIED_STRUCTURE_POLICY = {
  allowSyntheticAtoms: false,
  allowInventedPdbIds: false,
  allowPredictedAsExperimental: false,
  allowUnverifiedCoordinateDownload: false,
  allowPatientInference: false,
  action: 'remain-blocked-until-verified',
} as const
