import { useEffect, useState } from 'react'
import { ArrowUp, ArrowUpRight } from './icons'
import { Brand } from './components/Brand'
import { CartDrawer } from './components/CartDrawer'
import { Catalog } from './components/Catalog'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ProductDialog } from './components/ProductDialog'
import { VaultBuilder } from './components/VaultBuilder'
import { VaultPromo } from './components/VaultPromo'
import { ClosingCta, Faq, ScienceQuality, Services, Testimonials, WhyPanacea } from './components/StorySections'
import type { Product } from './data/products'
import { productById } from './data/products'
import type { CartItem, SavedVault } from './types/shop'
import { scrollToSection } from './utils'
import '../../styles/storefront.css'

interface Notification {
  id: string
  message: string
  type: 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
}

export function StorefrontPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('panaceamed-cart') : null
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [savedVault, setSavedVault] = useState<SavedVault | null>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('panaceamed-vault') : null
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('panaceamed-cart', JSON.stringify(cart))
      }
    } catch {
      // Usable even if storage is disabled
    }
  }, [cart])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (savedVault) {
          window.localStorage.setItem('panaceamed-vault', JSON.stringify(savedVault))
        } else {
          window.localStorage.removeItem('panaceamed-vault')
        }
      }
    } catch {
      // Usable even if storage is disabled
    }
  }, [savedVault])

  const notify = (message: string, type: 'success' | 'error' = 'success', actionLabel?: string, onAction?: () => void) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications((prev) => [...prev, { id, message, type, actionLabel, onAction }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  const addProduct = (product: Product, quantity = 1) => {
    const key = `product-${product.id}`
    setCart((current) => {
      const existing = current.find((item) => item.key === key)
      if (existing) {
        return current.map((item) => (item.key === key ? { ...item, quantity: Math.min(8, item.quantity + quantity) } : item))
      }
      return [...current, { key, kind: 'product', name: product.name, productId: product.id, quantity, unitPrice: product.price }]
    })
    notify(`${product.name} added to your cart`, 'success', 'View cart', () => setCartOpen(true))
  }

  const addVault = (vault: SavedVault) => {
    const originalTotal = vault.productIds.reduce((sum, id) => sum + (productById(id)?.price ?? 0), 0)
    const key = `vault-${vault.id}`
    const item: CartItem = {
      key,
      kind: 'vault',
      name: vault.name,
      productIds: vault.productIds,
      quantity: 1,
      unitPrice: originalTotal * 0.8,
      originalUnitPrice: originalTotal,
    }
    setCart((current) => [...current.filter((cartItem) => cartItem.key !== key), item])
    notify(`${vault.name} added to your cart (${vault.productIds.length} formulas · 20% Private Vault saving applied)`, 'success', 'View cart', () => setCartOpen(true))
  }

  const saveVault = (vault: SavedVault) => {
    setSavedVault(vault)
    notify(`${vault.name} saved in this browser`, 'success')
  }

  const updateQuantity = (key: string, quantity: number) => {
    setCart((current) => current.map((item) => (item.key === key ? { ...item, quantity: Math.max(1, Math.min(8, quantity)) } : item)))
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="storefront-app antialiased selection:bg-amber-200 selection:text-stone-900">
      <button
        type="button"
        onClick={() => scrollToSection('main')}
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-white focus:text-black"
      >
        Skip to content
      </button>
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <main id="main">
        <Hero />
        <Catalog onView={setActiveProduct} onAdd={addProduct} />
        <VaultPromo />
        <VaultBuilder
          savedVault={savedVault}
          onSave={saveVault}
          onDeleteSaved={() => {
            setSavedVault(null)
            notify('Saved Vault removed', 'success')
          }}
          onAddToCart={addVault}
        />
        <WhyPanacea />
        <ScienceQuality />
        <Services />
        <Testimonials />
        <Faq />
        <ClosingCta />
      </main>

      <footer className="footer dark">
        <div className="page-shell">
          <div className="footer__top">
            <div className="footer__brand">
              <button
                type="button"
                onClick={() => scrollToSection('top')}
                className="bg-transparent border-0 p-0 cursor-pointer text-left"
                aria-label="PanaceaMed home"
              >
                <Brand light />
              </button>
              <p>Precision formulas.<br />Personal rituals.</p>
            </div>
            <div className="footer__nav">
              <div>
                <span>EXPLORE</span>
                <button type="button" onClick={() => scrollToSection('catalog')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  Catalog
                </button>
                <button type="button" onClick={() => scrollToSection('private-vault')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  Private Vault
                </button>
                <button type="button" onClick={() => scrollToSection('why-panacea')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  Why Panacea
                </button>
              </div>
              <div>
                <span>DISCOVER</span>
                <button type="button" onClick={() => scrollToSection('our-standard')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  Our Standard
                </button>
                <button type="button" onClick={() => scrollToSection('services')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  Services
                </button>
                <button type="button" onClick={() => scrollToSection('faq')} className="bg-transparent border-0 cursor-pointer p-0 text-left block text-stone-300 hover:text-white">
                  FAQ
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('vault-builder')}
              className="footer__cta bg-transparent border-0 cursor-pointer text-left"
            >
              Build your collection <ArrowUpRight size={21} />
            </button>
          </div>
          <div className="footer__disclaimer">
            <strong>Medical disclaimer</strong>
            <p>
              Warning: These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat,
              cure, or prevent any disease. Do not use if pregnant or nursing without consulting a qualified healthcare professional.
            </p>
          </div>
          <div className="footer__bottom">
            <span>© 2026 PANACEAMED. ALL RIGHTS RESERVED.</span>
            <span>STOREFRONT PREVIEW · BROWSER-LOCAL CART & VAULT</span>
            <button
              type="button"
              onClick={() => scrollToSection('top')}
              className="bg-transparent border-0 p-0 text-inherit cursor-pointer inline-flex items-center gap-1.5"
            >
              Back to top <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      <ProductDialog product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addProduct} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onQuantity={updateQuantity}
        onRemove={(key) => setCart((current) => current.filter((item) => item.key !== key))}
        onNotify={(msg, type) => notify(msg, type ?? 'success')}
      />

      {/* Floating notification toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-lg shadow-xl text-sm flex items-center justify-between gap-3 border transition-all ${
              n.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-800'
                : 'bg-stone-900/95 text-stone-100 border-stone-800'
            }`}
          >
            <span>{n.message}</span>
            {n.actionLabel && n.onAction && (
              <button
                type="button"
                onClick={n.onAction}
                className="text-xs font-semibold underline hover:text-amber-300 shrink-0"
              >
                {n.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
