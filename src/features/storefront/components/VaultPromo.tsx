import { ArrowRight } from '../icons'
import { products } from '../data/products'
import { ProductJar } from './ProductJar'
import { Reveal } from './Reveal'
import { scrollToSection } from '../utils'

export function VaultPromo() {
  return (
    <section className="vault-promo dark" id="private-vault">
      <div className="vault-promo__inner page-shell">
        <Reveal className="vault-promo__copy">
          <p className="eyebrow">A more personal way to supplement</p>
          <h2>One vault.<br /><em>Endlessly personal.</em></h2>
          <p>Curate a collection around your routine and save 20%. Thoughtful recommendations to begin, complete freedom to make it yours.</p>
          <button type="button" onClick={() => scrollToSection('vault-builder')} className="button button--orange">Start building <ArrowRight size={18} /></button>
        </Reveal>
        <Reveal className="vault-promo__visual" delay={0.08}>
          <span className="vault-promo__watermark" aria-hidden="true">VAULT</span>
          <div className="vault-promo__jars" aria-label="A personalized collection of PanaceaMed formulas">
            <ProductJar product={products[1]} />
            <ProductJar product={products[0]} />
            <ProductJar product={products[2]} />
          </div>
          <div className="vault-promo__note"><span>YOUR COLLECTION</span><strong>20% saved</strong><small>No subscription. Just your edit.</small></div>
        </Reveal>
      </div>
    </section>
  )
}
