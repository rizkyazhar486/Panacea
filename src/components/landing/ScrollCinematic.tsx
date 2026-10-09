import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { ACTS, type Stage } from './scrollCinematicData'
import { HumanAnatomy } from './HumanAnatomySvg'
import './scrollCinematic.css'

export { ACTS, type Stage } from './scrollCinematicData'
export { HumanAnatomy } from './HumanAnatomySvg'

export function ScrollCinematic() {
  const [activeStage, setActiveStage] = useState<Stage>('exploded')
  const sceneRef = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(document.documentElement.classList.contains('reduce-motion') || media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  const currentAct = ACTS.find((a) => a.key === activeStage) ?? ACTS[1]

  return (
    <section className="relative px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-label="Atlas Anatomi Digital">
      <div className="mx-auto max-w-6xl">
        <div className="dark relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-b from-[#02050a] via-[#040d11] to-[#02050a] text-white shadow-2xl shadow-emerald-950/20 sm:rounded-[3rem]">
          {/* Subtle ambient lighting glows */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          {/* Header Card */}
          <div className="relative z-20 px-6 pt-10 text-center sm:px-12 sm:pt-14">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
              ATLAS ANATOMI DIGITAL · PERSPEKTIF MULTI-LAYER
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Satu Tubuh. <span className="font-serif-display italic text-emerald-400">Seluruh Sistem Terhubung.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-cyan-100/75 sm:text-base">
              Pantau keterkaitan organ vital, metabolisme, dan biomarker klinis Anda dalam satu representasi tubuh longitudinal terpadu.
            </p>

            {/* Interactive Layer Switcher Tabs */}
            <div className="mx-auto mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-md sm:gap-2">
              {ACTS.map((act, i) => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => setActiveStage(act.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 sm:px-5 sm:py-2 ${
                    activeStage === act.key
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-105'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <span className="mr-1.5 opacity-80">{i === 0 ? '🧍' : i === 1 ? '🫀' : i === 2 ? '⚡' : '🧬'}</span>
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anatomical Visual Stage */}
          <div className="relative h-[520px] w-full overflow-hidden sm:h-[620px] lg:h-[660px]">
            <AnatomyScene stage={activeStage} reduced={reduced} sceneRef={sceneRef} />

            {/* Current layer caption pill */}
            <div className="pointer-events-none absolute bottom-4 inset-x-4 z-20 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentAct.title}
              </span>
            </div>
          </div>

          {/* Bottom Controls & High-contrast CTA */}
          <div className="relative z-20 flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-black/40 px-6 py-5 backdrop-blur-md sm:flex-row sm:px-10">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <span className="text-emerald-400">✦</span>
              <span>Interaktif: pilih lapisan di atas atau gerakkan kursor untuk eksplorasi sudut pandang</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/body-explorer"
                className="cta-atlas-btn group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 sm:text-sm"
              >
                <span>Jelajahi Atlas Tubuh 3D</span>
                <span className="font-black transition-transform group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AnatomyScene({ stage, reduced = false, sceneRef }: { stage: Stage; reduced?: boolean; sceneRef?: RefObject<HTMLDivElement> }) {
  const localRef = useRef<HTMLDivElement>(null)
  const targetRef = sceneRef ?? localRef

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const el = targetRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    el.style.setProperty('--tilt-x', `${x * 4.5}deg`)
    el.style.setProperty('--tilt-y', `${y * -3.5}deg`)
  }

  const reset = () => {
    targetRef.current?.style.setProperty('--tilt-x', '0deg')
    targetRef.current?.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div
      ref={targetRef}
      data-stage={stage}
      onPointerMove={move}
      onPointerLeave={reset}
      className="anatomy-scene absolute inset-0 overflow-hidden"
    >
      <div className="anatomy-aurora absolute inset-0" />
      <div className="anatomy-grid absolute inset-0" />
      <Particles />
      <OrbitRings />

      <div className="anatomy-stage absolute left-1/2 top-[54%] h-[82%] max-h-[500px] w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 [perspective:1200px]">
        <div className="anatomy-tilt h-full w-full"><HumanAnatomy /></div>
      </div>

      <div className="anatomy-label anatomy-label-brain">OTAK</div>
      <div className="anatomy-label anatomy-label-lungs">PARU-PARU</div>
      <div className="anatomy-label anatomy-label-heart">JANTUNG</div>
      <div className="anatomy-label anatomy-label-liver">HATI</div>
      <div className="anatomy-label anatomy-label-kidneys">GINJAL</div>
      <div className="anatomy-label anatomy-label-skeleton">RANGKA</div>
      <div className="anatomy-label anatomy-label-neuro">SARAF</div>
      <div className="anatomy-label anatomy-label-vascular">VASKULAR</div>
    </div>
  )
}

function Particles() {
  const dots = Array.from({ length: 32 }, (_, i) => {
    const a = (Math.sin(i * 31.7) + 1) / 2
    const b = (Math.sin(i * 73.1 + 3) + 1) / 2
    const c = (Math.sin(i * 19.3 + 8) + 1) / 2
    return { left: `${a * 100}%`, top: `${b * 100}%`, size: 1 + c * 2.4, delay: `${-a * 8}s` }
  })
  return <div className="pointer-events-none absolute inset-0">{dots.map((dot, i) => <span key={i} className="anatomy-particle absolute rounded-full bg-white" style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size, animationDelay: dot.delay }} />)}</div>
}

function OrbitRings() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[54%] h-[58vmin] w-[58vmin] max-h-[620px] max-w-[620px] -translate-x-1/2 -translate-y-1/2">
      <span className="anatomy-ring absolute inset-0 rounded-full border border-cyan-100/10" />
      <span className="anatomy-ring anatomy-ring-2 absolute inset-[13%] rounded-full border border-violet-200/10" />
      <span className="anatomy-ring anatomy-ring-3 absolute inset-[27%] rounded-full border border-white/10" />
    </div>
  )
}

export function ScrollCinematicStyles() {
  return null
}
