// Achievement conditions are plain arithmetic over a real, already-logged
// workout array — this checks that arithmetic, and that a popup fires only
// once per condition (newlyUnlocked), never fabricating progress.
const simpanan = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => simpanan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpanan.set(k, v) },
  removeItem: (k: string) => { simpanan.delete(k) },
}

const { evaluateWorkoutAchievements, evaluateAthleteAchievements, newlyUnlocked } = await import('../../src/lib/achievements.ts')

const chk = (n: string, c: boolean, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x)

function log(entries: { date: string; sets: number; reps: number; weight: number }[]) { return entries }

{
  const empty = evaluateWorkoutAchievements([])
  chk('no logged sets unlocks nothing', empty.length === 0)
}

{
  const one = evaluateWorkoutAchievements(log([{ date: '2026-09-01', sets: 3, reps: 10, weight: 0 }]))
  chk('a single logged set unlocks First Blood', one.some((a) => a.id === 'first-blood'))
  chk('a single day does not unlock Iron Week', !one.some((a) => a.id === 'iron-week'))
}

{
  const threeDays = evaluateWorkoutAchievements(log([
    { date: '2026-09-01', sets: 3, reps: 10, weight: 0 },
    { date: '2026-09-02', sets: 3, reps: 10, weight: 0 },
    { date: '2026-09-03', sets: 3, reps: 10, weight: 0 },
  ]))
  chk('three distinct training days unlocks Iron Week', threeDays.some((a) => a.id === 'iron-week'))
  chk('three distinct days does not yet unlock Relentless (needs seven)', !threeDays.some((a) => a.id === 'relentless'))
}

{
  const bigVolume = evaluateWorkoutAchievements(log([{ date: '2026-09-01', sets: 20, reps: 20, weight: 30 }]))
  chk('20*20*30=12,000 volume crosses the Ten Thousand threshold', bigVolume.some((a) => a.id === 'ten-thousand'))
}

{
  const noGap = evaluateWorkoutAchievements(log([
    { date: '2026-09-01', sets: 3, reps: 10, weight: 0 },
    { date: '2026-09-02', sets: 3, reps: 10, weight: 0 },
  ]))
  chk('consecutive days do not fabricate a comeback', !noGap.some((a) => a.id === 'the-rise'))

  const withGap = evaluateWorkoutAchievements(log([
    { date: '2026-09-01', sets: 3, reps: 10, weight: 0 },
    { date: '2026-09-06', sets: 3, reps: 10, weight: 0 },
  ]))
  chk('a real 5-day gap followed by a new log unlocks The Rise', withGap.some((a) => a.id === 'the-rise'))
}

{
  chk('VO2max tier Elite unlocks Elite Lungs', evaluateAthleteAchievements('Elite').some((a) => a.id === 'elite-lungs'))
  chk('VO2max tier Good unlocks nothing', evaluateAthleteAchievements('Good').length === 0)
}

{
  const candidates = evaluateWorkoutAchievements(log([{ date: '2026-09-01', sets: 3, reps: 10, weight: 0 }]))
  const firstPass = newlyUnlocked(candidates)
  chk('the first time a condition is true, it counts as newly unlocked', firstPass.some((a) => a.id === 'first-blood'))
  const secondPass = newlyUnlocked(candidates)
  chk('the same condition never fires a second popup', secondPass.length === 0)
}
