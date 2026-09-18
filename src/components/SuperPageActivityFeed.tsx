import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { getUsageCounts } from '../lib/usage'
import { superPageForRoute, type SuperPageId } from '../lib/superPages'

export function SuperPageActivityFeed({
  domain,
  initialLimit = 20,
}: {
  domain: SuperPageId
  initialLimit?: number
}) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [usage] = useState(getUsageCounts)

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return FITUR_DARI_HUB
      .filter((feature) => superPageForRoute(feature.to, feature.grup) === domain)
      .filter((feature) => !needle || (feature.nama + ' ' + feature.grup + ' ' + feature.apa + ' ' + feature.kw).toLowerCase().includes(needle))
      .sort((a, b) => {
        const usageDelta = (usage[b.to] ?? 0) - (usage[a.to] ?? 0)
        return usageDelta || a.nama.localeCompare(b.nama)
      })
  }, [domain, query, usage])

  const visible = expanded || query ? items : items.slice(0, initialLimit)

  return (
    <section className="pmd-capability-feed pmd-scroll-section" aria-label="Capability activity feed">
      <div className="pmd-feed-topline">
        <div className="pmd-section-heading">
          <span className="pmd-section-kicker">Activity feed</span>
          <strong className="pmd-one-line">{items.length} capabilities in this space</strong>
        </div>
        <button
          type="button"
          className="pmd-feed-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Compact' : 'All'}
        </button>
      </div>

      <label className="pmd-feed-search">
        <span aria-hidden>⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this space"
          aria-label="Search capabilities in this super page"
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
      </label>

      <ul className="pmd-feed-list" role="list">
        {visible.map((feature, index) => (
          <motion.li
            key={feature.to + '-' + feature.nama}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .2, delay: Math.min(index, 10) * .012 }}
          >
            <Link to={feature.to} className="pmd-feed-row">
              <span className="pmd-feed-pulse" aria-hidden />
              <span className="pmd-feed-main">
                <strong className="pmd-one-line">{feature.nama}</strong>
                <small className="pmd-one-line">{usage[feature.to] ? 'Used ' + usage[feature.to] + '× · ' + feature.grup : feature.grup}</small>
              </span>
              <span className="pmd-feed-arrow" aria-hidden>↗</span>
            </Link>
          </motion.li>
        ))}
      </ul>

      {!query && items.length > initialLimit && !expanded && (
        <button type="button" className="pmd-feed-more" onClick={() => setExpanded(true)}>
          Show {items.length - initialLimit} more
        </button>
      )}
    </section>
  )
}

export default SuperPageActivityFeed
