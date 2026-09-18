import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { IconHeart, IconMoon, IconPlus, IconRun, IconUpload } from './icons'
import '../styles/home-human-interface.css'

const DAY = 86_400_000

function num(value: number | undefined | null, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return digits ? value.toFixed(digits) : Math.round(value).toLocaleString()
}

function todayKey() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

type BentoMetric = {
  key: string
  label: string
  value: string
  unit?: string
  meta?: string
  to: string
  size: 'hero' | 'wide' | 'unit'
  icon: typeof IconRun
  accent?: 'green' | 'violet' | 'orange' | 'cyan' | 'rose'
}

export function HomeHealthBrief() {
  const { state } = useStore()
  const [refresh, setRefresh] = useState(0)

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
  const latestSleep = useMemo(() => [...(state.sleepLogs ?? [])]
    .filter((item) => typeof item?.hours === 'number' && item.hours > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0], [state.sleepLogs])

  const sleep = typeof latestSleep?.hours === 'number'
    ? latestSleep.hours
    : (typeof vitals.sleepH === 'number' ? vitals.sleepH : undefined)
  const steps = typeof vitals.steps === 'number' && vitals.steps >= 0 ? vitals.steps : undefined
  const restingHr = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? vitals.restingHr : undefined
  const hrv = typeof vitals.hrvMs === 'number' && vitals.hrvMs > 0 ? vitals.hrvMs : undefined
  const vo2max = typeof vitals.vo2max === 'number' && vitals.vo2max > 0 ? vitals.vo2max : undefined
  const recovery = typeof vitals.recoveryPct === 'number' && vitals.recoveryPct > 0 ? vitals.recoveryPct : undefined
  const bodyScore = typeof vitals.bodyScore === 'number' && vitals.bodyScore > 0 ? vitals.bodyScore : undefined
  const source = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source.trim() : 'Health data'
  const date = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()),
    [],
  )

  const nutrition = useMemo(() => {
    const today = todayKey()
    return (state.foods ?? [])
      .filter((food) => food?.date === today)
      .reduce((sum, food) => ({
        kcal: sum.kcal + (food.kcal || 0),
        protein: sum.protein + (food.protein || 0),
      }), { kcal: 0, protein: 0 })
  }, [state.foods])

  const training = useMemo(() => {
    const now = Date.now()
    const recent = workouts.filter((workout) => {
      const at = Date.parse(workout.mulai)
      return Number.isFinite(at) && now - at <= 7 * DAY
    })
    return {
      sessions: recent.length,
      minutes: Math.round(recent.reduce((sum, workout) => sum + Math.max(0, workout.durasi || 0), 0) / 60),
    }
  }, [workouts])

  const primary = recovery ?? bodyScore ?? steps
  const primaryLabel = recovery != null
    ? 'Recovery'
    : bodyScore != null
      ? 'Body score'
      : 'Steps'
  const primaryUnit = recovery != null ? '%' : undefined

  const metrics: BentoMetric[] = [
    {
      key: 'primary',
      label: primaryLabel,
      value: num(primary),
      unit: primaryUnit,
      meta: recovery != null || bodyScore != null ? 'Today' : undefined,
      to: recovery != null || bodyScore != null ? '/readiness' : '/tubuh?t=gerak',
      size: 'hero',
      icon: IconRun,
      accent: 'green',
    },
    {
      key: 'sleep',
      label: 'Sleep',
      value: num(sleep, 1),
      unit: 'h',
      to: '/tubuh?t=tidur',
      size: 'unit',
      icon: IconMoon,
      accent: 'violet',
    },
    {
      key: 'heart',
      label: 'Rest HR',
      value: num(restingHr),
      unit: 'bpm',
      to: '/tubuh?t=jantung',
      size: 'unit',
      icon: IconHeart,
      accent: 'rose',
    },
    {
      key: 'vo2',
      label: 'VO₂max',
      value: num(vo2max, 1),
      to: '/latihan?t=lab',
      size: 'unit',
      icon: IconRun,
      accent: 'cyan',
    },
    {
      key: 'hrv',
      label: 'HRV',
      value: num(hrv),
      unit: 'ms',
      to: '/readiness',
      size: 'unit',
      icon: IconHeart,
      accent: 'cyan',
    },
    {
      key: 'nutrition',
      label: 'Nutrition',
      value: num(nutrition.kcal),
      unit: 'kcal',
      meta: nutrition.protein > 0 ? `${Math.round(nutrition.protein)}g protein` : 'Today',
      to: '/nutrition',
      size: 'wide',
      icon: IconPlus,
      accent: 'orange',
    },
    {
      key: 'training',
      label: 'Training',
      value: num(training.sessions),
      unit: 'sessions',
      meta: training.minutes > 0 ? `${training.minutes} min · 7d` : 'Last 7 days',
      to: '/latihan',
      size: 'wide',
      icon: IconRun,
      accent: 'green',
    },
  ]

  return (
    <section
      data-panacea-instrument-strip
      className="panacea-health-bento-section"
      aria-label="Today health instruments"
    >
      <div className="panacea-health-bento-head">
        <span className="panacea-instrument-date">{date}</span>
        <Link
          to="/health-data"
          className="panacea-instrument-sync"
          aria-label={`Open connected health data. Current source: ${source}`}
          title={source}
        >
          <IconUpload size={17} />
        </Link>
      </div>

      <div className="panacea-health-bento">
        {metrics.map(({ key, label, value, unit, meta, to, size, icon: Icon, accent }) => (
          <Link
            key={key}
            to={to}
            className="panacea-health-bento-tile"
            data-size={size}
            data-accent={accent}
            aria-label={`${label} ${value}${unit ? ` ${unit}` : ''}`}
          >
            <span className="panacea-health-bento-kicker"><Icon size={14} />{label}</span>
            <span className="panacea-health-bento-value">
              {value}
              {unit ? <small>{unit}</small> : null}
            </span>
            {meta ? <span className="panacea-health-bento-meta">{meta}</span> : null}
            {size === 'hero' ? (
              <span className="panacea-health-bento-matrix" aria-hidden>
                {Array.from({ length: 36 }).map((_, index) => (
                  <i key={index} data-on={primary != null && index < Math.max(3, Math.min(36, Math.round((Number(primary) / 100) * 36)))} />
                ))}
              </span>
            ) : null}
          </Link>
        ))}

        <Link to="/harian" className="panacea-health-bento-action" aria-label="Log today">
          <IconPlus size={18} />
          <span>Log</span>
        </Link>
      </div>
    </section>
  )
}

export default HomeHealthBrief
