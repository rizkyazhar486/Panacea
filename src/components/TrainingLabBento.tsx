import { Link, useLocation } from 'react-router-dom'
import '../styles/training-lab-bento.css'

export interface TrainingLabBentoSnapshot {
  freshness: number | null
  fitness: number | null
  fatigue: number | null
  sessions: number
  freshnessSeries: number[]
}

function displayMetric(value: number | null) {
  return value == null || !Number.isFinite(value) ? '—' : String(Math.round(value))
}

function freshnessTone(value: number | null) {
  if (value == null) return 'neutral'
  return value >= -10 ? 'good' : 'attention'
}

function MiniTrend({ values }: { values: number[] }) {
  if (!values.length) {
    return <span className="training-bento-empty-trend" aria-hidden />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(1, max - min)

  return (
    <span className="training-bento-trend" aria-hidden>
      {values.slice(-14).map((value, index) => (
        <span
          key={index}
          style={{ height: `${20 + ((value - min) / spread) * 80}%` }}
        />
      ))}
    </span>
  )
}

export function TrainingLabBento({ snapshot }: { snapshot: TrainingLabBentoSnapshot }) {
  const location = useLocation()
  const active = new URLSearchParams(location.search).get('t') ?? 'pelatih'

  return (
    <nav className="training-lab-bento" aria-label="Training Lab quick actions">
      <Link
        to="/latihan?t=pelatih"
        className="training-lab-bento-card training-lab-bento-card--lead"
        data-active={active === 'pelatih' ? 'true' : 'false'}
        data-tone={freshnessTone(snapshot.freshness)}
        aria-label={snapshot.freshness == null
          ? 'Open Today training coach'
          : `Open Today training coach. Freshness ${Math.round(snapshot.freshness)}`}
      >
        <span className="training-bento-kicker">Today</span>
        <span className="training-bento-lead-row">
          <span>
            <strong>{displayMetric(snapshot.freshness)}</strong>
            <small>Freshness</small>
          </span>
          <MiniTrend values={snapshot.freshnessSeries} />
        </span>
        <span className="training-bento-foot">
          <span>{snapshot.sessions} sessions</span>
          <span aria-hidden>→</span>
        </span>
      </Link>

      <Link
        to="/latihan?t=progres"
        className="training-lab-bento-card"
        data-active={active === 'progres' ? 'true' : 'false'}
        data-tone="cool"
        aria-label={snapshot.fitness == null ? 'Open Progress' : `Open Progress. Fitness ${Math.round(snapshot.fitness)}`}
      >
        <span className="training-bento-kicker">Fitness</span>
        <strong>{displayMetric(snapshot.fitness)}</strong>
        <span className="training-bento-action" aria-hidden>↗</span>
      </Link>

      <Link
        to="/latihan?t=fisiologi"
        className="training-lab-bento-card"
        data-active={active === 'fisiologi' ? 'true' : 'false'}
        data-tone="warm"
        aria-label={snapshot.fatigue == null ? 'Open Physiology' : `Open Physiology. Fatigue ${Math.round(snapshot.fatigue)}`}
      >
        <span className="training-bento-kicker">Load</span>
        <strong>{displayMetric(snapshot.fatigue)}</strong>
        <span className="training-bento-action" aria-hidden>↗</span>
      </Link>

      <Link
        to="/latihan?t=rencana"
        className="training-lab-bento-card"
        data-active={active === 'rencana' ? 'true' : 'false'}
        data-tone="neutral"
        aria-label="Open training plan"
      >
        <span className="training-bento-kicker">Plan</span>
        <strong className="training-bento-word">Week</strong>
        <span className="training-bento-action" aria-hidden>↗</span>
      </Link>

      <Link
        to="/latihan?t=lab"
        className="training-lab-bento-card"
        data-active={active === 'lab' ? 'true' : 'false'}
        data-tone="violet"
        aria-label="Open performance lab"
      >
        <span className="training-bento-kicker">Lab</span>
        <strong className="training-bento-word">VO₂</strong>
        <span className="training-bento-action" aria-hidden>↗</span>
      </Link>
    </nav>
  )
}

export default TrainingLabBento
