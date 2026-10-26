import { useState } from 'react'
import { ArrowUpRight, Menu, ShoppingBag, XIcon } from '../icons'
import { Brand } from './Brand'
import { scrollToSection } from '../utils'

const navigation = [
  { label: 'Catalog', targetId: 'catalog' },
  { label: 'Private Vault', targetId: 'private-vault' },
  { label: 'Why Panacea', targetId: 'why-panacea' },
  { label: 'Our Standard', targetId: 'our-standard' },
]

export function Header({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="announcement w-full block text-center"
        onClick={() => scrollToSection('private-vault')}
      >
        <span>Private Vault</span>
        <span className="announcement__message">Your personal collection. Always 20% less.</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </button>
      <header className="site-header">
        <div className="site-header__inner page-shell">
          <button
            type="button"
            onClick={() => scrollToSection('top')}
            className="site-header__brand bg-transparent border-0 p-0 cursor-pointer text-left"
            aria-label="PanaceaMed home"
          >
            <Brand />
          </button>
          <nav className="site-header__nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <button
                key={item.targetId}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className="bg-transparent border-0 cursor-pointer p-0 font-inherit"
              >
                {item.label}
              </button>
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
                  <button
                    key={item.targetId}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      scrollToSection(item.targetId)
                    }}
                    className="flex items-center justify-between py-3 border-b border-stone-800 text-lg hover:text-amber-300 transition-colors w-full text-left bg-transparent"
                  >
                    <span className="text-xs text-stone-500 font-mono">0{index + 1}</span>
                    <span className="font-serif">{item.label}</span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
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
