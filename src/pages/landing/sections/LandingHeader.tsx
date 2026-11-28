import { Wordmark } from '../../../components/Logo'
import { IconSun, IconMoon } from '../../../components/icons'
import type { Theme } from '../../../lib/theme'
import { alignWhenScrollStops } from '../components/alignWhenScrollStops'

interface LandingHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  onMasuk: () => void
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth' })
  // The blocks this scroll passes render on the way and can change height: re-align once it stops.
  alignWhenScrollStops(target)
}

export function LandingHeader({ theme, onToggleTheme, onMasuk }: LandingHeaderProps) {
  return (
    <>
      {/* ── FLOATING GLASS NAVBAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-black/85 sm:px-8">
        <div className="min-w-0 shrink">
          <Wordmark size={32} />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-600 dark:text-neutral-300 lg:flex">
          <button type="button" onClick={() => scrollToSection('pintu')} className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Cara kerja
          </button>
          <button type="button" onClick={() => scrollToSection('pricing')} className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Tarif
          </button>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/5 text-neutral-600 transition hover:bg-neutral-100 hover:text-brand-dark dark:border-white/10 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="min-h-[42px] whitespace-nowrap rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95 sm:px-6"
          >
            Masuk
          </button>
        </div>
      </header>
    </>
  )
}
