import { Link } from 'react-router-dom'
import '../styles/home-recovery-visuals.css'

type Mode = 'spa' | 'sauna' | 'steam' | 'jacuzzi' | 'hot' | 'cold' | 'onsen'

const MODES: readonly { id: Mode; label: string; cue: string }[] = [
  { id: 'spa', label: 'Spa', cue: 'restore' },
  { id: 'sauna', label: 'Sauna', cue: 'heat' },
  { id: 'steam', label: 'Steam', cue: 'humid' },
  { id: 'jacuzzi', label: 'Jacuzzi', cue: 'water' },
  { id: 'hot', label: 'Hot', cue: 'warm' },
  { id: 'cold', label: 'Cold', cue: 'cool' },
  { id: 'onsen', label: 'Onsen', cue: 'soak' },
] as const

function RecoveryGlyph({ mode }: { mode: Mode }) {
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

export function HomeRecoveryVisuals() {
  return (
    <section className="pmd-recovery-strip" aria-label="Recovery tools">
      <div className="pmd-recovery-head">
        <strong>Recovery</strong>
        <details>
          <summary aria-label="About recovery tools">i</summary>
          <p>Heat, water and cold modalities are grouped for access; evidence and safety differ by modality.</p>
        </details>
      </div>

      <div className="pmd-recovery-grid">
        {MODES.map((mode, index) => (
          <Link
            key={mode.id}
            to={`/tubuh?t=termal&mode=${mode.id}`}
            className="pmd-recovery-tile"
            data-mode={mode.id}
            aria-label={`Open ${mode.label} recovery`}
          >
            <span className="pmd-recovery-meter" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => (
                <i key={i} style={{ height: `${24 + ((i + index) % 5) * 11}%` }} />
              ))}
            </span>
            <span className="pmd-recovery-glyph"><RecoveryGlyph mode={mode.id} /></span>
            <span className="pmd-recovery-label">{mode.label}</span>
            <span className="pmd-recovery-cue">{mode.cue}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeRecoveryVisuals
