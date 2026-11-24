import { lazy, Suspense, useState } from 'react'
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

const HERO_ORGANS = [
  { id: 'brain', label: 'Neuro', metric: '95%', cx: 50, cy: 14, color: '#a78bfa' },
  { id: 'heart', label: 'Cardio', metric: '72 bpm', cx: 53, cy: 34, color: '#fb7185' },
  { id: 'lungs', label: 'Pulmo', metric: '98% SpO2', cx: 43, cy: 33, color: '#38bdf8' },
  { id: 'liver', label: 'Hepato', metric: '93%', cx: 44, cy: 46, color: '#34d399' },
  { id: 'metabolic', label: 'Metabolic', metric: 'HRV 68ms', cx: 52, cy: 58, color: '#fbbf24' },
] as const

type HoloLayer = 'surface' | 'vascular' | 'neural'

interface HeroSectionProps {
  onMasuk: () => void
}

export function HeroSection({ onMasuk }: HeroSectionProps) {
  const [layer, setLayer] = useState<HoloLayer>('vascular')
  const [focusOrganId, setFocusOrganId] = useState<(typeof HERO_ORGANS)[number]['id']>('heart')
  const focusOrgan = HERO_ORGANS.find((o) => o.id === focusOrganId) ?? HERO_ORGANS[1]

  return (
    <section className="astro-horizon-grid relative overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
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

          {/* Sisi Kanan (Instant Interactive 360° Holographic BodyExposure Stage) */}
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
                  <div className="flex shrink-0 items-center gap-1">
                    {(['surface', 'vascular', 'neural'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLayer(l)}
                        aria-pressed={layer === l}
                        className={`min-h-[30px] whitespace-nowrap rounded-full border px-2 font-mono text-[9.5px] font-extrabold uppercase transition ${
                          layer === l
                            ? 'border-cyan-300/60 bg-cyan-500/25 text-cyan-100'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative flex flex-col items-center rounded-2xl border border-cyan-400/15 bg-gradient-to-b from-[#071326] to-[#030710] p-3">
                  <svg viewBox="0 0 100 92" className="h-64 w-full max-w-[270px]" role="img" aria-label="Interactive holographic body twin">
                    <defs>
                      <radialGradient id="heroTwinAura" cx="50%" cy="44%" r="48%">
                        <stop offset="0%" stopColor={focusOrgan.color} stopOpacity="0.34" />
                        <stop offset="100%" stopColor="#030710" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="45" r="41" fill="url(#heroTwinAura)" />
                    <ellipse cx="50" cy="84" rx="28" ry="4" fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="0.7" strokeDasharray="2 2" />
                    <path
                      d="M50 7 C54 7 56 10 56 14 C56 18 53 20 53 22 L63 25 C67 27 69 32 71 44 L73 56 C73 58 70 59 69 57 L65 36 L60 36 L61 54 L63 82 C63 85 59 86 58 83 L52 58 L48 58 L42 83 C41 86 37 85 37 82 L39 54 L40 36 L35 36 L31 57 C30 59 27 58 27 56 L29 44 C31 32 33 27 37 25 L47 22 C47 20 44 18 44 14 C44 10 46 7 50 7 Z"
                      fill={layer === 'surface' ? 'rgba(34, 211, 238, 0.22)' : 'rgba(34, 211, 238, 0.10)'}
                      stroke="#67e8f9"
                      strokeWidth="0.9"
                    />
                    {layer === 'vascular' && (
                      <path d="M50 14 V58 M44 33 Q50 38 56 33 M43 46 Q50 50 57 46 M48 58 L41 81 M52 58 L59 81" fill="none" stroke="rgba(251,113,133,0.65)" strokeWidth="0.85" />
                    )}
                    {layer === 'neural' && (
                      <path d="M50 11 V54 M50 22 L33 34 M50 22 L67 34 M50 38 L42 52 M50 38 L58 52" fill="none" stroke="rgba(167,139,250,0.75)" strokeWidth="0.85" strokeDasharray="1.4 1" />
                    )}
                    {HERO_ORGANS.map((org) => {
                      const active = org.id === focusOrgan.id
                      return (
                        <g
                          key={org.id}
                          onClick={() => setFocusOrganId(org.id)}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${org.label} ${org.metric}`}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFocusOrganId(org.id) }}
                        >
                          {active && <circle cx={org.cx} cy={org.cy} r="6.4" fill="none" stroke={org.color} strokeWidth="0.9" strokeDasharray="1.6 1.6" />}
                          <circle cx={org.cx} cy={org.cy} r={active ? 3.4 : 2.3} fill={org.color} stroke="#ffffff" strokeWidth="0.7" />
                        </g>
                      )
                    })}
                  </svg>
                  <div className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: focusOrgan.color }} />
                      <span className="whitespace-nowrap text-xs font-black text-white">{focusOrgan.label}</span>
                      <span className="whitespace-nowrap font-mono text-xs font-bold" style={{ color: focusOrgan.color }}>{focusOrgan.metric}</span>
                    </div>
                    <svg viewBox="0 0 80 18" width="76" height="18" aria-hidden="true">
                      <path d="M2 10h14l4-6 5 11 5-13 5 10 4-2h39" fill="none" stroke={focusOrgan.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <button
                      type="button"
                      onClick={onMasuk}
                      className="min-h-[34px] whitespace-nowrap rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-2.5 text-[10px] font-black text-emerald-100 hover:bg-emerald-500/30"
                    >
                      360° 3D ↗
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
