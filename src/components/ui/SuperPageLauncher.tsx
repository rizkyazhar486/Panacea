import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  IconActivity,
  IconBook,
  IconEMR,
  IconHeart,
  IconSparkle,
  IconStethoscope,
  IconUser,
} from '../icons'
import { SUPER_PAGES, type SuperPageId } from '../../lib/superPages'
import { WhenNear } from '../../shared/ui/WhenNear'

const FeatureMapOrbit = lazy(() => import('./FeatureMapOrbit'))

const ICONS = {
  human: IconActivity,
  health: IconHeart,
  clinical: IconStethoscope,
  explore: IconBook,
  simulate: IconSparkle,
  records: IconEMR,
  'for-you': IconUser,
} satisfies Record<SuperPageId, typeof IconHeart>

function CategoryGrid() {
  return (
    <div className="pmd-superpage-grid">
      {SUPER_PAGES.map((space, index) => {
        const Icon = ICONS[space.id]
        return (
          <motion.div
            key={space.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: .35 }}
            transition={{ duration: .36, delay: index * .045, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.008 }}
            whileTap={{ scale: .985 }}
          >
            <Link
              to={space.to}
              className="pmd-liquid-metal pmd-superpage-tile"
              data-superpage={space.id}
              data-human-state-source={space.stateSource}
              aria-label={'Open ' + space.label}
            >
              <span className="pmd-liquid-metal-icon" aria-hidden>
                <Icon size={22} />
              </span>
              <span className="pmd-superpage-copy">
                <strong className="pmd-one-line">{space.label}</strong>
                <small className="pmd-one-line">{space.cue}</small>
              </span>
              <span className="pmd-superpage-arrow" aria-hidden>↗</span>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

export function SuperPageLauncher({ compact = false }: { compact?: boolean } = {}) {
  const [view, setView] = useState<'map' | 'grid'>('map')

  return (
    <section
      className={compact ? 'space-y-2.5' : 'pmd-superpage-launcher pmd-scroll-section'}
      aria-label="Panacea category pages"
    >
      <div className={compact ? 'flex flex-wrap items-center justify-between gap-2' : 'pmd-section-heading'}>
        <div className="min-w-0">
          {!compact && <span className="pmd-section-kicker">Feature map</span>}
          <strong className={compact ? 'block truncate text-xs font-extrabold text-white' : 'pmd-one-line'}>
            One human state, seven connected lenses
          </strong>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Feature map view">
          <button
            type="button"
            data-pmd-native="true"
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
            className={
              view === 'map'
                ? 'min-h-[44px] min-w-[56px] rounded-full bg-emerald-500 px-3 text-[11px] font-extrabold text-neutral-950 transition'
                : compact
                  ? 'min-h-[44px] min-w-[56px] rounded-full border border-white/20 bg-white/[.08] px-3 text-[11px] font-bold text-white transition hover:bg-white/[.15]'
                  : 'min-h-[44px] min-w-[56px] rounded-full border border-neutral-300 bg-neutral-100 px-3 text-[11px] font-bold text-neutral-900 transition hover:bg-neutral-200 dark:border-white/20 dark:bg-white/[.08] dark:text-white dark:hover:bg-white/[.15]'
            }
          >
            Map
          </button>
          <button
            type="button"
            data-pmd-native="true"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            className={
              view === 'grid'
                ? 'min-h-[44px] min-w-[56px] rounded-full bg-emerald-500 px-3 text-[11px] font-extrabold text-neutral-950 transition'
                : compact
                  ? 'min-h-[44px] min-w-[56px] rounded-full border border-white/20 bg-white/[.08] px-3 text-[11px] font-bold text-white transition hover:bg-white/[.15]'
                  : 'min-h-[44px] min-w-[56px] rounded-full border border-neutral-300 bg-neutral-100 px-3 text-[11px] font-bold text-neutral-900 transition hover:bg-neutral-200 dark:border-white/20 dark:bg-white/[.08] dark:text-white dark:hover:bg-white/[.15]'
            }
          >
            Grid
          </button>
        </div>
      </div>

      {view === 'map' ? (
        compact ? (
          <Suspense fallback={<CategoryGrid />}>
            <FeatureMapOrbit icons={ICONS} />
          </Suspense>
        ) : (
          // The orbit is the heaviest part of Home and sits below the fold: load it when it scrolls near.
          <WhenNear minHeight={420}>
            <Suspense fallback={<CategoryGrid />}>
              <FeatureMapOrbit icons={ICONS} />
            </Suspense>
          </WhenNear>
        )
      ) : (
        <CategoryGrid />
      )}
    </section>
  )
}

export default SuperPageLauncher
