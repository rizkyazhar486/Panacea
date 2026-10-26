import { useEffect, useState } from 'react'
import { Check, Minus, Plus, ShoppingBag, XIcon } from '../icons'
import type { Product } from '../data/products'
import { formatPrice } from '../data/products'
import { ProductJar } from './ProductJar'

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

  useEffect(() => {
    if (product) {
      setQuantity(1)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [product, onClose])

  if (!product) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title"
      aria-describedby="product-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6"
      onClick={handleBackdropClick}
    >
      <div className="product-dialog relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 bg-white/80 rounded-full backdrop-blur transition-colors"
        >
          <XIcon size={20} />
        </button>

        <div className={`product-dialog__visual product-card__visual--${product.tone}`}>
          <span className="product-card__code">{product.code}</span>
          <ProductJar product={product} />
        </div>
        <div className="product-dialog__content">
          <p className="eyebrow">{product.category} · {product.servings} servings</p>
          <h2 id="product-dialog-title" className="product-dialog__title">{product.name}</h2>
          <p className="product-dialog__subtitle">{product.subtitle}</p>
          <p id="product-dialog-description" className="product-dialog__description">
            {product.description}
          </p>
          <ul className="product-dialog__notes">
            {product.formulaNotes.map((note) => (
              <li key={note}>
                <Check size={16} aria-hidden="true" />
                {note}
              </li>
            ))}
          </ul>
          <details className="product-dialog__usage">
            <summary>Usage & safety</summary>
            <p>{product.usage}</p>
          </details>
          <div className="product-dialog__purchase">
            <div className="quantity-control" aria-label="Quantity selector">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity === 1}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(8, q + 1))}
                disabled={quantity === 8}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              className="button button--orange product-dialog__add"
              onClick={() => {
                onAdd(product, quantity)
                onClose()
              }}
            >
              <ShoppingBag size={17} aria-hidden="true" /> Add · {formatPrice(product.price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
