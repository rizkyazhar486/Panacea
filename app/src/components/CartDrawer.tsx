import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CartItem } from '@/types/shop'
import { formatPrice, productById } from '@/data/products'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onQuantity,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  onQuantity: (key: string, quantity: number) => void
  onRemove: (key: string) => void
}) {
  const [view, setView] = useState<'cart' | 'preview'>('cart')
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setView('cart')
    onOpenChange(nextOpen)
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
      await navigator.clipboard.writeText(summary)
      toast.success('Cart summary copied')
    } catch {
      toast.error('Copy is unavailable in this browser')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="cart-drawer">
        <SheetHeader className="cart-drawer__header">
          {view === 'preview' && <button type="button" className="icon-button cart-drawer__back" onClick={() => setView('cart')} aria-label="Back to cart"><ArrowLeft size={19} /></button>}
          <SheetTitle>{view === 'cart' ? `Your cart · ${count}` : 'Checkout preview'}</SheetTitle>
          <SheetDescription>{view === 'cart' ? 'Your selected formulas and Private Vaults.' : 'Review your selection. No payment will be collected.'}</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={32} strokeWidth={1.3} aria-hidden="true" />
            <h3>Your ritual starts here.</h3>
            <p>Explore targeted formulas or build a personalized collection with 20% savings.</p>
            <a href="#catalog" className="button button--green" onClick={() => handleOpenChange(false)}>Explore formulas <ArrowRight size={17} /></a>
            <a href="#vault-builder" className="text-link" onClick={() => handleOpenChange(false)}>Build a Private Vault</a>
          </div>
        ) : view === 'preview' ? (
          <div className="checkout-preview">
            <div className="checkout-preview__notice"><Check size={18} aria-hidden="true" /><p>Your cart is ready. This preview does not transmit an order or process payment.</p></div>
            <div className="checkout-preview__lines">
              {items.map((item) => <div key={item.key}><span>{item.quantity} × {item.name}</span><strong>{formatPrice(item.unitPrice * item.quantity)}</strong></div>)}
            </div>
            <div className="cart-drawer__total"><span>Preview total</span><strong>{formatPrice(total)}</strong></div>
            <p className="checkout-preview__fine">Shipping, taxes, availability, and final pricing would be confirmed by a connected commerce backend.</p>
            <button type="button" className="button button--green button--full" onClick={copySummary}><Copy size={17} /> Copy order summary</button>
            <button type="button" className="text-link mx-auto" onClick={() => setView('cart')}>Return to cart</button>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => {
                const product = item.productId ? productById(item.productId) : undefined
                return (
                  <article className="cart-line" key={item.key}>
                    <div className={`cart-line__visual ${item.kind === 'vault' ? 'cart-line__visual--vault' : ''}`}>
                      {item.kind === 'vault' ? <><span>PRIVATE</span><strong>VAULT</strong><small>20% SAVED</small></> : product && <img src="/images/product-jar.webp" alt="" />}
                    </div>
                    <div className="cart-line__content">
                      <div className="cart-line__heading"><div><h3>{item.name}</h3><p>{item.kind === 'vault' ? `${item.productIds?.length ?? 0} formulas · personalized` : product?.subtitle}</p></div><button type="button" className="icon-button" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button></div>
                      <div className="cart-line__bottom">
                        <div className="quantity-control quantity-control--small">
                          <button type="button" onClick={() => onQuantity(item.key, item.quantity - 1)} disabled={item.quantity === 1} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => onQuantity(item.key, item.quantity + 1)} disabled={item.quantity === 8} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button>
                        </div>
                        <div className="cart-line__price">{item.originalUnitPrice && <s>{formatPrice(item.originalUnitPrice * item.quantity)}</s>}<strong>{formatPrice(item.unitPrice * item.quantity)}</strong></div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="cart-drawer__summary">
              {savings > 0 && <div className="cart-drawer__saving"><span>Private Vault savings</span><strong>−{formatPrice(savings)}</strong></div>}
              <div className="cart-drawer__total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
              <p>Shipping and taxes are not included in this storefront preview.</p>
              <button type="button" className="button button--orange button--full" onClick={() => setView('preview')}>Preview checkout <ArrowRight size={17} /></button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
