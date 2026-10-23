/** Client-source provenance only: this does not validate device or clinical accuracy. */
export function workoutDurationSeconds(workout: unknown): number | null {
  if (!workout || typeof workout !== 'object') return null
  const w = workout as Record<string, unknown>
  const seconds = w.durasi
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return null
  if (w.durationSource === 'source_field') return seconds
  if (w.durationSource === 'timestamps') {
    if (typeof w.mulai !== 'string' || typeof w.selesai !== 'string') return null
    const start = Date.parse(w.mulai)
    const end = Date.parse(w.selesai)
    return Number.isFinite(start) && Number.isFinite(end) && end >= start
      && Math.round((end - start) / 1000) === seconds ? seconds : null
  }
  // Old caches cannot distinguish an absent duration from an explicitly recorded zero.
  if (w.durationSource === undefined && seconds > 0) return seconds
  return null
}
