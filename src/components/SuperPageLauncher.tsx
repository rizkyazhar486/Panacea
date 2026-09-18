import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IconHeart, IconSparkle, IconStethoscope } from './icons'
import { SUPER_PAGES, type SuperPageId } from '../lib/superPages'

const ICONS = {
  body: IconHeart,
  clinical: IconStethoscope,
  'for-you': IconSparkle,
} satisfies Record<SuperPageId, typeof IconHeart>

export function SuperPageLauncher() {
  return (
    <section className="pmd-superpage-launcher pmd-scroll-section" aria-label="Panacea super pages">
      <div className="pmd-section-heading">
        <span className="pmd-section-kicker">Three spaces</span>
        <strong className="pmd-one-line">Everything in Panacea, without the maze</strong>
      </div>

      <div className="pmd-superpage-grid">
        {SUPER_PAGES.map((space, index) => {
          const Icon = ICONS[space.id]
          return (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .35 }}
              transition={{ duration: .36, delay: index * .055, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, scale: 1.008 }}
              whileTap={{ scale: .985 }}
            >
              <Link
                to={space.to}
                className="pmd-liquid-metal pmd-superpage-tile"
                data-superpage={space.id}
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
    </section>
  )
}

export default SuperPageLauncher
