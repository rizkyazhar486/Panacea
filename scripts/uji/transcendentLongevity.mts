// Test suite for Transcendent Longevity & Physiological Trajectory Modeling Engine
import { projectLongevityTrajectory } from '../../src/domains/clinical-operations/model/transcendentLongevityTrajectory.ts'

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (err: any) {
    console.log(`FAIL ${name}: ${err.message}`)
    throw err
  }
}

test('projectLongevityTrajectory generates valid multi-decade trajectory points', () => {
  const result = projectLongevityTrajectory({
    baselineChronologicalAge: 40,
    baselineBiologicalAge: 38,
    cardiorespiratoryFitnessScore: 42,
    metabolicFlexibilityIndex: 0.85,
    glycemicStabilityScore: 0.90,
    inflammationIndex: 0.5,
  })

  if (result.status !== 'valid') throw new Error('Expected valid trajectory status')
  if (result.trajectory.length !== 7) throw new Error(`Expected 7 trajectory points (0 to 30 years by 5s), got ${result.trajectory.length}`)
  if (result.trajectory[0].projectedChronologicalAge !== 40) throw new Error('First point chrono age mismatch')
})

test('projectLongevityTrajectory fails closed on invalid inputs', () => {
  const result = projectLongevityTrajectory({
    baselineChronologicalAge: -5,
    baselineBiologicalAge: 40,
    cardiorespiratoryFitnessScore: 30,
    metabolicFlexibilityIndex: 0.5,
    glycemicStabilityScore: 0.5,
    inflammationIndex: 1.0,
  })

  if (result.status !== 'fail-closed') throw new Error('Expected fail-closed status for negative age')
  if (result.trajectory.length !== 0) throw new Error('Expected empty trajectory on fail-closed')
})
