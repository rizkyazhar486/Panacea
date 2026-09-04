import { motion } from 'framer-motion'
import './DesignDemo.css'
import { FadingVideo } from '../components/design-demo/FadingVideo'
import { BlurText } from '../components/design-demo/BlurText'
import {
  ArrowUpRightIcon, PlayIcon, ClockIcon, GlobeIcon,
  ImageGlyphIcon, MovieGlyphIcon, LightbulbGlyphIcon,
} from '../components/design-demo/icons'

// Halaman demo terisolasi — bukan bagian dari alur produk Panaceamed.
// Tidak ditautkan dari navigasi mana pun; hanya dapat diakses lewat URL
// langsung (#/design-demo). Salinan kata di sini sengaja meniru agensi
// desain contoh (statistik & nama merek fiktif) karena itulah spesifikasi
// yang diminta untuk halaman demo ini — bukan konten produk sungguhan.
const NAV_LINKS = ['Work', 'Studio', 'Services', 'Journal', 'Contact']
const TRUST_LOGOS = ['Aeon', 'Vela', 'Apex', 'Orbit', 'Zeno']

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4'
const CAPABILITIES_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4'

const fadeUp = {
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
}

const CAPABILITIES = [
  {
    icon: ImageGlyphIcon,
    tags: ['Brand Systems', 'Art Direction', 'Visual Identity', 'Motion'],
    title: 'Design',
    body: 'We shape identities and interfaces that feel unmistakably yours — typographic systems, component libraries, and art-directed pages that scale without losing soul.',
  },
  {
    icon: MovieGlyphIcon,
    tags: ['React', 'Next.js', 'Headless CMS', 'Edge-Ready'],
    title: 'Engineering',
    body: 'Production-grade front-ends built on modern stacks. Performant, accessible, and instrumented — with code your team will enjoy extending long after launch.',
  },
  {
    icon: LightbulbGlyphIcon,
    tags: ['SEO', 'Analytics', 'A/B Testing', 'Retention'],
    title: 'Growth',
    body: 'Launch is the starting line. We partner with your team on conversion, content, and iteration loops that turn a beautiful site into a compounding asset.',
  },
]

export function DesignDemo() {
  return (
    // fixed inset-0 z-50: halaman ini dirender di dalam <Shell> pemilik rute
    // lain, jadi ia perlu menutupi total nav/sidebar Shell (z-10) alih-alih
    // dipasangi bersamaan dengannya.
    <div className="dd-root fixed inset-0 z-50 overflow-y-auto">
      {/* ══════════ Section 1: Hero ══════════ */}
      <section className="relative h-screen overflow-hidden bg-black">
        <FadingVideo
          src={HERO_VIDEO}
          className="absolute left-1/2 top-0 z-0 -translate-x-1/2 object-cover object-top"
          style={{ width: '120%', height: '120%' }}
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* Navbar */}
          <div className="fixed left-0 right-0 top-4 z-50 flex items-center justify-between px-8 lg:px-16">
            <div className="dd-liquid-glass grid h-12 w-12 place-items-center rounded-full">
              <span className="dd-heading text-2xl">a</span>
            </div>
            <div className="dd-liquid-glass hidden items-center rounded-full px-1.5 py-1.5 md:flex">
              {NAV_LINKS.map((l) => (
                <span key={l} className="dd-body px-3 py-2 text-sm font-medium text-white/90">{l}</span>
              ))}
              <button className="dd-body flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                Start a Project <ArrowUpRightIcon size={14} />
              </button>
            </div>
            <div className="h-12 w-12" />
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
            <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }} className="dd-liquid-glass flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">New</span>
              <span className="dd-body text-xs text-white/90">Booking Q3 2026 engagements — limited capacity</span>
            </motion.div>

            <div className="mt-6 max-w-3xl">
              <BlurText
                text="Crafted Digital Experiences Built to Outlast Trends"
                className="dd-heading text-6xl leading-[0.8] tracking-[-4px] text-white md:text-7xl lg:text-[5.5rem]"
              />
            </div>

            <motion.p {...fadeUp} transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }} className="dd-body mt-4 max-w-2xl text-sm font-light leading-tight text-white md:text-base">
              We are a small studio of designers and engineers shaping brand-defining websites for ambitious companies. Precise typography, cinematic motion, and code you can be proud of.
            </motion.p>

            <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }} className="mt-6 flex items-center gap-6">
              <button className="dd-liquid-glass-strong dd-body flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white">
                Start a Project <ArrowUpRightIcon size={16} />
              </button>
              <button className="dd-body flex items-center gap-2 text-sm font-medium text-white">
                <PlayIcon size={16} /> Watch Showreel
              </button>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }} className="mt-8 flex gap-4">
              <div className="dd-liquid-glass w-[220px] rounded-[1.25rem] p-5 text-left">
                <ClockIcon size={20} className="text-white/80" />
                <div className="dd-heading mt-4 text-4xl leading-none tracking-[-1px]">6 Weeks</div>
                <div className="dd-body mt-2 text-xs text-white/70">Average End-to-End Launch Time</div>
              </div>
              <div className="dd-liquid-glass w-[220px] rounded-[1.25rem] p-5 text-left">
                <GlobeIcon size={20} className="text-white/80" />
                <div className="dd-heading mt-4 text-4xl leading-none tracking-[-1px]">140+</div>
                <div className="dd-body mt-2 text-xs text-white/70">Brands Shipped Across Four Continents</div>
              </div>
            </motion.div>
          </div>

          {/* Bottom trust bar */}
          <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }} className="flex flex-col items-center gap-4 pb-8">
            <div className="dd-liquid-glass dd-body rounded-full px-4 py-1.5 text-xs text-white/80">
              Trusted by founders, operators, and creative directors worldwide
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-2 md:gap-x-16">
              {TRUST_LOGOS.map((name) => (
                <span key={name} className="dd-heading text-2xl tracking-tight text-white/90 md:text-3xl">{name}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ Section 2: Capabilities ══════════ */}
      <section className="relative min-h-screen overflow-hidden bg-black">
        <FadingVideo src={CAPABILITIES_VIDEO} className="absolute inset-0 z-0 h-full w-full object-cover" />

        <div className="relative z-10 flex min-h-screen flex-col px-8 pb-10 pt-24 md:px-16 lg:px-20">
          <div className="mb-auto">
            <div className="dd-body mb-6 text-sm text-white/80">// Capabilities</div>
            <h2 className="dd-heading text-6xl leading-[0.9] tracking-[-3px] md:text-7xl lg:text-[6rem]">
              Studio craft,<br />end to end
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, tags, title, body }) => (
              <div key={title} className="dd-liquid-glass flex min-h-[360px] flex-col rounded-[1.25rem] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="dd-liquid-glass grid h-11 w-11 shrink-0 place-items-center rounded-[0.75rem]">
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="dd-liquid-glass dd-body whitespace-nowrap rounded-full px-3 py-1 text-[11px] text-white/90">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                <div>
                  <h3 className="dd-heading text-3xl leading-none tracking-[-1px] md:text-4xl">{title}</h3>
                  <p className="dd-body mt-3 max-w-[32ch] text-sm font-light leading-snug text-white/90">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
