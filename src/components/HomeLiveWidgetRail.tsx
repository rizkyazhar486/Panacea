import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'
import { deretMetrik } from '../lib/riwayatVitals'

type SignalDef = {
  key: string
  field: string
  label: string
  unit: string
  to: string
  digits?: number
}

const SIGNALS: SignalDef[] = [
  { key: 'steps', field: 'steps', label: 'Steps', unit: 'steps', to: '/tubuh?t=gerak' },
  { key: 'heartRate', field: 'heartRate', label: 'Heart Rate', unit: 'bpm', to: '/tubuh?t=jantung' },
  { key: 'restingHr', field: 'restingHr', label: 'Resting HR', unit: 'bpm', to: '/tubuh?t=jantung' },
  { key: 'hrvMs', field: 'hrvMs', label: 'HRV', unit: 'ms', to: '/tubuh?t=jantung' },
  { key: 'sleepH', field: 'sleepH', label: 'Sleep', unit: 'h', to: '/pola-tidur', digits: 1 },
  { key: 'spo2Pct', field: 'spo2Pct', label: 'SpO₂', unit: '%', to: '/tubuh', digits: 1 },
  { key: 'respRate', field: 'respRate', label: 'Respiration', unit: '/min', to: '/tubuh', digits: 1 },
  { key: 'bodyTempC', field: 'bodyTempC', label: 'Temperature', unit: '°C', to: '/tubuh', digits: 1 },
  { key: 'vo2max', field: 'vo2max', label: 'VO₂max', unit: 'mL/kg/min', to: '/latihan?t=lab', digits: 1 },
  { key: 'recoveryPct', field: 'recoveryPct', label: 'Recovery', unit: '%', to: '/recovery' },
  { key: 'strain', field: 'strain', label: 'Strain', unit: 'load', to: '/readiness', digits: 1 },
  { key: 'bodyScore', field: 'bodyScore', label: 'Body Score', unit: '/100', to: '/tubuh' },
  { key: 'activeKcal', field: 'activeKcal', label: 'Active Energy', unit: 'kcal', to: '/latihan' },
  { key: 'weightKg', field: 'weightKg', label: 'Weight', unit: 'kg', to: '/tubuh', digits: 1 },
  { key: 'bodyFatPct', field: 'bodyFatPct', label: 'Body Fat', unit: '%', to: '/tubuh', digits: 1 },
  { key: 'leanMassKg', field: 'leanMassKg', label: 'Lean Mass', unit: 'kg', to: '/tubuh', digits: 1 },
  { key: 'bmi', field: 'bmi', label: 'BMI', unit: 'kg/m²', to: '/tubuh', digits: 1 },
  { key: 'skeletalMuscleKg', field: 'skeletalMuscleKg', label: 'Skeletal Muscle', unit: 'kg', to: '/tubuh', digits: 1 },
  { key: 'bodyWaterPct', field: 'bodyWaterPct', label: 'Body Water', unit: '%', to: '/tubuh', digits: 1 },
  { key: 'bodyAge', field: 'bodyAge', label: 'Body Age', unit: 'yr', to: '/tubuh' },
  { key: 'exerciseMin', field: 'exerciseMin', label: 'Exercise', unit: 'min', to: '/latihan' },
  { key: 'distanceKm', field: 'distanceKm', label: 'Distance', unit: 'km', to: '/latihan', digits: 1 },
  { key: 'flightsClimbed', field: 'flightsClimbed', label: 'Flights', unit: 'floors', to: '/tubuh?t=gerak' },
  { key: 'standHours', field: 'standHours', label: 'Stand', unit: 'h', to: '/tubuh?t=gerak', digits: 1 },
  { key: 'daylightMin', field: 'daylightMin', label: 'Daylight', unit: 'min', to: '/harian' },
  { key: 'cardioRecoveryBpm', field: 'cardioRecoveryBpm', label: 'Cardio Recovery', unit: 'bpm', to: '/latihan?t=analisis' },
  { key: 'walkingSpeedKmh', field: 'walkingSpeedKmh', label: 'Walking Speed', unit: 'km/h', to: '/tubuh?t=gerak', digits: 1 },
  { key: 'sixMinWalkM', field: 'sixMinWalkM', label: '6-Min Walk', unit: 'm', to: '/tubuh?t=gerak' },
  { key: 'runningPowerW', field: 'runningPowerW', label: 'Running Power', unit: 'W', to: '/latihan?t=analisis' },
  { key: 'runningSpeedKmh', field: 'runningSpeedKmh', label: 'Running Speed', unit: 'km/h', to: '/latihan?t=analisis', digits: 1 },
  { key: 'runningStrideLengthM', field: 'runningStrideLengthM', label: 'Stride Length', unit: 'm', to: '/latihan?t=analisis', digits: 2 },
  { key: 'runningGroundContactMs', field: 'runningGroundContactMs', label: 'Ground Contact', unit: 'ms', to: '/latihan?t=analisis' },
  { key: 'runningVerticalOscCm', field: 'runningVerticalOscCm', label: 'Vertical Osc.', unit: 'cm', to: '/latihan?t=analisis', digits: 1 },
]

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function format(value: number | undefined, digits = 0): string {
  if (value == null) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function trend(field: string) {
  const points = deretMetrik(field, 14).slice(-14).filter((p) => Number.isFinite(p.nilai))
  if (points.length < 2) return { polyline: '', delta: '' }

  const values = points.map((p) => p.nilai)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1e-6)
  const polyline = points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * 100
      const y = 30 - ((p.nilai - min) / span) * 24
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const first = values[0]
  const last = values[values.length - 1]
  const delta = first === 0 ? '' : `${last >= first ? '↑' : '↓'}${Math.abs(((last - first) / first) * 100).toFixed(0)}%`
  return { polyline, delta }
}

export function HomeLiveWidgetRail() {
  const vitals = getVitals() as unknown as Record<string, unknown>

  return (
    <section aria-labelledby="home-live-widget-rail-title" className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#00BF63]">33 live instruments</div>
          <h3 id="home-live-widget-rail-title" className="mt-0.5 text-[15px] font-black tracking-[-.02em] text-white">
            Swipe your health signals
          </h3>
        </div>
        <Link to="/health-data" className="shrink-0 text-[10px] font-black text-[#00BF63]">Data ↗</Link>
      </div>

      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2" aria-label="Scrollable live health widgets">
        {SIGNALS.map((signal) => {
          const value = number(vitals[signal.key])
          const history = trend(signal.field)
          return (
            <Link
              key={signal.key}
              to={signal.to}
              className="dark group relative min-h-[148px] w-[148px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-[#00BF63]/35 bg-black p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] transition active:scale-[.97]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[.13em] text-[#00BF63]">{signal.label}</span>
                <span className="text-[10px] font-black text-white/55" aria-label={history.delta ? `14-day change ${history.delta}` : 'Not enough history'}>
                  {history.delta || 'LIVE'}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <strong className="text-[27px] font-black leading-none tracking-[-.045em] tabular-nums">
                  {format(value, signal.digits)}
                </strong>
                {value != null && <span className="max-w-[58px] truncate text-[8px] font-bold text-white/65">{signal.unit}</span>}
              </div>

              <div className="mt-3 h-[38px] w-full">
                {history.polyline ? (
                  <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`${signal.label} recorded trend`}>
                    <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <polyline
                      points={history.polyline}
                      fill="none"
                      stroke="#00BF63"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                ) : (
                  <div className="flex h-full items-center text-[9px] font-bold text-white/45">Trend after 2 records</div>
                )}
              </div>

              <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[8px] font-black uppercase tracking-[.1em] text-white/50">
                <span>Recorded</span>
                <span className="text-[#00BF63] transition group-active:translate-x-0.5">Open →</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default HomeLiveWidgetRail
