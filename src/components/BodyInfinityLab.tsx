import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BODY_INFINITY_FEATURES,
  BODY_INFINITY_GROUPS,
  bodyInfinityFeatureCounts,
  bodyInfinitySearch,
  type BodyExperienceFeature,
  type ExperienceKind,
} from '../lib/bodyExperienceMatrix'

const KIND_LABELS: Record<ExperienceKind, string> = {
  spatial: 'Spatial',
  motion: 'Motion',
  simulation: 'Simulation',
  surgery: 'Surgery',
  imaging: 'Imaging',
  physiology: 'Physiology',
  micro: 'Micro',
  education: 'Education',
  game: 'Game',
  cinematic: 'Cinematic',
}

const KIND_GLYPHS: Record<ExperienceKind, string> = {
  spatial: '◈',
  motion: '≈',
  simulation: '⧉',
  surgery: '✦',
  imaging: '◉',
  physiology: '∿',
  micro: '⌬',
  education: '◇',
  game: '✣',
  cinematic: '✺',
}

const stars = Array.from({ length: 72 }, (_, index) => ({
  left: `${(index * 37.17) % 100}%`,
  top: `${(index * 61.91) % 100}%`,
  size: 1 + (index % 3),
  delay: (index % 11) * 0.17,
  duration: 2.4 + (index % 7) * 0.43,
}))

function HumanLightform({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 280 620" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="bodyHalo" cx="50%" cy="35%" r="68%">
          <stop offset="0" stopColor="rgba(103,232,249,.30)" />
          <stop offset=".48" stopColor="rgba(139,92,246,.18)" />
          <stop offset="1" stopColor="rgba(236,72,153,0)" />
        </radialGradient>
        <linearGradient id="bodyLine" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e9fbff" />
          <stop offset=".35" stopColor="#67e8f9" />
          <stop offset=".68" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#f0abfc" />
        </linearGradient>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="140" cy="310" rx="128" ry="286" fill="url(#bodyHalo)" opacity={active ? 1 : .7} />
      <g fill="none" stroke="url(#bodyLine)" strokeLinecap="round" strokeLinejoin="round" filter="url(#softGlow)">
        <circle cx="140" cy="72" r="43" strokeWidth="2.2" opacity=".95" />
        <path d="M112 111 C98 144 95 183 102 222 C108 259 100 309 88 355" strokeWidth="2.4" />
        <path d="M168 111 C182 144 185 183 178 222 C172 259 180 309 192 355" strokeWidth="2.4" />
        <path d="M114 121 C72 145 56 193 58 254" strokeWidth="2" />
        <path d="M166 121 C208 145 224 193 222 254" strokeWidth="2" />
        <path d="M58 254 C55 304 47 347 34 388" strokeWidth="1.8" />
        <path d="M222 254 C225 304 233 347 246 388" strokeWidth="1.8" />
        <path d="M88 355 C97 401 94 469 80 548" strokeWidth="2.4" />
        <path d="M192 355 C183 401 186 469 200 548" strokeWidth="2.4" />
        <path d="M80 548 L70 598" strokeWidth="2" />
        <path d="M200 548 L210 598" strokeWidth="2" />
        <path d="M102 222 C119 238 161 238 178 222" strokeWidth="1.4" opacity=".8" />
        <path d="M100 302 C118 320 162 320 180 302" strokeWidth="1.4" opacity=".65" />
        <path d="M140 116 L140 354" strokeWidth="1" opacity=".7" />
        <path d="M118 154 C128 143 152 143 162 154 C172 167 168 191 140 212 C112 191 108 167 118 154 Z" strokeWidth="1.5" opacity=".92" />
        <path d="M120 222 C105 250 106 293 121 322" strokeWidth="1" opacity=".62" />
        <path d="M160 222 C175 250 174 293 159 322" strokeWidth="1" opacity=".62" />
      </g>
      {Array.from({ length: 17 }, (_, i) => (
        <circle
          key={i}
          cx={140 + Math.sin(i * 1.71) * (24 + (i % 4) * 12)}
          cy={125 + i * 24}
          r={1.8 + (i % 3)}
          fill={i % 2 ? '#67e8f9' : '#c4b5fd'}
          opacity={.65 + (i % 3) * .1}
        />
      ))}
    </svg>
  )
}

function FeatureCard({
  feature,
  active,
  onSelect,
}: {
  feature: BodyExperienceFeature
  active: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4, scale: 1.012 }}
      whileTap={{ scale: .99 }}
      className={`group min-h-[164px] rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
        active
          ? 'border-cyan-300/30 bg-[linear-gradient(145deg,rgba(34,211,238,.13),rgba(139,92,246,.10),rgba(236,72,153,.06))] shadow-[0_20px_60px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.14)]'
          : 'border-white/[.08] bg-white/[.035] hover:border-white/[.14] hover:bg-white/[.055]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-lg text-cyan-100/90">
          {KIND_GLYPHS[feature.kind]}
        </span>
        <span className="rounded-full border border-white/[.08] bg-black/25 px-2 py-1 text-[8px] font-black uppercase tracking-[.16em] text-white/35">
          {feature.maturity}
        </span>
      </div>
      <h4 className="mt-4 text-[13px] font-black leading-tight tracking-[-.01em] text-white/90">{feature.title}</h4>
      <p className="mt-2 line-clamp-3 text-[11px] font-medium leading-relaxed text-white/46">{feature.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {feature.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-white/[.045] px-2 py-1 text-[8px] font-bold text-white/35">{tag}</span>
        ))}
      </div>
    </motion.button>
  )
}

export default function BodyInfinityLab() {
  const stageRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [kind, setKind] = useState<ExperienceKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(BODY_INFINITY_FEATURES[0]?.id ?? '')
  const [expanded, setExpanded] = useState(false)
  const [cinematic, setCinematic] = useState(true)

  const counts = useMemo(() => bodyInfinityFeatureCounts(), [])
  const features = useMemo(
    () => bodyInfinitySearch(query, kind === 'all' ? undefined : kind),
    [query, kind],
  )
  const selected = BODY_INFINITY_FEATURES.find((feature) => feature.id === selectedId) ?? features[0] ?? BODY_INFINITY_FEATURES[0]

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2
    stageRef.current?.style.setProperty('--mx', x.toFixed(3))
    stageRef.current?.style.setProperty('--my', y.toFixed(3))
  }

  function clearPointer() {
    stageRef.current?.style.setProperty('--mx', '0')
    stageRef.current?.style.setProperty('--my', '0')
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.085] bg-[#030508]/90 shadow-[0_28px_100px_rgba(0,0,0,.46)]" aria-labelledby="body-infinity-title">
      <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden>
        {stars.map((star, index) => (
          <motion.i
            key={index}
            className="absolute rounded-full bg-white"
            style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
            animate={reduceMotion ? undefined : { opacity: [.12, .68, .12], scale: [.8, 1.5, .8] }}
            transition={{ repeat: Infinity, duration: star.duration, delay: star.delay }}
          />
        ))}
        <div className="absolute left-[12%] top-[-24%] h-[420px] w-[420px] rounded-full bg-cyan-400/[.08] blur-[110px]" />
        <div className="absolute right-[-10%] top-[6%] h-[460px] w-[460px] rounded-full bg-violet-500/[.08] blur-[130px]" />
        <div className="absolute bottom-[-30%] left-[36%] h-[400px] w-[400px] rounded-full bg-fuchsia-500/[.055] blur-[140px]" />
      </div>

      <div className="relative z-[2] border-b border-white/[.07] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200">Infinity Lab · Experimental</span>
              <span className="rounded-full border border-white/[.09] bg-white/[.045] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white/45">{BODY_INFINITY_FEATURES.length} experience primitives</span>
            </div>
            <h3 id="body-infinity-title" className="mt-2 text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">
              Spatial anatomy that behaves like a living world.
            </h3>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/52">
              A deliberately ambitious prototyping layer for motion graphics, spatial navigation, physiology games, procedural training, cinematic transitions, micro-scale worlds, and future simulator concepts. Experimental visuals are not patient-specific medical guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={cinematic}
              onClick={() => setCinematic((value) => !value)}
              className={`min-h-[42px] rounded-full border px-4 text-[11px] font-black transition ${cinematic ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[.04] text-white/55'}`}
            >
              {cinematic ? 'Cinematic ON' : 'Cinematic OFF'}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="min-h-[42px] rounded-full border border-white/10 bg-white/[.04] px-4 text-[11px] font-black text-white/70 transition hover:bg-white/[.075]"
            >
              {expanded ? 'Compact stage' : 'Expand stage'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-[2] grid xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
        <div className="min-w-0 border-b border-white/[.07] xl:border-b-0 xl:border-r">
          <div
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerLeave={clearPointer}
            className={`relative isolate overflow-hidden ${expanded ? 'min-h-[760px]' : 'min-h-[520px] sm:min-h-[620px]'}`}
            style={{ ['--mx' as string]: '0', ['--my' as string]: '0' }}
          >
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[86%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-200/[.08]"
              animate={reduceMotion || !cinematic ? undefined : { rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[64%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-violet-200/[.07]"
              animate={reduceMotion || !cinematic ? undefined : { rotate: -360 }}
              transition={{ duration: 52, repeat: Infinity, ease: 'linear' }}
            />

            <div
              className="absolute inset-[5%] transition-transform duration-200 ease-out"
              style={{ transform: 'perspective(1100px) rotateY(calc(var(--mx) * 7deg)) rotateX(calc(var(--my) * -5deg)) translate3d(calc(var(--mx) * 7px),calc(var(--my) * 5px),0)' }}
            >
              <motion.div
                className="absolute inset-x-[30%] bottom-[7%] top-[6%]"
                animate={reduceMotion || !cinematic ? undefined : { y: [0, -8, 0], filter: ['brightness(1)', 'brightness(1.14)', 'brightness(1)'] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HumanLightform active={cinematic} />
              </motion.div>

              <motion.div
                className="absolute left-[7%] top-[14%] w-[32%] rounded-[24px] border border-white/[.095] bg-black/45 p-4 backdrop-blur-xl"
                animate={reduceMotion || !cinematic ? undefined : { x: [0, 5, 0], y: [0, -3, 0] }}
                transition={{ duration: 7, repeat: Infinity }}
              >
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/70">Selected prototype</div>
                <div className="mt-2 text-sm font-black text-white/90">{selected?.title}</div>
                <p className="mt-2 text-[11px] font-medium leading-relaxed text-white/45">{selected?.summary}</p>
              </motion.div>

              <motion.div
                className="absolute right-[5%] top-[20%] w-[28%] rounded-[22px] border border-violet-300/[.1] bg-black/40 p-3 backdrop-blur-xl"
                animate={reduceMotion || !cinematic ? undefined : { x: [0, -6, 0], y: [0, 4, 0] }}
                transition={{ duration: 8.4, repeat: Infinity }}
              >
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/60">Experience class</div>
                <div className="mt-1.5 text-xs font-black text-white/80">{selected ? KIND_LABELS[selected.kind] : '—'}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selected?.tags.map((tag) => <span key={tag} className="rounded-full bg-white/[.05] px-2 py-1 text-[8px] font-bold text-white/35">{tag}</span>)}
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-[13%] right-[9%] rounded-full border border-cyan-300/15 bg-cyan-300/[.055] px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/70 backdrop-blur-xl"
                animate={reduceMotion || !cinematic ? undefined : { scale: [1, 1.055, 1], opacity: [.7, 1, .7] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                prototype space · non-diagnostic
              </motion.div>
            </div>
          </div>
        </div>

        <aside className="min-w-0 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-2">
            {counts.map(({ kind: groupKind, count }) => (
              <button
                key={groupKind}
                type="button"
                onClick={() => setKind(kind === groupKind ? 'all' : groupKind)}
                className={`rounded-[18px] border px-3 py-3 text-left transition ${kind === groupKind ? 'border-cyan-300/25 bg-cyan-300/[.08]' : 'border-white/[.07] bg-white/[.028] hover:bg-white/[.05]'}`}
              >
                <div className="text-base text-cyan-100/80">{KIND_GLYPHS[groupKind]}</div>
                <div className="mt-1 text-[10px] font-black text-white/70">{KIND_LABELS[groupKind]}</div>
                <div className="mt-1 text-[9px] font-bold text-white/30">{count} concepts</div>
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Search experimental Body Exposure features</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search motion, surgery, cells, imaging…"
              className="min-h-[44px] w-full rounded-[16px] border border-white/[.09] bg-black/35 px-4 text-xs font-bold text-white/80 outline-none placeholder:text-white/25 focus:border-cyan-300/25 focus:ring-2 focus:ring-cyan-300/10"
            />
          </label>

          <div className="mt-3 flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[.14em] text-white/30">
            <span>{features.length} visible concepts</span>
            {(kind !== 'all' || query) && (
              <button type="button" onClick={() => { setKind('all'); setQuery('') }} className="text-cyan-200/70 hover:text-cyan-100">Reset</button>
            )}
          </div>

          <div className="mt-3 max-h-[520px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <AnimatePresence initial={false} mode="popLayout">
                {features.map((feature) => (
                  <motion.div key={feature.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .98 }}>
                    <FeatureCard
                      feature={feature}
                      active={selected?.id === feature.id}
                      onSelect={() => setSelectedId(feature.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </div>

      <footer className="relative z-[2] flex flex-col gap-2 border-t border-white/[.07] px-4 py-3 text-[9px] font-medium leading-relaxed text-white/32 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span>Experimental interaction concepts may use synthetic or stylized visuals until source-backed anatomy and validated physiology implementations are available.</span>
        <span className="shrink-0 font-black uppercase tracking-[.14em] text-white/38">Body Exposure R&D playground</span>
      </footer>
    </section>
  )
}
