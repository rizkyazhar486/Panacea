import { Wordmark } from '../../../components/Logo'
import { IconShield, IconSun, IconMoon } from '../../../components/icons'
import type { Theme } from '../../../lib/theme'

interface LandingHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  onMasuk: () => void
}

export function LandingHeader({ theme, onToggleTheme, onMasuk }: LandingHeaderProps) {
  return (
    <>
      {/* ── [1] CLINICAL TRUST DOCK (KEPATUHAN MEDIS & PRIVASI DATA) ── */}
      <div className="dark relative z-40 w-full border-b border-emerald-500/20 bg-gradient-to-r from-[#02180e] via-[#043320] to-[#02180e] px-4 py-2 shadow-inner">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-center text-xs font-medium text-emerald-100 sm:gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm"
            style={{ color: '#6ee7b7' }}
          >
            <IconShield size={12} className="shrink-0" />
            Kepatuhan Medis
          </span>
          <span className="tracking-wide">
            Interoperabilitas <b>SATUSEHAT (HL7® FHIR)</b>
            <span className="mx-2 opacity-40">·</span>
            Perlindungan Data Medis <b>UU PDP No. 27/2022</b>
            <span className="mx-2 hidden opacity-40 sm:inline">·</span>
            <span className="hidden sm:inline">Verifikasi STR Klinisi Berizin</span>
          </span>
        </div>
      </div>

      {/* ── FLOATING GLASS NAVBAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-black/85 sm:px-8">
        <div className="min-w-0 shrink">
          <Wordmark size={32} />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-600 dark:text-neutral-300 lg:flex">
          <a href="#features" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Kapabilitas Platform
          </a>
          <a href="#roles" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Profil Pengguna
          </a>
          <a href="#pricing" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Tarif &amp; Layanan
          </a>
          <a href="#science" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Eksplorasi Sains
          </a>
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
            Masuk <span className="hidden sm:inline">/ Daftar Gratis</span>
          </button>
        </div>
      </header>
    </>
  )
}
