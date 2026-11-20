import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { SUPER_PAGES, type SuperPageId } from '../../lib/superPages'
import {
  ALL_FEATURE_WIDGETS,
  FEATURE_GLYPH_SVG_PATHS,
  FEATURE_MAP_HOME_HUB,
  allFeatureWidgetsForCategory,
  featureMapWorlds,
  featureOrbitPage,
  featureOrbitPageCount,
  orbitLayout,
  type FeatureChartKind,
  type FeatureGlyphId,
  type FeatureVisualWidget,
} from '../../lib/navigation/featureMap'
import '../../styles/feature-map-orbit.css'

type IconComponent = ComponentType<{ size?: number }>
export type FeatureMapOrbitProps = { icons: Readonly<Record<SuperPageId, IconComponent>>; hub?: SuperPageId }

const WORLD_COLORS: Readonly<Record<SuperPageId, string>> = {
  human: '#22d3ee', health: '#34d399', clinical: '#fb7185', explore: '#a78bfa', simulate: '#fbbf24', records: '#60a5fa', 'for-you': '#f472b6',
}

const SOCIAL_HUB_WIDGETS: ReadonlyArray<{ to: string; short: string; color: string; glyph: FeatureGlyphId }> = [
  { to: '/community', short: 'People', color: '#f472b6', glyph: 'users' },
  { to: '/connect', short: 'Connect', color: '#38bdf8', glyph: 'heart' },
  { to: '/clubs', short: 'Clubs', color: '#34d399', glyph: 'flame' },
  { to: '/feed', short: 'Feed', color: '#a78bfa', glyph: 'wave' },
  { to: '/messages', short: 'Chat', color: '#fbbf24', glyph: 'spark' },
]

export function FeatureGlyphSvg({ glyph, size = 18 }: { glyph: FeatureGlyphId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={FEATURE_GLYPH_SVG_PATHS[glyph]} />
    </svg>
  )
}

export function FeatureMiniChart({ kind, values, pct, color = '#22d3ee' }: { kind: FeatureChartKind; values: readonly number[]; pct: number; color?: string }) {
  if (kind === 'ring') {
    const r = 9, c = 2 * Math.PI * r, dash = (Math.max(15, Math.min(98, pct)) / 100) * c
    return (
      <svg viewBox="0 0 48 24" width="46" height="22" aria-hidden="true" focusable="false">
        <circle cx="13" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.6" />
        <circle cx="13" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={`${dash.toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 13 12)" />
        <text x="27" y="15" fill={color} fontSize="8.5" fontWeight="800" fontFamily="monospace">{pct}%</text>
      </svg>
    )
  }
  if (kind === 'bars') {
    return (
      <svg viewBox="0 0 48 24" width="46" height="22" aria-hidden="true" focusable="false">
        {values.map((v, i) => {
          const h = Math.max(4, Math.round((v / 100) * 18))
          return <rect key={i} x={3 + i * 7.2} y={21 - h} width="4.8" height={h} rx="1.4" fill={i === values.length - 1 ? '#fde68a' : color} opacity={0.55 + i * 0.08} />
        })}
      </svg>
    )
  }
  if (kind === 'radar') {
    const pts = values.map((v, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 6, rad = 3 + (v / 100) * 8.5
      return `${(14 + rad * Math.cos(a)).toFixed(1)},${(12 + rad * Math.sin(a)).toFixed(1)}`
    })
    return (
      <svg viewBox="0 0 48 24" width="46" height="22" aria-hidden="true" focusable="false">
        <circle cx="14" cy="12" r="9.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
        <polygon points={pts.join(' ')} fill={`${color}33`} stroke={color} strokeWidth="1.5" />
        <text x="27" y="15" fill="#e6fbff" fontSize="8" fontWeight="800" fontFamily="monospace">{pct}</text>
      </svg>
    )
  }
  if (kind === 'ecg') {
    return (
      <svg viewBox="0 0 48 24" width="46" height="22" aria-hidden="true" focusable="false">
        <path d="M2 13 H11 L14 8 L17 19 L21 4 L25 17 L28 11 L32 13 H46" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="21" cy="4" r="1.8" fill="#fde68a" />
      </svg>
    )
  }
  const pts = values.map((v, i) => `${(3 + i * 8.4).toFixed(1)},${20 - Math.round((v / 100) * 15)}`)
  const last = pts[pts.length - 1]?.split(',') ?? ['45', '8']
  return (
    <svg viewBox="0 0 48 24" width="46" height="22" aria-hidden="true" focusable="false">
      <polygon points={`3,21 ${pts.join(' ')} 45,21`} fill={`${color}24`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill="#fde68a" />
    </svg>
  )
}

export function FeatureMapOrbit({ icons, hub = FEATURE_MAP_HOME_HUB }: FeatureMapOrbitProps) {
  const [world, setWorld] = useState<SuperPageId | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [deckOpen, setDeckOpen] = useState(false)
  const [deckCategory, setDeckCategory] = useState<SuperPageId | 'all'>('all')
  const [search, setSearch] = useState('')
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const backRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusTo = useRef<SuperPageId | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const worlds = featureMapWorlds(hub)
  const hubPage = SUPER_PAGES.find((page) => page.id === hub) ?? SUPER_PAGES[SUPER_PAGES.length - 1]
  const activeWorld = world ? SUPER_PAGES.find((page) => page.id === world) ?? null : null
  const totalPages = activeWorld ? featureOrbitPageCount(activeWorld.id) : 1
  const features = activeWorld ? featureOrbitPage(activeWorld.id, pageIndex) : []
  const points = orbitLayout(activeWorld ? features.length : worlds.length)

  const visibleWidgets = useMemo((): readonly FeatureVisualWidget[] => {
    const pool = deckCategory === 'all' ? ALL_FEATURE_WIDGETS : allFeatureWidgetsForCategory(deckCategory)
    const q = search.trim().toLowerCase()
    return q ? pool.filter((w) => `${w.label} ${w.shortLabel} ${w.cue} ${w.to}`.toLowerCase().includes(q)) : pool
  }, [deckCategory, search])

  useEffect(() => {
    setFocusedIndex(null)
    if (activeWorld) {
      backRef.current?.focus({ preventScroll: true })
    } else if (returnFocusTo.current) {
      stageRef.current?.querySelector<HTMLButtonElement>(`[data-superpage="${returnFocusTo.current}"]`)?.focus({ preventScroll: true })
      returnFocusTo.current = null
    }
  }, [activeWorld])

  const openWorld = (id: SuperPageId) => { setFocusedIndex(null); setPageIndex(0); setWorld(id); setDeckCategory(id) }
  const close = () => { returnFocusTo.current = world; setFocusedIndex(null); setPageIndex(0); setWorld(null); setDeckCategory('all') }
  const stepOrbit = (delta: number) => {
    if (activeWorld) setPageIndex((p) => (p + delta + totalPages) % totalPages)
    else {
      const idx = SUPER_PAGES.findIndex((p) => p.id === (world ?? hub))
      const next = SUPER_PAGES[(idx + delta + SUPER_PAGES.length) % SUPER_PAGES.length]
      if (next) openWorld(next.id)
    }
  }

  return (
    <div
      ref={stageRef}
      className="dark pmd-feature-map"
      data-feature-map-level={activeWorld ? 'world' : 'orbit'}
      data-feature-map-world={activeWorld?.id ?? ''}
      data-feature-map-page={pageIndex}
      onKeyDown={(event) => { if (event.key === 'Escape' && activeWorld) { event.stopPropagation(); close() } }}
    >
      <div className="pmd-feature-map__stage">
        <svg className="pmd-feature-map__rings" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="37" />
          <circle cx="50" cy="50" r="24" strokeDasharray="0.8 2.2" />
          <circle cx="50" cy="50" r="18" />
          <path className="pmd-feature-map__tick" d="M50 2v3 M50 95v3 M2 50h3 M95 50h3" />
          <polygon points="50,23 73,37 70,63 50,75 28,62 30,36" fill="rgba(34, 211, 238, 0.08)" stroke="rgba(103, 232, 249, 0.35)" strokeWidth="0.4" />
          {points.map((point, index) => (
            <line key={index} x1="50" y1="50" x2={point.x} y2={point.y} className={focusedIndex === index ? 'pmd-feature-map__spoke--active' : undefined} />
          ))}
        </svg>

        <div className="pmd-feature-map__core">
          {activeWorld ? (
            <>
              <span className="pmd-feature-map__core-kicker">{activeWorld.shortLabel} {totalPages > 1 ? `${(pageIndex % totalPages) + 1}/${totalPages}` : ''}</span>
              <button ref={backRef} type="button" className="pmd-feature-map__back" onClick={close} aria-label="Back to all worlds">←</button>
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
                <path d="M2 11 L11 11 L15 4 L20 17 L25 8 L29 11 L42 11" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                title={`${feature.label} — ${feature.cue}`}
                onPointerEnter={() => setFocusedIndex(index)}
                onPointerLeave={() => setFocusedIndex(null)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
              >
                <span className="pmd-feature-map__blip" aria-hidden="true"><FeatureGlyphSvg glyph={feature.glyph} size={20} /></span>
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
                  title={page.label}
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

      <div className="pmd-feature-map__hud" role="toolbar" aria-label="Interactive feature navigator">
        <button type="button" onClick={() => stepOrbit(-1)} aria-label="Previous orbit page" className="pmd-feature-map__dock-btn">◀</button>
        {SUPER_PAGES.map((page) => {
          const Icon = icons[page.id]
          const isCurrent = activeWorld?.id === page.id
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => { openWorld(page.id); setDeckOpen(true) }}
              aria-pressed={isCurrent}
              aria-label={`Switch to ${page.label}`}
              data-dock-world={page.id}
              className={isCurrent ? 'pmd-feature-map__dock-btn pmd-feature-map__dock-btn--active' : 'pmd-feature-map__dock-btn'}
            >
              <Icon size={17} />
            </button>
          )
        })}
        <button type="button" onClick={() => stepOrbit(1)} aria-label="Next orbit page" className="pmd-feature-map__dock-btn">▶</button>
        <button
          type="button"
          onClick={() => setDeckOpen((open) => !open)}
          aria-expanded={deckOpen}
          aria-label="Toggle all feature widgets"
          data-feature-widget-deck-toggle
          className={deckOpen ? 'pmd-feature-map__dock-btn pmd-feature-map__dock-btn--active' : 'pmd-feature-map__dock-btn'}
        >
          ⊞
        </button>
      </div>

      {deckOpen && (
        <div className="pmd-feature-map__deck" data-feature-widget-deck>
          <div className="pmd-feature-map__social-bar" role="toolbar" aria-label="Social pulse widgets">
            {SOCIAL_HUB_WIDGETS.map((soc) => (
              <Link key={soc.to} to={soc.to} className="pmd-feature-map__social-pill" aria-label={soc.short} style={{ borderColor: `${soc.color}55`, color: soc.color }}>
                <FeatureGlyphSvg glyph={soc.glyph} size={15} />
                <span>{soc.short}</span>
              </Link>
            ))}
          </div>
          <div className="pmd-feature-map__deck-bar">
            <button
              type="button"
              onClick={() => setDeckCategory('all')}
              aria-pressed={deckCategory === 'all'}
              aria-label="All worlds"
              className={deckCategory === 'all' ? 'pmd-feature-map__filter-chip pmd-feature-map__filter-chip--active' : 'pmd-feature-map__filter-chip'}
            >
              ⊞ {ALL_FEATURE_WIDGETS.length}
            </button>
            {SUPER_PAGES.map((page) => {
              const Icon = icons[page.id]
              const active = deckCategory === page.id
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setDeckCategory(page.id)}
                  aria-pressed={active}
                  aria-label={`${page.label} widgets`}
                  className={active ? 'pmd-feature-map__filter-chip pmd-feature-map__filter-chip--active' : 'pmd-feature-map__filter-chip'}
                >
                  <Icon size={14} />
                  <span>{allFeatureWidgetsForCategory(page.id).length}</span>
                </button>
              )
            })}
            <label className="pmd-feature-map__search">
              <span aria-hidden="true">⌕</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${visibleWidgets.length}`} aria-label="Filter feature widgets" />
            </label>
          </div>

          <div className="pmd-feature-map__widget-grid" role="list" aria-label="Visual feature widgets">
            {visibleWidgets.map((w) => {
              const accent = WORLD_COLORS[w.category] ?? '#22d3ee'
              return (
                <Link
                  key={`${w.category}-${w.id}-${w.to}`}
                  to={w.to}
                  role="listitem"
                  className="pmd-feature-map__widget-card"
                  data-widget-route={w.to}
                  data-widget-category={w.category}
                  aria-label={`${w.label}: ${w.cue}`}
                  title={`${w.label} — ${w.cue}`}
                >
                  <div className="pmd-feature-map__widget-top">
                    <span className="pmd-feature-map__widget-logo" style={{ color: accent, borderColor: `${accent}44` }}>
                      <FeatureGlyphSvg glyph={w.glyph} size={17} />
                    </span>
                    <FeatureMiniChart kind={w.chartKind} values={w.chartValues} pct={w.gaugePct} color={accent} />
                  </div>
                  <strong className="pmd-feature-map__widget-title">{w.shortLabel}</strong>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FeatureMapOrbit
