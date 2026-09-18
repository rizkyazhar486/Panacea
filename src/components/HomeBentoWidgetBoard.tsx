import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { WIDGETS, type WidgetDef } from '../lib/homeWidgets'
import '../styles/home-bento-widget-board.css'

const STORAGE_KEY = 'pmd-home-bento-selection-v1'
const DEFAULT_IDS = [
  'ringHarian',
  'kebugaran',
  'giziLebar',
  'langkahRingkas',
  'tidurRingkas',
  'denyutRingkas',
  'vo2tren',
  'hrv',
  'hidrasi2',
  'pewaktu',
]
const DAY = 86_400_000

type TileData = {
  value: string
  unit?: string
  meta?: string
  size: 'lead' | 'wide' | 'unit'
}

function positive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function format(value: number | null, digits = 0) {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function todayKey() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_IDS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_IDS
    const available = new Set(WIDGETS.map((widget) => widget.id))
    const valid = parsed.filter((id): id is string => typeof id === 'string' && available.has(id))
    return valid.length ? valid : DEFAULT_IDS
  } catch {
    return DEFAULT_IDS
  }
}

function saveSelection(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* storage unavailable */ }
}

export function HomeBentoWidgetBoard() {
  const { state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<string[]>(loadSelection)
  const [pickerOpen, setPickerOpen] = useState(false)
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

  const snapshot = useMemo(() => {
    const latestSleep = [...(state.sleepLogs ?? [])]
      .filter((entry) => positive(entry?.hours) != null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]

    const foods = (state.foods ?? []).filter((food) => food?.date === todayKey())
    const nutrition = foods.reduce((sum, food) => ({
      kcal: sum.kcal + (food.kcal || 0),
      protein: sum.protein + (food.protein || 0),
    }), { kcal: 0, protein: 0 })

    const now = Date.now()
    const recent = workouts.filter((workout) => {
      const at = Date.parse(workout.mulai)
      return Number.isFinite(at) && now - at <= 7 * DAY
    })

    return {
      steps: positive(vitals.steps),
      sleep: positive(latestSleep?.hours) ?? positive(vitals.sleepH),
      restingHr: positive(vitals.restingHr),
      hrv: positive(vitals.hrvMs),
      vo2: positive(vitals.vo2max),
      recovery: positive(vitals.recoveryPct),
      bodyScore: positive(vitals.bodyScore),
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      workouts7d: recent.length,
      minutes7d: Math.round(recent.reduce((sum, workout) => sum + Math.max(0, workout.durasi || 0), 0) / 60),
      waterMl: (state.wellness?.[todayKey()]?.waterMl ?? 0) || 0,
    }
  }, [state.foods, state.sleepLogs, state.wellness, vitals, workouts])

  const byId = useMemo(() => new Map(WIDGETS.map((widget) => [widget.id, widget])), [])
  const chosen = selected.map((id) => byId.get(id)).filter((widget): widget is WidgetDef => Boolean(widget))

  function dataFor(widget: WidgetDef): TileData {
    switch (widget.id) {
      case 'ringHarian': {
        const value = snapshot.recovery ?? snapshot.bodyScore ?? snapshot.steps
        const unit = snapshot.recovery != null ? '%' : undefined
        const meta = snapshot.recovery != null
          ? 'Recovery'
          : snapshot.bodyScore != null
            ? 'Body score'
            : 'Steps today'
        return { value: format(value), unit, meta, size: 'lead' }
      }
      case 'kebugaran':
      case 'latihanRingkas':
      case 'muatanPekan':
        return {
          value: format(snapshot.workouts7d),
          unit: 'sessions',
          meta: snapshot.minutes7d > 0 ? `${snapshot.minutes7d} min · 7d` : 'Last 7 days',
          size: 'wide',
        }
      case 'giziLebar':
      case 'kaloriBanding':
      case 'tdee':
        return {
          value: format(snapshot.kcal),
          unit: 'kcal',
          meta: snapshot.protein > 0 ? `${Math.round(snapshot.protein)}g protein` : 'Today',
          size: 'wide',
        }
      case 'langkahRingkas':
        return { value: format(snapshot.steps), meta: 'Steps today', size: 'unit' }
      case 'tidurRingkas':
      case 'tidurLebar':
      case 'tidur14':
        return { value: format(snapshot.sleep, 1), unit: 'h', meta: 'Latest sleep', size: 'unit' }
      case 'denyutRingkas':
      case 'nadiPanjang':
        return { value: format(snapshot.restingHr), unit: 'bpm', meta: 'Resting HR', size: 'unit' }
      case 'vo2tren':
      case 'aerobikRingkas':
        return { value: format(snapshot.vo2, 1), meta: 'VO₂ max', size: 'unit' }
      case 'hrv':
        return { value: format(snapshot.hrv), unit: 'ms', meta: 'HRV', size: 'unit' }
      case 'hidrasi2':
        return { value: format(snapshot.waterMl), unit: 'mL', meta: 'Logged today', size: 'unit' }
      case 'pewaktu':
        return { value: '25:00', meta: 'Focus timer', size: 'unit' }
      default:
        return { value: 'Open', meta: widget.kategori, size: 'unit' }
    }
  }

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return WIDGETS
    return WIDGETS.filter((widget) =>
      `${widget.label} ${widget.ringkas} ${widget.kategori}`.toLowerCase().includes(needle),
    )
  }, [query])

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      const safe = next.length ? next : DEFAULT_IDS
      saveSelection(safe)
      return safe
    })
  }

  return (
    <section className="panacea-widget-bento-section" aria-label="Custom bento widgets">
      <div className="panacea-widget-bento-head">
        <span>My bento</span>
        <button type="button" onClick={() => setPickerOpen(true)}>
          Customize · {WIDGETS.length}
        </button>
      </div>

      <div className="panacea-widget-bento-grid">
        {chosen.map((widget) => {
          const data = dataFor(widget)
          return (
            <Link
              key={widget.id}
              to={widget.ke}
              className="panacea-widget-bento-tile"
              data-size={data.size}
              aria-label={`${widget.label}: ${data.value}${data.unit ? ` ${data.unit}` : ''}`}
            >
              <span className="panacea-widget-bento-title">{widget.label}</span>
              <span className="panacea-widget-bento-value">
                {data.value}
                {data.unit ? <small>{data.unit}</small> : null}
              </span>
              <span className="panacea-widget-bento-meta">{data.meta ?? widget.kategori}</span>
              <span className="panacea-widget-bento-arrow" aria-hidden>↗</span>
            </Link>
          )
        })}
      </div>

      {pickerOpen ? (
        <div
          className="panacea-widget-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPickerOpen(false)
          }}
        >
          <section className="panacea-widget-picker" role="dialog" aria-modal="true" aria-label="Customize bento widgets">
            <div className="panacea-widget-picker-head">
              <div>
                <strong>Widget universe</strong>
                <span>{WIDGETS.length} capabilities</span>
              </div>
              <button type="button" onClick={() => setPickerOpen(false)} aria-label="Close widget picker">×</button>
            </div>

            <input
              className="panacea-widget-picker-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search widgets"
              autoFocus
            />

            <div className="panacea-widget-picker-grid">
              {matches.map((widget) => {
                const active = selected.includes(widget.id)
                return (
                  <button
                    key={widget.id}
                    type="button"
                    className="panacea-widget-picker-item"
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

export default HomeBentoWidgetBoard
