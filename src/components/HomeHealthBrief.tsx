import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { IconHeart, IconMoon, IconPlus, IconRun, IconUpload } from './icons'
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
  primary?: boolean
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
    { key: 'steps', label: 'Steps', value: num(steps), to: '/tubuh?t=gerak', icon: IconRun, primary: true },
    { key: 'sleep', label: 'Sleep', value: num(sleep, 1), unit: 'h', to: '/tubuh?t=tidur', icon: IconMoon },
    { key: 'heart', label: 'Rest HR', value: num(restingHr), unit: 'bpm', to: '/tubuh?t=jantung', icon: IconHeart },
    { key: 'vo2', label: 'VO₂max', value: num(vo2max, 1), to: '/latihan?t=lab', icon: IconRun },
  ]

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
          className="panacea-instrument-sync"
          aria-label={`Open connected health data. Current source: ${source}`}
          title={source}
        >
          <IconUpload size={17} />
        </Link>
      </div>

      <div className="panacea-instrument-rail">
        {instruments.map(({ key, label, value, unit, to, icon: Icon, primary }) => (
          <Link
            key={key}
            to={to}
            className={`panacea-instrument-cell${primary ? ' panacea-instrument-primary' : ''}`}
            aria-label={`${label} ${value}${unit ? ` ${unit}` : ''}`}
          >
            <span className="panacea-instrument-kicker"><Icon size={15} />{label}</span>
            <span className="panacea-instrument-value">
              {value}
              {unit ? <span className="panacea-instrument-unit">{unit}</span> : null}
            </span>
          </Link>
        ))}

        <Link to="/harian" className="panacea-instrument-checkin" aria-label="Log today">
          <IconPlus size={20} />
        </Link>
      </div>
    </section>
  )
}

export default HomeHealthBrief
