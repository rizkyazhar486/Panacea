import { useEffect, useRef, useState } from 'react'

/**
 * Landing-page cinematic inspired by an exploded-product reveal, but the
 * product is the human body itself. One anatomical figure remains spatially
 * continuous while scrolling changes its state from whole body → exploded
 * anatomy → interconnected systems → recomposed longitudinal body state.
 *
 * The animation intentionally uses SVG + CSS only: no large 3D dependency,
 * no canvas/WebGL startup penalty, and it still degrades cleanly when reduced
 * motion is enabled.
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
    const onScroll = () => {
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
          const el = actRefs.current[i]
          const dot = dotRefs.current[i]
          if (!el) return
          const center = (i + 0.5) / ACTS.length
          const distance = Math.abs(progress - center)
          const opacity = clamp01(1 - distance / 0.16)
          const shift = (center - progress) * 110
          el.style.opacity = String(opacity)
          el.style.transform = `translate3d(0, ${shift}px, 0)`
          if (dot) {
            dot.style.opacity = i === stageIndex ? '1' : '0.28'
            dot.style.transform = i === stageIndex ? 'scale(1.5)' : 'scale(1)'
          }
        })
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  if (reduced) {
    return (
      <section className="anatomy-cinematic relative overflow-hidden px-5 py-20 text-white" aria-label="Human body overview">
        <AnatomyScene stage="exploded" reduced />
        <div className="relative z-20 mx-auto mt-[30rem] max-w-xl text-center sm:mt-[34rem]">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">PANACEAMED · YOUR BODY</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">One body. Every layer.</h2>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={trackRef}
      className="anatomy-cinematic relative"
      style={{ height: '360vh' }}
      aria-label="Interactive human anatomy cinematic"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#02050a] text-white">
        <div ref={sceneRef} data-stage="whole" className="absolute inset-0">
          <AnatomyScene stage="whole" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-20">
          {ACTS.map((act, i) => (
            <div
              key={act.key}
              ref={(el) => { actRefs.current[i] = el }}
              className="absolute inset-x-5 top-[9svh] text-center sm:inset-x-10 sm:top-[10svh]"
              style={{ opacity: i === 0 ? 1 : 0, willChange: 'opacity, transform' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-100/70 sm:text-[10px]">{act.eyebrow}</p>
              <h2 className="mt-2 text-[clamp(1.7rem,5vw,4.3rem)] font-black leading-none tracking-[-0.055em] text-white">
                {act.title}
              </h2>
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

function AnatomyScene({ stage, reduced = false }: { stage: Stage; reduced?: boolean }) {
  const tiltRef = useRef<HTMLDivElement | null>(null)

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    el.style.setProperty('--tilt-x', `${x * 4.5}deg`)
    el.style.setProperty('--tilt-y', `${y * -3.5}deg`)
  }

  const reset = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div
      ref={tiltRef}
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
        <div className="anatomy-tilt h-full w-full">
          <HumanAnatomy />
        </div>
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
  const dots = Array.from({ length: 34 }, (_, i) => {
    const a = (Math.sin(i * 31.7) + 1) / 2
    const b = (Math.sin(i * 73.1 + 3) + 1) / 2
    const c = (Math.sin(i * 19.3 + 8) + 1) / 2
    return { left: `${a * 100}%`, top: `${b * 100}%`, size: 1 + c * 2.5, delay: `${-a * 8}s` }
  })
  return (
    <div className="pointer-events-none absolute inset-0">
      {dots.map((dot, i) => (
        <span
          key={i}
          className="anatomy-particle absolute rounded-full bg-white"
          style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size, animationDelay: dot.delay }}
        />
      ))}
    </div>
  )
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
  return (
    <svg
      className="h-full w-full overflow-visible"
      viewBox="0 0 520 760"
      role="img"
      aria-label="Human anatomy layers separating into organs and systems"
    >
      <defs>
        <radialGradient id="skinGlow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e8fbff" stopOpacity="0.24" />
          <stop offset="65%" stopColor="#7dd3fc" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bone" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bdefff" />
        </linearGradient>
        <linearGradient id="vessel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6ee7f9" />
          <stop offset="48%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="organGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse className="anatomy-floor" cx="260" cy="714" rx="112" ry="18" fill="rgba(64,220,255,.13)" />

      {/* translucent whole-body envelope */}
      <g className="anatomy-envelope">
        <circle cx="260" cy="92" r="48" fill="url(#skinGlow)" stroke="rgba(202,244,255,.28)" strokeWidth="1.5" />
        <path d="M210 151 C191 173 184 219 190 279 L207 414 L176 628 C172 659 191 681 208 658 L252 444 L268 444 L312 658 C329 681 348 659 344 628 L313 414 L330 279 C336 219 329 173 310 151 C290 139 230 139 210 151Z" fill="url(#skinGlow)" stroke="rgba(202,244,255,.26)" strokeWidth="1.5" />
        <path d="M203 171 L117 357 C110 378 127 389 140 371 L219 230" fill="none" stroke="rgba(202,244,255,.22)" strokeWidth="27" strokeLinecap="round" />
        <path d="M317 171 L403 357 C410 378 393 389 380 371 L301 230" fill="none" stroke="rgba(202,244,255,.22)" strokeWidth="27" strokeLinecap="round" />
      </g>

      {/* skeleton */}
      <g className="anatomy-part anatomy-skeleton" filter="url(#softGlow)">
        <circle cx="260" cy="92" r="34" fill="none" stroke="url(#bone)" strokeWidth="5" opacity=".8" />
        <path d="M244 106 Q260 118 276 106 M260 126 L260 420" fill="none" stroke="url(#bone)" strokeWidth="6" strokeLinecap="round" opacity=".78" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 177 + i * 28
          const width = 58 - i * 4
          return <path key={i} d={`M260 ${y} C${260 - width} ${y - 15}, ${260 - width} ${y + 24}, 260 ${y + 24} C${260 + width} ${y + 24}, ${260 + width} ${y - 15}, 260 ${y}`} fill="none" stroke="url(#bone)" strokeWidth="3.8" opacity=".66" />
        })}
        <path d="M223 158 L164 264 L126 364 M297 158 L356 264 L394 364" fill="none" stroke="url(#bone)" strokeWidth="7" strokeLinecap="round" opacity=".72" />
        <path d="M224 408 Q260 432 296 408 M232 422 L202 615 M288 422 L318 615" fill="none" stroke="url(#bone)" strokeWidth="9" strokeLinecap="round" opacity=".76" />
        <path d="M203 615 L194 680 M317 615 L326 680" fill="none" stroke="url(#bone)" strokeWidth="7" strokeLinecap="round" opacity=".72" />
      </g>

      {/* nervous system */}
      <g className="anatomy-part anatomy-neuro" fill="none" stroke="#c4b5fd" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M260 128 L260 431" strokeWidth="3.2" />
        <path d="M260 202 C224 232 195 269 164 329 M260 202 C296 232 325 269 356 329" strokeWidth="1.7" opacity=".82" />
        <path d="M260 330 C236 399 218 493 205 615 M260 330 C284 399 302 493 315 615" strokeWidth="1.8" opacity=".82" />
      </g>

      {/* brain */}
      <g className="anatomy-part anatomy-brain" filter="url(#organGlow)">
        <path d="M226 86 C224 60 243 43 260 50 C277 40 298 58 294 79 C306 99 290 122 268 118 C249 130 221 111 226 86Z" fill="rgba(196,181,253,.84)" stroke="#ede9fe" strokeWidth="2" />
        <path d="M240 61 C250 71 246 85 236 92 M264 53 C255 66 264 79 274 85 M285 66 C274 76 276 95 288 102 M249 100 C260 89 273 96 279 111" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      </g>

      {/* lungs */}
      <g className="anatomy-part anatomy-lungs" filter="url(#organGlow)">
        <path d="M248 176 C219 171 205 203 207 247 C209 286 229 305 250 284 L250 181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" />
        <path d="M272 176 C301 171 315 203 313 247 C311 286 291 305 270 284 L270 181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" />
        <path d="M260 147 L260 191 M260 184 L235 209 M260 184 L285 209" fill="none" stroke="#e6fdff" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* heart */}
      <g className="anatomy-part anatomy-heart" filter="url(#organGlow)">
        <path d="M260 251 C245 229 220 239 221 261 C222 285 260 311 260 311 C260 311 298 285 299 261 C300 239 275 229 260 251Z" fill="#fb7185" stroke="#fecdd3" strokeWidth="2.4" />
        <path d="M256 244 C252 230 254 219 260 209 M268 246 C278 231 283 221 283 208" fill="none" stroke="#fda4af" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* liver */}
      <g className="anatomy-part anatomy-liver" filter="url(#organGlow)">
        <path d="M246 326 C207 315 199 342 210 371 C229 385 266 378 287 358 C300 345 286 326 246 326Z" fill="rgba(251,146,60,.82)" stroke="#fed7aa" strokeWidth="2" />
      </g>

      {/* kidneys */}
      <g className="anatomy-part anatomy-kidneys" filter="url(#organGlow)">
        <path d="M222 372 C205 365 196 384 203 407 C210 426 230 421 232 399 C234 383 231 376 222 372Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" />
        <path d="M298 372 C315 365 324 384 317 407 C310 426 290 421 288 399 C286 383 289 376 298 372Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" />
      </g>

      {/* digestive tract */}
      <g className="anatomy-part anatomy-digestive" filter="url(#organGlow)">
        <path d="M274 338 C303 339 300 379 278 382 C260 384 257 365 265 352" fill="rgba(253,186,116,.7)" stroke="#ffedd5" strokeWidth="2" />
        <path d="M234 410 C217 422 217 469 238 483 C262 499 299 487 302 457 C306 426 285 408 264 416 C244 423 243 449 259 456 C279 465 289 441 278 431" fill="none" stroke="#fdba74" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* vascular axis */}
      <g className="anatomy-part anatomy-vascular" fill="none" stroke="url(#vessel)" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M265 209 C270 259 268 324 263 432 L287 614" strokeWidth="5" />
        <path d="M263 320 L218 407 M263 320 L302 407 M266 265 L218 206 M266 265 L307 205" strokeWidth="2.6" opacity=".8" />
      </g>
    </svg>
  )
}

export function ScrollCinematicStyles() {
  return (
    <style>{`
      .anatomy-cinematic { --cyan:#67e8f9; --violet:#a78bfa; --rose:#fb7185; }
      .anatomy-scene { --tilt-x:0deg; --tilt-y:0deg; background: radial-gradient(circle at 50% 47%, #0d2231 0%, #050a12 36%, #02050a 72%); }
      .anatomy-aurora { background: radial-gradient(circle at 48% 43%, rgba(34,211,238,.13), transparent 28%), radial-gradient(circle at 62% 55%, rgba(139,92,246,.1), transparent 32%), radial-gradient(circle at 38% 58%, rgba(236,72,153,.07), transparent 28%); filter: blur(22px); }
      .anatomy-grid { opacity:.18; background-image:linear-gradient(rgba(125,211,252,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.06) 1px,transparent 1px); background-size:42px 42px; mask-image:radial-gradient(circle at center,#000 0%,transparent 67%); -webkit-mask-image:radial-gradient(circle at center,#000 0%,transparent 67%); }
      .anatomy-tilt { transform:rotateX(var(--tilt-y)) rotateY(var(--tilt-x)); transform-style:preserve-3d; transition:transform 280ms cubic-bezier(.2,.8,.2,1); }
      .anatomy-part { transform-box:fill-box; transform-origin:center; transition:transform 1050ms cubic-bezier(.16,1,.3,1), opacity 700ms ease, filter 700ms ease; }
      .anatomy-envelope { transition:opacity 800ms ease, transform 1100ms cubic-bezier(.16,1,.3,1); transform-origin:center; }
      .anatomy-floor { transition:opacity 800ms ease, transform 900ms ease; transform-origin:center; filter:blur(7px); }

      .anatomy-scene[data-stage='whole'] .anatomy-part { transform:translate(0,0) scale(1); }
      .anatomy-scene[data-stage='whole'] .anatomy-envelope { opacity:.95; }
      .anatomy-scene[data-stage='whole'] .anatomy-label { opacity:0; }

      .anatomy-scene[data-stage='exploded'] .anatomy-envelope { opacity:.18; transform:scale(1.035); }
      .anatomy-scene[data-stage='exploded'] .anatomy-brain { transform:translate(-92px,-42px) rotate(-7deg) scale(1.08); }
      .anatomy-scene[data-stage='exploded'] .anatomy-lungs { transform:translate(102px,-10px) rotate(5deg) scale(1.04); }
      .anatomy-scene[data-stage='exploded'] .anatomy-heart { transform:translate(-116px,18px) rotate(-9deg) scale(1.12); }
      .anatomy-scene[data-stage='exploded'] .anatomy-liver { transform:translate(108px,29px) rotate(8deg) scale(1.08); }
      .anatomy-scene[data-stage='exploded'] .anatomy-kidneys { transform:translate(-84px,51px) rotate(-4deg) scale(1.08); }
      .anatomy-scene[data-stage='exploded'] .anatomy-digestive { transform:translate(101px,72px) rotate(7deg) scale(1.07); }
      .anatomy-scene[data-stage='exploded'] .anatomy-neuro { transform:translate(-34px,0) scale(1.01); }
      .anatomy-scene[data-stage='exploded'] .anatomy-vascular { transform:translate(40px,0) scale(1.01); }
      .anatomy-scene[data-stage='exploded'] .anatomy-skeleton { transform:scale(.98); opacity:.68; }

      .anatomy-scene[data-stage='systems'] .anatomy-envelope { opacity:.08; transform:scale(1.07); }
      .anatomy-scene[data-stage='systems'] .anatomy-brain { transform:translate(-142px,-56px) rotate(-11deg) scale(1.14); }
      .anatomy-scene[data-stage='systems'] .anatomy-lungs { transform:translate(152px,-30px) rotate(8deg) scale(1.1); }
      .anatomy-scene[data-stage='systems'] .anatomy-heart { transform:translate(-164px,34px) rotate(-13deg) scale(1.18); }
      .anatomy-scene[data-stage='systems'] .anatomy-liver { transform:translate(155px,41px) rotate(11deg) scale(1.14); }
      .anatomy-scene[data-stage='systems'] .anatomy-kidneys { transform:translate(-139px,87px) rotate(-8deg) scale(1.13); }
      .anatomy-scene[data-stage='systems'] .anatomy-digestive { transform:translate(150px,104px) rotate(9deg) scale(1.12); }
      .anatomy-scene[data-stage='systems'] .anatomy-neuro { transform:translate(-69px,3px) scale(1.025); filter:drop-shadow(0 0 10px rgba(196,181,253,.6)); }
      .anatomy-scene[data-stage='systems'] .anatomy-vascular { transform:translate(71px,-1px) scale(1.025); filter:drop-shadow(0 0 10px rgba(103,232,249,.58)); }
      .anatomy-scene[data-stage='systems'] .anatomy-skeleton { transform:scale(.96); opacity:.5; }

      .anatomy-scene[data-stage='unified'] .anatomy-part { transform:translate(0,0) scale(1); }
      .anatomy-scene[data-stage='unified'] .anatomy-envelope { opacity:.44; transform:scale(1); }
      .anatomy-scene[data-stage='unified'] .anatomy-skeleton { opacity:.56; }
      .anatomy-scene[data-stage='unified'] .anatomy-neuro, .anatomy-scene[data-stage='unified'] .anatomy-vascular { filter:drop-shadow(0 0 11px rgba(103,232,249,.56)); }
      .anatomy-scene[data-stage='unified'] .anatomy-floor { transform:scaleX(1.18); opacity:.95; }

      .anatomy-label { position:absolute; z-index:12; padding:.35rem .55rem; border:1px solid rgba(255,255,255,.13); border-radius:999px; background:rgba(4,10,18,.48); backdrop-filter:blur(14px); color:rgba(236,254,255,.78); font-size:8px; font-weight:800; letter-spacing:.18em; opacity:0; transform:translateY(8px); transition:opacity 500ms ease 380ms, transform 500ms cubic-bezier(.16,1,.3,1) 380ms; }
      .anatomy-scene[data-stage='exploded'] .anatomy-label, .anatomy-scene[data-stage='systems'] .anatomy-label { opacity:1; transform:translateY(0); }
      .anatomy-label-brain { left:calc(50% - 180px); top:25%; }
      .anatomy-label-lungs { left:calc(50% + 105px); top:34%; }
      .anatomy-label-heart { left:calc(50% - 196px); top:44%; }
      .anatomy-label-liver { left:calc(50% + 115px); top:50%; }
      .anatomy-label-kidneys { left:calc(50% - 185px); top:57%; }
      .anatomy-label-skeleton { left:calc(50% - 34px); top:75%; }
      .anatomy-label-neuro { left:calc(50% - 126px); top:69%; }
      .anatomy-label-vascular { left:calc(50% + 75px); top:68%; }

      .anatomy-ring { animation:anatomyOrbit 22s linear infinite; box-shadow:0 0 40px rgba(34,211,238,.03) inset; }
      .anatomy-ring-2 { animation-direction:reverse; animation-duration:17s; }
      .anatomy-ring-3 { animation-duration:12s; }
      .anatomy-particle { opacity:.26; box-shadow:0 0 8px rgba(103,232,249,.65); animation:anatomyParticle 5s ease-in-out infinite alternate; }
      .anatomy-scroll-arrow { animation:anatomyChevron 1.6s ease-in-out infinite; }
      @keyframes anatomyOrbit { from{transform:rotate(0deg) scaleX(1)} 50%{transform:rotate(180deg) scaleX(.78)} to{transform:rotate(360deg) scaleX(1)} }
      @keyframes anatomyParticle { from{transform:translate3d(0,0,0);opacity:.12} to{transform:translate3d(0,-16px,0);opacity:.52} }
      @keyframes anatomyChevron { 0%,100%{transform:translateY(0);opacity:.45} 50%{transform:translateY(5px);opacity:1} }

      @media (max-width:640px) {
        .anatomy-stage { width:min(124vw,690px)!important; top:55%!important; }
        .anatomy-label { font-size:7px; padding:.28rem .42rem; }
        .anatomy-label-brain { left:9%; top:29%; }
        .anatomy-label-lungs { left:auto; right:8%; top:36%; }
        .anatomy-label-heart { left:7%; top:46%; }
        .anatomy-label-liver { left:auto; right:7%; top:51%; }
        .anatomy-label-kidneys { left:8%; top:59%; }
        .anatomy-label-skeleton { left:44%; top:76%; }
        .anatomy-label-neuro { left:15%; top:69%; }
        .anatomy-label-vascular { left:auto; right:12%; top:68%; }
        .anatomy-scene[data-stage='systems'] .anatomy-brain { transform:translate(-108px,-46px) rotate(-10deg) scale(1.12); }
        .anatomy-scene[data-stage='systems'] .anatomy-lungs { transform:translate(112px,-24px) rotate(7deg) scale(1.08); }
        .anatomy-scene[data-stage='systems'] .anatomy-heart { transform:translate(-118px,28px) rotate(-11deg) scale(1.15); }
        .anatomy-scene[data-stage='systems'] .anatomy-liver { transform:translate(116px,37px) rotate(9deg) scale(1.12); }
        .anatomy-scene[data-stage='systems'] .anatomy-kidneys { transform:translate(-103px,70px) rotate(-7deg) scale(1.1); }
        .anatomy-scene[data-stage='systems'] .anatomy-digestive { transform:translate(110px,84px) rotate(8deg) scale(1.1); }
      }

      .reduce-motion .anatomy-part, .reduce-motion .anatomy-envelope, .reduce-motion .anatomy-tilt, .reduce-motion .anatomy-label { transition:none!important; }
      .reduce-motion .anatomy-ring, .reduce-motion .anatomy-particle, .reduce-motion .anatomy-scroll-arrow { animation:none!important; }
    `}</style>
  )
}
