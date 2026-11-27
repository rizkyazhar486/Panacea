import React, { useState } from 'react'
import { Wordmark } from '../../../components/ui/Logo'
import { IconArrowRight } from '../landingSvgs'

interface LandingHeaderProps {
  theme: string
  onToggleTheme: () => void
  onMasuk: () => void
}

const NAV_ITEMS = [
  { id: 'anatomy-stage', label: 'Atlas 3D' },
  { id: 'features', label: 'Kemampuan' },
  { id: 'roles', label: 'Peran' },
  { id: 'pricing', label: 'Paket' },
  { id: 'news', label: 'Riset' },
] as const

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LandingHeader({ theme, onToggleTheme, onMasuk }: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDark = theme === 'dark'

  const handleNav = (id: string) => {
    setMenuOpen(false)
    scrollToSection(id)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-[#F8FAF9]/90 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#060A09]/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          data-pmd-native="true"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex min-h-[44px] shrink-0 items-center bg-transparent p-0 text-left focus:outline-none"
          aria-label="PanaceaMed Beranda"
        >
          <Wordmark size={22} />
        </button>

        {/* Desktop Primary Navigation (single focused row) */}
        <nav aria-label="Navigasi Utama Landing" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-pmd-native="true"
              onClick={() => handleNav(item.id)}
              className="min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-pmd-native="true"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-900 transition hover:border-emerald-600/50 dark:border-white/15 dark:bg-[#111815] dark:text-neutral-100 dark:hover:border-emerald-400/50"
          >
            <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
            <span className="hidden sm:inline">{isDark ? 'Terang' : 'Gelap'}</span>
          </button>

          <button
            type="button"
            data-pmd-native="true"
            onClick={onMasuk}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 sm:px-5 sm:text-[13px]"
          >
            <span className="whitespace-nowrap">Masuk / Daftar</span>
            <IconArrowRight size={14} stroke="#ffffff" />
          </button>

          <button
            type="button"
            data-pmd-native="true"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu Navigasi"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 text-sm font-bold text-neutral-900 dark:border-white/15 dark:bg-[#111815] dark:text-white lg:hidden"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Compact Mobile Drawer */}
      {menuOpen && (
        <nav
          aria-label="Navigasi Seluler Landing"
          className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#111815] lg:hidden"
        >
          <div className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-pmd-native="true"
                onClick={() => handleNav(item.id)}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-bold text-neutral-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
