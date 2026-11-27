import React from 'react'
import { Reveal } from '../../../components/Reveal'
import { VideoSaatTerlihat } from './ScienceOdysseySection'

const VISUAL_PLATES = [
  {
    id: 'cardio',
    badge: 'ATLAS VASKULAR & KORONER',
    title: 'Pemetaan Hemodinamika 3D',
    desc: 'Visualisasi arkus aorta, ventrikel jantung, dan percabangan karotis dari Z-Anatomy untuk mempercepat penjelasan klinis dokter kepada pasien.',
    img: '/landing/cardio-vascular-uhd.webp',
    alt: 'Model 3D pembuluh darah toraks, jantung, dan arteri karotis Z-Anatomy',
    videoSrc: '/hf_20260702_023227_70cd71c5-55a5-4d94-b25a-8a8d8e6f186d.mp4',
  },
  {
    id: 'neuro',
    badge: 'ATLAS NEURO-KRANIAL',
    title: 'Korteks Serebri & Keterhubungan Sistem',
    desc: 'Menghubungkan keluhan neurologis, riwayat obat, dan pemantauan biomarker longitudinal dalam satu tampilan visual yang mudah dipahami.',
    img: '/landing/neuro-cranial-uhd.webp',
    alt: 'Model 3D otak, saraf kranial, dan pembuluh darah kepala Z-Anatomy',
    videoSrc: '/hf_20260807_091507_8eb1a7ef-2745-4c0a-92e6-49a473eb0e5c.mp4',
  },
] as const

export function BrandFilmsSection() {
  return (
    <section
      id="studio-showcase"
      aria-labelledby="studio-showcase-title"
      className="bg-white py-16 text-neutral-950 transition-colors dark:bg-[#111815] dark:text-neutral-50 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal variant="rise">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-2">
              <span className="inline-block font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                VISUALISASI ANATOMI 3D STUDIO
              </span>
              <h2
                id="studio-showcase-title"
                className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl"
              >
                Kejernihan Visual untuk Keputusan Klinis yang Lebih Cepat.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Setiap model dibangun di atas mesin Z-Anatomy 3D (CC BY-SA 4.0) dengan pemisahan ketat antara atlas
              referensi dan rekam klinis terverifikasi dokter.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {VISUAL_PLATES.map((plate) => (
            <Reveal key={plate.id} variant="soft">
              <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-[#F8FAF9] shadow-sm transition hover:border-emerald-700/35 dark:border-white/10 dark:bg-[#090F0C] dark:hover:border-emerald-400/35">
                <div className="dark relative aspect-[16/10] w-full overflow-hidden bg-[#060A09]">
                  <img
                    src={plate.img}
                    alt={plate.alt}
                    width={1600}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center transition duration-500 hover:scale-[1.02]"
                  />
                  <span className="dark absolute left-4 top-4 rounded-full border border-emerald-400/35 bg-[#060A09]/85 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur">
                    {plate.badge}
                  </span>
                </div>

                <div className="space-y-3 p-6">
                  <h3 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                    {plate.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{plate.desc}</p>

                  <details className="group pt-1">
                    <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-xs font-bold text-neutral-900 transition hover:border-emerald-600/50 dark:border-white/15 dark:bg-[#111815] dark:text-neutral-100">
                      <span>Putar Cuplikan Gerak (Opsional)</span>
                      <span className="transition group-open:rotate-180">▾</span>
                    </summary>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                      <VideoSaatTerlihat src={plate.videoSrc} judul={plate.title} />
                    </div>
                  </details>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
