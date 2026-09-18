import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { WIDGETS, type WidgetDef } from '../lib/homeWidgets'
import '../styles/home-fun-widgets.css'

type Snapshot = {
  steps: number | null
  sleep: number | null
  restingHr: number | null
  hrv: number | null
  vo2: number | null
  weight: number | null
  recovery: number | null
  bodyScore: number | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  foodEntries: number
  workouts7d: number
  trainingMinutes7d: number
  wallet: number
}

type MetricPresentation = {
  value: string
  unit?: string
  label: string
  secondary: Array<{ label: string; value: string; unit?: string }>
  mode: 'matrix' | 'ring' | 'bars' | 'stack' | 'dial' | 'launcher'
}

const STORAGE_KEY = 'pmd-home-fun-widgets-v1'
const DEFAULT_WIDGETS = ['ringHarian', 'giziLebar', 'pewaktu', 'langkahRingkas', 'tidurRingkas', 'vo2tren', 'denyutRingkas', 'kebugaran']
const DAY = 86_400_000

function finitePositive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function compact(value: number | null, digits = 0) {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function todayKey() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function loadSelection(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WIDGETS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS
    const valid = parsed.filter((id): id is string => typeof id === 'string' && WIDGETS.some((w) => w.id === id))
    return valid.length ? valid : DEFAULT_WIDGETS
  } catch {
    return DEFAULT_WIDGETS
  }
}

function saveSelection(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* storage unavailable */ }
}

function idHas(widget: WidgetDef, pattern: RegExp) {
  return pattern.test(`${widget.id} ${widget.label} ${widget.kategori}`.toLowerCase())
}

function modeFor(widget: WidgetDef): MetricPresentation['mode'] {
  const hash = [...widget.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return (['matrix', 'ring', 'bars', 'stack', 'dial'] as const)[hash % 5]
}

function presentation(widget: WidgetDef, s: Snapshot): MetricPresentation {
  const secondaryBody = [
    { label: 'Steps', value: compact(s.steps) },
    { label: 'RHR', value: compact(s.restingHr), unit: 'bpm' },
    { label: 'VO₂', value: compact(s.vo2, 1) },
  ]

  if (widget.id === 'ringHarian' || idHas(widget, /recovery|readiness|body battery|body score|ringharian/)) {
    const primary = s.recovery ?? s.bodyScore
    return {
      value: compact(primary),
      unit: primary != null ? '%' : undefined,
      label: s.recovery != null ? 'recovery' : s.bodyScore != null ? 'body score' : 'no score yet',
      secondary: secondaryBody,
      mode: 'matrix',
    }
  }

  if (idHas(widget, /gizi|nutrition|kalori|calorie|protein|tdee|macro|pangan|food/)) {
    return {
      value: compact(s.kcal),
      unit: 'kcal',
      label: 'logged today',
      secondary: [
        { label: 'Protein', value: compact(s.protein), unit: 'g' },
        { label: 'Carbs', value: compact(s.carbs), unit: 'g' },
        { label: 'Fat', value: compact(s.fat), unit: 'g' },
      ],
      mode: 'ring',
    }
  }

  if (idHas(widget, /sleep|tidur|hrv|recovery|utang tidur|nap/)) {
    const value = idHas(widget, /hrv/) ? s.hrv : s.sleep
    return {
      value: compact(value, 1),
      unit: idHas(widget, /hrv/) ? 'ms' : 'h',
      label: idHas(widget, /hrv/) ? 'latest HRV' : 'latest sleep',
      secondary: [
        { label: 'HRV', value: compact(s.hrv), unit: 'ms' },
        { label: 'RHR', value: compact(s.restingHr), unit: 'bpm' },
        { label: 'Recovery', value: compact(s.recovery), unit: s.recovery != null ? '%' : undefined },
      ],
      mode: 'bars',
    }
  }

  if (idHas(widget, /vo2|aerobic|cardiorespiratory/)) {
    return {
      value: compact(s.vo2, 1),
      label: 'VO₂ max',
      secondary: [
        { label: 'Steps', value: compact(s.steps) },
        { label: 'Sessions', value: compact(s.workouts7d) },
        { label: 'Sleep', value: compact(s.sleep, 1), unit: 'h' },
      ],
      mode: 'dial',
    }
  }

  if (idHas(widget, /heart|hr|denyut|nadi|cardio/)) {
    return {
      value: compact(s.restingHr),
      unit: 'bpm',
      label: 'resting HR',
      secondary: [
        { label: 'HRV', value: compact(s.hrv), unit: 'ms' },
        { label: 'VO₂', value: compact(s.vo2, 1) },
        { label: 'Sleep', value: compact(s.sleep, 1), unit: 'h' },
      ],
      mode: 'dial',
    }
  }

  if (idHas(widget, /steps|langkah|tangga|movement|gerak/)) {
    return {
      value: compact(s.steps),
      label: 'steps today',
      secondary: [
        { label: 'Sessions', value: compact(s.workouts7d) },
        { label: 'Minutes', value: compact(s.trainingMinutes7d) },
        { label: 'VO₂', value: compact(s.vo2, 1) },
      ],
      mode: 'matrix',
    }
  }

  if (idHas(widget, /training|latihan|workout|athlete|sport|fitness|zona2|zone 2|muatan/)) {
    return {
      value: compact(s.workouts7d),
      label: 'sessions · 7d',
      secondary: [
        { label: 'Minutes', value: compact(s.trainingMinutes7d) },
        { label: 'Steps', value: compact(s.steps) },
        { label: 'VO₂', value: compact(s.vo2, 1) },
      ],
      mode: 'stack',
    }
  }

  if (idHas(widget, /weight|berat|body|komposisi|composition|bmi/)) {
    return {
      value: compact(s.weight, 1),
      unit: 'kg',
      label: 'latest weight',
      secondary: secondaryBody,
      mode: 'ring',
    }
  }

  if (idHas(widget, /wallet|money|keuangan|finance/)) {
    return {
      value: compact(s.wallet),
      label: 'wallet',
      secondary: [],
      mode: 'stack',
    }
  }

  return {
    value: 'Open',
    label: widget.kategori,
    secondary: [],
    mode: modeFor(widget),
  }
}

function WidgetVisual({ p }: { p: MetricPresentation }) {
  if (p.mode === 'launcher') return null

  if (p.mode === 'matrix') {
    return (
      <span className="panacea-fun-visual panacea-fun-matrix" aria-hidden>
        {Array.from({ length: 24 }).map((_, index) => <i key={index} data-on={index < 7} />)}
      </span>
    )
  }

  if (p.mode === 'bars') {
    return (
      <span className="panacea-fun-visual panacea-fun-bars" aria-hidden>
        {[32, 46, 54, 42, 70, 58, 82].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
      </span>
    )
  }

  if (p.mode === 'stack') {
    return (
      <span className="panacea-fun-visual panacea-fun-stack" aria-hidden>
        <i /><i /><i />
      </span>
    )
  }

  return (
    <span className="panacea-fun-visual panacea-fun-ring" aria-hidden>
      <svg viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="16" pathLength="100" />
        <circle className="is-progress" cx="21" cy="21" r="16" pathLength="100" strokeDasharray="68 100" />
      </svg>
    </span>
  )
}

function FeatureWidget({ widget, snapshot }: { widget: WidgetDef; snapshot: Snapshot }) {
  const p = presentation(widget, snapshot)
  return (
    <Link
      to={widget.ke}
      className="panacea-fun-card"
      data-mode={p.mode}
      style={{ '--fw-accent': '#00bf63' } as CSSProperties}
      aria-label={`${widget.label}: ${p.value} ${p.unit ?? ''}`}
    >
      <span className="panacea-fun-card-kicker">{widget.label}</span>
      <span className="panacea-fun-card-primary">
        {p.value}{p.unit ? <small>{p.unit}</small> : null}
      </span>
      <span className="panacea-fun-card-caption">{p.label}</span>
      <WidgetVisual p={p} />
      {p.secondary.length ? (
        <span className="panacea-fun-metrics" aria-hidden>
          {p.secondary.slice(0, 3).map((metric) => (
            <span key={metric.label} className="panacea-fun-metric">
              <span>{metric.label}</span>
              <b>{metric.value}{metric.unit ? <small>{metric.unit}</small> : null}</b>
            </span>
          ))}
        </span>
      ) : (
        <span className="panacea-fun-launch-note">{widget.ringkas}</span>
      )}
    </Link>
  )
}

function FocusWidget() {
  const [seconds, setSeconds] = useState(25 * 60)
  const [total, setTotal] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const mins = Math.floor(seconds / 60)
  const secs = String(seconds % 60).padStart(2, '0')
  const progress = Math.max(0, Math.min(100, 100 - (seconds / Math.max(1, total)) * 100))

  return (
    <article className="panacea-fun-card panacea-fun-focus" style={{ '--fw-accent': '#7dd3fc' } as CSSProperties}>
      <span className="panacea-fun-card-kicker">Focus timer</span>
      <span className="panacea-fun-card-primary panacea-fun-clock">{mins}:{secs}</span>
      <span className="panacea-fun-card-caption">{running ? 'in progress' : 'ready'}</span>
      <span className="panacea-fun-visual panacea-fun-ring" aria-hidden>
        <svg viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="16" pathLength="100" />
          <circle className="is-progress" cx="21" cy="21" r="16" pathLength="100" strokeDasharray={`${progress} 100`} />
        </svg>
      </span>
      <div className="panacea-fun-focus-controls">
        <button type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : 'Start'}</button>
        {[15, 25, 50].map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => {
              setRunning(false)
              setTotal(minutes * 60)
              setSeconds(minutes * 60)
            }}
          >
            {minutes}m
          </button>
        ))}
      </div>
    </article>
  )
}

export function HomeFunWidgetRail() {
  const { state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<string[]>(loadSelection)
  const [customizing, setCustomizing] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])

  const snapshot = useMemo<Snapshot>(() => {
    const today = todayKey()
    const foods = (state.foods ?? []).filter((food) => food?.date === today)
    const nutrition = foods.reduce(
      (sum, food) => ({
        kcal: sum.kcal + (food.kcal || 0),
        protein: sum.protein + (food.protein || 0),
        carbs: sum.carbs + (food.carbs || 0),
        fat: sum.fat + (food.fat || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const latestSleep = [...(state.sleepLogs ?? [])]
      .filter((entry) => finitePositive(entry?.hours) != null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    const now = Date.now()
    const recentWorkouts = workouts.filter((workout) => {
      const at = Date.parse(workout.mulai)
      return Number.isFinite(at) && now - at <= 7 * DAY
    })
    return {
      steps: finitePositive(vitals.steps),
      sleep: finitePositive(latestSleep?.hours) ?? finitePositive(vitals.sleepH),
      restingHr: finitePositive(vitals.restingHr),
      hrv: finitePositive(vitals.hrvMs),
      vo2: finitePositive(vitals.vo2max),
      weight: finitePositive(vitals.weightKg),
      recovery: finitePositive(vitals.recoveryPct),
      bodyScore: finitePositive(vitals.bodyScore),
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      foodEntries: foods.length,
      workouts7d: recentWorkouts.length,
      trainingMinutes7d: Math.round(recentWorkouts.reduce((sum, workout) => sum + Math.max(0, workout.durasi || 0), 0) / 60),
      wallet: Math.max(0, state.wallet?.balance ?? 0),
    }
  }, [state.foods, state.sleepLogs, state.wallet?.balance, vitals, workouts])

  const byId = useMemo(() => new Map(WIDGETS.map((widget) => [widget.id, widget])), [])
  const selectedWidgets = selected.map((id) => byId.get(id)).filter((widget): widget is WidgetDef => !!widget)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return WIDGETS
    return WIDGETS.filter((widget) => `${widget.label} ${widget.ringkas} ${widget.kategori}`.toLowerCase().includes(needle))
  }, [query])

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      saveSelection(next.length ? next : DEFAULT_WIDGETS)
      return next.length ? next : DEFAULT_WIDGETS
    })
  }

  return (
    <section className="panacea-fun-widgets" aria-label="Custom live widgets">
      <div className="panacea-fun-widgets-head">
        <span>{selected.length} live widgets</span>
        <button type="button" onClick={() => setCustomizing(true)}>Customize · {WIDGETS.length}</button>
      </div>

      <div className="panacea-fun-widgets-rail">
        {selectedWidgets.map((widget) => (
          widget.id === 'pewaktu'
            ? <FocusWidget key={widget.id} />
            : <FeatureWidget key={widget.id} widget={widget} snapshot={snapshot} />
        ))}
      </div>

      {customizing ? (
        <div className="panacea-fun-picker-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setCustomizing(false)
        }}>
          <section className="panacea-fun-picker" role="dialog" aria-modal="true" aria-label="Customize Home widgets">
            <div className="panacea-fun-picker-head">
              <div>
                <strong>Widget universe</strong>
                <span>{WIDGETS.length} existing Panacea features · choose any</span>
              </div>
              <button type="button" onClick={() => setCustomizing(false)} aria-label="Close widget picker">×</button>
            </div>

            <input
              className="panacea-fun-picker-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search widgets"
              autoFocus
            />

            <div className="panacea-fun-picker-grid">
              {matches.map((widget) => {
                const active = selected.includes(widget.id)
                return (
                  <button
                    key={widget.id}
                    type="button"
                    className="panacea-fun-picker-item"
                    data-active={active}
                    onClick={() => toggle(widget.id)}
                  >
                    <span>{widget.label}</span>
                    <small>{widget.kategori}</small>
                    <b aria-hidden>{active ? '✓' : '+'}</b>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default HomeFunWidgetRail
