import { workoutDurationSeconds } from '../../../shared/kernel/workoutDurationEvidence'
import { loggedSubtotal } from './loggedCalories'

/** Eight rolling seven-day bins, preserving unknown durations and explicit zero. */
export function weeklyWorkoutDurations(workouts: readonly unknown[], now = Date.now()) {
  return Array.from({ length: 8 }, (_, index) => {
    const end = now - (7 - index) * 7 * 864e5
    const start = end - 7 * 864e5
    const values: unknown[] = []
    if (Number.isFinite(now) && Number.isFinite(new Date(now).getTime())) {
      for (const workout of workouts) {
        if (!workout || typeof workout !== 'object' || !('mulai' in workout) || typeof workout.mulai !== 'string') continue
        const time = Date.parse(workout.mulai)
        if (!Number.isFinite(time) || time <= start || time > end) continue
        const seconds = workoutDurationSeconds(workout)
        values.push(seconds === null ? undefined : seconds / 60)
      }
    }
    return loggedSubtotal(values)
  })
}
