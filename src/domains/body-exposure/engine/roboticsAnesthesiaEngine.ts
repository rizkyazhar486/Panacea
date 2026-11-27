/**
 * PanaceaMed OS — Educational Surgical Robotics, Distant Telesurgery & Anesthesia Physiology Engine.
 *
 * Strictly sandboxed educational simulation (Constitutional Law I, Sections XIX–XXI):
 * - NEVER connects to live surgical robots, medical actuators, or patient infusion pumps.
 * - NEVER generates patient-specific drug dosing or clinical procedural authorization.
 */

export const ROBOTICS_ANESTHESIA_BOUNDARY = {
  epistemicClass: 'EDUCATIONAL_SANDBOX_ONLY',
  liveActuatorConnected: false,
  clinicallyAuthorizedDosing: false,
  disclaimer:
    'Isolated educational simulation for studying surgical kinematics, telesurgery latency hazards, and conceptual anesthesia physiology. Not for patient care, robot control, or drug dosing.',
} as const

export interface RoboticsInput {
  readonly pitchDeg: number
  readonly yawDeg: number
  readonly insertionMm: number
  readonly wristPitchDeg: number
  readonly jawOpenPct: number
  readonly motionScale: 1 | 3 | 5
  readonly tissueResistanceN: number
}

export interface RoboticsKinematicsState {
  readonly tipPositionMm: { readonly x: number; readonly y: number; readonly z: number }
  readonly scaledSpeedFactor: number
  readonly workspaceInBounds: boolean
  readonly forceWarning: boolean
  readonly forceLimitN: number
  readonly automatedSutureWaypoints: readonly { readonly step: number; readonly xMm: number; readonly yMm: number; readonly zMm: number }[]
}

export function computeRoboticsKinematics(input: RoboticsInput): RoboticsKinematicsState {
  const pitch = Math.max(-55, Math.min(55, input.pitchDeg)) * (Math.PI / 180)
  const yaw = Math.max(-65, Math.min(65, input.yawDeg)) * (Math.PI / 180)
  const depth = Math.max(20, Math.min(220, input.insertionMm))
  const wrist = Math.max(-70, Math.min(70, input.wristPitchDeg)) * (Math.PI / 180)
  const wristLen = 14

  // Remote Center of Motion (RCM) spherical trocar kinematics + articulated endo-wrist offset
  const baseX = depth * Math.sin(yaw) * Math.cos(pitch)
  const baseY = -depth * Math.cos(yaw) * Math.cos(pitch)
  const baseZ = depth * Math.sin(pitch)

  const x = Math.round((baseX + wristLen * Math.sin(wrist)) * 10) / 10
  const y = Math.round((baseY - wristLen * Math.cos(wrist)) * 10) / 10
  const z = Math.round(baseZ * 10) / 10

  const radialMm = Math.hypot(x, y, z)
  const workspaceInBounds = radialMm <= 235 && depth >= 25
  const forceLimitN = 4.5
  const forceWarning = input.tissueResistanceN > forceLimitN

  // Sandboxed educational 8-point semicircular suture arc around current tip
  const automatedSutureWaypoints = Array.from({ length: 8 }, (_, idx) => {
    const theta = (idx / 7) * Math.PI
    return {
      step: idx + 1,
      xMm: Math.round((x + 8 * Math.cos(theta)) * 10) / 10,
      yMm: Math.round((y - 6 * Math.sin(theta)) * 10) / 10,
      zMm: z,
    }
  })

  return {
    tipPositionMm: { x, y, z },
    scaledSpeedFactor: Number((1 / input.motionScale).toFixed(2)),
    workspaceInBounds,
    forceWarning,
    forceLimitN,
    automatedSutureWaypoints,
  }
}

export interface TelesurgeryLinkInput {
  readonly roundTripLatencyMs: number
  readonly jitterMs: number
  readonly packetLossPct: number
  readonly manualEmergencyStop?: boolean
}

export interface TelesurgeryLinkStatus {
  readonly state: 'NOMINAL' | 'DEGRADED_CAUTION' | 'SAFE_HOLD_ESTOP'
  readonly estimatedTrackingLagMm: number
  readonly safeHoldTriggered: boolean
  readonly reason: string
}

export function simulateTelesurgeryLink(input: TelesurgeryLinkInput): TelesurgeryLinkStatus {
  const rtt = Math.max(0, Math.min(1000, input.roundTripLatencyMs))
  const jitter = Math.max(0, Math.min(200, input.jitterMs))
  const loss = Math.max(0, Math.min(100, input.packetLossPct))

  // Assuming nominal 25 mm/s console velocity -> lag displacement proportional to one-way + jitter + loss penalty
  const estimatedTrackingLagMm = Math.round(((rtt / 2 + jitter * 1.5) * 0.025 + loss * 0.35) * 10) / 10

  if (input.manualEmergencyStop) {
    return {
      state: 'SAFE_HOLD_ESTOP',
      estimatedTrackingLagMm,
      safeHoldTriggered: true,
      reason: 'Manual virtual emergency stop engaged — arms locked in safe hold.',
    }
  }
  if (rtt > 250 || loss > 5 || jitter > 45) {
    return {
      state: 'SAFE_HOLD_ESTOP',
      estimatedTrackingLagMm,
      safeHoldTriggered: true,
      reason: `Automatic virtual E-Stop triggered (RTT ${rtt}ms / Jitter ${jitter}ms / Loss ${loss}%) exceeding safe telesurgery envelope.`,
    }
  }
  if (rtt > 120 || loss > 1.5 || jitter > 20) {
    return {
      state: 'DEGRADED_CAUTION',
      estimatedTrackingLagMm,
      safeHoldTriggered: false,
      reason: 'Noticeable visual-motor delay; reduce motion scaling to 5:1 in simulation.',
    }
  }
  return {
    state: 'NOMINAL',
    estimatedTrackingLagMm,
    safeHoldTriggered: false,
    reason: 'Isolated simulated link within nominal educational feedback threshold.',
  }
}

export type AnesthesiaModality = 'general' | 'local_regional'

export interface AnesthesiaInput {
  readonly modality: AnesthesiaModality
  /** General: conceptual MAC fraction 0.0–2.0; Local/Regional: conceptual Na+ channel blockade 0–100% */
  readonly depthLevel: number
  readonly surgicalStimulus01: number
  readonly regionalLevel?: 'brachial_plexus' | 'neuraxial_T10' | 'neuraxial_T4'
}

export interface AnesthesiaPhysiologyFrame {
  readonly modality: AnesthesiaModality
  readonly epistemicClass: 'EDUCATIONAL_SANDBOX_ONLY'
  readonly mapMmHg: number
  readonly hrBpm: number
  readonly rrPerMin: number
  readonly spo2Pct: number
  readonly etco2MmHg: number
  readonly conceptualBisIndex: number
  readonly tofRatioPct: number
  readonly fiberBlockade: {
    readonly autonomicSympatheticPct: number
    readonly cFiberPainPct: number
    readonly aDeltaTempPct: number
    readonly aBetaTouchPct: number
    readonly aAlphaMotorPct: number
  }
  readonly airwayReflex: 'INTACT' | 'BLUNTED' | 'ABOLISHED_CONTROLLED_VENT'
  readonly warningFlag: string | null
}

export function simulateAnesthesiaPhysiology(input: AnesthesiaInput): AnesthesiaPhysiologyFrame {
  const stim = Math.max(0, Math.min(1, input.surgicalStimulus01))

  if (input.modality === 'general') {
    const mac = Math.max(0, Math.min(2.0, input.depthLevel))
    const mapMmHg = Math.round(Math.max(46, Math.min(130, 88 - mac * 22 + stim * (14 * Math.max(0.2, 1.3 - mac)))))
    const hrBpm = Math.round(Math.max(42, Math.min(135, 72 - mac * 7 + stim * (22 * Math.max(0.15, 1.2 - mac)))))
    const rrPerMin = mac >= 1.0 ? 12 : Math.round(Math.max(6, 15 - mac * 6))
    const etco2MmHg = Math.round(Math.max(30, Math.min(58, 37 + mac * 6.5 - (mac >= 1.0 ? 3 : 0))))
    const spo2Pct = mac > 1.75 ? 95 : 99
    const conceptualBisIndex = Math.round(Math.max(18, Math.min(98, 96 - mac * 44 + stim * 6)))
    const tofRatioPct = mac >= 0.9 ? Math.round(Math.max(0, 100 - mac * 65)) : 100
    const airwayReflex = mac >= 0.95 ? 'ABOLISHED_CONTROLLED_VENT' : mac >= 0.4 ? 'BLUNTED' : 'INTACT'
    let warningFlag: string | null = null
    if (mapMmHg < 60) warningFlag = 'Conceptual hypotension alert (MAP < 60 mmHg — excessive vasodilatory depth).'
    else if (mac < 0.7 && stim > 0.6) warningFlag = 'Conceptual light-anesthesia autonomic surge (HR/MAP elevated).'

    return {
      modality: 'general',
      epistemicClass: 'EDUCATIONAL_SANDBOX_ONLY',
      mapMmHg,
      hrBpm,
      rrPerMin,
      spo2Pct,
      etco2MmHg,
      conceptualBisIndex,
      tofRatioPct,
      fiberBlockade: { autonomicSympatheticPct: Math.round(mac * 35), cFiberPainPct: Math.round(Math.min(100, mac * 75)), aDeltaTempPct: Math.round(Math.min(100, mac * 70)), aBetaTouchPct: Math.round(Math.min(100, mac * 60)), aAlphaMotorPct: Math.round(Math.min(100, (100 - tofRatioPct))) },
      airwayReflex,
      warningFlag,
    }
  }

  // Local / Regional / Neuraxial Na+-channel blockade conceptual model
  const pct = Math.max(0, Math.min(100, input.depthLevel))
  const level = input.regionalLevel ?? 'neuraxial_T10'
  // Differential nerve fiber sensitivity: Sympathetic B -> C (pain) -> A-delta (temp) -> A-beta (touch) -> A-alpha (motor)
  const autonomicSympatheticPct = Math.round(Math.min(100, pct * 1.15))
  const cFiberPainPct = Math.round(Math.min(100, pct * 1.05))
  const aDeltaTempPct = Math.round(Math.min(100, pct * 0.96))
  const aBetaTouchPct = Math.round(Math.min(100, pct * 0.78))
  const aAlphaMotorPct = Math.round(Math.min(100, pct * 0.62))

  const sympathectomyDrop = level === 'neuraxial_T4' ? 24 : level === 'neuraxial_T10' ? 12 : 2
  const mapMmHg = Math.round(Math.max(52, 88 - (autonomicSympatheticPct / 100) * sympathectomyDrop))
  const hrBpm = Math.round(level === 'neuraxial_T4' ? Math.max(48, 72 - (autonomicSympatheticPct / 100) * 18) : 74)
  const warningFlag =
    level === 'neuraxial_T4' && pct >= 70
      ? 'High thoracic (T4) cardioaccelerator fiber block: conceptual bradycardia & sympathectomy MAP drop.'
      : null

  return {
    modality: 'local_regional',
    epistemicClass: 'EDUCATIONAL_SANDBOX_ONLY',
    mapMmHg,
    hrBpm,
    rrPerMin: 14,
    spo2Pct: 99,
    etco2MmHg: 37,
    conceptualBisIndex: 95,
    tofRatioPct: 100,
    fiberBlockade: { autonomicSympatheticPct, cFiberPainPct, aDeltaTempPct, aBetaTouchPct, aAlphaMotorPct },
    airwayReflex: 'INTACT',
    warningFlag,
  }
}
