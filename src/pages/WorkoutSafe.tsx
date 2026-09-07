import { useState } from 'react'
import { repairWorkoutLogStorage, type WorkoutLogRepairResult } from '../lib/workoutLogGuard'
import { Workout } from './Workout'

function repairLocalWorkoutLog(): WorkoutLogRepairResult {
  try {
    return repairWorkoutLogStorage(window.localStorage)
  } catch {
    return { entries: [], repaired: false, dropped: 0 }
  }
}

/**
 * Compatibility boundary for legacy/local Workout history. The existing
 * Workout page remains untouched; persisted data is validated synchronously
 * before its useState(loadLog) initializer can read the key.
 */
export function WorkoutSafe() {
  const [repair] = useState(repairLocalWorkoutLog)

  return (
    <div className="space-y-3">
      {repair.repaired && (
        <p className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
          Workout history contained an older or invalid local record. Panacea kept a recoverable backup when storage allowed and excluded invalid entries instead of crashing the page{repair.dropped > 0 ? ` (${repair.dropped} entr${repair.dropped === 1 ? 'y' : 'ies'} excluded)` : ''}.
        </p>
      )}
      <Workout />
    </div>
  )
}

export default WorkoutSafe
