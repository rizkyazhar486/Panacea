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

const SPARK_PATHS: readonly string[] = [
  'M4 16 L9 12 L14 14 L19 7 L24 10 L28 5',
  'M4 15 Q10 6 16 12 T28 7',
  'M4 14 L8 14 L11 6 L15 18 L18 11 L28 11',
  'M4 17 L10 13 L16 9 L22 11 L28 4',
  'M4 12 C9 5, 19 19, 28 8',
  'M4 16 L12 8 L18 13 L28 5',
]

function FeatureEmblem({ index }: { index: number }) {
  const path = SPARK_PATHS[index % SPARK_PATHS.length]
  return (
    <svg viewBox="0 0 32 22" width="26" height="18" aria-hidden="true" focusable="false">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="6" r="2.2" fill="#fde68a" />
    </svg>
  )
}

/**
 * Visual-first game world map: six worlds orbit the central pulse hub, one tap
 * zooms into a world (<=6 choices per screen), a second tap opens the feature.
 * Bottom icon dock switches worlds in 1 tap with zero text clutter.
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
          <circle cx="50" cy="50" r="24" strokeDasharray="0.8 2.2" />
          <circle cx="50" cy="50" r="18" />
          <path className="pmd-feature-map__tick" d="M50 2v3 M50 95v3 M2 50h3 M95 50h3" />
          <polygon
            points="50,23 73,37 70,63 50,75 28,62 30,36"
            fill="rgba(34, 211, 238, 0.08)"
            stroke="rgba(103, 232, 249, 0.35)"
            strokeWidth="0.4"
          />
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
                ←
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
              <svg viewBox="0 0 44 20" width="40" height="18" aria-hidden="true">
                <path
                  d="M2 11 L11 11 L15 4 L20 17 L25 8 L29 11 L42 11"
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
                <span className="pmd-feature-map__blip" aria-hidden="true">
                  <FeatureEmblem index={index} />
                </span>
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

      {/* 1-Tap Visual Icon Dock — switch any world directly by logo without text menus */}
      <div className="pmd-feature-map__hud" role="toolbar" aria-label="Quick world switcher">
        {SUPER_PAGES.map((page) => {
          const Icon = icons[page.id]
          const isCurrent = activeWorld?.id === page.id
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => openWorld(page.id)}
              aria-pressed={isCurrent}
              aria-label={`Switch to ${page.label}`}
              data-dock-world={page.id}
              style={{
                minWidth: 44,
                minHeight: 44,
                borderRadius: 12,
                border: isCurrent ? '1px solid #fde68a' : '1px solid rgba(103, 232, 249, 0.22)',
                background: isCurrent ? 'rgba(253, 230, 138, 0.16)' : 'rgba(5, 12, 22, 0.85)',
                color: isCurrent ? '#fef3c7' : '#a5f3fc',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon size={18} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FeatureMapOrbit
