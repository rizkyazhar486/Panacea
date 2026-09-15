import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Vitals } from '../lib/healthVitals'
import { vitalsAge } from '../lib/healthVitals'
import { ambilRiwayat, deretMetrik } from '../lib/riwayatVitals'
import '../styles/home-overview-mosaic-v43.css'

type MetricKey = Extract<keyof Vitals, string>

type SystemGroup = {
  label: string
  short: string
  keys: MetricKey[]
  to: string
}

const GROUPS: SystemGroup[] = [
  { label: 'Recovery', short: 'REC', keys: ['recoveryPct', 'sleepH', 'hrvMs'], to: '/recovery' },
  { label: 'Cardio', short: 'CV', keys: ['restingHr', 'spo2Pct', 'respRate', 'vo2max'], to: '/tubuh?t=jantung' },
  { label: 'Movement', short: 'MOVE', keys: ['steps', 'activeKcal', 'exerciseMin', 'distanceKm'], to: '/latihan' },
  { label: 'Body', short: 'BODY', keys: ['weightKg', 'bodyFatPct', 'bodyTempC', 'bodyScore'], to: '/body' },
]

const OVERVIEW_KEYS: MetricKey[] = [...new Set(GROUPS.flatMap((group) => group.keys))]
const CONTINUITY_KEYS = ['steps', 'hrvMs', 'activeKcal'] as const

function numeric(vitals: Vitals, key: MetricKey): number | undefined {
  const value = vitals[key]
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function value(v: number | undefined, digits = 0): string {
  if (v == null) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function metric(vitals: Vitals, key: MetricKey, unit: string, digits = 0): string {
  const n = numeric(vitals, key)
  return n == null ? '—' : `${value(n, digits)}${unit}`
}

function available(vitals: Vitals, keys: MetricKey[]): number {
  return keys.reduce<number>((total, key) => total + (numeric(vitals, key) != null ? 1 : 0), 0)
}

function MiniMetric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pmd-overview-mini">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

function AvailabilityPill({ vitals, group }: { vitals: Vitals; group: SystemGroup }) {
  const count = available(vitals, group.keys)
  return (
    <Link to={group.to} className="pmd-overview-system-pill" aria-label={`${group.label}: ${count} of ${group.keys.length} overview inputs recorded`}>
      <span className={count > 0 ? 'is-live' : ''} aria-hidden />
      <b>{group.short}</b>
      <small>{count}/{group.keys.length}</small>
    </Link>
  )
}

export function HomeOverviewMosaic({ vitals }: { vitals: Vitals }) {
  const recorded = available(vitals, OVERVIEW_KEYS)
  const coverage = Math.round((recorded / Math.max(1, OVERVIEW_KEYS.length)) * 100)
  const source = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source.trim() : 'No source recorded'
  const freshness = vitalsAge(vitals) ?? 'Sync time unavailable'
  const recentHistory = ambilRiwayat().slice(-7)
  const stepDays = deretMetrik('steps', 7).length
  const hrvDays = deretMetrik('hrvMs', 7).length
  const activeDays = deretMetrik('activeKcal', 7).length
  const historyDays = recentHistory.filter((day) =>
    CONTINUITY_KEYS.some((key) => typeof day.nilai[key] === 'number'),
  ).length

  const constellation = [
    { label: 'Sleep', key: 'sleepH' as MetricKey, text: metric(vitals, 'sleepH', 'h', 1) },
    { label: 'HRV', key: 'hrvMs' as MetricKey, text: metric(vitals, 'hrvMs', ' ms') },
    { label: 'RHR', key: 'restingHr' as MetricKey, text: metric(vitals, 'restingHr', ' bpm') },
    { label: 'O₂', key: 'spo2Pct' as MetricKey, text: metric(vitals, 'spo2Pct', '%') },
    { label: 'Steps', key: 'steps' as MetricKey, text: metric(vitals, 'steps', '') },
    { label: 'VO₂', key: 'vo2max' as MetricKey, text: metric(vitals, 'vo2max', '', 1) },
  ]

  return (
    <section className="pmd-overview" aria-labelledby="pmd-overview-title" data-ui="overview-mosaic-v44">
      <div className="pmd-overview-head">
        <div>
          <span>OVERVIEW · LIVE MOSAIC</span>
          <h2 id="pmd-overview-title">One glance, more dimensions.</h2>
        </div>
        <div className="pmd-overview-head-meta"><b>{recorded}</b> signals available <span aria-hidden>↔</span></div>
      </div>

      <div className="pmd-overview-rail no-scrollbar" aria-label="Scrollable overview widgets">
        <article className="pmd-overview-card pmd-overview-orbit-card">
          <div className="pmd-overview-card-top"><span>Signal constellation</span><b>01</b></div>
          <div className="pmd-overview-orbit" style={{ '--coverage': `${coverage}%` } as CSSProperties}>
            <div className="pmd-overview-orbit-core">
              <strong>{coverage}%</strong>
              <small>overview fields</small>
            </div>
            {constellation.map((item, index) => (
              <div key={item.label} className={`pmd-overview-node node-${index + 1} ${numeric(vitals, item.key) != null ? 'is-live' : ''}`} title={`${item.label}: ${item.text}`}>
                <span>{item.label}</span>
                <b>{item.text}</b>
              </div>
            ))}
          </div>
          <p>Coverage = recorded overview fields ÷ supported fields. It is data completeness, not a health score.</p>
        </article>

        <article className="pmd-overview-card pmd-overview-recovery-card">
          <div className="pmd-overview-card-top"><span>Sleep architecture</span><b>02</b></div>
          <div className="pmd-overview-focus-value">
            <small>RECORDED SLEEP</small>
            <strong>{metric(vitals, 'sleepH', ' h', 1)}</strong>
            <span>stage durations from the connected source</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="Deep">{metric(vitals, 'sleepDeepH', ' h', 1)}</MiniMetric>
            <MiniMetric label="REM">{metric(vitals, 'sleepRemH', ' h', 1)}</MiniMetric>
            <MiniMetric label="Core">{metric(vitals, 'sleepCoreH', ' h', 1)}</MiniMetric>
            <MiniMetric label="Awake">{metric(vitals, 'sleepAwakeH', ' h', 1)}</MiniMetric>
          </div>
          <Link to="/recovery" className="pmd-overview-card-link">Sleep & recovery context <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-cardio-card">
          <div className="pmd-overview-card-top"><span>Hemodynamic snapshot</span><b>03</b></div>
          <div className="pmd-overview-heart-field" aria-hidden>
            <span className="pulse pulse-a" />
            <span className="pulse pulse-b" />
            <span className="pulse pulse-c" />
            <strong>♥</strong>
          </div>
          <div className="pmd-overview-mini-grid is-dense">
            <MiniMetric label="Systolic">{metric(vitals, 'systolic', ' mmHg')}</MiniMetric>
            <MiniMetric label="Diastolic">{metric(vitals, 'diastolic', ' mmHg')}</MiniMetric>
            <MiniMetric label="Heart rate">{metric(vitals, 'heartRate', ' bpm')}</MiniMetric>
            <MiniMetric label="Cardio recovery">{metric(vitals, 'cardioRecoveryBpm', ' bpm')}</MiniMetric>
          </div>
          <Link to="/tubuh?t=jantung" className="pmd-overview-card-link">Cardiovascular context <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-movement-card">
          <div className="pmd-overview-card-top"><span>Mobility geometry</span><b>04</b></div>
          <div className="pmd-overview-focus-value">
            <small>WALKING SPEED</small>
            <strong>{metric(vitals, 'walkingSpeedKmh', ' km/h', 1)}</strong>
            <span>recorded gait characteristics, not a diagnostic score</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="Asymmetry">{metric(vitals, 'walkingAsymmetryPct', '%', 1)}</MiniMetric>
            <MiniMetric label="Double support">{metric(vitals, 'walkingDoubleSupportPct', '%', 1)}</MiniMetric>
            <MiniMetric label="Step length">{metric(vitals, 'walkingStepLengthCm', ' cm', 1)}</MiniMetric>
            <MiniMetric label="6-min walk">{metric(vitals, 'sixMinWalkM', ' m')}</MiniMetric>
          </div>
          <Link to="/latihan" className="pmd-overview-card-link">Movement workspace <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-body-card">
          <div className="pmd-overview-card-top"><span>Body snapshot</span><b>05</b></div>
          <div className="pmd-overview-silhouette" aria-hidden>
            <i className="head" /><i className="torso" /><i className="arm left" /><i className="arm right" /><i className="leg left" /><i className="leg right" />
            <span className="scan-line" />
          </div>
          <div className="pmd-overview-mini-grid is-dense">
            <MiniMetric label="Weight">{metric(vitals, 'weightKg', ' kg', 1)}</MiniMetric>
            <MiniMetric label="Body fat">{metric(vitals, 'bodyFatPct', '%', 1)}</MiniMetric>
            <MiniMetric label="Temp">{metric(vitals, 'bodyTempC', '°C', 1)}</MiniMetric>
            <MiniMetric label="Body score">{metric(vitals, 'bodyScore', '/100')}</MiniMetric>
          </div>
          <Link to="/body" className="pmd-overview-card-link">Open body profile <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-body-card">
          <div className="pmd-overview-card-top"><span>Composition layers</span><b>06</b></div>
          <div className="pmd-overview-focus-value">
            <small>SKELETAL MUSCLE</small>
            <strong>{metric(vitals, 'skeletalMuscleKg', ' kg', 1)}</strong>
            <span>body-composition values from supported scale/import data</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="Body water">{metric(vitals, 'bodyWaterPct', '%', 1)}</MiniMetric>
            <MiniMetric label="Visceral fat">{metric(vitals, 'visceralFatLevel', '', 1)}</MiniMetric>
            <MiniMetric label="Waist / hip">{metric(vitals, 'waistHipRatio', '', 2)}</MiniMetric>
            <MiniMetric label="Bone mass">{metric(vitals, 'boneMassKg', ' kg', 1)}</MiniMetric>
          </div>
          <Link to="/body" className="pmd-overview-card-link">Composition details <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-movement-card">
          <div className="pmd-overview-card-top"><span>Running mechanics</span><b>07</b></div>
          <div className="pmd-overview-focus-value">
            <small>RUNNING POWER</small>
            <strong>{metric(vitals, 'runningPowerW', ' W')}</strong>
            <span>mechanics from compatible wearable recordings</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="Speed">{metric(vitals, 'runningSpeedKmh', ' km/h', 1)}</MiniMetric>
            <MiniMetric label="Stride">{metric(vitals, 'runningStrideLengthM', ' m', 2)}</MiniMetric>
            <MiniMetric label="Ground contact">{metric(vitals, 'runningGroundContactMs', ' ms')}</MiniMetric>
            <MiniMetric label="Vertical osc.">{metric(vitals, 'runningVerticalOscCm', ' cm', 1)}</MiniMetric>
          </div>
          <Link to="/latihan" className="pmd-overview-card-link">Training & mechanics <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-continuity-card">
          <div className="pmd-overview-card-top"><span>Data continuity</span><b>08</b></div>
          <div className="pmd-overview-continuity-score">
            <strong>{historyDays}<small>/7</small></strong>
            <span>latest recorded days containing at least one overview stream</span>
          </div>
          <div className="pmd-overview-streams">
            <div><span>Steps</span><i><b style={{ width: `${Math.min(100, (stepDays / 7) * 100)}%` }} /></i><em>{stepDays}d</em></div>
            <div><span>HRV</span><i><b style={{ width: `${Math.min(100, (hrvDays / 7) * 100)}%` }} /></i><em>{hrvDays}d</em></div>
            <div><span>Energy</span><i><b style={{ width: `${Math.min(100, (activeDays / 7) * 100)}%` }} /></i><em>{activeDays}d</em></div>
          </div>
          <Link to="/health-data" className="pmd-overview-card-link">Review data history <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-explore-card">
          <div className="pmd-overview-card-top"><span>Exposure context</span><b>09</b></div>
          <div className="pmd-overview-focus-value">
            <small>DAYLIGHT</small>
            <strong>{metric(vitals, 'daylightMin', ' min')}</strong>
            <span>daily-environment signals when supported by the source</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="Stand">{metric(vitals, 'standHours', ' h', 1)}</MiniMetric>
            <MiniMetric label="Flights">{metric(vitals, 'flightsClimbed', '')}</MiniMetric>
            <MiniMetric label="Audio exposure">{metric(vitals, 'audioExposureDb', ' dB', 1)}</MiniMetric>
            <MiniMetric label="Headphones">{metric(vitals, 'headphoneAudioDb', ' dB', 1)}</MiniMetric>
          </div>
          <Link to="/health-data" className="pmd-overview-card-link">Recorded exposures <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-recovery-card">
          <div className="pmd-overview-card-top"><span>Metabolic ledger</span><b>10</b></div>
          <div className="pmd-overview-focus-value">
            <small>BASAL METABOLISM</small>
            <strong>{metric(vitals, 'bmrKcal', ' kcal')}</strong>
            <span>imported body-composition estimates, not generated predictions</span>
          </div>
          <div className="pmd-overview-mini-grid">
            <MiniMetric label="BMI">{metric(vitals, 'bmi', '', 1)}</MiniMetric>
            <MiniMetric label="AMR">{metric(vitals, 'amrKcal', ' kcal')}</MiniMetric>
            <MiniMetric label="Lean mass">{metric(vitals, 'leanMassKg', ' kg', 1)}</MiniMetric>
            <MiniMetric label="Muscle reserve">{metric(vitals, 'muscleReserveCapacity', '', 1)}</MiniMetric>
          </div>
          <Link to="/body" className="pmd-overview-card-link">Body metabolism data <span>↗</span></Link>
        </article>

        <article className="pmd-overview-card pmd-overview-source-card">
          <div className="pmd-overview-card-top"><span>Source & freshness</span><b>11</b></div>
          <div className="pmd-overview-source-glyph" aria-hidden><span /><span /><span /><b>◎</b></div>
          <div className="pmd-overview-source-copy">
            <small>ACTIVE SOURCE</small>
            <strong>{source}</strong>
            <span>{freshness}</span>
          </div>
          <div className="pmd-overview-system-row">
            {GROUPS.map((group) => <AvailabilityPill key={group.label} vitals={vitals} group={group} />)}
          </div>
          <Link to="/health-data" className="pmd-overview-card-link">Connect & import <span>↗</span></Link>
        </article>
      </div>
    </section>
  )
}

export default HomeOverviewMosaic
