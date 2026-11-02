// src/domains/quantum-biology/index.ts
// Quantum Biology, Electron Kinetics & De Novo Epitope Modeling Domain

export {
  AMINO_ACID_TABLE,
  computeMarcusElectronTransferRate,
  evaluateEpitopeBindingAffinity,
} from './engine/epitopeBinderEngine.ts'

export {
  AMR_EPITOPE_CATALOG,
} from './data/amrEpitopeCatalog.ts'

export type {
  AminoAcidSingleLetter,
  AminoAcidPhysicochemicalProfile,
  EpitopeTargetDefinition,
  DeNovoBinderCandidate,
  BindingAffinityEvaluationResult,
} from './model/quantumProteinTypes.ts'
