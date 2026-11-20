// Home's first screen: the reference atlas body in the middle, the resting whole-body state on the left, and the
// selected system on the right. Tap a point on the body (or a chip) to select a system, tap Open to go into it.
//
// Truth classes on this surface: the body is the shipped Z-Anatomy atlas (reference anatomy, not the viewer's body;
// rendered by scripts/bangun/bake-home-body.mjs), and every number comes from the whole-body simulator at rest and
// is labelled "simulated". Nothing here is a measurement of the person looking at it.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BodySystemId } from '../../data/bodySystems.ts'
import { HOME_BODY_IMAGE } from '../../data/homeBodyAnchors.ts'
import { DEFAULT_PARAMS } from '../../engine/cardiacCycle.ts'
import { HOME_SYSTEMS, cardPlacement, restingVitals, ventricleVolumeTrace, type HomeSystem } from '../../engine/home-hero/homeBodyStage.ts'
import './livingBodyHero.css'

const TRACE = ventricleVolumeTrace(DEFAULT_PARAMS, 2, 160, 44)
const VITALS = restingVitals()
const IMAGE_SRC = `${import.meta.env.BASE_URL ?? '/'}${HOME_BODY_IMAGE.src}`

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
    <div className="lbh-detail" data-detail={system.id} style={{ ['--tone' as string]: system.tone }}>
      <span className="lbh-detail-head">
        <i aria-hidden />
        <strong>{system.label}</strong>
      </span>
      {system.id === 'cardiovascular' && <HeartTrace />}
      <span className="lbh-detail-note">
        {system.inAtlas ? 'Reference anatomy in the 3D atlas.' : 'Region marker only · not yet in the 3D atlas.'}
      </span>
      <Link to={`/tubuh?system=${system.id}`} className="lbh-detail-open" data-open-system={system.id}>
        Open {system.label} <span aria-hidden>→</span>
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

  return (
    <section className="lbh" aria-label="Body analysis" data-living-body-hero>
      <header className="lbh-head">
        <div>
          <span className="lbh-kicker"><b aria-hidden />Body analysis</span>
          <h2 className="lbh-title">Your body, every system</h2>
        </div>
        <Link to="/body-exposure" className="lbh-cta" data-hero-cta>
          <span aria-hidden className="lbh-cta-orb" />
          Enter 3D
        </Link>
      </header>

      <div className="lbh-layout">
        <aside className="lbh-rail" aria-label="Resting whole-body state (simulated)">
          <span className="lbh-rail-head">At rest · simulated</span>
          <div className="lbh-vitals">
            {VITALS.map((v) => (
              <div key={v.key} className="lbh-vital" style={{ ['--tone' as string]: v.tone }}>
                <span className="lbh-vital-label">{v.label}</span>
                <span className="lbh-vital-value">{v.value}<small>{v.unit}</small></span>
              </div>
            ))}
          </div>
        </aside>

        <div ref={stageRef} className="lbh-stage">
          <div className="lbh-bodybox" style={{ ['--lbh-mask' as string]: `url(${IMAGE_SRC})` }}>
            <img
              src={IMAGE_SRC}
              width={HOME_BODY_IMAGE.width}
              height={HOME_BODY_IMAGE.height}
              alt="Reference human body, Z-Anatomy atlas"
              decoding="async"
              className="lbh-body"
            />
            <span className="lbh-scan" aria-hidden style={{ maskImage: `url(${IMAGE_SRC})`, WebkitMaskImage: `url(${IMAGE_SRC})` }} />
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
          <div className="lbh-systems" role="group" aria-label="Body systems">
            {HOME_SYSTEMS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="lbh-chip"
                data-chip={s.id}
                aria-pressed={s.id === selected}
                onClick={() => setSelected(s.id)}
                style={{ ['--tone' as string]: s.tone }}
              >
                <i aria-hidden />
                {s.label}
              </button>
            ))}
          </div>
          <nav aria-label="Lenses" className="lbh-lenses">
            <Link to="/fitness-hub">Your Body</Link>
            <Link to="/clinical-hub">Clinical</Link>
            <Link to="/?t=for-you">For You</Link>
          </nav>
        </aside>
      </div>
      <small className="lbh-credit">Reference atlas: Z-Anatomy (CC BY-SA 4.0) · simulated resting state, not your measurements</small>
    </section>
  )
}

export default LivingBodyHero
