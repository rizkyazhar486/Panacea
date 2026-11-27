import React from 'react'
import { Reveal } from '../../../components/Reveal'
import { MedicalNews } from '../../../components/MedicalNews'

/** Editorial research & medical news section (duplicate WHATS_NEW checklist removed for compactness). */
export function NewsSection() {
  return (
    <section
      id="news"
      aria-labelledby="news-heading"
      className="bg-white px-4 py-16 text-neutral-950 transition-colors dark:bg-[#111815] dark:text-neutral-50 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <Reveal variant="rise" className="text-center">
          <span className="inline-block rounded-full border border-emerald-700/20 bg-emerald-700/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-300">
            WAWASAN &amp; LITERATUR MEDIS
          </span>
          <h2
            id="news-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl"
          >
            Ringkasan Riset &amp; Berita Klinis Terkurasi
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            Publikasi biomedical peer-reviewed dan pembaruan standar interoperabilitas kesehatan dalam satu aliran
            ringkas.
          </p>
        </Reveal>

        <MedicalNews />
      </div>
    </section>
  )
}
