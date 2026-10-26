import { useState } from 'react'
import { ArrowUpRight, Menu, ShoppingBag } from 'lucide-react'
import { Brand } from '@/components/Brand'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

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

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="mobile-menu">
          <SheetHeader className="mobile-menu__header">
            <SheetTitle><Brand /></SheetTitle>
            <SheetDescription className="sr-only">PanaceaMed navigation</SheetDescription>
          </SheetHeader>
          <nav className="mobile-menu__nav" aria-label="Mobile navigation">
            {navigation.map((item, index) => (
              <SheetClose asChild key={item.href}>
                <a href={item.href}>
                  <span>0{index + 1}</span>
                  {item.label}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </a>
              </SheetClose>
            ))}
          </nav>
          <div className="mobile-menu__foot">
            <p>Wellness, edited around you.</p>
            <span>Precision formulations · Personal collections</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
