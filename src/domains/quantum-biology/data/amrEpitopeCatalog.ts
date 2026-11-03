// src/domains/quantum-biology/data/amrEpitopeCatalog.ts
// Curated High-Priority Antimicrobial Resistance (AMR) & Viral Epitope Targets
// Structural biological coordinates indexed against PDB / UniProt references

import type { EpitopeTargetDefinition } from '../model/quantumProteinTypes.ts'

export const AMR_EPITOPE_CATALOG: readonly EpitopeTargetDefinition[] = [
  {
    targetId: 'TARGET-MRSA-PBP2A',
    targetName: 'PBP2a Transpeptidase Allosteric & Catalytic Domain',
    organism: 'Staphylococcus aureus (MRSA)',
    pathogenClass: 'BACTERIA_GRAM_POSITIVE',
    clinicalSignificance: 'Mediates high-level methicillin resistance via low-affinity beta-lactam binding',
    pdbAccessionReference: '1VQQ',
    epitopeSequence: 'SNKIKTGETYDKLKDEYGYK',
    criticalBindingResidues: [4, 8, 12, 17],
    activeSiteGeometry: 'BETA_LACTAM_COORDINATION',
  },
  {
    targetId: 'TARGET-NDM1-CARBAPENEMASE',
    targetName: 'New Delhi Metallo-Beta-Lactamase-1 Active Site',
    organism: 'Klebsiella pneumoniae / Enterobacterales',
    pathogenClass: 'BACTERIA_GRAM_NEGATIVE',
    clinicalSignificance: 'Hydrolyzes virtually all beta-lactams including carbapenems via dual zinc cofactor coordination',
    pdbAccessionReference: '3SPU',
    epitopeSequence: 'HAQATHSTSDNIEKLLK',
    criticalBindingResidues: [1, 5, 8, 12],
    activeSiteGeometry: 'ZINC_METALLO_POCKET',
  },
  {
    targetId: 'TARGET-KPC2-CARBAPENEMASE',
    targetName: 'KPC-2 Serine Carbapenemase Catalytic Pocket',
    organism: 'Klebsiella pneumoniae',
    pathogenClass: 'BACTERIA_GRAM_NEGATIVE',
    clinicalSignificance: 'Class A serine carbapenemase conferring widespread resistance to carbapenem antibiotics',
    pdbAccessionReference: '2OV5',
    epitopeSequence: 'TSGKTLESGKTLESGK',
    criticalBindingResidues: [2, 6, 11],
    activeSiteGeometry: 'SERINE_ESTERASE_TRIAD',
  },
  {
    targetId: 'TARGET-SARS2-SPIKE-RBD',
    targetName: 'SARS-CoV-2 Spike Receptor Binding Domain Epitope',
    organism: 'SARS-CoV-2',
    pathogenClass: 'VIRUS_ENVELOPED',
    clinicalSignificance: 'Critical interface for human ACE2 entry; prime neutralizing epitope for therapeutic nanobodies',
    pdbAccessionReference: '6M0J',
    epitopeSequence: 'KSTNLVKNKCVNFNFN',
    criticalBindingResidues: [1, 5, 9, 13],
    activeSiteGeometry: 'HYDROPHOBIC_FUSION_GROOVE',
  },
]
