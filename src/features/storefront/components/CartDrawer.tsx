import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Minus, Plus, ShoppingBag, Trash2, XIcon } from '../icons'
import type { CartItem } from '../types/shop'
import { formatPrice, productById } from '../data/products'
import { scrollToSection } from '../utils'

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onQuantity,
  onRemove,
  onNotify,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  onQuantity: (key: string, quantity: number) => void
  onRemove: (key: string) => void
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) {
  const [view, setView] = useState<'cart' | 'preview'>('cart')

  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setView('cart')
          onOpenChange(false)
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    } else {
      setView('cart')
    }
  }, [open, onOpenChange])

  if (!open) return null

  const handleClose = () => {
    setView('cart')
    onOpenChange(false)
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const savings = items.reduce((sum, item) => sum + ((item.originalUnitPrice ?? item.unitPrice) - item.unitPrice) * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  const copySummary = async () => {
    const summary = [
      'PANACEAMED — CART SUMMARY',
      ...items.map((item) => `${item.quantity} × ${item.name} — ${formatPrice(item.unitPrice * item.quantity)}`),
      `Total — ${formatPrice(total)}`,
      'Preview only. No payment or order has been submitted.',
    ].join('\n')
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summary)
        onNotify('Cart summary copied to clipboard', 'success')
      } else {
        onNotify('Copy is unavailable in this browser', 'error')
      }
    } catch {
      onNotify('Copy is unavailable in this browser', 'error')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="cart-drawer flex flex-col h-full w-full max-w-md bg-stone-50 text-stone-900 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close cart"
          className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900"
        >
          <XIcon size={20} />
        </button>

        <header className="cart-drawer__header">
          {view === 'preview' && (
            <button
              type="button"
              className="icon-button cart-drawer__back"
              onClick={() => setView('cart')}
              aria-label="Back to cart"
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <h2>{view === 'cart' ? `Your cart · ${count}` : 'Checkout preview'}</h2>
          <p>{view === 'cart' ? 'Your selected formulas and Private Vaults.' : 'Review your selection. No payment will be collected.'}</p>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag size={32} strokeWidth={1.3} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-medium">Your ritual starts here.</h3>
            <p className="mt-2 text-sm text-stone-600 max-w-xs">Explore targeted formulas or build a personalized collection with 20% savings.</p>
            <button type="button" className="button button--green mt-6" onClick={() => { handleClose(); scrollToSection('catalog') }}>
              Explore formulas <ArrowRight size={17} />
            </button>
            <button type="button" className="text-link mt-4" onClick={() => { handleClose(); scrollToSection('vault-builder') }}>
              Build a Private Vault
            </button>
          </div>
        ) : view === 'preview' ? (
          <div className="checkout-preview flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <div className="checkout-preview__notice">
              <Check size={18} aria-hidden="true" />
              <p>Your cart is ready. This preview does not transmit an order or process payment.</p>
            </div>
            <div className="checkout-preview__lines">
              {items.map((item) => (
                <div key={item.key}>
                  <span>{item.quantity} × {item.name}</span>
                  <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="cart-drawer__total">
              <span>Preview total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <p className="checkout-preview__fine">Shipping, taxes, availability, and final pricing would be confirmed by a connected commerce backend.</p>
            <button type="button" className="button button--green button--full" onClick={copySummary}>
              <Copy size={17} /> Copy order summary
            </button>
            <button type="button" className="text-link mx-auto" onClick={() => setView('cart')}>
              Return to cart
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => {
                const product = item.productId ? productById(item.productId) : undefined
                return (
                  <article className="cart-line" key={item.key}>
                    <div className={`cart-line__visual ${item.kind === 'vault' ? 'cart-line__visual--vault' : ''}`}>
                      {item.kind === 'vault' ? (
                        <>
                          <span>PRIVATE</span>
                          <strong>VAULT</strong>
                          <small>20% SAVED</small>
                        </>
                      ) : (
                        product && <img src="/images/product-jar.webp" alt="" />
                      )}
                    </div>
                    <div className="cart-line__content">
                      <div className="cart-line__heading">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.kind === 'vault' ? `${item.productIds?.length ?? 0} formulas · personalized` : product?.subtitle}</p>
                        </div>
                        <button type="button" className="icon-button" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="cart-line__bottom">
                        <div className="quantity-control quantity-control--small">
                          <button
                            type="button"
                            onClick={() => onQuantity(item.key, item.quantity - 1)}
                            disabled={item.quantity === 1}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onQuantity(item.key, item.quantity + 1)}
                            disabled={item.quantity === 8}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="cart-line__price">
                          {item.originalUnitPrice && <s>{formatPrice(item.originalUnitPrice * item.quantity)}</s>}
                          <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="cart-drawer__summary">
              {savings > 0 && (
                <div className="cart-drawer__saving">
                  <span>Total savings</span>
                  <strong>−{formatPrice(savings)}</strong>
                </div>
              )}
              <div className="cart-drawer__total">
                <span>Subtotal</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <p className="cart-drawer__fine">Shipping and local taxes calculated at checkout.</p>
              <button type="button" className="button button--green button--full" onClick={() => setView('preview')}>
                Proceed to checkout <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
