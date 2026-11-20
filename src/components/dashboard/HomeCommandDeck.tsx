import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../../lib/katalogFitur'
import { bentoSpan } from '../../lib/interaction/bento'
import { gabungKatalog, saringPeran, rutaKanonik as canonical, type EntriKatalog } from '../../lib/katalogLengkap'
import { NAV_UNTUK_PENGATURAN } from '../../data/navPengaturan'
import { inferFeatureVisual, type FeatureChartKind, type FeatureGlyphId } from '../../lib/navigation/featureMap'
import { useStore } from '../../lib/store'
import { getUsageCounts } from '../../lib/usage'
import { pintasanTerpakai } from '../../lib/pintasanTerpakai'
import '../../styles/home-human-interface.css'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

type Domain = 'Your Body' | 'Clinical' | 'For You'

function textOf(feature: EntriKatalog) {
  return `${feature.label} ${feature.apa} ${feature.kw} ${feature.group}`
}

function domainOf(feature: EntriKatalog): Domain {
  const text = textOf(feature).toLowerCase()
  if (/clinical|score|risk|emergency|drug|hospital|diagnos|medical|emr|osce|radiology|calculator|evidence/.test(text)) return 'Clinical'
  if (/social|community|feed|club|message|story|faith|prayer|adzan|quran|relig|finance|money|market|wallet|account|profile/.test(text)) return 'For You'
  return 'Your Body'
}

function DeckGlyph({ glyph }: { glyph: FeatureGlyphId }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyph === 'heart' && <path d="M19.5 12.6 12 20l-7.5-7.4A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 7.5 6.2Z" />}
      {glyph === 'brain' && <path d="M12 5a3 3 0 0 0-5.4-1.3A2.8 2.8 0 0 0 4 9a3 3 0 0 0 .8 5A3 3 0 0 0 12 18.5a3 3 0 0 0 7.2-4.5A2.8 2.8 0 0 0 20 9a3 3 0 0 0-8-4Z" />}
      {glyph === 'lungs' && <path d="M12 4v11M12 9c-3 0-5 2.5-5 6.5S9.5 19 12 16c2.5 3 5 1.5 5-0.5S15 9 12 9Z" />}
      {glyph === 'dna' && <path d="M7 4c0 4 10 4 10 8s-10 4-10 8M17 4c0 4-10 4-10 8s10 4 10 8" />}
      {glyph === 'pill' && <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-40 12 12)" />}
      {glyph === 'shield' && <path d="M12 3 19 6v5.4c0 4.5-3 8.2-7 9.6-4-1.4-7-5.1-7-9.6V6l7-3Z" />}
      {glyph === 'bolt' && <path d="M13 3 5 13h6l-1 8 9-11h-6l0-7Z" />}
      {glyph === 'compass' && <><circle cx="12" cy="12" r="8.5" /><polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" /></>}
      {glyph === 'users' && <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /></>}
      {glyph === 'spark' && <path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" />}
      {glyph === 'clock' && <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></>}
      {glyph === 'flame' && <path d="M12 3c2 3 5.5 5.2 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.6 1.5-4.8 3-6.2 0 2 1.2 3.2 2.2 3.2.8 0 1.3-1.2.3-6.5Z" />}
      {glyph === 'wave' && <path d="M2.5 12h3l2-5 3 10 3-8 2 5 2-2h4" />}
      {glyph === 'layers' && <><polygon points="12,3.5 20,8 12,12.5 4,8" /><path d="m4 13 8 4.5 8-4.5" /></>}
      {glyph === 'target' && <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /></>}
      {glyph === 'chart' && <><path d="M4 19h16" /><rect x="6" y="10" width="2.8" height="7" rx="1" /><rect x="11" y="6" width="2.8" height="11" rx="1" /><rect x="16" y="4" width="2.8" height="13" rx="1" /></>}
    </svg>
  )
}

function DeckMiniSpark({ kind, values, pct }: { kind: FeatureChartKind; values: readonly number[]; pct: number }) {
  if (kind === 'ring') {
    const r = 7
    const c = 2 * Math.PI * r
    const dash = (pct / 100) * c
    return (
      <svg viewBox="0 0 36 18" width="34" height="16" aria-hidden="true">
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.2" />
        <circle cx="9" cy="9" r={r} fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeDasharray={`${dash.toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 9 9)" />
        <text x="19" y="12" fill="currentColor" fontSize="7.5" fontWeight="800" fontFamily="monospace">{pct}</text>
      </svg>
    )
  }
  const pts = values.map((v, i) => `${(2 + i * 6.2).toFixed(1)},${16 - Math.round((v / 100) * 12)}`).join(' ')
  return (
    <svg viewBox="0 0 36 18" width="34" height="16" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HomeCommandDeck() {
  const { account } = useStore()
  const peran = account?.role ?? 'pasien'
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const uniqueFeatures = useMemo(() => {
    const gabungan = saringPeran(gabungKatalog(FITUR_DARI_HUB, NAV_UNTUK_PENGATURAN), peran)
    const seen = new Set<string>()
    return gabungan.filter((feature) => {
      if (feature.to === '/' || feature.to === '/semua-fitur') return false
      const key = canonical(feature.to)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [peran])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return uniqueFeatures.filter((feature) => !needle || textOf(feature).toLowerCase().includes(needle))
  }, [query, uniqueFeatures])

  const searching = query.trim().length > 0

  const pintasan = useMemo(
    () => pintasanTerpakai(uniqueFeatures, getUsageCounts(), canonical),
    [uniqueFeatures],
  )

  const groups = useMemo(() => {
    const bucket = new Map<string, EntriKatalog[]>()
    for (const feature of filtered) {
      const key = feature.group
      const list = bucket.get(key)
      if (list) list.push(feature)
      else bucket.set(key, [feature])
    }
    const menurutUkuran = [...bucket.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length)

    if (!searching && pintasan.length > 0) {
      return [{ name: 'Most used', items: pintasan }, ...menurutUkuran]
    }
    return menurutUkuran
  }, [filtered, pintasan, searching])

  const showIndex = expanded || searching

  return (
    <section data-panacea-command-surface className="panacea-command-surface" aria-label="Panacea capabilities">
      <div className="panacea-command-topline">
        <div className="flex items-center gap-2">
          <h2 className="panacea-command-title">Explore</h2>
          <BatasKlaimKesehatan permukaan="wellness.home-command" className="inline-block" />
        </div>
        <label className="panacea-command-search-wrap">
          <span className="sr-only">Search Panacea capabilities</span>
          <input
            className="panacea-command-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Panacea"
            autoComplete="off"
          />
        </label>
      </div>

      {!showIndex && pintasan.length > 0 ? (
        <nav className="panacea-command-recents" aria-label="Most used capabilities">
          {pintasan.map((feature) => {
            const vis = inferFeatureVisual(feature.to, feature.label, feature.kw)
            return (
              <Link
                key={`recent-${feature.label}-${canonical(feature.to)}`}
                to={canonical(feature.to)}
                className="panacea-command-recent"
                title={feature.apa || feature.label}
              >
                <DeckGlyph glyph={vis.glyph} />
                <span>{feature.label}</span>
                <DeckMiniSpark kind={vis.chartKind} values={vis.chartValues} pct={vis.gaugePct} />
              </Link>
            )
          })}
        </nav>
      ) : null}

      <button
        type="button"
        className="panacea-command-index-toggle"
        aria-expanded={showIndex}
        onClick={() => setExpanded((value) => !value)}
      >
        {showIndex ? 'Hide capabilities' : `All ${uniqueFeatures.length} capabilities`}
      </button>

      {showIndex ? (
        <div className="panacea-bento" aria-label="Capability index" aria-live={searching ? 'polite' : 'off'}>
          {groups.map((group) => {
            const open = openGroup === group.name || searching
            const span = bentoSpan(group.items.length, filtered.length)
            const groupVis = inferFeatureVisual(group.items[0]?.to ?? '/', group.name)
            return (
              <section
                key={group.name}
                className="panacea-bento-tile"
                data-span={span}
                data-open={open}
                aria-label={`${group.name}, ${group.items.length} capabilities`}
              >
                <button
                  type="button"
                  className="panacea-bento-head"
                  aria-expanded={open}
                  onClick={() => setOpenGroup((value) => (value === group.name ? null : group.name))}
                >
                  <span className="flex items-center gap-2">
                    <DeckGlyph glyph={groupVis.glyph} />
                    <span className="panacea-bento-name">{group.name}</span>
                  </span>
                  <span className="panacea-bento-count" aria-hidden>{group.items.length}</span>
                </button>

                {open ? (
                  <ul className="panacea-bento-items" role="list">
                    {group.items.map((feature) => {
                      const vis = inferFeatureVisual(feature.to, feature.label, feature.kw)
                      return (
                        <li key={`${feature.label}-${canonical(feature.to)}`}>
                          <Link
                            to={canonical(feature.to)}
                            className="panacea-command-result"
                            title={feature.apa || feature.label}
                          >
                            <span className="panacea-command-result-main flex items-center gap-2">
                              <DeckGlyph glyph={vis.glyph} />
                              <span className="panacea-command-result-title">{feature.label}</span>
                              <span className="sr-only panacea-command-result-meta">{domainOf(feature)}</span>
                            </span>
                            <DeckMiniSpark kind={vis.chartKind} values={vis.chartValues} pct={vis.gaugePct} />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </section>
            )
          })}
          {groups.length === 0 ? (
            <div className="py-5 text-sm font-bold text-white/40">No match</div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomeCommandDeck
