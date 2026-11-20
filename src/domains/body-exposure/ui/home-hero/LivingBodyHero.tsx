// Home's first screen: the reference atlas body in the middle, the resting whole-body state on the left, and the
// selected system on the right. Tap a point on the body (or a chip) to select a system, tap Open to go into it.
//
// Truth classes on this surface: the body is the shipped Z-Anatomy atlas (reference anatomy, not the viewer's body;
// rendered by scripts/bangun/bake-home-body.mjs), and every number comes from the whole-body simulator at rest and
// is labelled "simulated". Nothing here is a measurement of the person looking at it.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BodySystemId } from '../../data/bodySystems.ts'
import { HOME_BODY_HOLO } from '../../data/homeBodyAnchors.ts'
import { HOME_RESTING_VITALS, HOME_VENTRICLE_TRACE } from '../../data/homeBodySnapshot.ts'
import { HOME_SYSTEMS, cardPlacement, type HomeSystem } from '../../engine/home-hero/homeBodyStage.ts'
import { SystemGlyph } from '../SystemGlyph.tsx'
import './livingBodyHero.css'

const TRACE = HOME_VENTRICLE_TRACE
const VITALS = HOME_RESTING_VITALS
const IMAGE_SRC = `${import.meta.env.BASE_URL ?? '/'}${HOME_BODY_HOLO.src}`

/** Dial scale per vital for the orb ring: display only, no clinical threshold. Unknown or invalid → empty ring. */
const ORB_SCALE: Readonly<Record<string, readonly [number, number]>> = {
  hr: [30, 200], co: [0, 25], bp: [40, 200], rr: [0, 60], sao2: [70, 100], urine: [0, 200],
}
/** Short names that fit inside an orb; the full name stays in the accessible label. */
const ORB_NAME: Readonly<Record<string, string>> = { hr: 'Heart', co: 'Output', bp: 'Pressure', rr: 'Breaths', sao2: 'O\u2082 sat', urine: 'Urine' }

function orbFill(key: string, value: number): number {
  const s = ORB_SCALE[key]
  if (!s || !Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, (value - s[0]) / (s[1] - s[0])))
}

function HeartTrace() {
  if (!TRACE) return null
  return (
    <div className="lbh-trace" style={{ ['--lbh-sweep' as string]: `${(TRACE.beatS * 2).toFixed(3)}s` }}>
      <svg viewBox="0 0 160 44" preserveAspectRatio="none" aria-hidden>
        <path d={TRACE.d} className="lbh-trace-base" />
        <path d={TRACE.d} pathLength={1} className="lbh-trace-sweep" />
      </svg>
      <span className="lbh-meta">LV {TRACE.esvMl}–{TRACE.edvMl} mL · EF {TRACE.ejectionFractionPct}%</span>
    </div>
  )
}

function Detail({ system }: { system: HomeSystem }) {
  return (
    <div className="lbh-detail lbh-glass" data-detail={system.id} style={{ ['--tone' as string]: system.tone }}>
      <span className="lbh-detail-head">
        <SystemGlyph system={system.id} size={26} />
        <strong>{system.label}</strong>
      </span>
      {system.id === 'cardiovascular' && <HeartTrace />}
      {!system.inAtlas && <span className="lbh-detail-note" title="Region marker only; this system is not yet in the 3D atlas">◌ 3D</span>}
      <Link to={`/tubuh?system=${system.id}`} className="lbh-detail-open" data-open-system={system.id}>
        Open <span className="sr-only">{system.label}</span><span aria-hidden>→</span>
      </Link>
    </div>
  )
}

export function LivingBodyHero() {
  const [selected, setSelected] = useState<BodySystemId>('cardiovascular')
  const stageRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)
  const [geom, setGeom] = useState<{ stage: { w: number; h: number }; tag: { w: number; h: number }; px: number; py: number } | null>(null)

  // The tag follows the SELECTED hotspot's real position in the stage, so padding, object-fit and rounding can never
  // drift it off the organ; it re-measures on resize and on every selection.
  useEffect(() => {
    const stage = stageRef.current, tag = tagRef.current
    if (!stage || !tag || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const spot = stage.querySelector<HTMLElement>(`[data-spot="${selected}"]`)
      if (!spot) return
      const s = stage.getBoundingClientRect(), p = spot.getBoundingClientRect()
      setGeom({ stage: { w: s.width, h: s.height }, tag: { w: tag.offsetWidth, h: tag.offsetHeight }, px: p.left - s.left + p.width / 2, py: p.top - s.top + p.height / 2 })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(stage); ro.observe(tag)
    measure()
    return () => ro.disconnect()
  }, [selected])

  const system = HOME_SYSTEMS.find((s) => s.id === selected) ?? HOME_SYSTEMS[0]
  const place = geom ? cardPlacement(geom.px, geom.py, geom.tag, geom.stage, 14) : null

  const dock = (
    <nav className="lbh-dock" aria-label="Body systems">
      {HOME_SYSTEMS.map((s) => (
        <button
          key={s.id}
          type="button"
          className="lbh-dock-btn"
          data-chip={s.id}
          aria-pressed={s.id === selected}
          aria-label={s.label}
          title={s.label}
          onClick={() => setSelected(s.id)}
          style={{ ['--tone' as string]: s.tone }}
        >
          <SystemGlyph system={s.id} size={20} />
        </button>
      ))}
    </nav>
  )

  return (
    <section className="lbh" aria-label="Body analysis" data-living-body-hero>
      <div className="lbh-aura" aria-hidden><i /><i /><i /></div>
      <header className="lbh-head">
        <h2 className="lbh-kicker"><b aria-hidden /><span className="sr-only">Body analysis</span><span aria-hidden>LIVE</span></h2>
        <nav aria-label="Lenses" className="lbh-lenses lbh-glass">
          <Link to="/fitness-hub">Your Body</Link>
          <Link to="/clinical-hub">Clinical</Link>
          <Link to="/?t=for-you">For You</Link>
        </nav>
        <Link to="/body-exposure" className="lbh-cta" data-hero-cta>
          <span aria-hidden className="lbh-cta-orb" />
          3D
        </Link>
      </header>

      <div className="lbh-layout">
        {dock}

        <div ref={stageRef} className="lbh-stage">
          <svg className="lbh-hud" viewBox="-100 -100 200 200" aria-hidden>
            <circle r="92" className="lbh-hud-ring" />
            <circle r="78" className="lbh-hud-ring lbh-hud-dash" />
            <circle r="62" className="lbh-hud-ring lbh-hud-spin" />
            <path d="M-92 0h12M80 0h12M0 -92v12M0 80v12" className="lbh-hud-tick" />
          </svg>
          <span className="lbh-pedestal" aria-hidden />
          <div className="lbh-bodybox">
            <img
              src={IMAGE_SRC}
              width={HOME_BODY_HOLO.width}
              height={HOME_BODY_HOLO.height}
              alt="Reference human body, Z-Anatomy atlas: bone, muscle, vessels and nerves"
              decoding="async"
              className="lbh-body"
            />
            <span className="lbh-scan" aria-hidden />
            {HOME_SYSTEMS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="lbh-spot"
                data-spot={s.id}
                data-gap={s.inAtlas ? undefined : 'true'}
                aria-label={s.label}
                aria-pressed={s.id === selected}
                onClick={() => setSelected(s.id)}
                style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, ['--tone' as string]: s.tone }}
              >
                <span aria-hidden />
              </button>
            ))}
          </div>

          {place && geom && (
            <svg className="lbh-link" aria-hidden width={geom.stage.w} height={geom.stage.h}>
              <line x1={geom.px} y1={geom.py} x2={place.side === 'right' ? place.left : place.left + geom.tag.w} y2={place.top + geom.tag.h / 2} stroke={system.tone} />
            </svg>
          )}
          <div
            ref={tagRef}
            className="lbh-tag"
            data-tag={system.id}
            style={place ? { left: place.left, top: place.top, ['--tone' as string]: system.tone } : { visibility: 'hidden', ['--tone' as string]: system.tone }}
          >
            <i aria-hidden />{system.label}
          </div>
        </div>

        <aside className="lbh-side">
          <Detail system={system} />
          <div className="lbh-orbs" aria-label="Resting whole-body state (simulated)">
            {VITALS.map((v) => {
              const t = orbFill(v.key, Number.parseFloat(v.value))
              return (
                <div key={v.key} className="lbh-orb" style={{ ['--tone' as string]: v.tone, ['--fill' as string]: `${Math.round(t * 360)}deg` }} aria-label={`${v.label} ${v.value} ${v.unit}`}>
                  <span className="lbh-orb-core" aria-hidden>
                    <small>{ORB_NAME[v.key] ?? v.label}</small>
                    <b>{v.value}</b>
                    <i>{v.unit}</i>
                  </span>
                </div>
              )
            })}
            <span className="lbh-sim" title="Simulated resting state, not your measurements">SIM</span>
          </div>
        </aside>
      </div>
      <small className="lbh-credit">Z-Anatomy · CC BY-SA 4.0</small>
    </section>
  )
}

export default LivingBodyHero
