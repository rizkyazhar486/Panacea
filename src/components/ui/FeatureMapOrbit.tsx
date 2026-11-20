import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { SUPER_PAGES, type SuperPageId } from '../../lib/superPages'
import {
  FEATURE_MAP_HOME_HUB,
  featureMapNodes,
  featureMapWorlds,
  orbitLayout,
} from '../../lib/navigation/featureMap'
import '../../styles/feature-map-orbit.css'

type IconComponent = ComponentType<{ size?: number }>

export type FeatureMapOrbitProps = {
  icons: Readonly<Record<SuperPageId, IconComponent>>
  hub?: SuperPageId
}

/**
 * Interactive game-style world map: six worlds orbit the person hub, one tap
 * zooms into a world (<=6 choices per screen), a second tap opens any feature.
 * Pure DOM + SVG (no WebGL required) with CSS-only motion and reduced-motion
 * fallback.
 */
export function FeatureMapOrbit({ icons, hub = FEATURE_MAP_HOME_HUB }: FeatureMapOrbitProps) {
  const [world, setWorld] = useState<SuperPageId | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const backRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusTo = useRef<SuperPageId | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const worlds = featureMapWorlds(hub)
  const hubPage = SUPER_PAGES.find((page) => page.id === hub) ?? SUPER_PAGES[SUPER_PAGES.length - 1]
  const activeWorld = world ? SUPER_PAGES.find((page) => page.id === world) ?? null : null
  const features = activeWorld ? featureMapNodes(activeWorld.id) : []
  const points = orbitLayout(activeWorld ? features.length : worlds.length)

  useEffect(() => {
    setFocusedIndex(null)
    if (activeWorld) {
      backRef.current?.focus({ preventScroll: true })
    } else if (returnFocusTo.current) {
      stageRef.current
        ?.querySelector<HTMLButtonElement>(`[data-superpage="${returnFocusTo.current}"]`)
        ?.focus({ preventScroll: true })
      returnFocusTo.current = null
    }
  }, [activeWorld])

  const openWorld = (id: SuperPageId) => {
    setFocusedIndex(null)
    setWorld(id)
  }

  const close = () => {
    returnFocusTo.current = world
    setFocusedIndex(null)
    setWorld(null)
  }

  const preview = (() => {
    if (activeWorld) {
      const hovered = focusedIndex !== null ? features[focusedIndex] : null
      if (hovered) return { tag: hovered.label, detail: hovered.cue }
      return { tag: activeWorld.label, detail: activeWorld.cue }
    }
    const hovered = focusedIndex !== null ? worlds[focusedIndex] : null
    if (hovered) return { tag: hovered.label, detail: hovered.cue }
    return { tag: 'World Map', detail: 'Pick a world · 2 taps to any feature' }
  })()

  return (
    <div
      ref={stageRef}
      className="dark pmd-feature-map"
      data-feature-map-level={activeWorld ? 'world' : 'orbit'}
      data-feature-map-world={activeWorld?.id ?? ''}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && activeWorld) {
          event.stopPropagation()
          close()
        }
      }}
    >
      <div className="pmd-feature-map__stage">
        <svg className="pmd-feature-map__rings" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="37" />
          <circle cx="50" cy="50" r="18" />
          <path className="pmd-feature-map__tick" d="M50 2v3 M50 95v3 M2 50h3 M95 50h3" />
          {points.map((point, index) => (
            <line
              key={index}
              x1="50"
              y1="50"
              x2={point.x}
              y2={point.y}
              className={focusedIndex === index ? 'pmd-feature-map__spoke--active' : undefined}
            />
          ))}
        </svg>

        <div className="pmd-feature-map__core">
          {activeWorld ? (
            <>
              <span className="pmd-feature-map__core-kicker">{activeWorld.shortLabel}</span>
              <button
                ref={backRef}
                type="button"
                className="pmd-feature-map__back"
                onClick={close}
                aria-label="Back to all worlds"
              >
                ← Map
              </button>
            </>
          ) : (
            <button
              type="button"
              className="pmd-feature-map__hub-btn"
              data-superpage={hubPage.id}
              data-human-state-source={hubPage.stateSource}
              onClick={() => openWorld(hubPage.id)}
              onPointerEnter={() => setFocusedIndex(null)}
              onFocus={() => setFocusedIndex(null)}
              aria-label={`${hubPage.label}: ${hubPage.cue}`}
            >
              <span className="pmd-feature-map__core-kicker">You</span>
              <strong className="pmd-feature-map__core-title">{hubPage.shortLabel}</strong>
            </button>
          )}
        </div>

        {activeWorld ? (
          <div className="pmd-feature-map__orbit" role="group" aria-label={`${activeWorld.label} features`}>
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                to={feature.to}
                className="pmd-feature-map__node pmd-feature-map__node--feature"
                style={{ left: `${points[index].x}%`, top: `${points[index].y}%`, ['--pmd-node-i' as string]: index }}
                data-world-accent={activeWorld.id}
                data-feature-route={feature.to}
                aria-label={`${feature.label}: ${feature.cue}`}
                onPointerEnter={() => setFocusedIndex(index)}
                onPointerLeave={() => setFocusedIndex(null)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
              >
                <span className="pmd-feature-map__blip" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="pmd-feature-map__label">{feature.label}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pmd-feature-map__orbit" role="group" aria-label="Panacea worlds">
            {worlds.map((page, index) => {
              const Icon = icons[page.id]
              return (
                <button
                  key={page.id}
                  type="button"
                  className="pmd-feature-map__node"
                  style={{ left: `${points[index].x}%`, top: `${points[index].y}%`, ['--pmd-node-i' as string]: index }}
                  data-superpage={page.id}
                  data-world-accent={page.id}
                  data-human-state-source={page.stateSource}
                  aria-label={`${page.label}: ${page.cue}`}
                  onClick={() => openWorld(page.id)}
                  onPointerEnter={() => setFocusedIndex(index)}
                  onPointerLeave={() => setFocusedIndex(null)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                >
                  <span className="pmd-feature-map__blip" aria-hidden="true"><Icon size={22} /></span>
                  <span className="pmd-feature-map__label">{page.shortLabel}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="pmd-feature-map__hud" aria-live="polite">
        <span className="pmd-feature-map__hud-tag">{preview.tag}</span>
        <span className="pmd-feature-map__hud-detail">{preview.detail}</span>
      </div>
    </div>
  )
}

export default FeatureMapOrbit
