export type RespiratoryFlowPhase = 'inspiration' | 'exchange' | 'expiration'

export interface RespiratoryFlowVisualState {
  phase: RespiratoryFlowPhase
  progress: number
  direction: -1 | 0 | 1
  particleOpacity: number
  lungEmphasis: number
}

function wrap01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return ((value % 1) + 1) % 1
}

export function respiratoryFlowVisualState(
  elapsedSeconds: number,
  phase: RespiratoryFlowPhase,
  speed = 0.14,
): RespiratoryFlowVisualState {
  const safeSpeed = Number.isFinite(speed) ? Math.min(0.5, Math.max(0.02, speed)) : 0.14
  const t = wrap01((Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0) * safeSpeed)

  if (phase === 'exchange') {
    const pulse = 0.5 - 0.5 * Math.cos(t * Math.PI * 2)
    return {
      phase,
      progress: t,
      direction: 0,
      particleOpacity: 0.08,
      lungEmphasis: 0.18 + pulse * 0.32,
    }
  }

  return {
    phase,
    progress: phase === 'inspiration' ? t : 1 - t,
    direction: phase === 'inspiration' ? 1 : -1,
    particleOpacity: 0.78,
    lungEmphasis: phase === 'inspiration' ? 0.22 : 0.14,
  }
}
