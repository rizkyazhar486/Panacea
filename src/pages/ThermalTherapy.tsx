import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { hariLalu, hariIni } from '../lib/tanggal'
import '../styles/thermal-recovery.css'

type ThermalMode = 'spa' | 'sauna' | 'steam' | 'jacuzzi' | 'hot' | 'cold' | 'onsen'
type ThermalFamily = 'mixed' | 'heat' | 'water' | 'cold'

interface Session {
  date: string
  kind: ThermalMode
}

interface ModeMeta {
  kind: ThermalMode
  label: string
  family: ThermalFamily
  accent: string
  cue: string
  evidence: string
  safety: string
}

const MODES: readonly ModeMeta[] = [
  {
    kind: 'spa',
    label: 'Spa',
    family: 'mixed',
    accent: '#66e3a6',
    cue: 'A recovery setting that may combine heat, water, massage and rest.',
    evidence: 'Spa is an umbrella setting rather than one standardized exposure. Track the actual modality used instead of assuming one universal effect.',
    safety: 'Choose each heat, water or cold exposure according to its own safety limits. Stop if you feel faint, unwell or unusually short of breath.',
  },
  {
    kind: 'sauna',
    label: 'Sauna',
    family: 'heat',
    accent: '#ff8b52',
    cue: 'Dry heat.',
    evidence: 'Frequent sauna bathing was associated with lower fatal cardiovascular and all-cause mortality in a Finnish observational cohort; association is not proof of causation.',
    safety: 'Hydrate, avoid alcohol, and leave immediately if dizzy or unwell. People with unstable cardiovascular disease or pregnancy should seek individualized medical advice.',
  },
  {
    kind: 'steam',
    label: 'Steam',
    family: 'heat',
    accent: '#b7a1ff',
    cue: 'Humid heat.',
    evidence: 'Steam-room exposure is a different thermal environment from dry sauna. Do not transfer sauna cohort outcome estimates directly to steam sessions.',
    safety: 'Humidity can make heat feel more intense. Keep the exposure conservative, hydrate and stop if light-headed.',
  },
  {
    kind: 'jacuzzi',
    label: 'Jacuzzi',
    family: 'water',
    accent: '#52d7ff',
    cue: 'Warm-water immersion.',
    evidence: 'Warm-water immersion changes temperature and circulation differently from sauna. Treat it as a distinct recovery modality rather than an equivalent evidence dose.',
    safety: 'Avoid overheating, intoxication and prolonged unsupervised immersion. Exit if you become dizzy, sleepy or nauseated.',
  },
  {
    kind: 'hot',
    label: 'Hot',
    family: 'heat',
    accent: '#ffb04e',
    cue: 'General heat exposure.',
    evidence: 'Heat exposure is not one standardized intervention. Temperature, humidity, duration and body surface exposure all change the physiologic load.',
    safety: 'Use a conservative dose, hydrate and stop for headache, dizziness, chest discomfort or unusual breathlessness.',
  },
  {
    kind: 'cold',
    label: 'Cold',
    family: 'cold',
    accent: '#63bcff',
    cue: 'Cooling or cold-water exposure.',
    evidence: 'Cold-water immersion causes a strong acute respiratory and cardiovascular response. Evidence for routine wellness benefits is more context-specific than many social-media claims suggest.',
    safety: 'Never use unsupervised open-water or deep cold immersion. Cold shock can be dangerous, especially with cardiovascular or blood-pressure disease.',
  },
  {
    kind: 'onsen',
    label: 'Onsen',
    family: 'water',
    accent: '#7edfcf',
    cue: 'Hot-water soaking.',
    evidence: 'Onsen and hot-bath routines vary by mineral content, temperature and duration. Do not equate them automatically with sauna or one standardized heat protocol.',
    safety: 'Avoid very hot water, alcohol and prolonged immersion. Enter and exit slowly, especially if you are prone to low blood pressure.',
  },
] as const

const LS_KEY = 'pmd_thermal_v2'
const LEGACY_KEY = 'pmd_thermal_v1'
const MODE_SET = new Set<ThermalMode>(MODES.map((mode) => mode.kind))

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? localStorage.getItem(LEGACY_KEY) ?? '[]'
    const parsed = JSON.parse(raw) as Array<Partial<Session>>
    return parsed
      .filter((item): item is Session => typeof item?.date === 'string' && MODE_SET.has(item.kind as ThermalMode))
      .slice(0, 240)
  } catch {
    return []
  }
}

function modeGlyph(mode: ThermalMode) {
  if (mode === 'cold') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 7v34M10 15l28 18M38 15 10 33M17 10l7 5 7-5M17 38l7-5 7 5" />
      </svg>
    )
  }
  if (mode === 'sauna' || mode === 'steam' || mode === 'hot') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M15 38c-6-8 7-11 0-20M24 38c-6-8 7-11 0-20M33 38c-6-8 7-11 0-20" />
      </svg>
    )
  }
  if (mode === 'jacuzzi' || mode === 'onsen') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 28c5-5 9 5 14 0s9 5 14 0 8 4 8 4M8 35c4-4 8 4 12 0s8 4 12 0 8 3 8 3" />
        {mode === 'onsen' ? <path d="M12 23 24 11l12 12" /> : null}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 40c-9-6-14-13-13-22 7 0 12 3 13 9 1-6 6-9 13-9 1 9-4 16-13 22Z" />
      <path d="M24 27v13" />
    </svg>
  )
}

function shortDay(date: string) {
  const d = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(d)
}

export function ThermalTherapy() {
  const location = useLocation()
  const requested = new URLSearchParams(location.search).get('mode') as ThermalMode | null
  const [activeMode, setActiveMode] = useState<ThermalMode>(() => (requested && MODE_SET.has(requested) ? requested : 'sauna'))
  const [sessions, setSessions] = useState<Session[]>(loadSessions)

  useEffect(() => {
    if (requested && MODE_SET.has(requested)) setActiveMode(requested)
  }, [requested])

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sessions)) } catch { /* storage unavailable */ }
  }, [sessions])

  const active = MODES.find((mode) => mode.kind === activeMode) ?? MODES[1]
  const today = hariIni()
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => hariLalu(6 - index)), [])
  const weekStart = weekDays[0]
  const week = sessions.filter((session) => session.date >= weekStart)
  const modeCount = week.filter((session) => session.kind === activeMode).length
  const heatCount = week.filter((session) => MODES.find((mode) => mode.kind === session.kind)?.family === 'heat').length
  const waterCount = week.filter((session) => MODES.find((mode) => mode.kind === session.kind)?.family === 'water').length
  const coldCount = week.filter((session) => session.kind === 'cold').length

  const log = () => {
    setSessions((previous) => [{ date: today, kind: activeMode }, ...previous].slice(0, 240))
  }

  return (
    <section
      className="thermal-recovery"
      style={{ '--tr-accent': active.accent } as CSSProperties}
      aria-label="Thermal recovery"
    >
      <div className="thermal-mode-rail" role="tablist" aria-label="Recovery modalities">
        {MODES.map((mode) => (
          <button
            key={mode.kind}
            type="button"
            role="tab"
            aria-selected={mode.kind === activeMode}
            aria-pressed={mode.kind === activeMode}
            className="thermal-mode-button"
            style={{ '--tr-accent': mode.accent } as CSSProperties}
            onClick={() => setActiveMode(mode.kind)}
          >
            {modeGlyph(mode.kind)}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="thermal-hero">
        <div className="thermal-visual" aria-hidden>
          <svg viewBox="0 0 260 170">
            <path className="track" d="M35 126C64 44 196 44 225 126" pathLength="100" />
            <path className="active" d="M35 126C64 44 196 44 225 126" pathLength="100" strokeDasharray={`${Math.min(92, 28 + modeCount * 13)} 100`} />
            <path className="thermal-wave" d="M42 132c20-16 38 16 58 0s38 16 58 0 38 16 58 0" />
            <circle className="thermal-pulse-dot" cx={52 + Math.min(150, modeCount * 24)} cy="91" r="5" />
          </svg>
        </div>

        <div className="thermal-hero-copy">
          <span className="thermal-kicker">Recovery · {active.family}</span>
          <h2 className="thermal-title">{active.label}</h2>
          <div className="thermal-count">{modeCount}<small>this week</small></div>
          <p className="thermal-one-line" title={active.cue}>{active.cue}</p>

          <div className="thermal-actions">
            <button type="button" onClick={log} className="thermal-log" aria-label={`Log ${active.label} session today`}>
              <span aria-hidden>＋</span> Log
            </button>
            <details className="thermal-info">
              <summary aria-label={`Evidence and safety for ${active.label}`}>i</summary>
              <div className="thermal-info-panel">
                <strong>Evidence</strong>
                <p>{active.evidence}</p>
                <strong>Safety</strong>
                <p>{active.safety}</p>
                <strong>Counting formula</strong>
                <p>Weekly sessions = Σ 1(session date within the latest 7 calendar days). It is an activity count, not a recovery score.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="thermal-week" aria-label="Last seven days">
        {weekDays.map((day) => {
          const count = sessions.filter((session) => session.date === day && session.kind === activeMode).length
          return (
            <div key={day} className="thermal-day" data-count={String(Math.min(3, count))}>
              <span className="thermal-day-bars" aria-hidden>
                {Array.from({ length: 7 }).map((_, index) => (
                  <i key={index} style={{ height: `${22 + ((index + count) % 5) * 13}%` }} />
                ))}
              </span>
              <label title={day}>{shortDay(day)}</label>
            </div>
          )
        })}
      </div>

      <div className="thermal-recent" aria-label="Recovery summary">
        <span className="thermal-chip">Heat {heatCount}</span>
        <span className="thermal-chip">Water {waterCount}</span>
        <span className="thermal-chip">Cold {coldCount}</span>
        {sessions.slice(0, 10).map((session, index) => (
          <span key={`${session.date}-${session.kind}-${index}`} className="thermal-chip">
            {MODES.find((mode) => mode.kind === session.kind)?.label ?? session.kind} · {session.date.slice(5)}
          </span>
        ))}
      </div>

      <details className="thermal-info mt-3">
        <summary aria-label="References">i</summary>
        <div className="thermal-info-panel">
          <strong>References</strong>
          <p>Laukkanen T, et al. JAMA Internal Medicine. 2015;175(4):542-548 — observational sauna-bathing associations.</p>
          <p>Tipton MJ, Collier N, Massey H, Corbett J, Harper M. Experimental Physiology. 2017;102(11):1335-1355 — review of cold-water immersion physiology and risk.</p>
          <p>Spa, steam, jacuzzi, general heat and onsen are intentionally not assigned the sauna cohort effect estimate because the exposures are not equivalent.</p>
        </div>
      </details>
    </section>
  )
}

export default ThermalTherapy
