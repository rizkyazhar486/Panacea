import type { ImportedWorkout } from '../../../lib/workoutImport.ts'
import type { RankedWorkoutEvidence } from '../../../lib/seasonalHealthSportRank.ts'
import { workoutDurationSeconds } from '../../../shared/kernel/workoutDurationEvidence.ts'

/** Both rank projections require usable source-aware elapsed time; storage stays unchanged. */
export function rankedWorkoutsFromStored(workouts: readonly ImportedWorkout[]): RankedWorkoutEvidence[] {
  return workouts.flatMap((workout) => {
    const duration = workoutDurationSeconds(workout)
    if (duration === null || duration <= 0) return []
    return [{
      id: workout.id,
      startedAt: workout.mulai,
      durationMinutes: duration / 60,
      activeKcal: typeof workout.kcal === 'number' ? workout.kcal : undefined,
      avgHr: typeof workout.avgHr === 'number' ? workout.avgHr : undefined,
      maxHr: typeof workout.maxHr === 'number' ? workout.maxHr : undefined,
      paceSecondsPerKm: typeof workout.paceSec === 'number' ? workout.paceSec : undefined,
      speedKmh: typeof workout.kecepatanKmh === 'number' ? workout.kecepatanKmh : undefined,
      rpe: typeof workout.rpe === 'number' ? workout.rpe : undefined,
    }]
  })
}
