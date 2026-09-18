import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import '../styles/home-fun-widgets.css'

type Expanded = 'performance' | 'fuel' | 'focus' | 'breath' | null

const DAY = 86_400_000
const BREATH_TOTAL = 60
const BREATH_PHASE_SECONDS = 4
const BREATH_PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const

function todayKey() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return \`\${d.getFullYear()}-\${p(d.getMonth() + 1)}-\${p(d.getDate())}\`
}

function positive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function compact(value: number | null, digits = 0) {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function clock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return \`\${minutes}:\${String(seconds % 60).padStart(2, '0')}\`
}

function Metric({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit?: string
  accent: string
}) {
  return (
    <div className="panacea-fun-metric">
      <span className="panacea-fun-metric-dot" style={{ backgroundColor: accent }} aria-hidden />
      <span className="panacea-fun-metric-label">{label}</span>
      <span className="panacea-fun-metric-value">
        {value}{unit ? <small>{unit}</small> : null}
      </span>
    </div>
  )
}

export function HomeFunWidgetRail() {
  const { state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [expanded, setExpanded] = useState<Expanded>(null)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60)
  const [focusTotal, setFocusTotal] = useState(25 * 60)
  const [focusRunning, setFocusRunning] = useState(false)
  const [breathSeconds, setBreathSeconds] = useState(BREATH_TOTAL)
  const [breathRunning, setBreathRunning] = useState(false)

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  useEffect(() => {
    if (!focusRunning) return
    const id = window.setInterval(() => {
      setFocusSeconds((value) => {
        if (value <= 1) {
          setFocusRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [focusRunning])

  useEffect(() => {
    if (!breathRunning) return
    const id = window.setInterval(() => {
      setBreathSeconds((value) => {
        if (value <= 1) {
          setBreathRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [breathRunning])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const latestSleep = useMemo(
    () => [...(state.sleepLogs ?? [])]
      .filter((entry) => positive(entry?.hours) != null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [state.sleepLogs],
  )

  const performance = useMemo(() => {
    const now = Date.now()
    const sessions7d = workouts.filter((workout) => {
      const at = Date.parse(workout.mulai)
      return Number.isFinite(at) && now - at <= 7 * DAY
    }).length
    const recovery = positive(vitals.recoveryPct)
    const bodyScore = positive(vitals.bodyScore)
    const primary = recovery ?? bodyScore ?? sessions7d
    const primaryLabel = recovery != null ? 'recovery' : bodyScore != null ? 'body score' : 'sessions · 7d'
    const primaryUnit = recovery != null ? '%' : ''
    const dotCount = recovery != null || bodyScore != null
      ? Math.round((Math.min(100, primary) / 100) * 24)
      : Math.min(24, sessions7d)
    return {
      primary,
      primaryLabel,
      primaryUnit,
      dotCount,
      sleep: positive(latestSleep?.hours) ?? positive(vitals.sleepH),
      steps: positive(vitals.steps),
      vo2: positive(vitals.vo2max),
      sessions7d,
    }
  }, [latestSleep?.hours, vitals, workouts])

  const fuel = useMemo(() => {
    const key = todayKey()
    const today = (state.foods ?? []).filter((food) => food?.date === key)
    const totals = today.reduce(
      (sum, food) => ({
        kcal: sum.kcal + (food.kcal || 0),
        protein: sum.protein + (food.protein || 0),
        carbs: sum.carbs + (food.carbs || 0),
        fat: sum.fat + (food.fat || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const target = positive(vitals.amrKcal)
    return {
      ...totals,
      target,
      primary: target != null ? Math.max(0, target - totals.kcal) : totals.kcal,
      primaryLabel: target != null ? 'kcal left' : 'kcal logged',
      entries: today.length,
    }
  }, [state.foods, vitals.amrKcal])

  const breathElapsed = BREATH_TOTAL - breathSeconds
  const breathPhaseIndex = Math.floor((breathElapsed % (BREATH_PHASE_SECONDS * BREATH_PHASES.length)) / BREATH_PHASE_SECONDS)
  const breathPhase = breathSeconds === 0 ? 'Done' : BREATH_PHASES[breathPhaseIndex]
  const breathPhaseRemaining = breathSeconds === 0
    ? 0
    : BREATH_PHASE_SECONDS - (breathElapsed % BREATH_PHASE_SECONDS)

  const toggle = (key: Exclude<Expanded, null>) => {
    setExpanded((value) => (value === key ? null : key))
  }

  const performanceAccent = '#b4f000'
  const fuelAccent = '#ff7849'
  const focusAccent = '#7dd3fc'
  const breathAccent = '#5eead4'

  return (
    <section className="panacea-fun-widgets" aria-label="Live fun widgets">
      <div className="panacea-fun-widgets-head">
        <span>Live widgets</span>
        <Link to="/atur-fitur">Customize</Link>
      </div>

      <div className="panacea-fun-widgets-rail">
        <article
          className="panacea-fun-card"
          data-expanded={expanded === 'performance'}
          style={{ '--fw-accent': performanceAccent } as CSSProperties}
        >
          <button
            type="button"
            className="panacea-fun-card-main"
            aria-expanded={expanded === 'performance'}
            onClick={() => toggle('performance')}
          >
            <span className="panacea-fun-card-kicker">Performance</span>
            <span className="panacea-fun-card-primary">
              {compact(performance.primary)}
              {performance.primaryUnit ? <small>{performance.primaryUnit}</small> : null}
            </span>
            <span className="panacea-fun-card-caption">{performance.primaryLabel}</span>
            <span className="panacea-fun-dotfield" aria-hidden>
              {Array.from({ length: 24 }).map((_, index) => (
                <i key={index} data-on={index < performance.dotCount} />
              ))}
            </span>
          </button>

          <div className="panacea-fun-metrics">
            <Metric label="Sleep" value={compact(performance.sleep, 1)} unit="h" accent="#f97316" />
            <Metric label="Steps" value={compact(performance.steps)} accent="#8b5cf6" />
            <Metric label="VO₂ max" value={compact(performance.vo2, 1)} accent="#67e8f9" />
          </div>

          {expanded === 'performance' ? (
            <div className="panacea-fun-card-expand">
              <span>{performance.sessions7d} sessions · 7d</span>
              <Link to="/fitness-hub">Open Your Body →</Link>
            </div>
          ) : null}
        </article>

        <article
          className="panacea-fun-card"
          data-expanded={expanded === 'fuel'}
          style={{ '--fw-accent': fuelAccent } as CSSProperties}
        >
          <button
            type="button"
            className="panacea-fun-card-main"
            aria-expanded={expanded === 'fuel'}
            onClick={() => toggle('fuel')}
          >
            <span className="panacea-fun-card-kicker">Fuel · today</span>
            <span className="panacea-fun-card-primary">{compact(fuel.primary)}</span>
            <span className="panacea-fun-card-caption">{fuel.primaryLabel}</span>
            <span className="panacea-fun-ring" aria-hidden>
              <svg viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="16" pathLength="100" />
                <circle
                  className="is-progress"
                  cx="21"
                  cy="21"
                  r="16"
                  pathLength="100"
                  strokeDasharray={\`\${fuel.target ? Math.min(100, (fuel.kcal / fuel.target) * 100) : Math.min(100, fuel.entries * 18)} 100\`}
                />
              </svg>
            </span>
          </button>

          <div className="panacea-fun-metrics">
            <Metric label="Protein" value={compact(fuel.protein)} unit="g" accent="#ef4444" />
            <Metric label="Carbs" value={compact(fuel.carbs)} unit="g" accent="#f59e0b" />
            <Metric label="Fat" value={compact(fuel.fat)} unit="g" accent="#60a5fa" />
          </div>

          {expanded === 'fuel' ? (
            <div className="panacea-fun-card-expand">
              <span>{fuel.entries} entries today</span>
              <Link to="/nutrition">Open Nutrition →</Link>
            </div>
          ) : null}
        </article>

        <article
          className="panacea-fun-card panacea-fun-focus"
          data-expanded={expanded === 'focus'}
          style={{ '--fw-accent': focusAccent } as CSSProperties}
        >
          <button
            type="button"
            className="panacea-fun-card-main"
            aria-expanded={expanded === 'focus'}
            onClick={() => toggle('focus')}
          >
            <span className="panacea-fun-card-kicker">Focus</span>
            <span className="panacea-fun-card-primary panacea-fun-clock">{clock(focusSeconds)}</span>
            <span className="panacea-fun-card-caption">{focusRunning ? 'in progress' : focusSeconds === 0 ? 'complete' : 'ready'}</span>
            <span className="panacea-fun-ring" aria-hidden>
              <svg viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="16" pathLength="100" />
                <circle
                  className="is-progress"
                  cx="21"
                  cy="21"
                  r="16"
                  pathLength="100"
                  strokeDasharray={\`\${Math.max(0, Math.min(100, 100 - (focusSeconds / Math.max(1, focusTotal)) * 100))} 100\`}
                />
              </svg>
            </span>
          </button>

          <div className="panacea-fun-focus-controls" aria-label="Focus timer controls">
            <button
              type="button"
              disabled={focusSeconds === 0}
              onClick={() => setFocusRunning((value) => !value)}
            >
              {focusRunning ? 'Pause' : 'Start'}
            </button>
            <button type="button" onClick={() => { setFocusRunning(false); setFocusTotal(25 * 60); setFocusSeconds(25 * 60) }}>Reset</button>
          </div>

          {expanded === 'focus' ? (
            <div className="panacea-fun-card-expand panacea-fun-presets">
              {[15, 25, 50].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setFocusRunning(false)
                    setFocusTotal(minutes * 60)
                    setFocusSeconds(minutes * 60)
                  }}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          ) : null}
        </article>

        <article
          className="panacea-fun-card panacea-fun-breath"
          data-expanded={expanded === 'breath'}
          data-phase={breathPhase.toLowerCase()}
          style={{ '--fw-accent': breathAccent } as CSSProperties}
        >
          <button
            type="button"
            className="panacea-fun-card-main panacea-fun-breath-main"
            aria-expanded={expanded === 'breath'}
            onClick={() => toggle('breath')}
          >
            <span className="panacea-fun-card-kicker">Reset · 60s</span>
            <span className="panacea-fun-card-primary panacea-fun-clock">{clock(breathSeconds)}</span>
            <span className="panacea-fun-card-caption" aria-live="polite">
              {breathRunning ? \`\${breathPhase} · \${breathPhaseRemaining}s\` : breathSeconds === 0 ? 'complete' : 'guided breath'}
            </span>
            <span className="panacea-breath-orbit" aria-hidden>
              <i />
              <b />
            </span>
          </button>

          <div className="panacea-fun-focus-controls" aria-label="Guided breathing controls">
            <button
              type="button"
              disabled={breathSeconds === 0}
              onClick={() => setBreathRunning((value) => !value)}
            >
              {breathRunning ? 'Pause' : 'Start'}
            </button>
            <button type="button" onClick={() => { setBreathRunning(false); setBreathSeconds(BREATH_TOTAL) }}>Reset</button>
          </div>

          {expanded === 'breath' ? (
            <div className="panacea-fun-card-expand panacea-breath-sequence" aria-label="Breathing sequence">
              {BREATH_PHASES.map((phase, index) => (
                <span key={\`\${phase}-\${index}\`} data-active={breathRunning && index === breathPhaseIndex}>{phase}</span>
              ))}
            </div>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default HomeFunWidgetRail
