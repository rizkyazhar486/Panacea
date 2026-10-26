import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from '../icons'
import type { Product } from '../data/products'
import { categories, products } from '../data/products'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'

export function Catalog({ onView, onAdd }: { onView: (product: Product) => void; onAdd: (product: Product) => void }) {
  const [filter, setFilter] = useState<(typeof categories)[number]>('All formulas')
  const reduceMotion = useReducedMotion()
  const visible = products.filter((product) => filter === 'All formulas' || product.category === filter || product.additionalCategories?.includes(filter))

  return (
    <section className="catalog section-space" id="catalog">
      <div className="page-shell">
        <Reveal className="section-heading section-heading--split">
          <div><p className="eyebrow">The collection</p><h2>Targeted<br /><em>by design.</em></h2></div>
          <p>Four focused formulas. No endless aisles, no unnecessary complexity—just clear choices for a more considered daily ritual.</p>
        </Reveal>
        <div className="catalog__toolbar">
          <div className="catalog__filters" role="group" aria-label="Filter formulas by health category">
            {categories.map((category) => (
              <button key={category} type="button" className={filter === category ? 'is-active' : ''} onClick={() => setFilter(category)} aria-pressed={filter === category}>
                {category}
              </button>
            ))}
          </div>
          <span className="catalog__count" aria-live="polite">{visible.length.toString().padStart(2, '0')} formulas</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="product-grid"
            key={filter}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            {visible.map((product) => <ProductCard key={product.id} product={product} onView={onView} onAdd={onAdd} />)}
          </motion.div>
        </AnimatePresence>
        <div className="catalog__foot"><p>Prefer a collection that starts with you?</p><a href="#vault-builder" className="text-link">Build your Private Vault <ArrowUpRight size={16} /></a></div>
      </div>
    </section>
  )
}
