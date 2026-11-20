// Home's first screen: the reference atlas body in the middle, the resting whole-body state on the left, and the
// selected system on the right. Tap a point on the body (or a chip) to select a system, tap Open to go into it.
// Drag the body sideways (or tap 360°) to turn it: a baked turntable of the same atlas, fetched on first use; it
// springs back to the front, the only view the hotspots were projected for. With a mouse the stage tilts in depth.
//
// Truth classes on this surface: the body is the shipped Z-Anatomy atlas (reference anatomy, not the viewer's body;
// rendered by scripts/bangun/bake-home-body.mjs), and every number comes from the whole-body simulator at rest and
// is labelled "simulated". Nothing here is a measurement of the person looking at it.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type { BodySystemId } from '../../data/bodySystems.ts'
import { HOME_BODY_HOLO, HOME_BODY_TURN } from '../../data/homeBodyAnchors.ts'
import { HOME_RESTING_VITALS, HOME_VENTRICLE_TRACE } from '../../data/homeBodySnapshot.ts'
import { HOME_SYSTEMS, cardPlacement, type HomeSystem } from '../../engine/home-hero/homeBodyStage.ts'
import { dragAngle, isFront, settleStep, spinAngle, tiltFor, turnFrame } from '../../engine/home-hero/homeBodyTurn.ts'
import { SystemGlyph } from '../SystemGlyph.tsx'
import './livingBodyHero.css'

const TRACE = HOME_VENTRICLE_TRACE
const VITALS = HOME_RESTING_VITALS
const BASE = import.meta.env.BASE_URL ?? '/'
const IMAGE_SRC = `${BASE}${HOME_BODY_HOLO.src}`
const TURN_SRC = `${BASE}${HOME_BODY_TURN.src}`
/** A press that moves less than this is a tap (select a hotspot), not a turn. */
const DRAG_SLOP_PX = 6
const SPIN_MS = 1600

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion'))

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

/**
 * Turning the body: drag angle, spring back to the front, the 360° spin, and the turntable sprite loaded on first use.
 * Every step is computed by homeBodyTurn (pure); this hook only owns pointer capture and animation frames.
 */
function useTurntable() {
  const [angle, setAngle] = useState(0)
  const [spriteReady, setSpriteReady] = useState(false)
  const drag = useRef<{ id: number; x: number; start: number; width: number; moved: boolean } | null>(null)
  const frame = useRef(0)
  const lastTap = useRef(true)

  const stop = () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = 0 }
  useEffect(() => stop, [])

  const loadSprite = useCallback(() => {
    if (spriteReady) return
    const img = new Image()
    img.onload = () => setSpriteReady(true)
    img.src = TURN_SRC
  }, [spriteReady])

  const settle = useCallback((from: number) => {
    stop()
    if (reducedMotion()) { setAngle(0); return }
    let a = from, t = performance.now()
    const tick = (now: number) => {
      a = settleStep(a, now - t); t = now
      setAngle(a)
      frame.current = a === 0 ? 0 : requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [])

  const spin = useCallback(() => {
    loadSprite()
    stop()
    const t0 = performance.now()
    const tick = (now: number) => {
      const a = spinAngle(now - t0, SPIN_MS)
      setAngle(a)
      frame.current = a === 0 && now - t0 >= SPIN_MS ? 0 : requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [loadSprite])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    stop()
    drag.current = { id: e.pointerId, x: e.clientX, start: angle, width: e.currentTarget.getBoundingClientRect().width, moved: false }
    lastTap.current = true
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_SLOP_PX) return
      d.moved = true
      lastTap.current = false
      loadSprite()
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const a = dragAngle(d.start, dx, d.width)
    if (a !== null) setAngle(a)
  }
  const onPointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (d.moved) settle(angle)
  }

  /** True when the last press was a tap, so a hotspot click should select (a drag must not). */
  const wasTap = () => lastTap.current

  return { angle, spriteReady, spin, wasTap, handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd } }
}

export function LivingBodyHero() {
  const [selected, setSelected] = useState<BodySystemId>('cardiovascular')
  const stageRef = useRef<HTMLDivElement>(null)
  const depthRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)
  const [geom, setGeom] = useState<{ stage: { w: number; h: number }; tag: { w: number; h: number }; px: number; py: number } | null>(null)
  const turn = useTurntable()
  const front = isFront(turn.angle, HOME_BODY_TURN.frames)
  const turnIndex = turnFrame(turn.angle, HOME_BODY_TURN.frames) ?? 0
  const showSprite = !front && turn.spriteReady

  // The tag follows the SELECTED hotspot's layout position inside the depth layer (offsets, not screen rects, so the
  // tilt moves tag, line and organ together); it re-measures on resize and on every selection.
  useEffect(() => {
    const stage = depthRef.current, tag = tagRef.current
    if (!stage || !tag || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const spot = stage.querySelector<HTMLElement>(`[data-spot="${selected}"]`)
      const box = spot?.offsetParent as HTMLElement | null
      if (!spot || !box) return
      setGeom({
        stage: { w: stage.offsetWidth, h: stage.offsetHeight },
        tag: { w: tag.offsetWidth, h: tag.offsetHeight },
        px: box.offsetLeft + spot.offsetLeft + spot.offsetWidth / 2,
        py: box.offsetTop + spot.offsetTop + spot.offsetHeight / 2,
      })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(stage); ro.observe(tag)
    measure()
    return () => ro.disconnect()
  }, [selected])

  const system = HOME_SYSTEMS.find((s) => s.id === selected) ?? HOME_SYSTEMS[0]
  const place = geom && front ? cardPlacement(geom.px, geom.py, geom.tag, geom.stage, 14) : null

  // Parallax: a mouse over the stage tilts the depth layer a few degrees towards it. Written straight to CSS custom
  // properties so moving the mouse never re-renders React. Touch and reduced motion: no tilt.
  const tilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = depthRef.current
    if (!el || e.pointerType !== 'mouse' || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const t = tiltFor(e.clientX - r.left, e.clientY - r.top, r.width, r.height, 5)
    el.style.setProperty('--lbh-rx', `${t?.rx ?? 0}deg`)
    el.style.setProperty('--lbh-ry', `${t?.ry ?? 0}deg`)
  }
  const untilt = () => {
    depthRef.current?.style.setProperty('--lbh-rx', '0deg')
    depthRef.current?.style.setProperty('--lbh-ry', '0deg')
  }

  const dock = (
    <nav className="lbh-dock" aria-label="Body systems">
      {HOME_SYSTEMS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className="lbh-dock-btn"
          data-chip={s.id}
          aria-pressed={s.id === selected}
          aria-label={s.label}
          title={s.label}
          onClick={() => setSelected(s.id)}
          style={{ ['--tone' as string]: s.tone, ['--i' as string]: i }}
        >
          <SystemGlyph system={s.id} size={20} />
        </button>
      ))}
    </nav>
  )

  return (
    // data-pmd-unclamped: the site-wide tap-to-explain script must not turn orb and tag labels into tiny buttons.
    <section className="lbh" aria-label="Body analysis" data-living-body-hero data-pmd-unclamped="true">
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

        <div ref={stageRef} className="lbh-stage" onPointerMove={tilt} onPointerLeave={untilt}>
          <div ref={depthRef} className="lbh-depth">
            <svg className="lbh-hud" viewBox="-100 -100 200 200" aria-hidden>
              <circle r="92" className="lbh-hud-ring" />
              <circle r="78" className="lbh-hud-ring lbh-hud-dash" />
              <circle r="62" className="lbh-hud-ring lbh-hud-spin" />
              <path d="M-92 0h12M80 0h12M0 -92v12M0 80v12" className="lbh-hud-tick" />
              {/* Compass mark that turns with the body, so the turn reads as rotation in 3D. Hidden at the front, where it
                  would sit on the head. */}
              <g style={{ transform: `rotate(${turn.angle}deg)` }} className="lbh-hud-needle" data-shown={front ? undefined : 'true'}>
                <path d="M0 -92 l4 9 h-8z" />
              </g>
            </svg>
            <span className="lbh-pedestal" aria-hidden />
            <div className="lbh-bodybox" data-turning={front ? undefined : 'true'} {...turn.handlers}>
              <img
                src={IMAGE_SRC}
                width={HOME_BODY_HOLO.width}
                height={HOME_BODY_HOLO.height}
                alt="Reference human body, Z-Anatomy atlas: bone, muscle, vessels and nerves"
                decoding="async"
                draggable={false}
                className="lbh-body"
                data-hidden={showSprite ? 'true' : undefined}
              />
              {turn.spriteReady && (
                <span
                  className="lbh-turn"
                  aria-hidden
                  data-shown={showSprite ? 'true' : undefined}
                  style={{
                    backgroundImage: `url(${TURN_SRC})`,
                    backgroundSize: `${HOME_BODY_TURN.frames * 100}% 100%`,
                    backgroundPosition: `${(turnIndex / (HOME_BODY_TURN.frames - 1)) * 100}% 0`,
                  }}
                />
              )}
              <span className="lbh-scan" aria-hidden />
              {HOME_SYSTEMS.map((s, i) => (
                // Some organs sit ~13 px apart on a phone, too close to be separate tap targets. The dots are a pointer
                // shortcut only; the glass dock is the accessible control for the same choice.
                <span
                  key={s.id}
                  className="lbh-spot"
                  data-spot={s.id}
                  data-gap={s.inAtlas ? undefined : 'true'}
                  data-active={s.id === selected ? 'true' : undefined}
                  aria-hidden
                  onClick={() => { if (turn.wasTap()) setSelected(s.id) }}
                  style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, ['--tone' as string]: s.tone, ['--i' as string]: i } as CSSProperties}
                >
                  <span />
                </span>
              ))}
            </div>

            {place && geom && (
              <svg className="lbh-link" aria-hidden width={geom.stage.w} height={geom.stage.h}>
                <line x1={geom.px} y1={geom.py} x2={place.side === 'right' ? place.left : place.left + geom.tag.w} y2={place.top + geom.tag.h / 2} stroke={system.tone} />
              </svg>
            )}
            <div
              ref={tagRef}
              key={system.id}
              className="lbh-tag"
              data-tag={system.id}
              style={place ? { left: place.left, top: place.top, ['--tone' as string]: system.tone } : { visibility: 'hidden', ['--tone' as string]: system.tone }}
            >
              <i aria-hidden />{system.label}
            </div>
          </div>
          <button type="button" className="lbh-spin" onClick={turn.spin} aria-label="Turn the body around once" title="Turn 360°">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span aria-hidden>360°</span>
          </button>
        </div>

        <aside className="lbh-side">
          <Detail key={system.id} system={system} />
          <div className="lbh-orbs" aria-label="Resting whole-body state (simulated)">
            {VITALS.map((v, i) => {
              const t = orbFill(v.key, Number.parseFloat(v.value))
              return (
                <div key={v.key} className="lbh-orb" style={{ ['--tone' as string]: v.tone, ['--fill' as string]: `${Math.round(t * 360)}deg`, ['--i' as string]: i }} aria-label={`${v.label} ${v.value} ${v.unit}`}>
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
