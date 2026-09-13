import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DAILY_TRAINING_COMPLETION_KEY,
  DAILY_TRAINING_REMINDER_KEY,
  TRAINING_MODE_META,
  dateKey,
  getDailyTrainingSession,
  reminderDue,
  trainingLoadModifier,
  type DailyTrainingReminderSettings,
  type TrainingLevel,
  type TrainingMode,
} from '../lib/dailyTrainingModes'
import { Card, SectionTitle } from './ui'
import { IconActivity, IconTimer } from './icons'

const MODE_KEY = 'pm_daily_training_mode_v1'
const LEVEL_KEY = 'pm_daily_training_level_v1'

const LEVELS: Array<{ id: TrainingLevel; label: string }> = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

function safeJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? { ...fallback, ...JSON.parse(value) } : fallback
  } catch {
    return fallback
  }
}

function loadMode(): TrainingMode {
  try {
    const value = localStorage.getItem(MODE_KEY)
    if (value === 'calisthenics' || value === 'gymnastics' || value === 'amrap' || value === 'hyrox') return value
  } catch { /* ignore */ }
  return 'calisthenics'
}

function loadLevel(): TrainingLevel {
  try {
    const value = localStorage.getItem(LEVEL_KEY)
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value
  } catch { /* ignore */ }
  return 'beginner'
}

function fmt(sec: number) {
  const clamped = Math.max(0, Math.floor(sec))
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function completionKey(mode: TrainingMode, level: TrainingLevel) {
  return `${dateKey()}::${mode}::${level}`
}

export function DailyTrainingModes() {
  const [mode, setMode] = useState<TrainingMode>(loadMode)
  const [level, setLevel] = useState<TrainingLevel>(loadLevel)
  const session = useMemo(() => getDailyTrainingSession(mode, level), [mode, level])
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => safeJson<Record<string, boolean>>(DAILY_TRAINING_COMPLETION_KEY, {}))
  const [stationDone, setStationDone] = useState<Record<string, boolean>>({})
  const [rounds, setRounds] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const [reminder, setReminder] = useState<DailyTrainingReminderSettings>(() => safeJson(DAILY_TRAINING_REMINDER_KEY, {
    enabled: false,
    time: '07:00',
    lastDeliveredDate: null,
  }))
  const [reminderBanner, setReminderBanner] = useState(false)
  const [permission, setPermission] = useState<string>(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const profile = useMemo(() => safeJson('pm_athlete_profile', { recoveryHrs: 0, sleepScore: 0, acuteLoad: 0, chronicLoad: 0 }), [])
  const readiness = useMemo(() => trainingLoadModifier(profile), [profile])
  const todayCompleted = Boolean(completed[completionKey(mode, level)])

  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode) } catch { /* ignore */ }
    setStationDone({})
    setRounds(0)
    setElapsedSec(0)
    setTimerRunning(false)
  }, [mode])

  useEffect(() => {
    try { localStorage.setItem(LEVEL_KEY, level) } catch { /* ignore */ }
    setStationDone({})
    setRounds(0)
    setElapsedSec(0)
    setTimerRunning(false)
  }, [level])

  useEffect(() => {
    try { localStorage.setItem(DAILY_TRAINING_COMPLETION_KEY, JSON.stringify(completed)) } catch { /* ignore */ }
  }, [completed])

  useEffect(() => {
    try { localStorage.setItem(DAILY_TRAINING_REMINDER_KEY, JSON.stringify(reminder)) } catch { /* ignore */ }
  }, [reminder])

  useEffect(() => {
    if (!timerRunning) return
    intervalRef.current = window.setInterval(() => setElapsedSec((value) => value + 1), 1000)
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [timerRunning])

  useEffect(() => {
    const check = () => {
      const now = new Date()
      if (!reminderDue(reminder, now)) return
      const title = `${TRAINING_MODE_META[mode].emoji} ${TRAINING_MODE_META[mode].label} today`
      const body = `${session.title} · ${session.durationMin} min · ${session.targetRpe}`
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification(title, { body, tag: `panacea-training-${dateKey(now)}` }) } catch { /* fall back to banner */ }
      }
      setReminderBanner(true)
      setReminder((value) => ({ ...value, lastDeliveredDate: dateKey(now) }))
    }
    check()
    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [mode, reminder, session.durationMin, session.targetRpe, session.title])

  async function toggleReminder() {
    if (!reminder.enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const next = await Notification.requestPermission()
        setPermission(next)
      } catch { /* in-app reminder still works */ }
    }
    setReminder((value) => ({ ...value, enabled: !value.enabled, lastDeliveredDate: null }))
  }

  function markComplete() {
    const key = completionKey(mode, level)
    setCompleted((value) => ({ ...value, [key]: !value[key] }))
  }

  const scaledMinutes = Math.max(10, Math.round(session.durationMin * readiness.factor))
  const stationProgress = session.blocks.length > 0
    ? Math.round((session.blocks.filter((block) => stationDone[block.id]).length / session.blocks.length) * 100)
    : 0

  return (
    <Card className="!p-5" data-daily-training-modes="true">
      <SectionTitle
        icon={<IconActivity size={20} />}
        title="Daily Training Modes"
        subtitle="Calisthenics · Gymnastics · AMRAP · HYROX-style — one daily system beside your running plan"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(TRAINING_MODE_META) as TrainingMode[]).map((id) => {
          const item = TRAINING_MODE_META[id]
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(id)}
              className={`min-h-14 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.98] ${active ? 'border-brand bg-brand/10' : 'border-neutral-200 dark:border-white/10'}`}
            >
              <span className="block text-base">{item.emoji}</span>
              <span className="block text-xs font-black text-ink dark:text-white">{item.label}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{TRAINING_MODE_META[mode].description}</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {LEVELS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={level === item.id}
            onClick={() => setLevel(item.id)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold ${level === item.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Today · {readiness.label}</div>
            <h3 className="mt-1 text-lg font-black">{session.title}</h3>
            <p className="mt-1 text-[11px] text-white/65">{session.subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-brand">{scaledMinutes}<span className="ml-1 text-xs text-white/50">min</span></div>
            <div className="text-[10px] font-bold text-white/50">{session.targetRpe}</div>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-white/8 p-2.5 text-[11px] leading-relaxed text-white/70">{readiness.note}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {session.focus.map((focus) => <span key={focus} className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold">{focus}</span>)}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {session.blocks.map((block, index) => (
          <button
            type="button"
            key={block.id}
            aria-pressed={Boolean(stationDone[block.id])}
            onClick={() => setStationDone((value) => ({ ...value, [block.id]: !value[block.id] }))}
            className={`w-full rounded-2xl border p-3 text-left transition ${stationDone[block.id] ? 'border-brand bg-brand/[0.06]' : 'border-neutral-200 dark:border-white/10'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${stationDone[block.id] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'}`}>
                {stationDone[block.id] ? '✓' : index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <span className="text-sm font-black text-ink dark:text-white">{block.label}</span>
                  <span className="text-[11px] font-bold text-brand-dark">{block.prescription}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{block.cue}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {(mode === 'hyrox' || mode === 'gymnastics') && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10" aria-label={`${stationProgress}% session blocks completed`}>
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${stationProgress}%` }} />
        </div>
      )}

      {mode === 'amrap' && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div>
            <div className="text-xs font-black text-ink dark:text-white">Completed rounds</div>
            <div className="text-[10px] text-neutral-500">Count only technically clean rounds.</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 text-lg font-black dark:border-white/10" onClick={() => setRounds((value) => Math.max(0, value - 1))}>−</button>
            <span className="w-8 text-center text-xl font-black tabular-nums">{rounds}</span>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-brand text-lg font-black text-white" onClick={() => setRounds((value) => value + 1)}>+</button>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconTimer size={18} />
              <div>
                <div className="text-xs font-black">Session timer</div>
                <div className="text-[10px] text-neutral-500">Elapsed / suggested {scaledMinutes} min</div>
              </div>
            </div>
            <span className="font-mono text-xl font-black tabular-nums">{fmt(elapsedSec)}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button type="button" className="min-h-11 rounded-xl bg-brand px-3 text-xs font-black text-white" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? 'Pause' : 'Start'}</button>
            <button type="button" className="min-h-11 rounded-xl border border-neutral-200 px-3 text-xs font-bold dark:border-white/10" onClick={() => { setTimerRunning(false); setElapsedSec(0) }}>Reset</button>
            <button type="button" className={`min-h-11 rounded-xl px-3 text-xs font-black ${todayCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-white'}`} onClick={markComplete}>{todayCompleted ? 'Done ✓' : 'Complete'}</button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10 sm:min-w-[190px]">
          <div className="text-xs font-black">Daily reminder</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              aria-label="Daily training reminder time"
              type="time"
              value={reminder.time}
              onChange={(event) => setReminder((value) => ({ ...value, time: event.target.value, lastDeliveredDate: null }))}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 text-xs font-bold dark:border-white/10"
            />
            <button
              type="button"
              aria-pressed={reminder.enabled}
              onClick={toggleReminder}
              className={`min-h-11 rounded-xl px-3 text-xs font-black ${reminder.enabled ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
            >
              {reminder.enabled ? 'On' : 'Off'}
            </button>
          </div>
          <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-500">
            In-app daily reminder always works while Panacea is open. Browser notification permission: <b>{permission}</b>. Closed-app delivery requires an installed PWA/push worker; this card does not pretend a normal browser tab can wake itself.
          </p>
        </div>
      </div>

      {reminderBanner && (
        <div role="status" className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-3">
          <div>
            <div className="text-xs font-black text-brand-dark">Today's training is ready</div>
            <div className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">{session.title} · {scaledMinutes} min · {session.targetRpe}</div>
          </div>
          <button type="button" className="min-h-11 rounded-xl px-3 text-xs font-bold" onClick={() => setReminderBanner(false)}>Dismiss</button>
        </div>
      )}

      {session.finisher && <p className="mt-3 text-[11px] leading-relaxed text-neutral-500"><b>Finish:</b> {session.finisher}</p>}
      <details className="mt-3 text-[11px] text-neutral-500">
        <summary className="cursor-pointer font-bold text-brand-dark">Safety & scaling</summary>
        <ul className="mt-2 space-y-1.5">
          {session.safety.map((item) => <li key={item}>• {item}</li>)}
          <li>• Daily suggestions are general training guidance, not medical clearance or individualized rehabilitation.</li>
        </ul>
      </details>
    </Card>
  )
}
