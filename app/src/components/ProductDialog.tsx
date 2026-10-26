import { useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '@/data/products'
import { formatPrice } from '@/data/products'
import { ProductJar } from '@/components/ProductJar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

export function ProductDialog({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null
  onClose: () => void
  onAdd: (product: Product, quantity: number) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const close = () => { setQuantity(1); onClose() }

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && close()}>
      {product && (
        <DialogContent className="product-dialog" aria-describedby="product-dialog-description">
          <div className={`product-dialog__visual product-card__visual--${product.tone}`}>
            <span className="product-card__code">{product.code}</span>
            <ProductJar product={product} />
          </div>
          <div className="product-dialog__content">
            <p className="eyebrow">{product.category} · {product.servings} servings</p>
            <DialogTitle className="product-dialog__title">{product.name}</DialogTitle>
            <p className="product-dialog__subtitle">{product.subtitle}</p>
            <DialogDescription id="product-dialog-description" className="product-dialog__description">
              {product.description}
            </DialogDescription>
            <ul className="product-dialog__notes">
              {product.formulaNotes.map((note) => <li key={note}><Check size={16} aria-hidden="true" />{note}</li>)}
            </ul>
            <details className="product-dialog__usage">
              <summary>Usage & safety</summary>
              <p>{product.usage}</p>
            </details>
            <div className="product-dialog__purchase">
              <div className="quantity-control" aria-label="Quantity selector">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity === 1} aria-label="Decrease quantity"><Minus size={16} /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(8, q + 1))} disabled={quantity === 8} aria-label="Increase quantity"><Plus size={16} /></button>
              </div>
              <button type="button" className="button button--orange product-dialog__add" onClick={() => { onAdd(product, quantity); close() }}>
                <ShoppingBag size={17} aria-hidden="true" /> Add · {formatPrice(product.price * quantity)}
              </button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
