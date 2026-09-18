import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { bentoSpan } from '../lib/interaction/bento'
import { gabungKatalog, saringPeran, rutaKanonik as canonical, type EntriKatalog } from '../lib/katalogLengkap'
import { NAV_UNTUK_PENGATURAN } from './Shell'
import { useStore } from '../lib/store'
import { getUsageCounts } from '../lib/usage'
import { pintasanTerpakai } from '../lib/pintasanTerpakai'
import '../styles/home-human-interface.css'

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

export function HomeCommandDeck() {
  const { account } = useStore()
  const peran = account?.role ?? 'pasien'
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Home still owns one complete, role-aware capability index. Simplifying the
  // visible surface must never make a destination unreachable.
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

  // Search is the primary retrieval path once the catalogue is larger than a
  // person can scan. Browsing stays available on demand, but it no longer
  // competes with a second set of top-level navigation controls.
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
        <h2 className="panacea-command-title">Explore</h2>
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
          {pintasan.map((feature) => (
            <Link
              key={`recent-${feature.label}-${canonical(feature.to)}`}
              to={canonical(feature.to)}
              className="panacea-command-recent"
            >
              <span>{feature.label}</span>
              <span aria-hidden>→</span>
            </Link>
          ))}
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
                  <span className="panacea-bento-name">{group.name}</span>
                  <span className="panacea-bento-count" aria-hidden>{group.items.length}</span>
                </button>

                {open ? (
                  <ul className="panacea-bento-items" role="list">
                    {group.items.map((feature) => (
                      <li key={`${feature.label}-${canonical(feature.to)}`}>
                        <Link to={canonical(feature.to)} className="panacea-command-result">
                          <span className="panacea-command-result-main">
                            <span className="panacea-command-result-title">{feature.label}</span>
                            <span className="panacea-command-result-meta">{domainOf(feature)}</span>
                          </span>
                          <span className="panacea-command-result-arrow" aria-hidden>→</span>
                        </Link>
                      </li>
                    ))}
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
