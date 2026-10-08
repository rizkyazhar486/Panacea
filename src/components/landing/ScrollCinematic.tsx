import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { Link } from 'react-router-dom'

/**
 * Exploded-human cinematic for the public landing page.
 * A single persistent figure changes state while the viewport is pinned:
 * whole body → exploded anatomy → connected systems → unified health state.
 * SVG/CSS keeps the first load light and preserves a reduced-motion fallback.
 */
const ACTS = [
  { key: 'whole', label: 'Seluruh Tubuh', eyebrow: 'ATLAS ANATOMI DIGITAL', title: 'Satu Tubuh. Seluruh Sistem Terhubung.' },
  { key: 'exploded', label: 'Eksplorasi Organ', eyebrow: 'PERSPEKTIF MULTI-LAYER', title: 'Pahami Keterkaitan Organ Vital.' },
  { key: 'systems', label: 'Sistem Fisiologis', eyebrow: 'JARINGAN METABOLISME', title: 'Sistem Tubuh Bergerak Selaras.' },
  { key: 'unified', label: 'Digital Health Twin', eyebrow: 'DIGITAL BODY TWIN', title: 'Satu Representasi Kesehatan Terpadu.' },
] as const

type Stage = (typeof ACTS)[number]['key']

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
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-black !text-black shadow-xl shadow-black/40 transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:text-sm"
                style={{ color: '#090d0b' }}
              >
                <span style={{ color: '#090d0b' }}>Jelajahi Atlas Tubuh 3D</span>
                <span className="font-extrabold text-emerald-700 transition group-hover:translate-x-0.5" aria-hidden="true" style={{ color: '#047857' }}>
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

function HumanAnatomy() {
  const ribs = [0, 1, 2, 3, 4, 5]
  return (
    <svg className="h-full w-full overflow-visible" viewBox="0 0 520 760" role="img" aria-label="Human anatomy layers separating into organs and systems">
      <defs>
        <radialGradient id="skinGlow" cx="50%" cy="35%" r="65%"><stop offset="0%" stopColor="#e8fbff" stopOpacity=".24" /><stop offset="65%" stopColor="#7dd3fc" stopOpacity=".08" /><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" /></radialGradient>
        <linearGradient id="bone" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#bdefff" /></linearGradient>
        <linearGradient id="vessel" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6ee7f9" /><stop offset="48%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#fb7185" /></linearGradient>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="organGlow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      <ellipse className="anatomy-floor" cx="260" cy="714" rx="112" ry="18" fill="rgba(64,220,255,.13)" />

      <g className="anatomy-envelope">
        <circle cx="260" cy="92" r="48" fill="url(#skinGlow)" stroke="rgba(202,244,255,.28)" strokeWidth="1.5" />
        <path d="M210 151C191 173 184 219 190 279l17 135-31 214c-4 31 15 53 32 30l44-214h16l44 214c17 23 36 1 32-30l-31-214 17-135c6-60-1-106-20-128-20-12-80-12-100 0Z" fill="url(#skinGlow)" stroke="rgba(202,244,255,.26)" strokeWidth="1.5" />
        <path d="M203 171 117 357c-7 21 10 32 23 14l79-141M317 171l86 186c7 21-10 32-23 14l-79-141" fill="none" stroke="rgba(202,244,255,.22)" strokeWidth="27" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-skeleton" filter="url(#softGlow)">
        <circle cx="260" cy="92" r="34" fill="none" stroke="url(#bone)" strokeWidth="5" opacity=".8" />
        <path d="M244 106q16 12 32 0M260 126v294" fill="none" stroke="url(#bone)" strokeWidth="6" strokeLinecap="round" opacity=".78" />
        {ribs.map((i) => { const y = 177 + i * 28; const w = 58 - i * 4; return <path key={i} d={`M260 ${y}C${260-w} ${y-15} ${260-w} ${y+24} 260 ${y+24}C${260+w} ${y+24} ${260+w} ${y-15} 260 ${y}`} fill="none" stroke="url(#bone)" strokeWidth="3.8" opacity=".66" /> })}
        <path d="m223 158-59 106-38 100m171-206 59 106 38 100M224 408q36 24 72 0m-64 14-30 193m86-193 30 193m-115 0-9 65m123-65 9 65" fill="none" stroke="url(#bone)" strokeWidth="8" strokeLinecap="round" opacity=".73" />
      </g>

      <g className="anatomy-part anatomy-neuro" fill="none" stroke="#c4b5fd" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M260 128v303" strokeWidth="3.2" /><path d="M260 202c-36 30-65 67-96 127m96-127c36 30 65 67 96 127M260 330c-24 69-42 163-55 285m55-285c24 69 42 163 55 285" strokeWidth="1.7" opacity=".82" />
      </g>

      <g className="anatomy-part anatomy-brain" filter="url(#organGlow)">
        <path d="M226 86c-2-26 17-43 34-36 17-10 38 8 34 29 12 20-4 43-26 39-19 12-47-7-42-32Z" fill="rgba(196,181,253,.84)" stroke="#ede9fe" strokeWidth="2" />
        <path d="M240 61c10 10 6 24-4 31m28-39c-9 13 0 26 10 32m11-19c-11 10-9 29 3 36m-39-2c11-11 24-4 30 11" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      </g>

      <g className="anatomy-part anatomy-lungs" filter="url(#organGlow)">
        <path d="M248 176c-29-5-43 27-41 71 2 39 22 58 43 37V181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" /><path d="M272 176c29-5 43 27 41 71-2 39-22 58-43 37V181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" /><path d="M260 147v44m0-7-25 25m25-25 25 25" fill="none" stroke="#e6fdff" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-heart" filter="url(#organGlow)">
        <path d="M260 251c-15-22-40-12-39 10 1 24 39 50 39 50s38-26 39-50c1-22-24-32-39-10Z" fill="#fb7185" stroke="#fecdd3" strokeWidth="2.4" /><path d="M256 244c-4-14-2-25 4-35m8 37c10-15 15-25 15-38" fill="none" stroke="#fda4af" strokeWidth="5" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-liver" filter="url(#organGlow)"><path d="M246 326c-39-11-47 16-36 45 19 14 56 7 77-13 13-13-1-32-41-32Z" fill="rgba(251,146,60,.82)" stroke="#fed7aa" strokeWidth="2" /></g>

      <g className="anatomy-part anatomy-kidneys" filter="url(#organGlow)">
        <path d="M222 372c-17-7-26 12-19 35 7 19 27 14 29-8 2-16-1-23-10-27Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" /><path d="M298 372c17-7 26 12 19 35-7 19-27 14-29-8-2-16 1-23 10-27Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" />
      </g>

      <g className="anatomy-part anatomy-digestive" filter="url(#organGlow)">
        <path d="M274 338c29 1 26 41 4 44-18 2-21-17-13-30" fill="rgba(253,186,116,.7)" stroke="#ffedd5" strokeWidth="2" /><path d="M234 410c-17 12-17 59 4 73 24 16 61 4 64-26 4-31-17-49-38-41-20 7-21 33-5 40 20 9 30-15 19-25" fill="none" stroke="#fdba74" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g className="anatomy-part anatomy-vascular" fill="none" stroke="url(#vessel)" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M265 209c5 50 3 115-2 223l24 182" strokeWidth="5" /><path d="m263 320-45 87m45-87 39 87m-36-142-48-59m48 59 41-60" strokeWidth="2.6" opacity=".8" />
      </g>
    </svg>
  )
}

export function ScrollCinematicStyles() {
  return (
    <style>{`
      .anatomy-cinematic{--cyan:#67e8f9;--violet:#a78bfa;--rose:#fb7185}
      .anatomy-scene{--tilt-x:0deg;--tilt-y:0deg;background:radial-gradient(circle at 50% 47%,#0d2231 0%,#050a12 36%,#02050a 72%)}
      .anatomy-aurora{background:radial-gradient(circle at 48% 43%,rgba(34,211,238,.13),transparent 28%),radial-gradient(circle at 62% 55%,rgba(139,92,246,.1),transparent 32%),radial-gradient(circle at 38% 58%,rgba(236,72,153,.07),transparent 28%);filter:blur(22px)}
      .anatomy-grid{opacity:.18;background-image:linear-gradient(rgba(125,211,252,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.06) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at center,#000 0%,transparent 67%);-webkit-mask-image:radial-gradient(circle at center,#000 0%,transparent 67%)}
      .anatomy-tilt{transform:rotateX(var(--tilt-y)) rotateY(var(--tilt-x));transform-style:preserve-3d;transition:transform 280ms cubic-bezier(.2,.8,.2,1)}
      .anatomy-part{transform-box:fill-box;transform-origin:center;transition:transform 1050ms cubic-bezier(.16,1,.3,1),opacity 700ms ease,filter 700ms ease}
      .anatomy-envelope{transition:opacity 800ms ease,transform 1100ms cubic-bezier(.16,1,.3,1);transform-origin:center}.anatomy-floor{transition:opacity 800ms ease,transform 900ms ease;transform-origin:center;filter:blur(7px)}
      .anatomy-scene[data-stage='whole'] .anatomy-part{transform:translate(0,0) scale(1)}.anatomy-scene[data-stage='whole'] .anatomy-envelope{opacity:.95}.anatomy-scene[data-stage='whole'] .anatomy-label{opacity:0}
      .anatomy-scene[data-stage='exploded'] .anatomy-envelope{opacity:.18;transform:scale(1.035)}
      .anatomy-scene[data-stage='exploded'] .anatomy-brain{transform:translate(-92px,-42px) rotate(-7deg) scale(1.08)}.anatomy-scene[data-stage='exploded'] .anatomy-lungs{transform:translate(102px,-10px) rotate(5deg) scale(1.04)}.anatomy-scene[data-stage='exploded'] .anatomy-heart{transform:translate(-116px,18px) rotate(-9deg) scale(1.12)}.anatomy-scene[data-stage='exploded'] .anatomy-liver{transform:translate(108px,29px) rotate(8deg) scale(1.08)}.anatomy-scene[data-stage='exploded'] .anatomy-kidneys{transform:translate(-84px,51px) rotate(-4deg) scale(1.08)}.anatomy-scene[data-stage='exploded'] .anatomy-digestive{transform:translate(101px,72px) rotate(7deg) scale(1.07)}.anatomy-scene[data-stage='exploded'] .anatomy-neuro{transform:translate(-34px,0)}.anatomy-scene[data-stage='exploded'] .anatomy-vascular{transform:translate(40px,0)}.anatomy-scene[data-stage='exploded'] .anatomy-skeleton{transform:scale(.98);opacity:.68}
      .anatomy-scene[data-stage='systems'] .anatomy-envelope{opacity:.08;transform:scale(1.07)}
      .anatomy-scene[data-stage='systems'] .anatomy-brain{transform:translate(-142px,-56px) rotate(-11deg) scale(1.14)}.anatomy-scene[data-stage='systems'] .anatomy-lungs{transform:translate(152px,-30px) rotate(8deg) scale(1.1)}.anatomy-scene[data-stage='systems'] .anatomy-heart{transform:translate(-164px,34px) rotate(-13deg) scale(1.18)}.anatomy-scene[data-stage='systems'] .anatomy-liver{transform:translate(155px,41px) rotate(11deg) scale(1.14)}.anatomy-scene[data-stage='systems'] .anatomy-kidneys{transform:translate(-139px,87px) rotate(-8deg) scale(1.13)}.anatomy-scene[data-stage='systems'] .anatomy-digestive{transform:translate(150px,104px) rotate(9deg) scale(1.12)}.anatomy-scene[data-stage='systems'] .anatomy-neuro{transform:translate(-69px,3px) scale(1.025);filter:drop-shadow(0 0 10px rgba(196,181,253,.6))}.anatomy-scene[data-stage='systems'] .anatomy-vascular{transform:translate(71px,-1px) scale(1.025);filter:drop-shadow(0 0 10px rgba(103,232,249,.58))}.anatomy-scene[data-stage='systems'] .anatomy-skeleton{transform:scale(.96);opacity:.5}
      .anatomy-scene[data-stage='unified'] .anatomy-part{transform:translate(0,0) scale(1)}.anatomy-scene[data-stage='unified'] .anatomy-envelope{opacity:.44;transform:scale(1)}.anatomy-scene[data-stage='unified'] .anatomy-skeleton{opacity:.56}.anatomy-scene[data-stage='unified'] .anatomy-neuro,.anatomy-scene[data-stage='unified'] .anatomy-vascular{filter:drop-shadow(0 0 11px rgba(103,232,249,.56))}.anatomy-scene[data-stage='unified'] .anatomy-floor{transform:scaleX(1.18);opacity:.95}
      .anatomy-label{position:absolute;z-index:12;padding:.35rem .55rem;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(4,10,18,.48);backdrop-filter:blur(14px);color:rgba(236,254,255,.78);font-size:8px;font-weight:800;letter-spacing:.18em;opacity:0;transform:translateY(8px);transition:opacity 500ms ease 380ms,transform 500ms cubic-bezier(.16,1,.3,1) 380ms}.anatomy-scene[data-stage='exploded'] .anatomy-label,.anatomy-scene[data-stage='systems'] .anatomy-label{opacity:1;transform:translateY(0)}
      .anatomy-label-brain{left:calc(50% - 160px);top:22%}.anatomy-label-lungs{left:calc(50% + 115px);top:33%}.anatomy-label-heart{left:calc(50% - 180px);top:43%}.anatomy-label-liver{left:calc(50% + 120px);top:49%}.anatomy-label-kidneys{left:calc(50% - 170px);top:56%}.anatomy-label-skeleton{left:calc(50% - 32px);top:75%}.anatomy-label-neuro{left:calc(50% - 120px);top:68%}.anatomy-label-vascular{left:calc(50% + 80px);top:68%}
      .anatomy-ring{animation:anatomyOrbit 22s linear infinite;box-shadow:0 0 40px rgba(34,211,238,.03) inset}.anatomy-ring-2{animation-direction:reverse;animation-duration:17s}.anatomy-ring-3{animation-duration:12s}.anatomy-particle{opacity:.26;box-shadow:0 0 8px rgba(103,232,249,.65);animation:anatomyParticle 5s ease-in-out infinite alternate}.anatomy-scroll-arrow{animation:anatomyChevron 1.6s ease-in-out infinite}
      @keyframes anatomyOrbit{from{transform:rotate(0deg) scaleX(1)}50%{transform:rotate(180deg) scaleX(.78)}to{transform:rotate(360deg) scaleX(1)}}@keyframes anatomyParticle{from{transform:translate3d(0,0,0);opacity:.12}to{transform:translate3d(0,-16px,0);opacity:.52}}@keyframes anatomyChevron{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(5px);opacity:1}}
      @media(max-width:640px){.anatomy-stage{width:min(90vw,440px)!important;height:82%!important;top:53%!important}.anatomy-label{font-size:7px;padding:.26rem .4rem}.anatomy-label-brain{left:6%;top:23%}.anatomy-label-lungs{left:auto;right:6%;top:33%}.anatomy-label-heart{left:5%;top:43%}.anatomy-label-liver{left:auto;right:5%;top:49%}.anatomy-label-kidneys{left:6%;top:56%}.anatomy-label-skeleton{left:calc(50% - 24px);top:75%}.anatomy-label-neuro{left:10%;top:68%}.anatomy-label-vascular{left:auto;right:10%;top:68%}.anatomy-scene[data-stage='systems'] .anatomy-brain{transform:translate(-108px,-46px) rotate(-10deg) scale(1.12)}.anatomy-scene[data-stage='systems'] .anatomy-lungs{transform:translate(112px,-24px) rotate(7deg) scale(1.08)}.anatomy-scene[data-stage='systems'] .anatomy-heart{transform:translate(-118px,28px) rotate(-11deg) scale(1.15)}.anatomy-scene[data-stage='systems'] .anatomy-liver{transform:translate(116px,37px) rotate(9deg) scale(1.12)}.anatomy-scene[data-stage='systems'] .anatomy-kidneys{transform:translate(-103px,70px) rotate(-7deg) scale(1.1)}.anatomy-scene[data-stage='systems'] .anatomy-digestive{transform:translate(110px,84px) rotate(8deg) scale(1.1)}}
      .reduce-motion .anatomy-part,.reduce-motion .anatomy-envelope,.reduce-motion .anatomy-tilt,.reduce-motion .anatomy-label{transition:none!important}.reduce-motion .anatomy-ring,.reduce-motion .anatomy-particle,.reduce-motion .anatomy-scroll-arrow{animation:none!important}
    `}</style>
  )
}
