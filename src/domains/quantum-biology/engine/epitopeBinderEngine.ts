// src/domains/quantum-biology/engine/epitopeBinderEngine.ts
// Quantum Biophysical Epitope Binding Affinity & Electron Transfer Kinetics Engine
// Marcus Theory of Electron Transfer (Marcus RA, Rev Mod Phys 1993; 65:599-610)

import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp.ts'
import type {
  AminoAcidSingleLetter,
  AminoAcidPhysicochemicalProfile,
  EpitopeTargetDefinition,
  DeNovoBinderCandidate,
  BindingAffinityEvaluationResult,
} from '../model/quantumProteinTypes.ts'

export const AMINO_ACID_TABLE: Readonly<Record<AminoAcidSingleLetter, AminoAcidPhysicochemicalProfile>> = {
  A: { code: 'A', name: 'Alanine', molecularWeightDa: 89.09, hydropathyIndex: 1.8, isoelectricPoint: 6.00, vanDerWaalsVolumeA3: 67, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  R: { code: 'R', name: 'Arginine', molecularWeightDa: 174.20, hydropathyIndex: -4.5, isoelectricPoint: 10.76, vanDerWaalsVolumeA3: 148, netChargeAtPh7: 1, hydrogenBondDonorCount: 5, hydrogenBondAcceptorCount: 1 },
  N: { code: 'N', name: 'Asparagine', molecularWeightDa: 132.12, hydropathyIndex: -3.5, isoelectricPoint: 5.41, vanDerWaalsVolumeA3: 96, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  D: { code: 'D', name: 'Aspartate', molecularWeightDa: 133.10, hydropathyIndex: -3.5, isoelectricPoint: 2.77, vanDerWaalsVolumeA3: 91, netChargeAtPh7: -1, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 3 },
  C: { code: 'C', name: 'Cysteine', molecularWeightDa: 121.16, hydropathyIndex: 2.5, isoelectricPoint: 5.07, vanDerWaalsVolumeA3: 86, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  Q: { code: 'Q', name: 'Glutamine', molecularWeightDa: 146.15, hydropathyIndex: -3.5, isoelectricPoint: 5.65, vanDerWaalsVolumeA3: 114, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  E: { code: 'E', name: 'Glutamate', molecularWeightDa: 147.13, hydropathyIndex: -3.5, isoelectricPoint: 3.22, vanDerWaalsVolumeA3: 109, netChargeAtPh7: -1, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 3 },
  G: { code: 'G', name: 'Glycine', molecularWeightDa: 75.07, hydropathyIndex: -0.4, isoelectricPoint: 5.97, vanDerWaalsVolumeA3: 48, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  H: { code: 'H', name: 'Histidine', molecularWeightDa: 155.16, hydropathyIndex: -3.2, isoelectricPoint: 7.59, vanDerWaalsVolumeA3: 118, netChargeAtPh7: 0.1, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  I: { code: 'I', name: 'Isoleucine', molecularWeightDa: 131.18, hydropathyIndex: 4.5, isoelectricPoint: 6.02, vanDerWaalsVolumeA3: 124, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  L: { code: 'L', name: 'Leucine', molecularWeightDa: 131.18, hydropathyIndex: 3.8, isoelectricPoint: 5.98, vanDerWaalsVolumeA3: 124, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  K: { code: 'K', name: 'Lysine', molecularWeightDa: 146.19, hydropathyIndex: -3.9, isoelectricPoint: 9.74, vanDerWaalsVolumeA3: 135, netChargeAtPh7: 1, hydrogenBondDonorCount: 3, hydrogenBondAcceptorCount: 1 },
  M: { code: 'M', name: 'Methionine', molecularWeightDa: 149.21, hydropathyIndex: 1.9, isoelectricPoint: 5.74, vanDerWaalsVolumeA3: 124, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  F: { code: 'F', name: 'Phenylalanine', molecularWeightDa: 165.19, hydropathyIndex: 2.8, isoelectricPoint: 5.48, vanDerWaalsVolumeA3: 135, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
  P: { code: 'P', name: 'Proline', molecularWeightDa: 115.13, hydropathyIndex: -1.6, isoelectricPoint: 6.30, vanDerWaalsVolumeA3: 90, netChargeAtPh7: 0, hydrogenBondDonorCount: 0, hydrogenBondAcceptorCount: 1 },
  S: { code: 'S', name: 'Serine', molecularWeightDa: 105.09, hydropathyIndex: -0.8, isoelectricPoint: 5.68, vanDerWaalsVolumeA3: 73, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  T: { code: 'T', name: 'Threonine', molecularWeightDa: 119.12, hydropathyIndex: -0.7, isoelectricPoint: 5.60, vanDerWaalsVolumeA3: 93, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  W: { code: 'W', name: 'Tryptophan', molecularWeightDa: 204.23, hydropathyIndex: -0.9, isoelectricPoint: 5.89, vanDerWaalsVolumeA3: 163, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 1 },
  Y: { code: 'Y', name: 'Tyrosine', molecularWeightDa: 181.19, hydropathyIndex: -1.3, isoelectricPoint: 5.66, vanDerWaalsVolumeA3: 141, netChargeAtPh7: 0, hydrogenBondDonorCount: 2, hydrogenBondAcceptorCount: 2 },
  V: { code: 'V', name: 'Valine', molecularWeightDa: 117.15, hydropathyIndex: 4.2, isoelectricPoint: 5.96, vanDerWaalsVolumeA3: 105, netChargeAtPh7: 0, hydrogenBondDonorCount: 1, hydrogenBondAcceptorCount: 1 },
}

function parseSequenceResidues(seq: string): AminoAcidSingleLetter[] {
  const clean = seq.toUpperCase().replace(/\s+/g, '')
  if (!clean || clean.length < 3) throw new TypeError('Sequence must contain at least 3 amino acids')
  const residues: AminoAcidSingleLetter[] = []
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i] as AminoAcidSingleLetter
    if (!AMINO_ACID_TABLE[char]) {
      throw new TypeError(`Invalid amino acid character '${clean[i]}' at position ${i + 1}`)
    }
    residues.push(char)
  }
  return residues
}

/**
 * Computes Marcus non-adiabatic electron transfer rate constant:
 * k_ET = (2 * pi / hbar) * |H_DA|^2 * (1 / sqrt(4 * pi * lambda * kB * T)) * exp(-(dG0 + lambda)^2 / (4 * lambda * kB * T))
 */
export function computeMarcusElectronTransferRate(
  lambda_eV: number,
  H_da_meV: number,
  dG0_eV: number,
  temperatureK = 310.15 // 37 C
): number {
  if (lambda_eV <= 0 || lambda_eV > 3.0) throw new RangeError(`Reorganization energy lambda must be in range (0..3.0] eV; got ${lambda_eV}`)
  if (H_da_meV < 0 || H_da_meV > 200) throw new RangeError(`Electronic coupling H_da must be in range [0..200] meV; got ${H_da_meV}`)

  const hbar_eV_s = 6.582119569e-16
  const kB_eV_K = 8.617333262e-5
  const kBT = kB_eV_K * temperatureK

  const H_da_eV = H_da_meV / 1000
  const prefactor = ((2 * Math.PI) / hbar_eV_s) * Math.pow(H_da_eV, 2)
  const normFactor = 1 / Math.sqrt(4 * Math.PI * lambda_eV * kBT)
  const activationEnergy = Math.pow(dG0_eV + lambda_eV, 2) / (4 * lambda_eV * kBT)
  const rate = prefactor * normFactor * Math.exp(-activationEnergy)

  return Math.round(rate * 100) / 100
}

/**
 * Deterministic biophysical epitope binding evaluation based on interface contact geometry,
 * charge complementarity, hydrogen bonding potential, and buried surface area.
 */
export function evaluateEpitopeBindingAffinity(
  target: EpitopeTargetDefinition,
  binder: DeNovoBinderCandidate,
  evaluationIsoTimestamp: string
): BindingAffinityEvaluationResult {
  if (!target || typeof target !== 'object') throw new TypeError('Target definition required')
  if (!binder || typeof binder !== 'object') throw new TypeError('Binder candidate required')
  if (!isValidIsoTimestamp(evaluationIsoTimestamp)) throw new TypeError('Invalid evaluation ISO timestamp')

  const targetRes = parseSequenceResidues(target.epitopeSequence)
  const binderRes = parseSequenceResidues(binder.sequence)

  // Align length of interface window (minimum overlap)
  const contactLen = Math.min(targetRes.length, binderRes.length)
  let saltBridges = 0
  let hydrogenBonds = 0
  let totalContactAreaA2 = 0
  let electrostaticEnergyKcal = 0
  let hydrophobicContributionKcal = 0

  for (let i = 0; i < contactLen; i++) {
    const tProfile = AMINO_ACID_TABLE[targetRes[i]]
    const bProfile = AMINO_ACID_TABLE[binderRes[i]]

    // Salt bridge vs electrostatic repulsion
    if (
      (tProfile.netChargeAtPh7 > 0.5 && bProfile.netChargeAtPh7 < -0.5) ||
      (tProfile.netChargeAtPh7 < -0.5 && bProfile.netChargeAtPh7 > 0.5)
    ) {
      saltBridges++
      electrostaticEnergyKcal -= 3.0 // favorable salt bridge
    } else if (
      (tProfile.netChargeAtPh7 > 0.5 && bProfile.netChargeAtPh7 > 0.5) ||
      (tProfile.netChargeAtPh7 < -0.5 && bProfile.netChargeAtPh7 < -0.5)
    ) {
      // Repulsive charge pair
      electrostaticEnergyKcal += 3.5
    }

    // Specific side-chain hydrogen bonding (polar residues only: S, T, N, Q, Y, H, D, E, K, R)
    const isPolarOrCharged = (aa: AminoAcidSingleLetter) => 'STNQYHDEKR'.includes(aa)
    if (isPolarOrCharged(targetRes[i]) && isPolarOrCharged(binderRes[i])) {
      hydrogenBonds++
      electrostaticEnergyKcal -= 0.9 // net H-bond free energy in aqueous solvent
    }

    // Buried surface area contribution
    const residueContactArea = (tProfile.vanDerWaalsVolumeA3 + bProfile.vanDerWaalsVolumeA3) * 0.35
    totalContactAreaA2 += residueContactArea

    // Hydrophobic effect: non-polar residues burying water
    if (tProfile.hydropathyIndex > 0 && bProfile.hydropathyIndex > 0) {
      hydrophobicContributionKcal -= (tProfile.hydropathyIndex + bProfile.hydropathyIndex) * 0.2
    }
  }

  // Solvation free energy of hydrophobic interface burial (Eisenberg & McLachlan 1986): -0.012 kcal/(mol * A^2)
  const interfaceBurialFreeEnergy = -0.012 * totalContactAreaA2

  // Conformational entropy loss on complex formation: ~0.6 kcal/mol per interface contact residue
  const entropyLossTdS = contactLen * 0.6
  const bindingFreeEnergy_dG = Math.round(
    (electrostaticEnergyKcal + hydrophobicContributionKcal + interfaceBurialFreeEnergy + entropyLossTdS) * 100
  ) / 100

  // Dissociation constant Kd = exp(dG / (R * T)) in nM
  // R = 1.9872e-3 kcal/(mol * K), T = 310.15 K -> RT = 0.61633 kcal/mol
  const RT = 0.61633
  const rawKdMolar = Math.exp(bindingFreeEnergy_dG / RT)
  const dissociationConstant_Kd_nM = Math.max(0.01, Math.round(rawKdMolar * 1e9 * 100) / 100)

  // Shape complementarity (Sc) statistic estimate (Lawrence & Colman, J Mol Biol 1993)
  const shapeComplementarityScore = Math.min(
    0.95,
    Math.max(0.35, Math.round((0.55 + (saltBridges * 0.08) + (hydrogenBonds * 0.03)) * 100) / 100)
  )

  let neutralizationEfficacyTier: BindingAffinityEvaluationResult['neutralizationEfficacyTier']
  if (bindingFreeEnergy_dG <= -9.5 && dissociationConstant_Kd_nM < 100) {
    neutralizationEfficacyTier = 'HIGH_AFFINITY_NEUTRALIZER'
  } else if (bindingFreeEnergy_dG <= -6.0 && dissociationConstant_Kd_nM < 5000) {
    neutralizationEfficacyTier = 'MODERATE_BINDER'
  } else if (bindingFreeEnergy_dG < 0) {
    neutralizationEfficacyTier = 'WEAK_SUBOPTIMAL'
  } else {
    neutralizationEfficacyTier = 'NON_NEUTRALIZING'
  }

  // Include Marcus electron transfer kinetics if metallo or redox active site
  let electronTransferKinetics: BindingAffinityEvaluationResult['electronTransferKinetics']
  if (target.activeSiteGeometry === 'ZINC_METALLO_POCKET' || target.activeSiteGeometry === 'BETA_LACTAM_COORDINATION') {
    const lambda_eV = 0.85
    const H_da_meV = 15.0
    const dG0_eV = bindingFreeEnergy_dG * 0.04336 // convert kcal/mol to eV
    const rate = computeMarcusElectronTransferRate(lambda_eV, H_da_meV, dG0_eV)
    electronTransferKinetics = {
      reorganizationEnergyLambda_eV: lambda_eV,
      electronicCouplingHda_meV: H_da_meV,
      rateConstant_kET_s1: rate,
    }
  }

  return {
    targetId: target.targetId,
    binderId: binder.binderId,
    bindingFreeEnergy_dG_kcal_mol: bindingFreeEnergy_dG,
    dissociationConstant_Kd_nM: dissociationConstant_Kd_nM,
    buriedSurfaceArea_A2: Math.round(totalContactAreaA2 * 10) / 10,
    hydrogenBondCount: hydrogenBonds,
    saltBridgeCount: saltBridges,
    shapeComplementarityScore,
    neutralizationEfficacyTier,
    electronTransferKinetics,
    truthClass: 'mechanistic_quantum_simulation_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
    evaluatedAtIso: evaluationIsoTimestamp,
  }
}
