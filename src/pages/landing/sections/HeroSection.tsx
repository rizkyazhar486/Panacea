import { lazy, Suspense } from 'react'
import { Reveal } from '../../../components/Reveal'
import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'
import { scrollToSection } from './LandingHeader'
import {
  IconShield,
  IconCheck,
  IconStethoscope,
} from '../../../components/icons'
import { IconArrowRight } from '../landingSvgs'

// Decorative canvas: loaded after the hero renders so it stays out of the initial JS budget.
const InteractiveAura = lazy(() => import('../../../components/InteractiveAura').then((m) => ({ default: m.InteractiveAura })))
const LivingBodyHero = lazy(() => import('../../../domains/body-exposure/ui/home-hero/LivingBodyHero').then((m) => ({ default: m.LivingBodyHero })))

interface HeroSectionProps {
  onMasuk: () => void
}

export function HeroSection({ onMasuk }: HeroSectionProps) {
  return (
    <section className="astro-horizon-grid relative overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
      {/* Realistic astronomical bio-telemetry horizon backdrop (replaces uncanny auto-looping synthetic video) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 640"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full opacity-35 dark:opacity-55"
        >
          <defs>
            <radialGradient id="astroOrb" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="640" fill="url(#astroOrb)" />
          <circle cx="600" cy="310" r="190" fill="none" stroke="rgba(34,211,238,0.22)" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="600" cy="310" r="310" fill="none" stroke="rgba(16,185,129,0.18)" strokeWidth="1" />
          <circle cx="600" cy="310" r="450" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="2 10" />
          <path d="M0 470 Q320 410 600 450 T1200 430" fill="none" stroke="rgba(34,211,238,0.28)" strokeWidth="1.5" />
        </svg>
        <Suspense fallback={null}>
          <InteractiveAura />
        </Suspense>
        <div className="orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div
          className="orb absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Sisi Kiri (Value Proposition) */}
          <div className="text-center lg:col-span-6 lg:text-left">
            <Reveal>
              <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 shadow-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 dark:text-neutral-200">
                  SISTEM DUKUNGAN KLINIS &amp; KESEHATAN PREVENTIF
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Platform AI-EMR &amp; Rekam Medis Modern untuk{' '}
                <span className="font-serif-display bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] bg-clip-text italic text-transparent">
                  Kesehatan &amp; Longevity Anda
                </span>
              </h1>
              <BatasKlaimKesehatan
                permukaan="care.landing"
                className="mt-3.5 max-w-xl text-[12px] leading-snug text-neutral-500"
              />
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-neutral-600 dark:text-neutral-300 sm:text-lg leading-relaxed">
                AI menyusun anamnesis terstruktur awal; dokter berizin menelaah rekam medis. Tingkatkan rentang hidup sehat (<b>healthspan</b>) Anda melalui evaluasi klinis preventif, deteksi dini risiko, dan panduan gaya hidup berbasis bukti.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
                <button
                  onClick={onMasuk}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-3 pl-7 pr-3 font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(0,191,99,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span className="relative z-10 text-sm sm:text-base">Mulai Konsultasi Gratis</span>
                  <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                    <IconArrowRight size={15} />
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('roles')}
                  className="flex items-center rounded-full border border-black/10 bg-white/70 px-6 py-3 font-bold text-neutral-700 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-200"
                >
                  Solusi Dokter &amp; Faskes
                </button>
              </div>
            </Reveal>

            {/* Micro Trust Badges */}
            <Reveal delay={280}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-black/5 pt-5 dark:border-white/10 lg:justify-start">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <IconShield size={14} className="text-emerald-600 dark:text-emerald-400" />
                  34 Skoring Klinis Standar
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Enkripsi Data Medis End-to-End
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <IconStethoscope size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Interoperabilitas SatuSehat
                </span>
              </div>
            </Reveal>
          </div>

          {/* Sisi Kanan (Interactive 360° Living Body Exposure Showcase) */}
          <div className="lg:col-span-6">
            <Reveal delay={200}>
              <div className="relative mx-auto max-w-xl rounded-3xl border border-cyan-400/20 bg-[#050811]/92 p-3.5 shadow-2xl backdrop-blur-2xl sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="whitespace-nowrap font-mono text-[11px] font-extrabold uppercase tracking-wider text-cyan-100">
                      BodyExposure 360° · Live Twin
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="whitespace-nowrap rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                      10 Systems
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                      FHIR R4
                    </span>
                  </div>
                </div>
                <Suspense fallback={<div className="grid h-[380px] place-items-center rounded-2xl bg-black/50 font-mono text-xs text-cyan-200">Loading 360° Digital Twin…</div>}>
                  <LivingBodyHero />
                </Suspense>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
