import { useState, useEffect } from 'react'
import { api, backendEnabled, type Health } from '../lib/api'
import { Wordmark } from '../components/Logo'
import { Reveal, CountUp } from '../components/Reveal'
import { InteractiveAura } from '../components/InteractiveAura'
import {
  IconChat,
  IconStore,
  IconShield,
  IconHeart,
  IconStethoscope,
  IconSparkle,
  IconUsers,
  IconCheck,
  IconSun,
  IconMoon,
  IconHospital,
  IconPill,
  IconChartUp,
} from '../components/icons'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'
import { MedicalNews } from '../components/MedicalNews'
import { ScrollCinematic, ScrollCinematicStyles } from '../components/ScrollCinematic'
import { PricingSection } from '../components/PricingSection'

const FEATURES = [
  { icon: IconUsers, title: 'Healthy Living Dashboard', text: 'A Strava/TikTok-style social network: share activities, healthy habits & longevity articles. Photos, short videos, profiles, bookmarks.' },
  { icon: IconHeart, title: 'AI Longevity Calculator', text: 'Log your diet, exercise, hydration, sleep & sun exposure — AI calculates your longevity score (30-day subscription).' },
  { icon: IconChat, title: 'AI Chatbot → AI-EMR', text: 'AI interviews the patient (SOCRATES method); results flow automatically into the Subjective/Objective fields of the AI-EMR, accessible only to doctors.' },
  { icon: IconStethoscope, title: 'Consultations, Pharmacy & Facilities', text: 'AI consultation (Rp49,000) → referral to specialist doctors; pharmacy with prescription fulfillment; nearest healthcare facilities via GPS for emergencies.' },
  { icon: IconStore, title: 'Medical Knowledge Hub', text: 'Discover & share curated medical notes, journals, and articles. Pricing set by the authors; watermarked PDFs protect contributors.' },
  { icon: IconShield, title: 'Certified AI-EMR', text: 'For certified clinicians & institutions (STR/NPWP). Doctor-in-the-loop CDSS flags drug interactions, allergies & contraindications.' },
]

const ROLES = [
  ['Customer / Patient', 'Healthy living dashboard, disease education, nutrition & AI Longevity, consultations, pharmacy & nearest facilities.'],
  ['Doctor', 'Full AI-EMR (SOAP), per-patient clinical data, planning & consultations.'],
  ['Contributor', 'Write, sell & request verification for medical content.'],
  ['Verifier', 'Specialists/professors + AI verify content.'],
  ['Admin', 'Services, automated support & pharmacy catalog management.'],
  ['Owner', 'Switch access modes & monitor company profitability.'],
]

const WHATS_NEW = [
  '"Panacea Healthy Living" social dashboard — photos & 30-second videos, profiles, reposts, private bookmarks.',
  'AI-powered Longevity Calculator (30-day subscription, Rp49,000/month).',
  'Pharmacy with prescription fulfillment/scanning + unified Transaction History (filterable by type).',
  'Nearest healthcare facilities via GPS (hospitals, clinics & pharmacies) for emergencies.',
  'Medical Knowledge Hub — discover & share curated notes, journals, and articles with PanaceaToken.',
]

const STATS: { node: React.ReactNode; label: string }[] = [
  { node: <CountUp to={6} suffix=" Roles" />, label: 'Unified user ecosystem' },
  { node: <CountUp to={100} suffix="%" />, label: 'Doctor-verified (AI-in-the-loop)' },
  { node: <CountUp to={30} suffix=" Days" />, label: 'AI Longevity cycle' },
  { node: <span>24/7</span>, label: 'Access & Emergency SOS' },
]

const MARQUEE = [
  { icon: IconHospital, label: 'Nearest Facilities' },
  { icon: IconPill, label: 'Digital Pharmacy' },
  { icon: IconStethoscope, label: 'Doctor Consultations' },
  { icon: IconHeart, label: 'AI Longevity' },
  { icon: IconStore, label: 'Medical Content' },
  { icon: IconShield, label: 'Certified AI-EMR' },
  { icon: IconChartUp, label: 'Healthspan Tracking' },
]

// ── History of longevity, anti-aging, wellness & healthcare systems ──────────────
const HISTORY_ERAS: { era: string; when: string; emoji: string; title: string; body: string }[] = [
  { era: 'Ancient Egypt', when: '≈3000–300 BCE', emoji: '𓂀', title: 'Pharaohs & Medical Papyri',
    body: 'The Edwin Smith and Ebers papyri recorded prescriptions, surgery, and hygiene. Pharaohs pursued eternal life through mummification; Imhotep was revered as a physician. Cosmetics & oils (moringa, honey) became the earliest anti-aging remedies.' },
  { era: 'Age of the Prophets', when: '≈2000 BCE–632 CE', emoji: '☾', title: 'Prophetic Tradition & Hygiene',
    body: 'Prophetic teachings emphasized ablution/cleanliness, periodic fasting, honey & black seed, and moderate eating ("a third for food, a third for drink, a third for breath"). These principles of prevention and moderation align closely with modern longevity science.' },
  { era: 'Greco-Roman', when: '≈500 BCE–500 CE', emoji: '🏛️', title: 'Hippocrates & Galen',
    body: 'Hippocrates: "let food be thy medicine" and the Hippocratic Oath (medical ethics). Galen systematized physiology. The Romans built aqueducts, bathhouses, and public sanitation — the first public health system.' },
  { era: 'Chinese Dynasties', when: '≈200 BCE–1912 CE', emoji: '🐉', title: 'Qi, Herbs & Elixirs of Longevity',
    body: 'The Huangdi Neijing laid the foundations of TCM. Emperors sought an "elixir of immortality" (some, ironically, containing mercury). Qigong, acupuncture, ginseng, and yin-yang balance formed a holistic approach to healthspan.' },
  { era: 'Mongol Empire', when: '≈1206–1368 CE', emoji: '🏹', title: 'Cross-Cultural Medicine',
    body: 'The Pax Mongolica connected Persian, Chinese, and Arab physicians along the Silk Road — exchanging surgical, pharmaceutical, and quarantine knowledge. Mobile hospitals and soldier fitness standards were early forms of "performance medicine".' },
  { era: 'Islamic Golden Age', when: '≈800–1300 CE', emoji: '⚕️', title: 'Ibn Sina & Hospitals (Bimaristan)',
    body: "Ibn Sina's Al-Qanun (Canon of Medicine) remained the world's reference for 600 years. Al-Razi pioneered clinical record-keeping. The Bimaristan — hospitals with medical records, pharmacies, and specializations — was the forerunner of modern healthcare systems." },
]
const HISTORY_MODERN: { decade: string; title: string; body: string }[] = [
  { decade: '1900–1950', title: 'Antibiotics & Vaccines', body: 'Penicillin (Fleming, 1928), mass vaccination, and sanitation dramatically extended life expectancy. Focus: infectious disease.' },
  { decade: '1960–1980', title: 'Medical Records & Evidence-Based Medicine', body: 'The first electronic medical record (the Problem-Oriented Medical Record). Randomized trials became the gold standard. The birth of gerontology.' },
  { decade: '1990–2000', title: 'Genomics & Telomeres', body: 'The Human Genome Project. Discovery of telomerase (molecular anti-aging). The internet began transforming access to health information.' },
  { decade: '2000–2010', title: 'EHR & Interoperability Standards', body: 'Widespread adoption of Electronic Health Records. HL7 v2/v3 and the birth of FHIR (2011) — the data-exchange standard now underpinning digital health.' },
  { decade: '2010–2020', title: 'Wearables & Longevity Science', body: 'Apple Watch, WHOOP, CGMs. Research into senolytics, NAD+, rapamycin, fasting. Longevity moved from the fringe into mainstream science (Sinclair, Attia).' },
  { decade: '2020–present', title: 'AI in Medicine + FHIR', body: 'AI for diagnosis, patient interviews, and image interpretation; medical LLMs. FHIR unifies data so AI and patients speak the same language. Panaceamed.id was born here: AI + doctor verification + measurable longevity.' },
]
const STEM_CELLS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Somatic (Adult)', emoji: '🩹', short: 'Multipotent',
    body: 'Stem cells already present in the adult body — bone marrow, fat, umbilical cord blood. Multipotent (limited to a few cell types from their tissue of origin). The safest, and already routinely used clinically (e.g. bone marrow transplants for leukemia).',
    use: 'Blood cell therapy, orthopedics, wound healing' },
  { type: 'Embryonic', emoji: '🌱', short: 'Pluripotent',
    body: 'Derived from early embryonic blastocysts; pluripotent — able to become ALMOST any cell type in the body. Extremely powerful for research & regeneration, but raises ethical considerations and immune/tumor rejection risks.',
    use: 'Developmental research, disease modeling, organ regeneration' },
  { type: 'iPSC (Induced Pluripotent)', emoji: '🔄', short: 'Pluripotent (engineered)',
    body: "Adult cells (e.g. skin/blood) are \"reprogrammed\" back into a pluripotent state (Yamanaka, Nobel Prize 2012). Combines the power of embryonic cells WITHOUT the embryo ethics issue, and can be personalized (from the patient's own cells → minimal rejection).",
    use: 'Personalized medicine, drug testing, anti-aging & reprogramming research' },
]
const ROBOTICS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Robotic Surgery', emoji: '🤖', short: 'Micro-precision',
    body: 'Systems like da Vinci (since ~2000) let surgeons operate through tiny incisions using precision robotic arms, tremor filtering, and 3D vision. The result: smaller wounds, less pain, and faster recovery.',
    use: 'Urology, gynecology, cardiac & digestive surgery' },
  { type: 'Prosthetics & Exoskeletons', emoji: '🦾', short: 'Bionic',
    body: "Bionic hands and legs controlled by nerve/muscle signals (myoelectric), plus robotic exoskeletons that help stroke and spinal-injury patients walk again — restoring mobility and independence.",
    use: 'Rehabilitation, amputation, spinal nerve injury' },
  { type: 'Nanorobots & Microrobots', emoji: '🧫', short: 'Cellular scale',
    body: 'Micro/nano-scale robots (still in early research and trial stages) designed to deliver drugs directly to target cells — such as tumors — or clear blood vessels, minimizing side effects to healthy tissue. The frontier of precision medicine.',
    use: 'Targeted drug delivery, intra-body diagnostics' },
  { type: 'Rehabilitation & Care Robots', emoji: '💗', short: 'Companion',
    body: 'Repetitive-motion therapy robots for post-stroke recovery, elderly-companion robots (monitoring falls, reminding about medication), and telepresence for remote doctor visits — expanding access to care.',
    use: 'Physiotherapy, elderly care, telemedicine' },
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)
  useEffect(() => {
    if (backendEnabled) api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
  }, [])
  return (
    <div className="min-h-screen bg-white">
      {/* Early-bird promo — 75% off for the first registrants */}
      {promo && promo.slotsLeft > 0 && (
        <button onClick={onMasuk} className="block w-full bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] px-4 py-2.5 text-center text-sm font-bold text-white hover:brightness-110">
          🎉 {promo.discountPct}% off ALL services for the first {promo.limit} sign-ups — only {promo.slotsLeft} spots left! Sign up now →
        </button>
      )}
      {/* Glass header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="min-w-0 shrink"><Wordmark size={32} /></div>
        <a href="#pricing" className="hidden shrink-0 text-sm font-bold text-neutral-600 transition hover:text-brand-dark sm:inline">Pricing</a>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/5 text-neutral-600 transition hover:text-brand-dark"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="min-h-[44px] whitespace-nowrap rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-95 sm:px-6 sm:text-base"
          >
            Sign In<span className="hidden sm:inline"> / Sign Up</span>
          </button>
        </div>
      </header>

      {/* ── SCROLL-CINEMATIC OVERTURE ───────────────────────────
          Scroll-driven sequence (sunrise → vitalitas → sains → longevity)
          — the live implementation of the earlier Remotion concept video.
          Pinned via `sticky` over a 400vh track so each act gets its own
          scroll "chapter" instead of racing past in a few frames. */}
      <ScrollCinematicStyles />
      <ScrollCinematic />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-28">
        {/* Cinematic brand film (Higgsfield) behind the hero, softened by a
            white gradient so the original template text stays readable. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
            autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="hero-video-scrim absolute inset-0" />
          <InteractiveAura />
          <div className="orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
          <div className="orb absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" style={{ animationDelay: '-6s' }} />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <div className="liquid-glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Longevity Medical-AI · Ready to Use</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              The Practical AI Clinic for
              <br />
              <span className="font-serif-display bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] bg-clip-text italic text-transparent">
                Your Access to Healthcare
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-neutral-600 sm:text-lg">
              AI handles the intake & education; doctors verify. We extend <b>healthspan</b> — not just
              lifespan — through precise clinical reasoning, early prevention, and lifestyle optimization.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {/* Nested 'button-in-button' CTA with magnetic icon physics */}
              <button
                onClick={onMasuk}
                className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-2 pl-7 pr-2 font-bold text-white shadow-[0_10px_30px_-8px_rgba(0,191,99,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span className="relative z-10 text-base">Sign Up Free Now</span>
                <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <a
                href="#about"
                className="flex items-center rounded-full border border-black/10 bg-white/60 px-8 py-3.5 font-bold text-brand-dark shadow-sm backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white"
              >
                Learn More
              </a>
            </div>
          </Reveal>

          {/* Stat band — glassmorphism */}
          <Reveal delay={320}>
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={i}
                  className="liquid-glass rounded-2xl p-4"
                >
                  <div className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                    {s.node}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="mt-5 text-xs text-neutral-500">AI supports, but never replaces, licensed clinicians.</p>

          {/* Trust & Authority strip — the #1 pattern for health products */}
          <Reveal delay={360}>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {[
                { icon: IconStethoscope, label: 'Verified by licensed doctors' },
                { icon: IconShield, label: 'PDP Law compliant' },
                { icon: IconCheck, label: 'FHIR data standard' },
                { icon: IconHeart, label: 'Measurable longevity' },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600">
                  <t.icon size={16} className="text-brand-dark" /> {t.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

           {/* Marquee strip */}
      <style>{`#panacea-track{animation:panaceaGo 45s linear infinite!important}@keyframes panaceaGo{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}`}</style>
      <div className="relative overflow-hidden border-y border-black/5 bg-white/40 py-5 backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/80 to-transparent" />
        <div id="panacea-track" className="flex w-max" onMouseEnter={e=>e.currentTarget.style.animationPlayState='paused'} onMouseLeave={e=>e.currentTarget.style.animationPlayState='running'}>
          {[0,1,2].map(g=>(
            <div key={g} className="flex shrink-0 gap-10 pr-10" aria-hidden={g!==0}>
              {MARQUEE.map((m,i)=>(
                <span key={i} className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-500">
                  <m.icon size={18} className="text-brand-dark" /> {m.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED BRAND FILM ──────────────────────────────── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
          {/* Self-hosted Remotion logo animation (code-based, free) */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video src={`${import.meta.env.BASE_URL}media/brand-intro.mp4`} autoPlay muted loop playsInline className="aspect-video w-full bg-[#06120c] object-cover" />
            </div>
          </Reveal>
          {/* Cinematic nature film */}
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
                autoPlay muted loop playsInline
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Nature. Humanity. <span className="font-serif-display italic text-emerald-300">Vitality.</span>
                </h2>
                <p className="mt-1 max-w-xl text-[13px] text-white/80">Extending healthspan through science — adding life to your years.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT / FEATURES ─────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">About Us</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">What is <span className="font-serif-display italic text-brand-dark">Panaceamed.id</span>?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600">
            An <b>AI-EMR</b> platform and <b>medical knowledge hub</b> in one. AI conducts the patient intake &
            supporting analysis through a chatbot, which then flows into a medical record <b>verified and signed
            by a human doctor</b>. Our vision: <b>a practical AI clinic for the future of your healthcare.</b>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div role="button" tabIndex={0} onClick={onMasuk} onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
                className="liquid-glass group relative h-full cursor-pointer overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_18px_40px_rgba(0,191,99,0.16)]">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/20" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-dark shadow-inner">
                    <f.icon size={22} />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-neutral-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                  </span>
                </div>
                <h3 className="relative mt-4 font-bold text-ink">{f.title}</h3>
                <p className="relative mt-1 text-sm leading-relaxed text-neutral-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-[#e1eae3] px-6 py-20 sm:px-10">
        <div className="orb pointer-events-none absolute right-10 top-10 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark backdrop-blur">Business Model</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">One platform, <span className="font-serif-display italic text-brand-dark">many roles</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Subscriptions (individuals & hospitals) plus a token economy: buyers deposit <b>PanaceaToken</b>,
              authors earn royalties, and all content is verified by specialists & AI.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="liquid-glass flex h-full items-start gap-3 rounded-2xl p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(0,191,99,0.22)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark"><IconUsers size={18} /></span>
                  <div>
                    <h3 className="font-bold text-ink">{t}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARGA & LAYANAN (dark bento-grid pricing) ─────────────── */}
      <PricingSection onMasuk={onMasuk} promo={promo} />

      {/* ── WHAT'S NEW ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <IconSparkle size={13} /> What's New
          </span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Latest <span className="font-serif-display italic text-brand-dark">Updates</span></h2>
        </Reveal>
        <ul className="mt-8 space-y-3">
          {WHATS_NEW.map((w, i) => (
            <Reveal key={w} as="li" delay={i * 70}>
              <div className="liquid-glass flex items-start gap-3 rounded-2xl p-4 transition hover:translate-x-1 hover:border-brand/30">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white"><IconCheck size={16} /></span>
                <span className="text-sm text-neutral-700">{w}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── MEDICAL NEWS & INNOVATION (editorial, rotating) ─────── */}
      <MedicalNews />

      {/* ── LONGEVITY & HEALTHCARE HISTORY ──────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">A Legacy Thousands of Years Old</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">A History of <span className="font-serif-display italic text-brand-dark">Longevity</span> &amp; Health</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              From pharaohs, prophets, the Greco-Roman world, and Chinese dynasties, to the Mongol empire —
              the pursuit of a long, healthy life is as old as civilization itself. Panaceamed.id carries it forward with science &amp; AI.
            </p>
          </Reveal>

          {/* Self-hosted Remotion animated timeline (code-based, free) */}
          <Reveal delay={80}>
            <div className="mt-8 overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video src={`${import.meta.env.BASE_URL}media/history.mp4`} autoPlay muted loop playsInline className="aspect-video w-full bg-[#06120c] object-cover" />
            </div>
          </Reveal>

          {/* Ancient eras timeline */}
          <div className="mt-10 space-y-4">
            {HISTORY_ERAS.map((e, i) => (
              <Reveal key={e.era} delay={(i % 3) * 80}>
                <div className="liquid-glass flex gap-4 rounded-2xl p-5">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">{e.emoji}</span>
                    {i < HISTORY_ERAS.length - 1 && <span className="mt-2 w-px flex-1 bg-brand/20" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-base font-extrabold text-ink">{e.title}</h3>
                      <span className="text-[11px] font-bold text-brand-dark">{e.era}</span>
                      <span className="text-[10px] text-neutral-400">· {e.when}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{e.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Modern per-decade */}
          <Reveal className="mt-12 text-center">
            <h3 className="text-2xl font-extrabold">The Modern Era — <span className="font-serif-display italic text-brand-dark">Decade by Decade</span></h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">From antibiotics & medical records, to wearables, the FHIR data standard, and AI in medicine.</p>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HISTORY_MODERN.map((m, i) => (
              <Reveal key={m.decade} delay={(i % 3) * 80}>
                <div className="liquid-glass h-full rounded-2xl p-5">
                  <div className="text-xs font-black text-brand-dark">{m.decade}</div>
                  <div className="mt-1 font-bold text-ink">{m.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* FHIR explainer */}
          <Reveal delay={80}>
            <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-50 p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">What is FHIR?</div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                <b>FHIR</b> (Fast Healthcare Interoperability Resources) is the global standard that lets health data —
                medical records, labs, medications, vital signs — be read across hospitals, apps, &amp; AI in one shared "language".
                It's the foundation that makes AI-EMR &amp; measurable longevity at Panaceamed.id safe, portable, &amp; collaborative.
              </p>
            </div>
          </Reveal>

          {/* Stem cells — the frontier of regenerative longevity */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">The Regenerative Frontier</span>
            <h3 className="mt-3 text-2xl font-extrabold">Stem Cells (<span className="font-serif-display italic text-brand-dark">Stem Cell</span>)</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
              Anti-aging's biggest promise: replacing damaged cells &amp; rejuvenating tissue. Three main types, from the most established to the most cutting-edge.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {STEM_CELLS.map((s, i) => (
              <Reveal key={s.type} delay={(i % 3) * 80}>
                <div className="liquid-glass flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">{s.emoji}</span>
                    <div>
                      <div className="font-extrabold text-ink">{s.type}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-dark">{s.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Applications:</b> {s.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
              Potential vs. clinical maturity: <b>potential</b> is highest for embryonic &amp; iPSC (pluripotent) cells, while <b>clinical maturity</b> is highest for somatic cells.
              Partial reprogramming research (Yamanaka factors) is now exploring <i>reversing the cell's biological clock</i> — the frontier of longevity science.
              <br /><span className="opacity-70">For educational purposes only; stem cell therapy must be performed at licensed facilities &amp; in accordance with regulations.</span>
            </p>
          </Reveal>

          {/* Robotics in medicine */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Machine Precision</span>
            <h3 className="mt-3 text-2xl font-extrabold">Robotics in <span className="font-serif-display italic text-brand-dark">Medicine</span></h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
              From precision surgical arms to nanorobots in the bloodstream — machines extend the reach of doctors, making care safer, less invasive, &amp; more affordable.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ROBOTICS.map((r, i) => (
              <Reveal key={r.type} delay={(i % 2) * 80}>
                <div className="liquid-glass flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">{r.emoji}</span>
                    <div>
                      <div className="font-extrabold text-ink">{r.type}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-dark">{r.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{r.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Applications:</b> {r.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
              Robotics combined with <b>AI</b> (surgical navigation, real-time image analysis) &amp; <b>FHIR</b> (connected data) —
              a pairing that defines Panaceamed.id's direction: technology that strengthens, rather than replaces, clinicians.
              <br /><span className="opacity-70">Some technologies (nanorobots) are still in the research/clinical-trial stage.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT US & CONTACT ─────────────────────────────────────── */}
      <section className="px-6 py-12 sm:px-10">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-6 rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm lg:grid-cols-3">
            <div>
              <h2 className="text-2xl font-extrabold">About Us</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Panaceamed.id is Indonesia's health & longevity super-app: AI handles the intake & education,
                licensed doctors verify. Our mission is to make quality healthcare access, chronic disease
                monitoring, and leading-edge longevity science affordable for everyone — backed by responsible
                artificial intelligence and PDP Law compliance.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-50 p-5">
              <h3 className="font-bold">Contact Us</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-500">Email:</span> <a href="mailto:index.meds@gmail.com" className="font-semibold text-brand-dark hover:underline">index.meds@gmail.com</a></li>
                <li><span className="text-neutral-500">Instagram:</span> <a href="https://instagram.com/Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
                <li><span className="text-neutral-500">TikTok:</span> <a href="https://tiktok.com/@Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-5">
              <h3 className="font-bold">Founder Contact</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-500">Name:</span> <b>Rizky Muhammad Azrissal</b></li>
                <li><span className="text-neutral-500">Email:</span> <a href="mailto:Rizkyazhar486@gmail.com" className="font-semibold text-brand-dark hover:underline">Rizkyazhar486@gmail.com</a></li>
                <li><span className="text-neutral-500">Phone:</span> <a href="tel:+6282261143040" className="font-semibold text-brand-dark hover:underline">0822-6114-3040</a></li>
                <li><span className="text-neutral-500">Instagram:</span> <a href="https://instagram.com/Rizkyazr4" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Rizkyazr4</a></li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-6 pb-24 sm:px-10">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] px-8 py-16 text-center shadow-2xl shadow-brand/30">
            <div className="orb pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="orb pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-emerald-900/30 blur-3xl" style={{ animationDelay: '-8s' }} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Start your <span className="font-serif-display italic">healthspan</span> journey</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Free to try — choose your role and experience an AI co-physician verified by doctors.
              </p>
              <button
                onClick={onMasuk}
                className="group mt-7 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-8 pr-2 font-bold text-brand-dark shadow-[0_12px_30px_-8px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Sign In &amp; Try Now</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <Wordmark size={28} />
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Panaceamed.id · Longevity Medical-AI · AI supports, but never
            replaces, licensed clinicians.
          </p>
        </div>
      </footer>
    </div>
  )
}
