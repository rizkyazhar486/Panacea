import type { Product } from '@/data/products'
import { cn } from '@/lib/utils'

export function ProductJar({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn('product-jar', className)}>
      <img src="/images/product-jar.webp" alt={`${product.name} amber supplement jar`} loading="lazy" />
      <div className="product-jar__label" aria-hidden="true">
        <span className="product-jar__brand">PANACEAMED</span>
        <span className="product-jar__line" />
        <span className="product-jar__name">{product.name}</span>
        <span className="product-jar__subtitle">{product.subtitle}</span>
        <span className="product-jar__servings">{product.servings} SERVINGS</span>
      </div>
    </div>
  )
}
