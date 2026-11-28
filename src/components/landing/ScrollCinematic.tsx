import React, { useState } from 'react'
import { ACTS, type Stage } from './scrollCinematicData'
import { HumanAnatomy } from './HumanAnatomySvg'
import './scrollCinematic.css'

export { ACTS, type Stage } from './scrollCinematicData'
export { HumanAnatomy } from './HumanAnatomySvg'

const STAGE_DETAILS: Record<
  Stage,
  {
    readonly summary: string
    readonly imgSrc: string
    readonly imgAlt: string
    readonly metrics: ReadonlyArray<{ readonly label: string; readonly value: string }>
    readonly badge: string
  }
> = {
  whole: {
    summary:
      'Semua organ vital, jalur pembuluh darah, dan jaringan saraf terindeks dalam satu model anatomi Z-Anatomy 3D.',
    imgSrc: '/landing/multiscale-systems-uhd.webp',
    imgAlt: 'Visualisasi anatomi 3D seluruh tubuh manusia multisistem Z-Anatomy',
    badge: '11 Sistem · Canonical Index',
    metrics: [
      { label: 'Ontologi', value: '1:1 Mesh Binding' },
      { label: 'Referensi', value: 'Z-Anatomy CC BY-SA 4.0' },
      { label: 'Status Data', value: 'Atlas Referensi' },
    ],
  },
  exploded: {
    summary:
      'Bandingkan lapisan muskuloskeletal, viseral, dan vaskular untuk menelusuri anatomi regional sebelum konsultasi.',
    imgSrc: '/landing/cardio-vascular-uhd.webp',
    imgAlt: 'Visualisasi lapisan toraks, jantung, arkus aorta, dan vaskular Z-Anatomy',
    badge: 'Toraks & Kardiovaskular',
    metrics: [
      { label: 'Lapisan', value: 'Skeletal + Vaskular' },
      { label: 'Fokus Area', value: 'Cor & Arteri Karotis' },
      { label: 'Keterangan', value: 'Edukasi Klinis' },
    ],
  },
  systems: {
    summary:
      'Korteks serebri, nervus kranialis, dan traktus servikalis dipetakan untuk memahami hubungan neuro-vaskular.',
    imgSrc: '/landing/neuro-cranial-uhd.webp',
    imgAlt: 'Visualisasi sistem saraf pusat, korteks serebri, dan pembuluh darah kranial Z-Anatomy',
    badge: 'Neuro-Kranial & Otonom',
    metrics: [
      { label: 'Jalur Saraf', value: 'Kranial & Servikal' },
      { label: 'Kopling', value: 'Neuro-Vaskular' },
      { label: 'Validasi', value: 'Tinjauan Dokter' },
    ],
  },
  unified: {
    summary:
      'Satu identitas pasien menghubungkan anamnesis SOCRATES, catatan rekam medis, tren lab, dan atlas tubuh personal.',
    imgSrc: '/home/atlas-body-holo.webp',
    imgAlt: 'Proyeksi holografik seluruh tubuh PanaceaMed Digital Body Twin',
    badge: 'One Patient State · Longitudinal',
    metrics: [
      { label: 'Standar Data', value: 'HL7® FHIR · SatuSehat' },
      { label: 'Pemisahan', value: 'Fakta vs Estimasi Model' },
      { label: 'Kontrol', value: 'Human-in-the-Loop' },
    ],
  },
}

export function ScrollCinematic() {
  const [stage, setStage] = useState<Stage>('whole')
  const [compareOverlay, setCompareOverlay] = useState(50)
  const activeAct = ACTS.find((a) => a.key === stage) ?? ACTS[0]
  const detail = STAGE_DETAILS[stage]

  return (
    <section
      id="anatomy-stage"
      aria-labelledby="anatomy-stage-title"
      className="border-y border-neutral-200/80 bg-[#F8FAF9] py-16 text-neutral-950 transition-colors dark:border-white/10 dark:bg-[#060A09] dark:text-neutral-50 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Narrative & Layer Controls */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                {activeAct.eyebrow}
              </span>
              <h2
                id="anatomy-stage-title"
                className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl"
              >
                {activeAct.title}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-base">
                {detail.summary}
              </p>
            </div>

            {/* 4 Clean Interactive Layer Tabs */}
            <div className="grid grid-cols-2 gap-2.5" role="tablist" aria-label="Mode Visualisasi Anatomi 3D">
              {ACTS.map((act, idx) => {
                const selected = stage === act.key
                return (
                  <button
                    key={act.key}
                    type="button"
                    role="tab"
                    data-pmd-native="true"
                    aria-selected={selected}
                    onClick={() => setStage(act.key)}
                    className={`stage-btn flex min-h-[52px] flex-col items-start justify-center rounded-2xl border px-3.5 py-2.5 text-left ${
                      selected
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-900 hover:border-emerald-600/40 dark:border-white/12 dark:bg-[#111815] dark:text-neutral-100 dark:hover:border-emerald-400/40'
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                        selected ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span className="mt-0.5 text-xs font-bold leading-tight sm:text-[13px]">{act.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Compact Dual-Layer Blend Slider when viewing Vascular / Holo stages */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-[#0D1311]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Komparator Transparansi Vaskular &amp; Holo
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{compareOverlay}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={compareOverlay}
                onChange={(e) => setCompareOverlay(Number(e.target.value))}
                aria-label="Komparator Transparansi Anatomi"
                className="mt-2.5 h-2 w-full cursor-pointer accent-[#047857]"
              />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-200/80 pt-3 dark:border-white/10">
                {detail.metrics.map((m) => (
                  <div key={m.label} className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {m.label}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-bold text-neutral-950 dark:text-white">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right UHD Z-Anatomy Specimen Stage */}
          <div className="lg:col-span-7">
            <div
              key={stage}
              className="dark stage-enter relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#060A09] shadow-2xl"
            >
              <div className="aspect-[16/10] w-full overflow-hidden">
                {stage === 'whole' && compareOverlay === 50 ? (
                  <div className="anatomy-tilt h-full w-full">
                    <HumanAnatomy />
                  </div>
                ) : (
                  <div className="anatomy-tilt relative h-full w-full">
                    <img
                      src={detail.imgSrc}
                      alt={detail.imgAlt}
                      width={stage === 'unified' ? 720 : 1600}
                      height={stage === 'unified' ? 1440 : 1000}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full ${
                        stage === 'unified' ? 'object-contain bg-[#060A09] py-2' : 'object-cover object-center'
                      }`}
                    />
                    {compareOverlay > 0 && stage !== 'unified' && (
                      <img
                        src="/home/atlas-body-holo.webp"
                        alt=""
                        aria-hidden="true"
                        width={720}
                        height={1440}
                        style={{ opacity: compareOverlay / 180 }}
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain py-2 mix-blend-screen"
                      />
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060A09] via-transparent to-transparent opacity-75"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-5 py-3.5 text-xs">
                      <span className="font-bold text-white">{activeAct.title}</span>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                        {detail.badge}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ScrollCinematicStyles() {
  return null
}
