import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { trackProductEvent } from '../lib/productLearning'
import { IconHeart, IconMoon, IconPlus, IconRun } from './icons'
import '../styles/home-human-interface.css'

function num(value: number | undefined, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return digits ? value.toFixed(digits) : Math.round(value).toLocaleString()
}

type Instrument = {
  key: string
  label: string
  value: string
  unit?: string
  to: string
  icon: typeof IconRun
}

function ConnectionStatusGlyph({ online }: { online: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.8 9.2a7.2 7.2 0 0 1 8.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity={online ? 1 : .38} />
      <path d="M4.8 12a4.2 4.2 0 0 1 4.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity={online ? 1 : .38} />
      <circle cx="7" cy="15" r="1.1" fill="currentColor" opacity={online ? 1 : .38} />
      <rect x="13" y="6" width="8" height="12" rx="2.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.6 3.8h2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="15.3" y="13.2" width="3.4" height="2.6" rx=".8" fill="currentColor" opacity={online ? .9 : .28} />
    </svg>
  )
}

export function HomeHealthBrief() {
  const { state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1)
    const markOnline = () => setOnline(true)
    const markOffline = () => setOnline(false)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  useEffect(() => {
    trackProductEvent({ name: 'health_brief_view', surface: 'home_health_brief' })
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const latestSleep = useMemo(() => [...(state.sleepLogs ?? [])]
    .filter((item) => typeof item?.hours === 'number' && item.hours > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0], [state.sleepLogs])

  const sleep = typeof latestSleep?.hours === 'number'
    ? latestSleep.hours
    : (typeof vitals.sleepH === 'number' ? vitals.sleepH : undefined)
  const steps = typeof vitals.steps === 'number' && vitals.steps >= 0 ? vitals.steps : undefined
  const restingHr = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? vitals.restingHr : undefined
  const vo2max = typeof vitals.vo2max === 'number' && vitals.vo2max > 0 ? vitals.vo2max : undefined
  const source = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source.trim() : 'Health data'
  const date = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()),
    [],
  )

  const instruments: Instrument[] = [
    { key: 'steps', label: 'Steps', value: num(steps), to: '/tubuh?t=gerak', icon: IconRun },
    { key: 'sleep', label: 'Sleep', value: num(sleep, 1), unit: 'h', to: '/tubuh?t=tidur', icon: IconMoon },
    { key: 'heart', label: 'Rest HR', value: num(restingHr), unit: 'bpm', to: '/tubuh?t=jantung', icon: IconHeart },
    { key: 'vo2', label: 'VO₂max', value: num(vo2max, 1), to: '/latihan?t=lab', icon: IconRun },
  ]

  const primary = instruments[0]
  const availableCount = instruments.filter((instrument) => instrument.value !== '—').length

  return (
    <section
      data-panacea-instrument-strip
      className="panacea-instrument-strip"
      aria-label="Today health instruments"
    >
      <div className="panacea-instrument-head">
        <span className="panacea-instrument-date">{date}</span>
        <Link
          to="/health-data"
          className="panacea-instrument-status"
          data-online={online ? 'true' : 'false'}
          aria-label={`${online ? 'Online' : 'Offline'}. Open connected health data. Current source: ${source}`}
          title={`${online ? 'Online' : 'Offline'} · ${source}`}
          onClick={() => trackProductEvent({ name: 'feature_open', surface: 'home_health_brief', target: 'connected-health-data' })}
        >
          <ConnectionStatusGlyph online={online} />
        </Link>
      </div>

      <div className="panacea-instrument-rail">
        <Link
          to={primary.to}
          className="panacea-signal-ring"
          aria-label={`${primary.label} ${primary.value}. ${availableCount} of ${instruments.length} health signals currently available.`}
          onClick={() => trackProductEvent({ name: 'health_brief_signal_open', surface: 'home_health_brief', target: primary.key })}
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="panacea-signal-ring-track" cx="60" cy="60" r="48" />
            {instruments.map((instrument, index) => (
              <circle
                key={instrument.key}
                className="panacea-signal-segment"
                data-signal={instrument.key}
                data-available={instrument.value !== '—' ? 'true' : 'false'}
                cx="60"
                cy="60"
                r="48"
                pathLength="100"
                strokeDasharray="18 82"
                strokeDashoffset={-(index * 25)}
              />
            ))}
          </svg>
          <span className="panacea-signal-ring-copy">
            <span className="panacea-signal-ring-kicker">{primary.label}</span>
            <span className="panacea-signal-ring-value">{primary.value}</span>
            <span className="panacea-signal-ring-meta">{availableCount}/{instruments.length} signals</span>
          </span>
        </Link>

        <div className="panacea-instrument-grid">
          {instruments.slice(1).map(({ key, label, value, unit, to, icon: Icon }) => (
            <Link
              key={key}
              to={to}
              className="panacea-instrument-mini"
              aria-label={`${label} ${value}${unit ? ` ${unit}` : ''}`}
              onClick={() => trackProductEvent({ name: 'health_brief_signal_open', surface: 'home_health_brief', target: key })}
            >
              <span className="panacea-instrument-mini-main">
                <span className="panacea-instrument-mini-label"><Icon size={13} />{label}</span>
                <span className="panacea-instrument-mini-value">
                  <span>{value}</span>
                  {unit ? <span className="panacea-instrument-unit">{unit}</span> : null}
                </span>
              </span>
            </Link>
          ))}

          <Link
            to="/harian"
            className="panacea-instrument-checkin"
            aria-label="Log today"
            onClick={() => trackProductEvent({ name: 'daily_log_open', surface: 'home_health_brief', target: 'log-today' })}
          >
            <IconPlus size={17} />
            <span>Log</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeHealthBrief
