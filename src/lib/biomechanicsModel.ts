export interface ExternalLoadInputs {
  bodyMassKg: number
  supportedBodyMassFraction: number
  externalLoadKg: number
  verticalAccelerationMs2: number
  momentArmM: number
  angularDisplacementRad: number
  angularVelocityRadS: number
  contactTimeS: number
}

export interface ExternalLoadResult {
  effectiveMassKg: number
  forceN: number
  torqueNm: number
  workJ: number
  powerW: number
  impulseNs: number
  bodyWeightN: number
  forceToBodyWeight: number
}

export const STANDARD_GRAVITY_MS2 = 9.80665

export function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * Simplified external-load mechanics for education.
 *
 * m_eff = m_body * support_fraction + m_external
 * F = m_eff * (g + a)
 * tau = F * r
 * W = tau * theta
 * P = tau * omega
 * J = F * dt
 *
 * This is not inverse dynamics. It does not estimate internal muscle force,
 * joint-contact force, co-contraction, tendon force or patient-specific kinetics.
 */
export function calculateExternalLoad(inputs: ExternalLoadInputs): ExternalLoadResult {
  const bodyMassKg = clampFinite(inputs.bodyMassKg, 0, 400)
  const supportedBodyMassFraction = clampFinite(inputs.supportedBodyMassFraction, 0, 1)
  const externalLoadKg = clampFinite(inputs.externalLoadKg, 0, 500)
  const verticalAccelerationMs2 = clampFinite(inputs.verticalAccelerationMs2, -STANDARD_GRAVITY_MS2, 20)
  const momentArmM = clampFinite(inputs.momentArmM, 0, 2)
  const angularDisplacementRad = clampFinite(inputs.angularDisplacementRad, 0, Math.PI * 2)
  const angularVelocityRadS = clampFinite(inputs.angularVelocityRadS, 0, 30)
  const contactTimeS = clampFinite(inputs.contactTimeS, 0, 5)

  const effectiveMassKg = bodyMassKg * supportedBodyMassFraction + externalLoadKg
  const forceN = Math.max(0, effectiveMassKg * (STANDARD_GRAVITY_MS2 + verticalAccelerationMs2))
  const torqueNm = forceN * momentArmM
  const workJ = torqueNm * angularDisplacementRad
  const powerW = torqueNm * angularVelocityRadS
  const impulseNs = forceN * contactTimeS
  const bodyWeightN = bodyMassKg * STANDARD_GRAVITY_MS2
  const forceToBodyWeight = bodyWeightN > 0 ? forceN / bodyWeightN : 0

  return {
    effectiveMassKg,
    forceN,
    torqueNm,
    workJ,
    powerW,
    impulseNs,
    bodyWeightN,
    forceToBodyWeight,
  }
}

export interface SegmentChainNode {
  id: string
  label: string
  parentId: string | null
  region: 'head' | 'trunk' | 'upper-limb' | 'pelvis' | 'lower-limb'
}

export const HUMAN_SEGMENT_CHAIN: SegmentChainNode[] = [
  { id: 'pelvis', label: 'Pelvis', parentId: null, region: 'pelvis' },
  { id: 'trunk', label: 'Trunk', parentId: 'pelvis', region: 'trunk' },
  { id: 'head', label: 'Head', parentId: 'trunk', region: 'head' },
  { id: 'left-thigh', label: 'Left thigh', parentId: 'pelvis', region: 'lower-limb' },
  { id: 'left-shank', label: 'Left shank', parentId: 'left-thigh', region: 'lower-limb' },
  { id: 'left-foot', label: 'Left foot', parentId: 'left-shank', region: 'lower-limb' },
  { id: 'right-thigh', label: 'Right thigh', parentId: 'pelvis', region: 'lower-limb' },
  { id: 'right-shank', label: 'Right shank', parentId: 'right-thigh', region: 'lower-limb' },
  { id: 'right-foot', label: 'Right foot', parentId: 'right-shank', region: 'lower-limb' },
  { id: 'left-upper-arm', label: 'Left upper arm', parentId: 'trunk', region: 'upper-limb' },
  { id: 'left-forearm', label: 'Left forearm', parentId: 'left-upper-arm', region: 'upper-limb' },
  { id: 'left-hand', label: 'Left hand', parentId: 'left-forearm', region: 'upper-limb' },
  { id: 'right-upper-arm', label: 'Right upper arm', parentId: 'trunk', region: 'upper-limb' },
  { id: 'right-forearm', label: 'Right forearm', parentId: 'right-upper-arm', region: 'upper-limb' },
  { id: 'right-hand', label: 'Right hand', parentId: 'right-forearm', region: 'upper-limb' },
]

export const BIOMECHANICS_REFERENCE_NOTES = [
  'Force: F = m·a; for a vertical external load model use F = m_eff·(g + a).',
  'External joint moment: τ = r × F; use the perpendicular distance from the joint center to the external force line.',
  'Rotational work: W = τ·θ. Rotational power: P = τ·ω.',
  'Impulse: J = ∫Fdt; for constant force in the teaching model J ≈ F·Δt.',
  'Patient-specific kinetics require synchronized kinematics plus force information and inverse-dynamics assumptions.',
] as const
