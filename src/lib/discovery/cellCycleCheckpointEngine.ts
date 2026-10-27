// src/lib/discovery/cellCycleCheckpointEngine.ts
// PanaceaMed T-CLIN-76: Eden Cell Cycle Phase Dynamics & CDK-Cyclin Checkpoint Transition Synthesizer

export type CellCyclePhase = 'G0_QUIESCENCE' | 'G1_EARLY' | 'G1_LATE' | 'S_SYNTHESIS' | 'G2_PROOFREADING' | 'M_MITOSIS'

export type CheckpointStatus = 'PASSED' | 'ARRESTED' | 'CHECKING'

export interface CyclinCdkComplexActivity {
  cyclinD_Cdk4_6: number // 0.0 - 1.0 (Arbitrary units)
  cyclinE_Cdk2: number // 0.0 - 1.0
  cyclinA_Cdk2: number // 0.0 - 1.0
  cyclinB_Cdk1: number // 0.0 - 1.0 (Mitosis Promoting Factor)
  p21_Cip1_level: number // 0.0 - 1.0 (CDK inhibitor)
  p53_Ser15_phosphorylated: boolean
}

export interface CellCycleStateSnapshot {
  phase: CellCyclePhase
  fractionalProgress: number // 0.0 - 1.0 within current phase
  restrictionPointPassed: boolean
  replicationForksLicensed: number // 0 - 50000 per diploid genome
  dnaDoubleStrandBreaksDetected: number
  spindleKinetochoreTensionRatio: number // 0.0 - 1.0
  e2fReleaseFraction: number // 0.0 - 1.0
  g1_s_checkpoint: CheckpointStatus
  g2_m_checkpoint: CheckpointStatus
  spindle_assembly_checkpoint: CheckpointStatus
  mitoticExitCompetent: boolean
  truthClass: 'mechanistic_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

export interface CellCycleSimulationInput {
  mitogenLevel?: number // 0.0 - 1.0 (e.g. EGF, serum)
  dnaDamageDsbCount?: number // integer count of double strand breaks
  wee1KinaseActivity?: number // 0.0 - 1.0
  cdc25PhosphataseActivity?: number // 0.0 - 1.0
  kinetochoreUnattachedCount?: number // integer unattached chromosomes
  p53Functional?: boolean
  initialPhase?: CellCyclePhase
}

/**
 * Hill function for ultra-sensitive switch behavior at the Restriction Point R.
 */
export function calculateE2fRelease(cdk4_6_activity: number, p21_level: number, hillCoeff = 3.5, kHalf = 0.45): number {
  const effectiveCdk = Math.max(0, cdk4_6_activity * (1.0 - Math.min(1.0, p21_level)))
  const num = Math.pow(effectiveCdk, hillCoeff)
  const den = Math.pow(kHalf, hillCoeff) + num
  return den === 0 ? 0 : Number((num / den).toFixed(4))
}

/**
 * Calculates Mitosis-Promoting Factor (MPF = Cyclin B-CDK1) activation balance.
 */
export function calculateMpfActivity(
  cyclinB_level: number,
  cdc25_activity: number,
  wee1_activity: number
): number {
  const netActivation = cdc25_activity - 0.75 * wee1_activity
  const scaled = cyclinB_level * Math.max(0, 0.5 + netActivation * 0.5)
  return Number(Math.min(1.0, Math.max(0.0, scaled)).toFixed(4))
}

/**
 * Evaluates the cell cycle state across G0 -> G1 -> S -> G2 -> M checkpoints.
 */
export function evaluateCellCycleCheckpoints(input: CellCycleSimulationInput = {}): CellCycleStateSnapshot {
  const mitogen = input.mitogenLevel ?? 0.8
  const dsbs = Math.max(0, input.dnaDamageDsbCount ?? 0)
  const wee1 = input.wee1KinaseActivity ?? 0.3
  const cdc25 = input.cdc25PhosphataseActivity ?? 0.8
  const unattached = Math.max(0, input.kinetochoreUnattachedCount ?? 0)
  const p53_ok = input.p53Functional ?? true
  const initialPhase = input.initialPhase ?? 'G1_EARLY'

  // 1. p53-p21 DNA damage pathway
  const p53_activated = dsbs > 0 && p53_ok
  const p21_induction = p53_activated ? Math.min(1.0, 0.2 + dsbs * 0.15) : 0.05

  // 2. Cyclin-CDK network
  const cdk4_6 = Math.min(1.0, mitogen * 1.1)
  const e2f = calculateE2fRelease(cdk4_6, p21_induction)
  const cdk2_cycE = Number((e2f * 0.95).toFixed(4))
  const cdk2_cycA = Number((e2f * 0.9).toFixed(4))
  const mpf = calculateMpfActivity(0.9, cdc25, wee1)

  // 3. Checkpoints
  const g1_s_checkpoint: CheckpointStatus =
    dsbs >= 5 && p53_ok ? 'ARRESTED' : e2f >= 0.55 ? 'PASSED' : 'CHECKING'

  const g2_m_checkpoint: CheckpointStatus =
    dsbs >= 3 && p53_ok ? 'ARRESTED' : mpf >= 0.65 ? 'PASSED' : 'CHECKING'

  const spindle_tension = unattached === 0 ? 1.0 : Math.max(0.0, 1.0 - unattached * 0.2)
  const spindle_assembly_checkpoint: CheckpointStatus =
    unattached === 0 ? 'PASSED' : 'ARRESTED'

  // 4. Dynamic Phase Resolution
  let phase: CellCyclePhase = initialPhase
  let progress = 0.5
  let restrictionPassed = false
  let licensedForks = 0

  if (mitogen < 0.15) {
    phase = 'G0_QUIESCENCE'
    progress = 0.1
    restrictionPassed = false
  } else if (g1_s_checkpoint === 'ARRESTED') {
    phase = 'G1_LATE'
    progress = 0.95
    restrictionPassed = false
  } else if (g1_s_checkpoint === 'PASSED' && initialPhase === 'G1_EARLY') {
    phase = 'G1_LATE'
    progress = 0.7
    restrictionPassed = true
  } else if (initialPhase === 'S_SYNTHESIS') {
    phase = 'S_SYNTHESIS'
    restrictionPassed = true
    licensedForks = Math.max(0, 30000 - dsbs * 2000)
    progress = 0.6
  } else if (initialPhase === 'G2_PROOFREADING') {
    if (g2_m_checkpoint === 'ARRESTED') {
      phase = 'G2_PROOFREADING'
      progress = 0.98
    } else {
      phase = 'G2_PROOFREADING'
      progress = 0.85
    }
    restrictionPassed = true
  } else if (initialPhase === 'M_MITOSIS') {
    phase = 'M_MITOSIS'
    restrictionPassed = true
    progress = spindle_assembly_checkpoint === 'PASSED' ? 0.9 : 0.5
  }

  const mitoticExit = phase === 'M_MITOSIS' && spindle_assembly_checkpoint === 'PASSED'

  return {
    phase,
    fractionalProgress: Number(progress.toFixed(3)),
    restrictionPointPassed: restrictionPassed,
    replicationForksLicensed: licensedForks,
    dnaDoubleStrandBreaksDetected: dsbs,
    spindleKinetochoreTensionRatio: Number(spindle_tension.toFixed(3)),
    e2fReleaseFraction: e2f,
    g1_s_checkpoint,
    g2_m_checkpoint,
    spindle_assembly_checkpoint,
    mitoticExitCompetent: mitoticExit,
    truthClass: 'mechanistic_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
  }
}
