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

      {/* ── FEATURED BRAND FILM (Black Video Glitch Safeguard) ──── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {/* Brand Intro Film Card with fallback gradient and poster */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#02180e] via-[#042817] to-[#02120b] shadow-2xl shadow-brand/20 dark:border-white/10">
              <video
                src={`${import.meta.env.BASE_URL}media/brand-intro.mp4`}
                autoPlay
                muted
                loop
                playsInline
                poster={BRAND_POSTER}
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Sekilas Platform</span>
                </div>
                <h3 className="mt-1 text-lg font-bold sm:text-xl">Panaceamed: AI-EMR &amp; Longevity OS</h3>
              </div>
            </div>
          </Reveal>

          {/* Higgsfield Nature Film */}
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#02180e] via-[#042817] to-[#02120b] shadow-2xl shadow-brand/20 dark:border-white/10">
              <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
                autoPlay
                muted
                loop
                playsInline
                poster={BRAND_POSTER}
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Alam. Kemanusiaan. <span className="font-serif-display italic text-emerald-300">Vitalitas.</span>
                </h2>
                <p className="mt-1 max-w-xl text-[13px] text-white/80">
                  Memperpanjang healthspan berbasis sains — menambah kualitas hidup pada setiap tahun usia Anda.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
