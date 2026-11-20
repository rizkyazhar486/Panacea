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

export function SuperPageLauncher() {
  const [view, setView] = useState<'map' | 'grid'>('map')

  return (
    <section className="pmd-superpage-launcher pmd-scroll-section" aria-label="Panacea category pages">
      <div className="pmd-section-heading">
        <span className="pmd-section-kicker">Feature map</span>
        <strong className="pmd-one-line">One human state, seven connected lenses</strong>
      </div>

      <div className="mb-2 flex items-center justify-end gap-2" role="group" aria-label="Feature map view">
        <button
          type="button"
          onClick={() => setView('map')}
          aria-pressed={view === 'map'}
          className={
            view === 'map'
              ? 'min-h-[44px] min-w-[60px] rounded-full bg-neutral-950 px-3.5 text-[12px] font-bold text-white dark:bg-cyan-300 dark:text-neutral-950'
              : 'min-h-[44px] min-w-[60px] rounded-full border border-black/15 bg-white px-3.5 text-[12px] font-bold text-neutral-900 dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-100'
          }
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setView('grid')}
          aria-pressed={view === 'grid'}
          className={
            view === 'grid'
              ? 'min-h-[44px] min-w-[60px] rounded-full bg-neutral-950 px-3.5 text-[12px] font-bold text-white dark:bg-cyan-300 dark:text-neutral-950'
              : 'min-h-[44px] min-w-[60px] rounded-full border border-black/15 bg-white px-3.5 text-[12px] font-bold text-neutral-900 dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-100'
          }
        >
          Grid
        </button>
      </div>

      {view === 'map' ? (
        <Suspense fallback={<CategoryGrid />}>
          <FeatureMapOrbit icons={ICONS} />
        </Suspense>
      ) : (
        <CategoryGrid />
      )}
    </section>
  )
}

export default SuperPageLauncher
