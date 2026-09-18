import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
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

  const showIndex = expanded || query.trim().length > 0 || domain !== 'All'
  const visible = showIndex ? filtered.slice(0, 40) : []

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
        {showIndex ? 'Hide capabilities' : 'All capabilities'}
      </button>

      {showIndex ? (
        <div className="panacea-command-results" role="list" aria-label="Capability index">
          {visible.map((feature) => (
            <Link
              key={`${feature.nama}-${canonical(feature.to)}`}
              to={canonical(feature.to)}
              className="panacea-command-result"
              role="listitem"
            >
              <span className="panacea-command-result-main">
                <span className="panacea-command-result-title">{feature.nama}</span>
                <span className="panacea-command-result-meta">{domainOf(feature)}</span>
              </span>
              <span className="panacea-command-result-arrow" aria-hidden>→</span>
            </Link>
          ))}
          {visible.length === 0 ? (
            <div className="py-5 text-sm font-bold text-white/40">No match</div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomeCommandDeck
