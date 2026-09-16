import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'

/**
 * Exploded-human cinematic for the public landing page.
 * A single persistent figure changes state while the viewport is pinned:
 * whole body → exploded anatomy → connected systems → unified health state.
 * SVG/CSS keeps the first load light and preserves a reduced-motion fallback.
 */
const ACTS = [
  { key: 'whole', label: 'Whole Body', eyebrow: 'YOUR BODY', title: 'One body. Every layer.' },
  { key: 'exploded', label: 'Exploded Anatomy', eyebrow: 'EXPLORE', title: 'See what lives beneath.' },
  { key: 'systems', label: 'Connected Systems', eyebrow: 'UNDERSTAND', title: 'Systems move together.' },
  { key: 'unified', label: 'Longitudinal State', eyebrow: 'PANACEAMED', title: 'One continuous health state.' },
] as const

type Stage = (typeof ACTS)[number]['key']

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function ScrollCinematic() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const actRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(document.documentElement.classList.contains('reduce-motion') || media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const update = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const track = trackRef.current
        const scene = sceneRef.current
        if (!track || !scene) return

        const rect = track.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        const progress = total > 0 ? clamp01(-rect.top / total) : 0
        const stageIndex = Math.min(ACTS.length - 1, Math.floor(progress * ACTS.length))
        scene.dataset.stage = ACTS[stageIndex].key
        scene.style.setProperty('--cinematic-progress', String(progress))

        ACTS.forEach((_, i) => {
          const copy = actRefs.current[i]
          const dot = dotRefs.current[i]
          if (!copy) return
          const center = (i + 0.5) / ACTS.length
          const distance = Math.abs(progress - center)
          const opacity = clamp01(1 - distance / 0.16)
          copy.style.opacity = String(opacity)
          copy.style.transform = `translate3d(0, ${(center - progress) * 105}px, 0)`
          if (dot) {
            dot.style.opacity = i === stageIndex ? '1' : '0.28'
            dot.style.transform = i === stageIndex ? 'scale(1.5)' : 'scale(1)'
          }
        })
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  if (reduced) {
    return (
      <section className="anatomy-cinematic relative h-[760px] overflow-hidden bg-[#02050a] text-white" aria-label="Human body overview">
        <AnatomyScene stage="exploded" reduced />
        <div className="pointer-events-none absolute inset-x-5 top-12 z-20 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-100/70">PANACEAMED · YOUR BODY</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">One body. Every layer.</h2>
        </div>
      </section>
    )
  }

  return (
    <section ref={trackRef} className="anatomy-cinematic relative" style={{ height: '360vh' }} aria-label="Interactive human anatomy cinematic">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#02050a] text-white">
        <AnatomyScene stage="whole" sceneRef={sceneRef} />

        <div className="pointer-events-none absolute inset-0 z-20">
          {ACTS.map((act, i) => (
            <div
              key={act.key}
              ref={(el) => { actRefs.current[i] = el }}
              className="absolute inset-x-5 top-[9svh] text-center sm:inset-x-10 sm:top-[10svh]"
              style={{ opacity: i === 0 ? 1 : 0, willChange: 'opacity, transform' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-100/70 sm:text-[10px]">{act.eyebrow}</p>
              <h2 className="mt-2 text-[clamp(1.7rem,5vw,4.3rem)] font-black leading-none tracking-[-0.055em] text-white">{act.title}</h2>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-8">
          {ACTS.map((act, i) => (
            <span
              key={act.key}
              ref={(el) => { dotRefs.current[i] = el }}
              className="h-1.5 w-1.5 rounded-full bg-white transition-[opacity,transform] duration-300"
              style={{ opacity: i === 0 ? 1 : 0.28 }}
              title={act.label}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 text-white/45">
          <span className="text-[9px] font-bold uppercase tracking-[0.28em]">Scroll to dissect</span>
          <span className="anatomy-scroll-arrow text-sm">↓</span>
        </div>
      </div>
    </section>
  )
}

function AnatomyScene({ stage, reduced = false, sceneRef }: { stage: Stage; reduced?: boolean; sceneRef?: RefObject<HTMLDivElement | null> }) {
  const localRef = useRef<HTMLDivElement | null>(null)
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

      <div className="anatomy-stage absolute left-1/2 top-[54%] h-[min(70svh,720px)] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 [perspective:1200px]">
        <div className="anatomy-tilt h-full w-full"><HumanAnatomy /></div>
      </div>

      <div className="anatomy-label anatomy-label-brain">BRAIN</div>
      <div className="anatomy-label anatomy-label-lungs">LUNGS</div>
      <div className="anatomy-label anatomy-label-heart">HEART</div>
      <div className="anatomy-label anatomy-label-liver">LIVER</div>
      <div className="anatomy-label anatomy-label-kidneys">KIDNEYS</div>
      <div className="anatomy-label anatomy-label-skeleton">SKELETON</div>
      <div className="anatomy-label anatomy-label-neuro">NEURO</div>
      <div className="anatomy-label anatomy-label-vascular">VASCULAR</div>
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
      .anatomy-label-brain{left:calc(50% - 180px);top:25%}.anatomy-label-lungs{left:calc(50% + 105px);top:34%}.anatomy-label-heart{left:calc(50% - 196px);top:44%}.anatomy-label-liver{left:calc(50% + 115px);top:50%}.anatomy-label-kidneys{left:calc(50% - 185px);top:57%}.anatomy-label-skeleton{left:calc(50% - 34px);top:75%}.anatomy-label-neuro{left:calc(50% - 126px);top:69%}.anatomy-label-vascular{left:calc(50% + 75px);top:68%}
      .anatomy-ring{animation:anatomyOrbit 22s linear infinite;box-shadow:0 0 40px rgba(34,211,238,.03) inset}.anatomy-ring-2{animation-direction:reverse;animation-duration:17s}.anatomy-ring-3{animation-duration:12s}.anatomy-particle{opacity:.26;box-shadow:0 0 8px rgba(103,232,249,.65);animation:anatomyParticle 5s ease-in-out infinite alternate}.anatomy-scroll-arrow{animation:anatomyChevron 1.6s ease-in-out infinite}
      @keyframes anatomyOrbit{from{transform:rotate(0deg) scaleX(1)}50%{transform:rotate(180deg) scaleX(.78)}to{transform:rotate(360deg) scaleX(1)}}@keyframes anatomyParticle{from{transform:translate3d(0,0,0);opacity:.12}to{transform:translate3d(0,-16px,0);opacity:.52}}@keyframes anatomyChevron{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(5px);opacity:1}}
      @media(max-width:640px){.anatomy-stage{width:min(124vw,690px)!important;top:55%!important}.anatomy-label{font-size:7px;padding:.28rem .42rem}.anatomy-label-brain{left:9%;top:29%}.anatomy-label-lungs{left:auto;right:8%;top:36%}.anatomy-label-heart{left:7%;top:46%}.anatomy-label-liver{left:auto;right:7%;top:51%}.anatomy-label-kidneys{left:8%;top:59%}.anatomy-label-skeleton{left:44%;top:76%}.anatomy-label-neuro{left:15%;top:69%}.anatomy-label-vascular{left:auto;right:12%;top:68%}.anatomy-scene[data-stage='systems'] .anatomy-brain{transform:translate(-108px,-46px) rotate(-10deg) scale(1.12)}.anatomy-scene[data-stage='systems'] .anatomy-lungs{transform:translate(112px,-24px) rotate(7deg) scale(1.08)}.anatomy-scene[data-stage='systems'] .anatomy-heart{transform:translate(-118px,28px) rotate(-11deg) scale(1.15)}.anatomy-scene[data-stage='systems'] .anatomy-liver{transform:translate(116px,37px) rotate(9deg) scale(1.12)}.anatomy-scene[data-stage='systems'] .anatomy-kidneys{transform:translate(-103px,70px) rotate(-7deg) scale(1.1)}.anatomy-scene[data-stage='systems'] .anatomy-digestive{transform:translate(110px,84px) rotate(8deg) scale(1.1)}}
      .reduce-motion .anatomy-part,.reduce-motion .anatomy-envelope,.reduce-motion .anatomy-tilt,.reduce-motion .anatomy-label{transition:none!important}.reduce-motion .anatomy-ring,.reduce-motion .anatomy-particle,.reduce-motion .anatomy-scroll-arrow{animation:none!important}
    `}</style>
  )
}
