export const MEDICAL_4D_DURATION = 12

export function advanceMedicalTime(time: number, delta: number, speed: number, playing: boolean): number {
  if (![time, delta, speed].every(Number.isFinite)) throw new Error('Timeline values must be finite')
  const current = Math.max(0, Math.min(MEDICAL_4D_DURATION, time))
  if (!playing) return current
  return Math.min(MEDICAL_4D_DURATION, current + Math.max(0, Math.min(0.1, delta)) * Math.max(0, Math.min(2, speed)))
}

export function flowParticlePhase(time: number, offset: number, velocity: number): number {
  if (![time, offset, velocity].every(Number.isFinite)) throw new Error('Particle values must be finite')
  return ((offset + Math.max(0, time) * 0.13 * Math.max(0, velocity)) % 1 + 1) % 1
}

export function medicalCameraDistance(radius: number, aspect: number, verticalFov: number): number {
  if (![radius, aspect, verticalFov].every(Number.isFinite) || radius <= 0 || aspect <= 0 || verticalFov <= 0 || verticalFov >= 180) {
    throw new Error('Invalid camera bounds')
  }
  const halfVertical = verticalFov * Math.PI / 360
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect)
  return 1.12 * radius / Math.sin(Math.min(halfVertical, halfHorizontal))
}
