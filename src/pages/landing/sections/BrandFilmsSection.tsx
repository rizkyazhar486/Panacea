import { Reveal } from '../../../components/Reveal'
import { BRAND_POSTER } from '../landingSvgs'
import { MARQUEE } from '../landingData'

export function BrandFilmsSection() {
  return (
    <>
      {/* Marquee strip */}
      <style>{`#panacea-track{animation:panaceaGo 45s linear infinite!important}@keyframes panaceaGo{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}`}</style>
      <div className="relative overflow-hidden border-y border-black/5 bg-white/40 py-5 backdrop-blur dark:border-white/5 dark:bg-black/40">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/80 to-transparent dark:from-black/80" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/80 to-transparent dark:from-black/80" />
        <div
          id="panacea-track"
          className="flex w-max"
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {[0, 1, 2].map((g) => (
            <div key={g} className="flex shrink-0 gap-10 pr-10" aria-hidden={g !== 0}>
              {MARQUEE.map((m, i) => (
                <span key={i} className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-300">
                  <m.icon size={18} className="text-brand-dark dark:text-emerald-400" /> {m.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED PLATFORM OVERVIEW & MULTISCALE TELEMETRY SHOWCASE ──── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {/* Local Brand Intro — user-controlled playback (no forced uncanny auto-loop) */}
          <Reveal>
            <div className="astro-surface relative overflow-hidden rounded-[2rem] text-white">
              <video
                src={`${import.meta.env.BASE_URL}media/brand-intro.mp4`}
                controls
                muted
                playsInline
                preload="metadata"
                poster={BRAND_POSTER}
                className="aspect-video w-full bg-[#040911] object-cover"
              />
              <div className="border-t border-cyan-400/20 p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="font-astro text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Platform Overview</span>
                </div>
                <h3 className="font-astro mt-1 text-lg font-bold text-white sm:text-xl">Panaceamed: AI-EMR &amp; Body Exposure OS</h3>
              </div>
            </div>
          </Reveal>

          {/* Realistic Multiscale Bio-Telemetry Schematic Card (replaces synthetic AI nature video) */}
          <Reveal delay={80}>
            <div className="astro-surface astro-horizon-grid relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] p-6 text-white">
              <div className="flex items-center justify-between gap-2">
                <span className="font-astro text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  MULTISCALE BIOPHYSICS ENGINE
                </span>
                <span className="font-astro-mono rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200">
                  7 LAYERS · 3D/4D
                </span>
              </div>

              <svg viewBox="0 0 420 150" className="my-4 w-full" role="img" aria-label="Multiscale longitudinal telemetry orbit">
                <defs>
                  <linearGradient id="panaceaNeonLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#c6ff34" />
                  </linearGradient>
                </defs>
                <ellipse cx="210" cy="76" rx="172" ry="44" fill="none" stroke="rgba(34,211,238,0.26)" strokeWidth="1" strokeDasharray="4 4" />
                <ellipse cx="210" cy="76" rx="116" ry="28" fill="none" stroke="rgba(16,185,129,0.34)" strokeWidth="1" />
                <path d="M24 88 L88 88 L104 88 L116 34 L128 112 L144 68 L168 88 L244 88 L256 34 L268 112 L284 68 L308 88 L396 88" fill="none" stroke="url(#panaceaNeonLine)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="116" cy="34" r="4" fill="#22d3ee" />
                <circle cx="256" cy="34" r="4" fill="#c6ff34" />
                <text x="24" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">BODY EXPOSURE · AI-EMR · IOT WEARABLES · CLINICIAN-IN-LOOP</text>
              </svg>

              <div>
                <h2 className="font-astro text-xl font-extrabold text-white sm:text-2xl">
                  Precision Anatomy. <span className="text-emerald-300">Longitudinal Care.</span>
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-300">
                  Satu rekaman kesehatan longitudinal dari sensor wearable, analisis komposisi tubuh, hingga verifikasi dokter berizin — tanpa data karangan.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
