import React from 'react'
import { Reveal } from '../../../components/Reveal'
import { FEATURES, MARQUEE } from '../landingData'
import { IconArrowRight } from '../landingSvgs'

interface FeaturesSectionProps {
  onMasuk: () => void
}

export function FeaturesSection({ onMasuk }: FeaturesSectionProps) {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="bg-[#F8FAF9] py-16 text-neutral-950 transition-colors dark:bg-[#060A09] dark:text-neutral-50 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal variant="rise">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-2">
              <span className="inline-block font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#047857] dark:text-emerald-400">
                EKOSISTEM SATU PINTU
              </span>
              <h2
                id="features-title"
                className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl"
              >
                Enam Pilar Operasional dalam Satu Sistem Terpadu.
              </h2>
            </div>

            <button
              type="button"
              data-pmd-native="true"
              onClick={onMasuk}
              className="inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
            >
              <span>Buka Ruang Kerja</span>
              <IconArrowRight size={14} stroke="#ffffff" />
            </button>
          </div>
        </Reveal>

        {/* Compact Marquee Capability Strip */}
        <div
          aria-label="Standar & kapabilitas utama"
          className="mt-7 flex flex-wrap gap-2 border-y border-neutral-200 py-3 dark:border-white/10"
        >
          {MARQUEE.slice(0, 8).map((item) => {
            const MIcon = item.icon
            return (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-800 dark:border-white/12 dark:bg-[#111815] dark:text-neutral-200"
              >
                <MIcon size={13} className="text-emerald-700 dark:text-emerald-400" />
                <span>{item.label}</span>
              </span>
            )
          })}
        </div>

        {/* Clean 6-Card Architectural Bento */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} variant="soft">
                <article className="flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-emerald-700/40 dark:border-white/10 dark:bg-[#111815] dark:hover:border-emerald-400/40">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-700/20 bg-emerald-700/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Icon size={20} />
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
                        0{idx + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold text-neutral-950 dark:text-white">
                      {f.title}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {f.subtitle}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {f.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>

        {/* Grounded Editorial Provenance Strip (real owner photography) */}
        <div className="mt-8 grid grid-cols-1 items-center gap-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-[#111815] lg:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10 lg:col-span-5">
            <img
              src="/images/sourcing.webp"
              alt="Kuratela kualitas dan sumber klinis PanaceaMed"
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
          <div className="space-y-2.5 lg:col-span-7">
            <span className="inline-block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#047857] dark:text-emerald-400">
              TRANSPARANSI &amp; INTEGRITAS KLINIS
            </span>
            <h3 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
              Fakta Klinis Pasien Terpisah Tegas dari Estimasi AI.
            </h3>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Draf anamnesis, ringkasan literatur, dan estimasi longevity selalu ditandai{' '}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-900 dark:bg-white/10 dark:text-emerald-300">
                clinically_reviewed=false
              </code>{' '}
              hingga diperiksa dan ditandatangani oleh tenaga medis berizin (STR). Data kosong tetap ditampilkan kosong
              tanpa nilai tebakan.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
