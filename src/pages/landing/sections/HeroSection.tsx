import React, { useEffect, useRef, useState } from 'react'
import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'
import { Reveal } from '../../../components/Reveal'
import {
  HOME_BODY_ANCHORS,
  HOME_BODY_HOLO,
  HOME_BODY_IMAGE,
  HOME_BODY_TURN,
} from '../../../domains/body-exposure/data/homeBodyAnchors'
import type { BodySystemId } from '../../../domains/body-exposure/data/bodySystems'
import {
  dragAngle,
  isFront,
  settleStep,
  spinAngle,
  turnFrame,
} from '../../../domains/body-exposure/engine/home-hero/homeBodyTurn'
import { IconArrowRight } from '../landingSvgs'
import { scrollToSection } from './LandingHeader'

interface HeroSectionProps {
  onMasuk: () => void
}

const HERO_HOTSPOTS: ReadonlyArray<{
  readonly id: BodySystemId
  readonly label: string
  readonly metric: string
}> = [
  { id: 'nervous', label: 'Saraf Pusat', metric: 'Korteks & Traktus Kranial' },
  { id: 'respiratory', label: 'Respirasi', metric: 'Paru & Pertukaran Gas' },
  { id: 'cardiovascular', label: 'Kardiovaskular', metric: 'Cor & Sirkulasi Sistemik' },
  { id: 'digestive', label: 'Digestif', metric: 'Hepar, Gaster & Metabolisme' },
  { id: 'urinary', label: 'Renal', metric: 'Filtrasi & Keseimbangan Cairan' },
]

export function HeroSection({ onMasuk }: HeroSectionProps) {
  const [layer, setLayer] = useState<'surface' | 'holo'>('holo')
  const [angleDeg, setAngleDeg] = useState(0)
  const [selectedSystem, setSelectedSystem] = useState<BodySystemId>('cardiovascular')
  const stageRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; deg: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const startSpin = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAngleDeg((d) => (d === 0 ? 45 : 0))
      return
    }
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const t0 = performance.now()
    const duration = 1800
    const tick = (now: number) => {
      const elapsed = now - t0
      if (elapsed >= duration) {
        setAngleDeg(0)
        rafRef.current = null
        return
      }
      setAngleDeg(spinAngle(elapsed, duration))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const settleBack = (fromDeg: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    let cur = fromDeg
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      cur = settleStep(cur, dt, 160)
      setAngleDeg(cur)
      if (cur !== 0) rafRef.current = requestAnimationFrame(tick)
      else rafRef.current = null
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    dragStartRef.current = { x: e.clientX, deg: angleDeg }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current
    const box = stageRef.current
    if (!start || !box) return
    const next = dragAngle(start.deg, e.clientX - start.x, box.clientWidth || 320, 360)
    if (next !== null) setAngleDeg(next)
  }

  const onPointerUp = () => {
    if (!dragStartRef.current) return
    dragStartRef.current = null
    settleBack(angleDeg)
  }

  const frame = turnFrame(angleDeg, HOME_BODY_TURN.frames) ?? 0
  const showFront = isFront(angleDeg, HOME_BODY_TURN.frames)
  const activeMeta = HERO_HOTSPOTS.find((h) => h.id === selectedSystem) ?? HERO_HOTSPOTS[2]

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="relative overflow-hidden bg-[#F8FAF9] pb-14 pt-10 text-neutral-950 transition-colors dark:bg-[#060A09] dark:text-neutral-50 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Narrative Stack */}
          <div className="space-y-6 lg:col-span-7">
            <Reveal variant="rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-700 dark:bg-emerald-400" aria-hidden="true" />
                <span className="whitespace-nowrap">SatuSehat HL7® FHIR · AI-EMR &amp; 3D Anatomy</span>
              </div>
            </Reveal>

            <Reveal variant="rise">
              <h1
                id="hero-headline"
                className="font-display text-4xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
              >
                Satu Sistem Kesehatan{' '}
                <span className="text-emerald-700 dark:text-emerald-400">Longitudinal.</span>
                <br />
                Dari Anamnesis ke Atlas 3D.
              </h1>
            </Reveal>

            <Reveal variant="soft">
              <p className="max-w-2xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
                Anamnesis terstruktur SOCRATES, rekam medis AI-EMR, pelacakan biomarker longevity, dan visualisasi
                anatomi Z-Anatomy 3D dalam satu ruang kerja terpadu—dengan dokter berizin tetap memegang verifikasi akhir.
              </p>
            </Reveal>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-pmd-native="true"
                onClick={onMasuk}
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800"
              >
                <span className="whitespace-nowrap">Mulai Gratis</span>
                <IconArrowRight size={16} stroke="#ffffff" />
              </button>

              <button
                type="button"
                data-pmd-native="true"
                onClick={() => scrollToSection('anatomy-stage')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-neutral-300 bg-neutral-50 px-6 py-3 text-sm font-bold text-neutral-950 transition hover:border-emerald-700/50 hover:bg-neutral-100 dark:border-white/20 dark:bg-[#111815] dark:text-white dark:hover:border-emerald-400/50"
              >
                <span className="whitespace-nowrap">Jelajahi Anatomi 3D</span>
              </button>
            </div>

            {/* Clean Architectural Metrics Strip */}
            <dl className="grid grid-cols-3 gap-4 border-t border-neutral-200 pt-5 dark:border-white/10">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Atlas Tubuh
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-neutral-950 dark:text-white sm:text-xl">
                  11 Sistem 3D
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Integrasi
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-neutral-950 dark:text-white sm:text-xl">
                  HL7® FHIR
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Kendali Klinis
                </dt>
                <dd className="mt-1 font-display text-lg font-bold text-neutral-950 dark:text-white sm:text-xl">
                  Dokter STR
                </dd>
              </div>
            </dl>

            <BatasKlaimKesehatan
              permukaan="care.landing"
              className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400"
            />
          </div>

          {/* Right Interactive 360° Z-Anatomy Specimen Stage */}
          <div className="lg:col-span-5">
            <div className="dark relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#060A09] p-4 text-white shadow-2xl sm:p-5">
              {/* Top Specimen Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="whitespace-nowrap">Z-ANATOMY 360° · LIVE SPECIMEN</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['holo', 'surface'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      data-pmd-native="true"
                      onClick={() => setLayer(mode)}
                      className={`min-h-[34px] rounded-full px-3 text-[11px] font-bold transition ${
                        layer === mode
                          ? 'bg-emerald-700 text-white'
                          : 'border border-white/15 bg-white/[0.04] text-neutral-300 hover:border-emerald-400/50 hover:text-white'
                      }`}
                    >
                      {mode === 'holo' ? 'Holo 3D' : 'Anatomi'}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-pmd-native="true"
                    onClick={startSpin}
                    className="min-h-[34px] rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                  >
                    Putar 360°
                  </button>
                </div>
              </div>

              {/* Real Baked Z-Anatomy Stage + Drag-to-Turn */}
              <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="Tahap interaktif anatomi 3D PanaceaMed — geser untuk memutar 360 derajat"
                className="relative mx-auto flex aspect-[3/4] max-h-[430px] w-full cursor-grab select-none items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#040706] active:cursor-grabbing"
              >
                {showFront ? (
                  <div className="relative h-full w-auto max-w-full aspect-[1/2]">
                    <img
                      src={`/${layer === 'holo' ? HOME_BODY_HOLO.src : HOME_BODY_IMAGE.src}`}
                      alt="Atlas anatomi 3D tubuh manusia Z-Anatomy"
                      width={720}
                      height={1440}
                      className="h-full w-full object-contain"
                    />
                    {HERO_HOTSPOTS.map((spot) => {
                      const anchor = HOME_BODY_ANCHORS.find((a) => a.id === spot.id)
                      if (!anchor) return null
                      const isSel = selectedSystem === spot.id
                      return (
                        <button
                          key={spot.id}
                          type="button"
                          data-pmd-native="true"
                          aria-label={spot.label}
                          onClick={() => setSelectedSystem(spot.id)}
                          style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                            isSel
                              ? 'h-5 w-5 border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]'
                              : 'h-3.5 w-3.5 border border-white/80 bg-[#111815]/90 hover:scale-125 hover:bg-emerald-400'
                          }`}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div
                    role="img"
                    aria-label={`Tampilan 360 derajat sudut ${Math.round(angleDeg)} derajat`}
                    className="h-full aspect-[1/2] bg-no-repeat"
                    style={{
                      backgroundImage: `url('/${HOME_BODY_TURN.src}')`,
                      backgroundSize: `${HOME_BODY_TURN.frames * 100}% 100%`,
                      backgroundPosition: `${(frame / (HOME_BODY_TURN.frames - 1)) * 100}% 0%`,
                    }}
                  />
                )}
              </div>

              {/* Clean Specimen System Telemetry Readout */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {activeMeta.label}
                  </div>
                  <div className="truncate text-xs font-semibold text-white">{activeMeta.metric}</div>
                </div>
                <button
                  type="button"
                  data-pmd-native="true"
                  onClick={onMasuk}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  <span className="whitespace-nowrap">Buka Studio 3D</span>
                  <IconArrowRight size={13} stroke="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
