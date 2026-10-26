import { ArrowUpRight, Plus } from '../icons'
import type { Product } from '../data/products'
import { formatPrice } from '../data/products'
import { ProductJar } from './ProductJar'

export function ProductCard({
  product,
  onView,
  onAdd,
}: {
  product: Product
  onView: (product: Product) => void
  onAdd: (product: Product) => void
}) {
  return (
    <article className="product-card">
      <button
        type="button"
        className={`product-card__visual product-card__visual--${product.tone}`}
        onClick={() => onView(product)}
        aria-label={`View ${product.name} details`}
      >
        <span className="product-card__code">{product.code}</span>
        <ProductJar product={product} />
        <span className="product-card__view">View formula <ArrowUpRight size={15} aria-hidden="true" /></span>
      </button>
      <div className="product-card__body">
        <button type="button" className="product-card__title" onClick={() => onView(product)}>
          {product.name}
        </button>
        <p className="product-card__subtitle">{product.subtitle}</p>
        <p className="product-card__description">{product.shortDescription}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(product.price)} <small>/ {product.servings} servings</small></span>
          <button type="button" className="quick-add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
            <Plus size={18} aria-hidden="true" />
            <span>Quick add</span>
          </button>
        </div>
      </div>
    </article>
  )
}
