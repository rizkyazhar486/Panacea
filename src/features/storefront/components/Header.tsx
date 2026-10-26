import { useState } from 'react'
import { ArrowUpRight, Menu, ShoppingBag, XIcon } from '../icons'
import { Brand } from './Brand'

const navigation = [
  { label: 'Catalog', href: '#catalog' },
  { label: 'Private Vault', href: '#private-vault' },
  { label: 'Why Panacea', href: '#why-panacea' },
  { label: 'Our Standard', href: '#our-standard' },
]

export function Header({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <a className="announcement" href="#private-vault">
        <span>Private Vault</span>
        <span className="announcement__message">Your personal collection. Always 20% less.</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </a>
      <header className="site-header">
        <div className="site-header__inner page-shell">
          <a href="#top" className="site-header__brand" aria-label="PanaceaMed home">
            <Brand />
          </a>
          <nav className="site-header__nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="site-header__actions">
            <button className="cart-trigger" type="button" onClick={onCartOpen} aria-label={`Open cart with ${cartCount} items`}>
              <ShoppingBag size={19} strokeWidth={1.7} aria-hidden="true" />
              <span className="cart-trigger__label">Cart</span>
              <span className="cart-trigger__count" aria-hidden="true">{cartCount}</span>
            </button>
            <button className="menu-trigger" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">
              <Menu size={22} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuOpen(false)
          }}
        >
          <div className="mobile-menu w-4/5 max-w-sm h-full bg-stone-900 text-white p-6 flex flex-col justify-between relative shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center text-stone-300 hover:text-white"
            >
              <XIcon size={20} />
            </button>
            <div>
              <div className="mobile-menu__header mb-8">
                <Brand light />
              </div>
              <nav className="mobile-menu__nav flex flex-col gap-4" aria-label="Mobile navigation">
                {navigation.map((item, index) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-3 border-b border-stone-800 text-lg hover:text-amber-300 transition-colors"
                  >
                    <span className="text-xs text-stone-500 font-mono">0{index + 1}</span>
                    <span className="font-serif">{item.label}</span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                ))}
              </nav>
            </div>
            <div className="mobile-menu__foot pt-6 border-t border-stone-800 text-xs text-stone-400">
              <p className="font-serif italic text-stone-300 text-sm mb-1">Wellness, edited around you.</p>
              <span>Precision formulations · Personal collections</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
