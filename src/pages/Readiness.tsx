import { useEffect, useMemo, useState } from 'react'
import { KolomAngka } from '../components/KolomAngka'
import { hariIni, hariLalu } from '../lib/tanggal'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconHeart, IconActivity, IconMoon, IconChartUp } from '../components/icons'
import { awal, awalBulat } from '../lib/nilaiAwal'
import { useVitals } from '../lib/useVitals'
import { mergeVitals } from '../lib/healthVitals'
import { mergeHealthCache } from '../lib/profile'

interface Workout { rpe: number; min: number }
interface DayLog {
  hrv?: number
  rhr?: number
  sleepH?: number
  sleepQ?: number
  behaviors: string[]
  workouts: Workout[]
}
type Store = Record<string, DayLog>

const KEY = 'pmd_readiness_v1'
const todayKey = () => hariIni()
const dayKey = (offset: number) => hariLalu(offset)

const BEHAVIORS = [
  { id: 'caffeine_late', label: '☕ Afternoon/evening caffeine' },
  { id: 'alcohol', label: '🍺 Alcohol' },
  { id: 'late_meal', label: '🍽️ Late meal (<2 hrs before bed)' },
  { id: 'screen_bed', label: '📱 Screen time in bed' },
  { id: 'stress_high', label: '😰 High stress' },
  { id: 'sick', label: '🤒 Sick / feeling unwell' },
  { id: 'travel', label: '✈️ Long-distance travel' },
  { id: 'meditation', label: '🧘 Meditation' },
  { id: 'reading', label: '📖 Read before bed' },
  { id: 'sauna_cold', label: '🧊 Sauna / cold plunge' },
] as const

function validPositive(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function normalizeDayLog(value: unknown): DayLog {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const workouts = Array.isArray(row.workouts)
    ? row.workouts.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const raw = item as Record<string, unknown>
        const rpe = validPositive(raw.rpe)
        const min = validPositive(raw.min)
        if (!rpe || !min || rpe > 10) return []
        return [{ rpe, min }]
      })
    : []
  const behaviors = Array.isArray(row.behaviors)
    ? row.behaviors.filter((item): item is string => typeof item === 'string' && BEHAVIORS.some((b) => b.id === item))
    : []
  const sleepQ = validPositive(row.sleepQ)
  return {
    hrv: validPositive(row.hrv),
    rhr: validPositive(row.rhr),
    sleepH: validPositive(row.sleepH),
    sleepQ: sleepQ && sleepQ <= 5 ? sleepQ : undefined,
    behaviors,
    workouts,
  }
}

function load(): Store {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .map(([date, value]) => [date, normalizeDayLog(value)]),
    )
  } catch {
    return {}
  }
}

function averagePrevious(store: Store, field: 'hrv' | 'rhr' | 'sleepH'): { value: number; count: number } | null {
  const values: number[] = []
  for (let i = 1; i <= 14; i++) {
    const value = store[dayKey(i)]?.[field]
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) values.push(value)
  }
  if (values.length < 3) return null
  return { value: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length }
}

function recordedLoad(workouts: Workout[]): number {
  return workouts.reduce((sum, workout) => sum + workout.rpe * workout.min, 0)
}

export function Readiness() {
  const [store, setStore] = useState<Store>(load)
  const vitals = useVitals()
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [wRpe, setWRpe] = useState(6)
  const [wMin, setWMin] = useState(45)
  const tk = todayKey()
  const today: DayLog = store[tk] ?? { behaviors: [], workouts: [] }

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* storage unavailable */ }
  }, [store])

  const updateToday = (patch: Partial<DayLog>) => {
    setStore((current) => ({
      ...current,
      [tk]: { behaviors: [], workouts: [], ...current[tk], ...patch },
    }))
  }

  useEffect(() => {
    const patch: Partial<DayLog> = {}
    if (!today.hrv) { const value = awal('hrvMs', 0); if (value > 0) patch.hrv = Math.round(value) }
    if (!today.rhr) { const value = awalBulat('restingHr', 0); if (value > 0) patch.rhr = value }
    if (!today.sleepH) { const value = awal('sleepH', 0); if (value > 0) patch.sleepH = Math.round(value * 10) / 10 }
    if (Object.keys(patch).length) updateToday(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tk, today.hrv, today.rhr, today.sleepH])

  const hrvBaseline = useMemo(() => averagePrevious(store, 'hrv'), [store])
  const rhrBaseline = useMemo(() => averagePrevious(store, 'rhr'), [store])
  const sleepBaseline = useMemo(() => averagePrevious(store, 'sleepH'), [store])
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = dayKey(6 - i)
    const day = store[date]
    return {
      date,
      hrv: day?.hrv,
      rhr: day?.rhr,
      sleepH: day?.sleepH,
      load: day ? recordedLoad(day.workouts ?? []) : 0,
    }
  }), [store])

  const vitalKey: Record<'hrv' | 'rhr' | 'sleepH', string> = {
    hrv: 'hrvMs',
    rhr: 'restingHr',
    sleepH: 'sleepH',
  }

  const numberField = (label: string, key: 'hrv' | 'rhr' | 'sleepH', step = 1, placeholder = '') => {
    const value = today[key]
    const deviceValue = vitals[vitalKey[key]]
    const fromSharedVitals = typeof value === 'number' && typeof deviceValue === 'number' && Math.abs(value - deviceValue) < 0.05
    const saveManual = () => {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || fromSharedVitals) return
      mergeVitals({ [vitalKey[key]]: value, source: 'Manual', measuredAt: new Date().toISOString() })
      mergeHealthCache({ [vitalKey[key]]: value })
      setSavedKey(key)
    }
    return (
      <Field label={
        <span className="flex items-center gap-1">
          <span>{label}</span>
          {fromSharedVitals && <span className="rounded bg-brand-50 px-1 text-[10px] font-bold text-brand-dark" title="Loaded from shared recorded vitals">recorded</span>}
        </span>
      }>
        <div className="flex items-center gap-1" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveManual() } }}>
          <KolomAngka
            step={step}
            placeholder={placeholder}
            ariaLabel={label}
            nilai={value}
            onNilai={(next) => updateToday({ [key]: next } as Partial<DayLog>)}
          />
          {typeof value === 'number' && value > 0 && !fromSharedVitals && (
            <button type="button" onClick={saveManual} aria-label={`Save ${label}`} className="shrink-0 rounded-lg bg-brand px-2 py-1.5 text-[12px] font-black text-ink">↵</button>
          )}
          {savedKey === key && <span className="shrink-0 text-[10px] font-bold text-emerald-600" role="status">saved</span>}
        </div>
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Readiness & Recovery" subtitle="Recorded signals and your own recent history — without a synthetic readiness score" />
        <div className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
          Panacea does not convert HRV, resting heart rate, sleep, behaviors, or workout entries into a home-made recovery score or training prescription. Provider-derived scores must remain attributed to their provider and are not available here unless a reviewed adapter supplies them with provenance.
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Morning Check-in" subtitle="Record measurements or manual observations; missing values stay missing" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {numberField('Overnight HRV (ms)', 'hrv', 1, hrvBaseline ? `14d mean ${hrvBaseline.value.toFixed(0)}` : 'e.g. 65')}
          {numberField('Resting HR (bpm)', 'rhr', 1, rhrBaseline ? `14d mean ${rhrBaseline.value.toFixed(0)}` : 'e.g. 58')}
          {numberField('Sleep (hours)', 'sleepH', 0.1, sleepBaseline ? `14d mean ${sleepBaseline.value.toFixed(1)}` : 'e.g. 7.5')}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          The 14-day values shown above are simple arithmetic means of at least three recorded prior-day observations. They are personal descriptive summaries, not population reference ranges, diagnostic thresholds, readiness classifications, or treatment/training recommendations.
        </p>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sleep quality — subjective self-rating</div>
          <div className="mt-1.5 flex gap-1.5" role="group" aria-label="Subjective sleep quality from 1 to 5">
            {[1, 2, 3, 4, 5].map((quality) => (
              <button
                key={quality}
                type="button"
                aria-pressed={(today.sleepQ ?? 0) === quality}
                aria-label={`Sleep quality ${quality} of 5`}
                onClick={() => updateToday({ sleepQ: quality })}
                className={'flex-1 rounded-xl py-2 text-lg ' + ((today.sleepQ ?? 0) === quality ? 'bg-brand/15 ring-2 ring-brand' : 'bg-neutral-100')}
              >
                {['😫', '😕', '😐', '🙂', '😴'][quality - 1]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<span className="text-lg">📝</span>} title="Context Journal" subtitle="Record context only; Panacea does not infer causation from these tags" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BEHAVIORS.map((behavior) => {
            const selected = today.behaviors.includes(behavior.id)
            return (
              <button
                key={behavior.id}
                type="button"
                aria-pressed={selected}
                onClick={() => updateToday({ behaviors: selected ? today.behaviors.filter((id) => id !== behavior.id) : [...today.behaviors, behavior.id] })}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (selected ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600')}
              >
                {behavior.label}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Recorded Training Load" subtitle="Explicit arithmetic only: session RPE × recorded minutes" />
        <div className="mt-2 flex items-end gap-2">
          <div className="w-24"><Field label="Minutes"><input className={inputClass} type="number" min={1} value={wMin} onChange={(event) => setWMin(Number(event.target.value))} /></Field></div>
          <div className="flex-1">
            <Field label={`Session RPE ${wRpe}/10`}>
              <input type="range" min={1} max={10} value={wRpe} onChange={(event) => setWRpe(Number(event.target.value))} className="w-full" />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => {
              if (Number.isFinite(wMin) && wMin > 0 && Number.isFinite(wRpe) && wRpe >= 1 && wRpe <= 10) {
                updateToday({ workouts: [...today.workouts, { rpe: wRpe, min: wMin }] })
              }
            }}
            className="h-[42px] shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white active:scale-95"
          >+ Add</button>
        </div>
        {today.workouts.length > 0 && (
          <div className="mt-3 space-y-1">
            {today.workouts.map((workout, index) => (
              <div key={`${workout.rpe}-${workout.min}-${index}`} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-xs">
                <span>{workout.min} min · RPE {workout.rpe}/10 · recorded load {workout.rpe * workout.min} RPE·min</span>
                <button type="button" aria-label={`Remove workout ${index + 1}`} onClick={() => updateToday({ workouts: today.workouts.filter((_, i) => i !== index) })} className="font-bold text-rose-600">✕</button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          RPE·min is displayed only as the arithmetic product of your recorded session rating and duration. Panacea does not map it to a proprietary strain scale or derive a recommended training target from it.
        </p>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Last 7 Recorded Days" subtitle="Raw observations stay separate; no composite score is synthesized" />
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-neutral-500">
              <tr><th className="py-2">Date</th><th>HRV ms</th><th>RHR bpm</th><th>Sleep h</th><th>RPE·min</th></tr>
            </thead>
            <tbody>
              {week.map((day) => (
                <tr key={day.date} className="border-t border-neutral-100">
                  <td className="py-2 font-semibold">{day.date}</td>
                  <td>{day.hrv ?? '—'}</td>
                  <td>{day.rhr ?? '—'}</td>
                  <td>{day.sleepH ?? '—'}</td>
                  <td>{day.load || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-xs leading-relaxed text-brand-dark">
        Data on this surface is recorded or manually entered and remains descriptive. Absence of data is not interpreted as recovery, illness, stress, permission denial, or device failure. This page does not diagnose, forecast, prescribe training, or substitute for provider-derived scores or clinical review.
      </div>
    </div>
  )
}

export default Readiness
