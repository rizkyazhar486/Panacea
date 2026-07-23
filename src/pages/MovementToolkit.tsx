import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconRun } from '../components/icons'
import { getDemo } from '../lib/profile'
import { ScoreTrend } from '../components/ScoreTrend'

// ─────────────────────────────────────────────────────────────────────────────
// Movement Longevity Toolkit — five small real tools bundled into one page:
// grip strength trend (a genuine longevity biomarker), a one-leg balance
// test timer, a Zone 2 cardio heart-rate range calculator, a random
// micro-workout generator, and a 30-day squat streak counter. Pure
// client-side math/state, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'grip' | 'balance' | 'zone2' | 'micro' | 'squats'

function GripStrength() {
  const [kg, setKg] = useState(30)
  return (
    <>
      <Card className="!p-5">
        <p className="text-[13px] leading-relaxed text-neutral-500">
          Grip strength is one of the most-replicated simple predictors of healthy aging — measure with
          a hand dynamometer if you have one, or note your gym's grip-strength machine reading.
        </p>
        <Field label="Grip strength (kg)">
          <input className={`${inputClass} mt-1`} type="number" min={0} max={100} value={kg} onChange={(e) => setKg(Number(e.target.value) || 0)} />
        </Field>
      </Card>
      <ScoreTrend storageKey="pmd_grip_strength_v1" scoreName="Grip Strength" total={kg} maxScore={80} detail={`${kg} kg`} />
    </>
  )
}

const BALANCE_KEY = 'pmd_balance_test_v1'
function BalanceTest() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BALANCE_KEY) || 0))
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  const stop = () => {
    setRunning(false)
    if (seconds > best) { setBest(seconds); try { localStorage.setItem(BALANCE_KEY, String(seconds)) } catch { /* ignore */ } }
  }
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Stand on one leg, eyes open. Start the timer, stop it when you touch down or lose balance.</p>
      <div className="mt-3 text-5xl font-black tabular-nums text-brand-dark">{seconds}s</div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => (running ? stop() : setRunning(true))} className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${running ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-brand text-white'}`}>{running ? 'Stop' : 'Start'}</button>
        <button onClick={() => { setSeconds(0); setRunning(false) }} className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-bold text-neutral-500 dark:bg-white/10">Reset</button>
      </div>
      <p className="mt-3 text-[12px] text-neutral-400">Best: {best}s · under ~10s at midlife is worth mentioning to a clinician</p>
    </Card>
  )
}

function Zone2Checker() {
  const [age, setAge] = useState(() => getDemo().age || 30)
  const lower = Math.round((220 - age) * 0.6)
  const upper = Math.round((220 - age) * 0.7)
  return (
    <Card className="!p-5">
      <Field label="Age">
        <input className={inputClass} type="number" min={10} max={100} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
      </Field>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{lower}-{upper} bpm</div>
        <div className="text-[11px] text-neutral-500">Estimated Zone 2 range (60-70% of 220−age)</div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        Zone 2 is easy, conversational-pace cardio — a practical field check is that you can breathe
        comfortably through your nose. It's the base of most endurance and metabolic-health training,
        not the "no pain no gain" zone.
      </p>
    </Card>
  )
}

const MICRO_WORKOUTS = [
  '15 bodyweight squats', '10 push-ups (knees if needed)', '30-second plank', '15 walking lunges each leg',
  '20 jumping jacks', '10 burpees', '30-second wall sit', '15 glute bridges', '1-minute high knees', '10 tricep dips (using a chair)',
]
function MicroWorkout() {
  const [pick, setPick] = useState<string | null>(null)
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Stuck at a desk? Get one random 1-2 minute movement break.</p>
      <button onClick={() => setPick(MICRO_WORKOUTS[Math.floor(Math.random() * MICRO_WORKOUTS.length)])} className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">Give me a micro-workout</button>
      {pick && <div className="mt-4 rounded-xl bg-brand/10 p-4 text-lg font-black text-brand-dark">{pick}</div>}
    </Card>
  )
}

const SQUAT_KEY = 'pmd_squat_challenge_v1'
function SquatChallenge() {
  const [days, setDays] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem(SQUAT_KEY) || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem(SQUAT_KEY, JSON.stringify(days)) } catch { /* ignore */ } }, [days])
  const today = new Date().toISOString().slice(0, 10)
  const total = Object.values(days).reduce((a, b) => a + b, 0)
  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (days[key] > 0) s++
      else break
    }
    return s
  }, [days])
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">30-day squat challenge — log today's reps.</p>
      <div className="mt-3 flex items-end gap-2">
        <Field label="Reps done today">
          <input className={inputClass} type="number" min={0} max={500} value={days[today] || ''} onChange={(e) => setDays((d) => ({ ...d, [today]: Number(e.target.value) || 0 }))} placeholder="0" />
        </Field>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-brand/10 p-3"><div className="text-xl font-black text-brand-dark">{streak}</div><div className="text-[11px] text-neutral-500">Day streak</div></div>
        <div className="rounded-xl bg-brand/10 p-3"><div className="text-xl font-black text-brand-dark">{total}</div><div className="text-[11px] text-neutral-500">Total reps logged</div></div>
      </div>
      {days[today] > 0 && <Badge tone="brand">✓ Logged today</Badge>}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'grip', label: 'Grip Strength' },
  { id: 'balance', label: 'Balance Test' },
  { id: 'zone2', label: 'Zone 2 Cardio' },
  { id: 'micro', label: 'Micro-Workout' },
  { id: 'squats', label: 'Squat Challenge' },
]

export function MovementToolkit() {
  const [tab, setTab] = useState<Tab>('grip')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Movement Longevity Toolkit" subtitle="Five small, real movement tools in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'grip' && <GripStrength />}
      {tab === 'balance' && <BalanceTest />}
      {tab === 'zone2' && <Zone2Checker />}
      {tab === 'micro' && <MicroWorkout />}
      {tab === 'squats' && <SquatChallenge />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational self-tracking, not a fitness assessment by a professional — stop any exercise that
        causes pain and check with a clinician if you have an existing injury or condition.
      </div>
    </div>
  )
}

export default MovementToolkit
