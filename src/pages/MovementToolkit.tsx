import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { kunciHari, hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconRun } from '../components/icons'
import { getDemoTersimpan } from '../lib/profile'
import { zone2HeartRate, validateGripKg, parseNumberField } from '../domains/clinical-calculators'
import { ScoreTrend } from '../components/ScoreTrend'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'

// ─────────────────────────────────────────────────────────────────────────────
// Movement Longevity Toolkit — five small real tools bundled into one page:
// grip strength trend (a genuine longevity biomarker), a one-leg balance
// test timer, a Zone 2 cardio heart-rate range calculator, a random
// micro-workout generator, and a 30-day squat streak counter. Pure
// client-side math/state, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'grip' | 'balance' | 'zone2' | 'micro' | 'squats'

function GripStrength() {
  // Teks mentah: tanpa nilai awal (30 kg bawaan dulu bisa tersimpan sebagai pengukuran di grafik tren).
  const [kgText, setKgText] = useState('')
  const grip = validateGripKg(parseNumberField(kgText))
  return (
    <>
      <Card className="!p-5">
        <Prosa kelas="text-[13px] leading-relaxed text-neutral-500">Grip strength is one of the simplest, most consistently reproduced markers of healthy aging — measure it with a hand dynamometer if you have one.</Prosa>
        <Field label="Grip strength (kg)">
          <input className={`${inputClass} mt-1`} type="number" min={0} max={100} value={kgText} onChange={(e) => setKgText(e.target.value)} />
        </Field>
        {kgText.trim() !== '' && !grip.ok && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600">{grip.reason}.</p>}
      </Card>
      {grip.ok ? (
        <ScoreTrend storageKey="pmd_grip_strength_v1" scoreName="Grip Strength" total={grip.kg} maxScore={80} detail={`${grip.kg} kg`} />
      ) : (
        <p className="px-1 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">Enter a measured grip strength to log a reading. Nothing is pre-filled, because a saved value becomes part of your trend.</p>
      )}
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
      <p className="mt-3 text-[12px] text-neutral-500">Best: {best}s · under ~10s at midlife is worth mentioning to a clinician</p>
    </Card>
  )
}

function Zone2Checker() {
  // Profil TERSIMPAN, bukan getDemo(): getDemo() mengisi usia 30 bawaan sehingga rentang bpm tampil untuk orang yang belum
  // mengisi usia. Teks mentah: kolom kosong = belum diisi, bukan usia 0.
  const tersimpan = getDemoTersimpan().age
  const [ageText, setAgeText] = useState(() => (typeof tersimpan === 'number' && tersimpan > 0 ? String(tersimpan) : ''))
  // HRmaks memakai Tanaka, Monahan & Seals (2001), J Am Coll Cardiol 37(1):153-6
  // (208 - 0,7 x usia) — 220 - usia meleset makin jauh pada usia lanjut.
  // Batas zona 2 = 60-70% HRmaks mengikuti ACSM (Garber et al., 2011).
  const zone = zone2HeartRate(parseNumberField(ageText))
  return (
    <Card className="!p-5">
      <Field label="Age">
        <input className={inputClass} type="number" min={10} max={100} value={ageText} onChange={(e) => setAgeText(e.target.value)} />
      </Field>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        {zone.ok ? (
          <>
            <div className="text-2xl font-black text-brand-dark">{zone.lower}-{zone.upper} bpm</div>
            <div className="text-[11px] text-neutral-500">Estimated Zone 2 range (60-70% of estimated max HR, Tanaka: 208 − 0.7 × age)</div>
          </>
        ) : (
          <div role={ageText.trim() === '' ? undefined : 'alert'} className="text-[12.5px] font-semibold text-neutral-600 dark:text-neutral-300">{ageText.trim() === '' ? 'Enter your age to see an estimated range.' : `${zone.reason}.`}</div>
        )}
      </div>
      <Prosa kelas="mt-3 text-[12px] leading-relaxed text-neutral-500">Zone 2 is light cardio at a pace that still allows conversation — a practical field check: you can still breathe comfortably through your nose. This is the foundation of most endurance training and metabolic health, not a "no pain no gain" zone.</Prosa>
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
  const today = hariIni()
  const total = Object.values(days).reduce((a, b) => a + b, 0)
  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = kunciHari(d)
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
        <BatasKlaimKesehatan permukaan="longevity.movement-toolkit" />
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

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Educational self-tracking, not a fitness assessment by a professional — stop any exercise that
        causes pain and check with a clinician if you have an existing injury or condition.
      </div>
    </div>
  )
}

export default MovementToolkit
