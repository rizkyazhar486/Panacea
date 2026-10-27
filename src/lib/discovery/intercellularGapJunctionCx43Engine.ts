// src/lib/discovery/intercellularGapJunctionCx43Engine.ts
// T-CLIN-109: Intercellular Gap Junction Connexin-43 (Cx43) Electrical Syncytium Coupling Engine

export interface GapJunctionInput {
  cx43TotalExpressionRatio: number // 0.1 to 1.5 (relative to healthy ventricular myocardium)
  cx43PhosphorylationSer368Ratio?: number // normal ~0.8; ischemic dephosphorylation drops to < 0.25
  intercalatedDiscPolarLocalizationFraction?: number // fraction at poles (normal > 0.85; lateralized < 0.50)
  intracellularPh?: number // acidosis closes gap junctions (normal 7.2; ischemic < 6.5)
  gapJunctionStabilizerDanegaptideConcentrationNm?: number // antiarrhythmic peptide (0 to 500 nM)
}

export interface GapJunctionCouplingEvaluation {
  junctionalConductanceNanoSiemens: number // Gj per cell pair (normal 200 - 600 nS)
  longitudinalConductionVelocityMetersPerSec: number // theta_L (normal 0.50 to 0.85 m/s)
  anisotropyRatio: number // longitudinal / transverse conduction ratio (normal 2.5 - 3.5; pathological > 5.0)
  reentrantArrhythmiaVulnerabilityTier: 'LOW_HOMOGENEOUS_CONDUCTION' | 'INTERMEDIATE_SLOW_ZONES' | 'CRITICAL_REENTRANT_SUBSTRATE'
  syncytialMetabolicPermeabilityScore: number // dye/ATP metabolic coupling (0.0 - 1.0)
  danegaptideStabilizationEffectPct: number
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Rohr 2004 Cardiovasc Res; Severs et al. 2008 Cardiovasc Res'
  }
}

/**
 * Simulates Connexin-43 gap junction conductance, intercalated disc localization, and syncytial cardiac conduction velocity.
 */
export function evaluateGapJunctionSyncytiumCoupling(input: GapJunctionInput): GapJunctionCouplingEvaluation {
  const cxExp = Math.max(0.05, input.cx43TotalExpressionRatio)
  const pSer = Math.min(1.0, Math.max(0.05, input.cx43PhosphorylationSer368Ratio ?? 0.80))
  const polar = Math.min(1.0, Math.max(0.1, input.intercalatedDiscPolarLocalizationFraction ?? 0.88))
  const ph = Math.min(7.4, Math.max(6.0, input.intracellularPh ?? 7.2))
  const danegaptide = Math.max(0.0, input.gapJunctionStabilizerDanegaptideConcentrationNm ?? 0.0)

  // Danegaptide stabilization effect (EC50 ~ 50 nM)
  const daneBonus = danegaptide > 0.0
    ? (danegaptide / (danegaptide + 50.0)) * 0.45
    : 0.0
  const danePct = Number((daneBonus * 100.0).toFixed(1))

  // pH-dependent gating: Hill equation with pKa ~ 6.6
  const phGatingFactor = 1.0 / (1.0 + Math.pow(10, (6.6 - ph) * 2.5))

  // Junctional conductance Gj (nS)
  const baseGj = 450.0 // nS baseline in healthy ventricular myocytes
  const effectivePhosphorylation = Math.min(1.0, pSer + daneBonus)
  const gj = Math.max(10.0, baseGj * cxExp * effectivePhosphorylation * polar * phGatingFactor)
  const roundedGj = Number(gj.toFixed(1))

  // Conduction velocity scales roughly with sqrt(Gj)
  const cvLongitudinal = Number((Math.min(0.85, 0.72 * Math.sqrt(gj / 450.0))).toFixed(2))

  // Anisotropy: when Cx43 is lateralized or uncoupled, transverse conduction suffers disproportionately
  const anisotropy = Number((Math.max(2.0, Math.min(7.5, 3.0 / Math.max(0.4, polar)))).toFixed(2))

  // Arrhythmia risk tier
  let risk: 'LOW_HOMOGENEOUS_CONDUCTION' | 'INTERMEDIATE_SLOW_ZONES' | 'CRITICAL_REENTRANT_SUBSTRATE' = 'LOW_HOMOGENEOUS_CONDUCTION'
  if (cvLongitudinal < 0.35 || anisotropy > 5.0 || roundedGj < 120.0) {
    risk = 'CRITICAL_REENTRANT_SUBSTRATE'
  } else if (cvLongitudinal < 0.55 || anisotropy > 3.8 || roundedGj < 280.0) {
    risk = 'INTERMEDIATE_SLOW_ZONES'
  } else {
    risk = 'LOW_HOMOGENEOUS_CONDUCTION'
  }

  const metabolicPermeability = Number((Math.min(1.0, (roundedGj / 450.0) * 0.95)).toFixed(3))

  return {
    junctionalConductanceNanoSiemens: roundedGj,
    longitudinalConductionVelocityMetersPerSec: cvLongitudinal,
    anisotropyRatio: anisotropy,
    reentrantArrhythmiaVulnerabilityTier: risk,
    syncytialMetabolicPermeabilityScore: metabolicPermeability,
    danegaptideStabilizationEffectPct: danePct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Rohr 2004 Cardiovasc Res; Severs et al. 2008 Cardiovasc Res',
    },
  }
}
