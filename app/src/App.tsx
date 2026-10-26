import { useState } from 'react'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Brand } from '@/components/Brand'
import { CartDrawer } from '@/components/CartDrawer'
import { Catalog } from '@/components/Catalog'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { ProductDialog } from '@/components/ProductDialog'
import { VaultBuilder } from '@/components/VaultBuilder'
import { VaultPromo } from '@/components/VaultPromo'
import { ClosingCta, Faq, ScienceQuality, Services, Testimonials, WhyPanacea } from '@/components/StorySections'
import type { Product } from '@/data/products'
import { productById } from '@/data/products'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { CartItem, SavedVault } from '@/types/shop'

export default function App() {
  const [cart, setCart] = useLocalStorage<CartItem[]>('panaceamed-cart', [])
  const [savedVault, setSavedVault] = useLocalStorage<SavedVault | null>('panaceamed-vault', null)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const addProduct = (product: Product, quantity = 1) => {
    const key = `product-${product.id}`
    setCart((current) => {
      const existing = current.find((item) => item.key === key)
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: Math.min(8, item.quantity + quantity) } : item)
      return [...current, { key, kind: 'product', name: product.name, productId: product.id, quantity, unitPrice: product.price }]
    })
    toast.success(`${product.name} added to your cart`, {
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
    })
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
    toast.success(`${vault.name} added to your cart`, {
      description: `${vault.productIds.length} formulas · 20% Private Vault saving applied`,
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
    })
  }

  const saveVault = (vault: SavedVault) => {
    setSavedVault(vault)
    toast.success(`${vault.name} saved in this browser`)
  }

  const updateQuantity = (key: string, quantity: number) => {
    setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.min(8, quantity)) } : item))
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <main id="main">
        <Hero />
        <Catalog onView={setActiveProduct} onAdd={addProduct} />
        <VaultPromo />
        <VaultBuilder savedVault={savedVault} onSave={saveVault} onDeleteSaved={() => { setSavedVault(null); toast.success('Saved Vault removed') }} onAddToCart={addVault} />
        <WhyPanacea />
        <ScienceQuality />
        <Services />
        <Testimonials />
        <Faq />
        <ClosingCta />
      </main>

      <footer className="footer">
        <div className="page-shell">
          <div className="footer__top">
            <div className="footer__brand"><a href="#top" aria-label="PanaceaMed home"><Brand light /></a><p>Precision formulas.<br />Personal rituals.</p></div>
            <div className="footer__nav"><div><span>EXPLORE</span><a href="#catalog">Catalog</a><a href="#private-vault">Private Vault</a><a href="#why-panacea">Why Panacea</a></div><div><span>DISCOVER</span><a href="#our-standard">Our Standard</a><a href="#services">Services</a><a href="#faq">FAQ</a></div></div>
            <a href="#vault-builder" className="footer__cta">Build your collection <ArrowUpRight size={21} /></a>
          </div>
          <div className="footer__disclaimer"><strong>Medical disclaimer</strong><p>These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified healthcare professional before using any dietary supplement, especially if you are pregnant, nursing, taking medication, or managing a health condition.</p></div>
          <div className="footer__bottom"><span>© 2026 PANACEAMED. ALL RIGHTS RESERVED.</span><span>STOREFRONT PREVIEW · BROWSER-LOCAL CART & VAULT</span><a href="#top">Back to top <ArrowUp size={14} /></a></div>
        </div>
      </footer>

      <ProductDialog product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addProduct} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} items={cart} onQuantity={updateQuantity} onRemove={(key) => setCart((current) => current.filter((item) => item.key !== key))} />
      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'panacea-toast', duration: 3500 }} />
    </div>
  )
}
