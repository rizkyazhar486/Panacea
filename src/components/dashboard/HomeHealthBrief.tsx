import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/bootVitals'
import { deretMetrik } from '../../lib/riwayatVitals'
import { IconHeart, IconMoon, IconPlus, IconRun } from '../icons'
import '../../styles/home-human-interface.css'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'
import { glanceMetric, type GlanceMetricId } from '../../domains/personal-health/engine/glance/glanceMetrics.ts'
import type { DayValue } from '../../domains/personal-health/engine/glance/metricInsight.ts'
import { POSITION_SHORT } from '../../domains/personal-health/engine/glance/insightText.ts'
import { localDayOf, weekGlance } from '../../domains/personal-health/engine/glance/weekGlance.ts'
import { MicroTrend } from '../../domains/personal-health/ui/glance/MicroTrend.tsx'
import { useDarkClass } from '../../domains/personal-health/ui/glance/useDarkClass.ts'

// The chart, the window's numbers and every day as a table load only when a tile is opened.
const MetricInsightSheet = lazy(() => import('../../domains/personal-health/ui/glance/MetricInsightSheet.tsx'))

const tileButton: CSSProperties = { font: 'inherit', textAlign: 'left', cursor: 'pointer', width: '100%' }
const chipStyle: CSSProperties = { display: 'block', marginTop: 5, fontSize: 10, fontWeight: 750, letterSpacing: '.01em', opacity: 0.72, whiteSpace: 'nowrap' }

function num(value: number | undefined, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return digits ? value.toFixed(digits) : Math.round(value).toLocaleString()
}

type Instrument = {
  key: string
  metric: GlanceMetricId
  label: string
  value: string
  unit?: string
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
  const { state, activePatient } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const [bleNote, setBleNote] = useState<string | null>(null)
  const [bleBusy, setBleBusy] = useState(false)

  const handleQuickWearable = async () => {
    setBleBusy(true)
    try {
      const mod = await import('../../domains/devices/adapters/quickConnectSession')
      await mod.triggerQuickWearableConnect((next) => {
        setBleNote(next.message)
        if (next.status === 'connected') setRefresh((v) => v + 1)
      })
    } finally {
      setBleBusy(false)
    }
  }

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1)
    const markOnline = () => setOnline(true)
    const markOffline = () => setOnline(false)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('panacea:body-character-updated', update)
    window.addEventListener('focus', update)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('panacea:body-character-updated', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  const vitals = useMemo(
    () =>
      readUnifiedLocalVitals(state.account, {
        patient: activePatient,
        patientVitals: activePatient ? state.vitals[activePatient.id] : undefined,
        sleepLogs: state.sleepLogs,
      }),
    [refresh, state.account, activePatient, state.vitals, state.sleepLogs],
  )
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
    { key: 'steps', metric: 'steps', label: 'Steps', value: num(steps), icon: IconRun },
    { key: 'sleep', metric: 'sleepH', label: 'Sleep', value: num(sleep, 1), unit: 'h', icon: IconMoon },
    { key: 'heart', metric: 'restingHr', label: 'Rest HR', value: num(restingHr), unit: 'bpm', icon: IconHeart },
    { key: 'vo2', metric: 'vo2max', label: 'VO₂max', value: num(vo2max, 1), icon: IconRun },
  ]

  // Recorded daily history per signal (oldest first), re-read whenever health data changes.
  const today = useMemo(() => localDayOf(new Date()), [refresh])
  const series = useMemo(() => Object.fromEntries(instruments.map(({ metric }) => [
    metric, deretMetrik(metric, 120).map((day) => ({ date: day.tanggal, value: day.nilai })),
  ])) as Record<GlanceMetricId, DayValue[]>, [refresh]) // eslint-disable-line react-hooks/exhaustive-deps
  const glance = useMemo(() => Object.fromEntries(instruments.map(({ metric }) => [metric, weekGlance(metric, series[metric], today)])) as
    Record<GlanceMetricId, ReturnType<typeof weekGlance>>, [series, today]) // eslint-disable-line react-hooks/exhaustive-deps
  const dark = useDarkClass()

  // One sheet at a time; closing it returns focus to the tile that opened it.
  const [open, setOpen] = useState<GlanceMetricId | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const openSheet = (metric: GlanceMetricId, from: HTMLElement) => { opener.current = from; setOpen(metric) }
  const closeSheet = useCallback(() => {
    setOpen(null)
    const target = opener.current
    if (target) requestAnimationFrame(() => target.focus())
  }, [])
  const describe = (instrument: Instrument) => {
    const position = glance[instrument.metric]?.position
    const reading = `${instrument.label} ${instrument.value}${instrument.unit && instrument.value !== '—' ? ` ${instrument.unit}` : ''}`
    return `${reading}${position ? `, ${POSITION_SHORT[position].replace(/^[^A-Za-z]+/, '').toLowerCase()}` : ''}. Open its history.`
  }

  const primary = instruments[0]
  const availableCount = instruments.filter((instrument) => instrument.value !== '—').length

  return (
    <section
      data-panacea-instrument-strip
      className="panacea-instrument-strip h-full flex flex-col justify-between"
      aria-label="Today health instruments"
    >
      <BatasKlaimKesehatan permukaan="wellness.home-brief" />
      <div className="panacea-instrument-head">
        <span className="panacea-instrument-date">{date}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => void handleQuickWearable()}
            disabled={bleBusy}
            data-testid="home-auto-connect-wearable"
            className="text-emerald-700 dark:text-[#00BF63]"
            title={bleNote ?? '1-Click Auto-Connect Paired Bluetooth Wearable'}
            style={{
              font: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid rgba(0, 191, 99, 0.35)',
              background: 'rgba(0, 191, 99, 0.12)',
              cursor: 'pointer',
              minHeight: 44,
              whiteSpace: 'nowrap',
            }}
          >
            {bleBusy ? 'Connecting…' : '⚡ Auto-Connect Wearable'}
          </button>
          <Link
            to="/health-data"
            className="panacea-instrument-status"
            data-online={online ? 'true' : 'false'}
            aria-label={`${online ? 'Online' : 'Offline'}. Open connected health data. Current source: ${source}`}
            title={`${online ? 'Online' : 'Offline'} · ${source}`}
          >
            <ConnectionStatusGlyph online={online} />
          </Link>
        </div>
      </div>
      {bleNote && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#00BF63', marginTop: 4 }}>{bleNote}</div>
      )}

      <div className="panacea-instrument-rail flex-1">
        <button
          type="button"
          onClick={(event) => openSheet(primary.metric, event.currentTarget)}
          className="panacea-signal-ring h-full"
          style={tileButton}
          aria-label={`${describe(primary)} ${availableCount} of ${instruments.length} health signals currently available.`}
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
            {glance.steps?.position && <span style={{ ...chipStyle, marginTop: 3 }}>{POSITION_SHORT[glance.steps.position]}</span>}
          </span>
          {glance.steps?.stats && (
            <span aria-hidden="true" style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
              <MicroTrend metric={glance.steps.metric} points={glance.steps.points} dark={dark} height={22} />
            </span>
          )}
        </button>

        <div className="panacea-instrument-grid h-full">
          {instruments.slice(1).map((instrument) => {
            const { key, metric, label, value, unit, icon: Icon } = instrument
            const week = glance[metric]
            const spec = glanceMetric(metric)
            return (
              <button
                key={key}
                type="button"
                onClick={(event) => openSheet(metric, event.currentTarget)}
                className="panacea-instrument-mini h-full"
                style={tileButton}
                aria-label={describe(instrument)}
              >
                <span className="panacea-instrument-mini-main" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <span className="panacea-instrument-mini-label"><Icon size={13} />{label}</span>
                  <span className="panacea-instrument-mini-value">
                    <span>{value}</span>
                    {unit ? <span className="panacea-instrument-unit">{unit}</span> : null}
                  </span>
                  {week && spec && week.stats && (
                    <span aria-hidden="true" style={{ display: 'block', marginTop: 7 }}>
                      <MicroTrend metric={spec} points={week.points} dark={dark} />
                    </span>
                  )}
                  {week?.position && <span aria-hidden="true" style={chipStyle}>{POSITION_SHORT[week.position]}</span>}
                </span>
              </button>
            )
          })}

          <Link to="/harian" className="panacea-instrument-checkin h-full" aria-label="Log today">
            <IconPlus size={17} />
            <span>Log</span>
          </Link>
        </div>
      </div>
      {open && (
        <Suspense fallback={null}>
          <MetricInsightSheet
            metricId={open}
            series={series[open]}
            today={today}
            onClose={closeSheet}
            boundary={<BatasKlaimKesehatan permukaan="wellness.home-brief" />}
          />
        </Suspense>
      )}
    </section>
  )
}

export default HomeHealthBrief
