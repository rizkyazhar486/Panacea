export type DigestiveFlowPhase = 'upper' | 'small-bowel' | 'colon'

export interface DigestiveFlowVisualState {
  progress: number
  particleOpacity: number
  organEmphasis: number
}

const PERIOD_SECONDS: Readonly<Record<DigestiveFlowPhase, number>> = {
  upper: 7,
  'small-bowel': 9,
  colon: 11,
}

export function advanceDigestiveFlowTime(currentSeconds: number, deltaSeconds: number, running: boolean) {
  const current = Number.isFinite(currentSeconds) ? Math.max(0, currentSeconds) : 0
  const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0
  return running ? current + delta : current
}

export function digestiveFlowVisualState(elapsedSeconds: number, phase: DigestiveFlowPhase): DigestiveFlowVisualState {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0
  const period = PERIOD_SECONDS[phase]
  const progress = (safeElapsed / period) % 1
  const pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2)
  return {
    progress,
    particleOpacity: 0.42 + pulse * 0.4,
    organEmphasis: 0.18 + pulse * 0.24,
  }
}

export function digestiveVisualPeriodSeconds(phase: DigestiveFlowPhase) {
  return PERIOD_SECONDS[phase]
}
