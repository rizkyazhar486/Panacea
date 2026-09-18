import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { bentoSpan } from '../lib/interaction/bento'
import { IconBook, IconChat, IconHeart, IconRun, IconStethoscope, IconUsers } from './icons'
import '../styles/home-human-interface.css'

type HubFeature = (typeof FITUR_DARI_HUB)[number]
type ActionIcon = ComponentType<{ size?: number; className?: string }>
type Domain = 'Your Body' | 'Clinical' | 'For You'

type Launch = {
  label: string
  to: string
  icon: ActionIcon
}

const DIRECT_LAUNCHES: Launch[] = [
  { label: 'Your Body', to: '/tubuh', icon: IconHeart },
  { label: 'Clinical', to: '/clinical-hub', icon: IconStethoscope },
  { label: 'Training', to: '/fitness-hub?view=training', icon: IconRun },
  { label: 'Learn', to: '/learn', icon: IconBook },
  { label: 'People', to: '/?t=social', icon: IconUsers },
  { label: 'Ask Panacea', to: '/chatbot', icon: IconChat },
]

const DOMAINS: Array<'All' | Domain> = ['All', 'Your Body', 'Clinical', 'For You']

function textOf(feature: HubFeature) {
  return `${feature.nama} ${feature.apa ?? ''} ${feature.kw ?? ''} ${feature.grup ?? ''}`
}

function domainOf(feature: HubFeature): Domain {
  const text = textOf(feature).toLowerCase()
  if (/clinical|score|risk|emergency|drug|hospital|diagnos|medical|emr|osce|radiology|calculator|evidence/.test(text)) return 'Clinical'
  if (/social|community|feed|club|message|story|faith|prayer|adzan|quran|relig|finance|money|market|wallet|account|profile/.test(text)) return 'For You'
  return 'Your Body'
}

function canonical(to: string) {
  const redirects: Record<string, string> = {
    '/feed': '/?t=social',
    '/community': '/?t=community',
    '/clubs': '/?t=clubs',
    '/sports-scores': '/?t=scores',
    '/scripture': '/?t=religion&faith=scripture',
    '/hadith': '/?t=religion&faith=hadith',
    '/prayer-times': '/?t=religion&faith=prayer',
    '/prophet-stories': '/?t=religion&faith=stories',
    '/body-explorer': '/learn?t=body',
    '/radiology': '/learn?t=radiology',
    '/med-study': '/learn?t=library',
    '/clinical-calculators': '/learn?t=calculators',
    '/latihan': '/fitness-hub?view=training',
    '/workout': '/fitness-hub?view=workout&t=sesi',
    '/recovery': '/fitness-hub?view=recovery',
    '/nutrition': '/fitness-hub?view=nutrition',
    '/health-data': '/fitness-hub?view=health-data',
  }
  return redirects[to] ?? to
}

export function HomeCommandDeck() {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<'All' | Domain>('All')
  const [expanded, setExpanded] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const uniqueFeatures = useMemo(() => {
    const seen = new Set<string>()
    return FITUR_DARI_HUB.filter((feature) => {
      const key = canonical(feature.to)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return uniqueFeatures.filter((feature) => {
      if (domain !== 'All' && domainOf(feature) !== domain) return false
      return !needle || textOf(feature).toLowerCase().includes(needle)
    })
  }, [domain, query, uniqueFeatures])

  // Bento dikelompokkan menurut `grup` yang sudah dibawa katalognya sendiri.
  // Kelompok dipakai apa adanya — menerjemahkan atau menyusun ulang namanya di
  // sini akan memisahkannya dari katalog dan membuat hitungannya berbohong.
  const groups = useMemo(() => {
    const bucket = new Map<string, HubFeature[]>()
    for (const feature of filtered) {
      const key = feature.grup ?? 'Other'
      const list = bucket.get(key)
      if (list) list.push(feature)
      else bucket.set(key, [feature])
    }
    return [...bucket.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [filtered])

  const searching = query.trim().length > 0
  const showIndex = expanded || searching || domain !== 'All'

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
          <span className="panacea-command-search-icon" aria-hidden><IconChat size={17} /></span>
        </label>
      </div>

      <div className="panacea-command-domains" aria-label="Capability domains">
        {DOMAINS.map((item) => (
          <button
            key={item}
            type="button"
            className="panacea-command-domain"
            data-active={domain === item}
            aria-pressed={domain === item}
            onClick={() => {
              setDomain(item)
              if (item !== 'All') setExpanded(true)
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <nav data-panacea-direct-launch className="panacea-direct-launch" aria-label="Direct launch">
        {DIRECT_LAUNCHES.map(({ label, to, icon: Icon }) => (
          <Link key={label} to={to} className="panacea-direct-launch-item">
            <span className="panacea-direct-launch-icon" aria-hidden><Icon size={20} /></span>
            <span className="panacea-direct-launch-label">
              <span>{label}</span>
              <span aria-hidden>↗</span>
            </span>
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="panacea-command-index-toggle"
        aria-expanded={showIndex}
        onClick={() => setExpanded((value) => !value)}
      >
        {showIndex ? 'Hide capabilities' : `All ${uniqueFeatures.length} capabilities`}
      </button>

      {showIndex ? (
        <div className="panacea-bento" aria-label="Capability index">
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

                {/* Seluruh isi kelompok dirender saat dibuka — tidak ada
                    pemotongan diam-diam. Daftar sebelumnya berhenti di 40 dari
                    135 kapabilitas tanpa memberi tahu siapa pun bahwa 95
                    sisanya ada, jadi menjelajah tidak akan pernah menemukannya
                    dan hanya pencarian yang bisa. */}
                {open ? (
                  <ul className="panacea-bento-items" role="list">
                    {group.items.map((feature) => (
                      <li key={`${feature.nama}-${canonical(feature.to)}`}>
                        <Link to={canonical(feature.to)} className="panacea-command-result">
                          <span className="panacea-command-result-main">
                            <span className="panacea-command-result-title">{feature.nama}</span>
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
