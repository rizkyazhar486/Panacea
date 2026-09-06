import { useEffect, useState, type ComponentType } from 'react'
import { Wordmark } from '../components/Logo'
import { BodyExposureWidget } from '../components/dashboard/BodyExposureWidget'
import { MedicalNews } from '../components/MedicalNews'
import { PricingSection } from '../components/PricingSection'
import { ClinicalDuel } from '../components/growth/ClinicalDuel'
import { api, backendEnabled, type Health } from '../lib/api'
import {
  IconActivity,
  IconBook,
  IconRun,
  IconSparkle,
  IconStethoscope,
} from '../components/icons'
import '../styles/panacea2026.css'

type Feature = {
  icon: ComponentType<{ size?: number }>
  title: string
  body: string
  eyebrow: string
}

const FEATURES: Feature[] = [
  { icon: IconActivity, eyebrow: 'See', title: 'A body you can explore, not a diagram you scroll past', body: 'Move from whole-body reference anatomy into organs, radiology, physiology, cell states and molecular pathways through one visual system.' },
  { icon: IconBook, eyebrow: 'Understand', title: 'Medicine that changes depth with the learner', body: 'Switch from everyday explanations to school, medical-school, professional, specialist or professor-level framing without changing the underlying topic.' },
  { icon: IconRun, eyebrow: 'Do', title: 'Training and recovery connected to your real logs', body: 'Runs, workouts, recovery and milestones become a practical daily layer—not a separate fitness app bolted onto medicine.' },
  { icon: IconStethoscope, eyebrow: 'Use clinically', title: 'Clinical tools stay distinct from education', body: 'Reference content, patient-derived observations and clinical inference are presented as separate trust layers so polished visuals do not masquerade as measured fact.' },
]

const PERSONAS = [
  ['Everyday life', 'Understand symptoms, habits, fitness and your own health data in language that does not assume a medical degree.'],
  ['Student', 'Turn diseases, drugs, anatomy, physiology, OSCE and questions into connected visual learning instead of disconnected memorization.'],
  ['Clinician', 'Reach calculators, references, imaging context, records and patient-facing explanations without digging through the student experience.'],
  ['Specialist & research', 'Go deeper into imaging, pathways, genomics, organ-specific anatomy and evidence while keeping provenance and uncertainty visible.'],
]

const TRUST = [
  ['Educational visualization', 'Reference anatomy, physiology, pathology and mechanism. It teaches; it is not automatically patient-specific.'],
  ['Patient-derived findings', 'Measured information such as imaging, labs, genomics or wearable data retains its source and timestamp.'],
  ['Clinical inference', 'Interpretation is visibly separated from raw observations and should carry evidence, validation and uncertainty.'],
]

const TIMELINE = [
  ['1', 'Life', 'Daily behavior, movement, sleep, nutrition, relationships and environment.'],
  ['2', 'Body', 'Signals, anatomy, organs, physiology and longitudinal change.'],
  ['3', 'Disease', 'Etiology, pathophysiology, pathology, imaging and clinical patterns.'],
  ['4', 'Mechanism', 'Cells, pathways, proteins, genes and drug mechanism-of-action.'],
  ['5', 'Action', 'Learning, prevention, training, care navigation and clinician-supported decisions.'],
]

function FeatureCard({ item }: { item: Feature }) {
  const Icon = item.icon
  return (
    <article className="panacea-feature-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.055] text-[#f0d68a]"><Icon size={19} /></span>
        <span className="text-[9px] font-black uppercase tracking-[.17em] text-white/35">{item.eyebrow}</span>
      </div>
      <h3 className="mt-5 text-lg font-black leading-tight tracking-[-.02em] text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/52">{item.body}</p>
    </article>
  )
}

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [promo, setPromo] = useState<Health['promo'] | null>(null)
  useEffect(() => {
    if (backendEnabled) api.health().then((health) => setPromo(health.promo ?? null)).catch(() => {})
  }, [])

  return (
    <main className="panacea-landing">
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
        <nav className="panacea-landing-nav mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2.5 sm:px-4">
          <Wordmark size={34} onDark />
          <div className="hidden items-center gap-5 text-[11px] font-bold text-white/55 md:flex">
            <a href="#duel" className="hover:text-white">Daily Duel</a>
            <a href="#system" className="hover:text-white">System</a>
            <a href="#mission" className="hover:text-white">Mission</a>
            <a href="#news" className="hover:text-white">Briefing</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <button onClick={onMasuk} className="liquid-orbit-button !min-h-[36px]">Enter Panacea</button>
        </nav>
      </header>

      {promo && promo.slotsLeft > 0 && (
        <button onClick={onMasuk} className="mx-auto mt-3 block rounded-full border border-[#d8bb70]/20 bg-[#d8bb70]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.13em] text-[#f0d68a]">
          Current launch offer: {promo.discountPct}% off for eligible early registrations · {promo.slotsLeft} slots shown by the service
        </button>
      )}

      <section className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
        <div className="relative z-10">
          <div className="panacea-kicker">Human health, from daily life to molecular mechanism</div>
          <h1 className="panacea-hero-title mt-6 text-white">Understand your body. <span className="panacea-gold-text">Act on what matters.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/58 sm:text-lg">PanaceaMed is built as one calm interface for health, medical learning, 4D anatomy, training and clinician-supported tools—without forcing every user to think like a doctor.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <button onClick={onMasuk} className="liquid-orbit-button !min-h-[44px] !px-5 !text-xs">Start your health space <span aria-hidden>→</span></button>
            <a href="#duel" className="liquid-orbit-button !min-h-[44px] !px-5 !text-xs">Try today's clinical duel</a>
            <a href="#system" className="liquid-orbit-button !min-h-[44px] !px-5 !text-xs">See how it works</a>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-2">
            {[['6 depths', 'Everyday → professor'], ['3 trust layers', 'Education · data · inference'], ['4D atlas', 'Structure + time/state']].map(([value, label]) => (
              <div key={value} className="rounded-2xl border border-white/[.08] bg-white/[.035] p-3 backdrop-blur-xl"><div className="text-sm font-black text-white">{value}</div><div className="mt-1 text-[9px] leading-snug text-white/38">{label}</div></div>
            ))}
          </div>
        </div>
        <BodyExposureWidget hero interactive showCta={false} className="min-h-[420px]" />
      </section>

      <section id="duel" className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <ClinicalDuel />
      </section>

      <section id="system" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <div className="panacea-kicker">One system, progressive disclosure</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">Power underneath. Simplicity on the surface.</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">The product does not become mature by showing more controls. It becomes mature when the right control appears at the right moment, while the deeper clinical and scientific layers remain available when needed.</p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">{FEATURES.map((item) => <FeatureCard key={item.title} item={item} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <div className="panacea-kicker">One knowledge graph</div>
            <h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-white">Whole person → organ → cell → molecule.</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/52">The interface should preserve context as you zoom. A heart is not a separate page from coronary anatomy, myocardium, ECG, pathology and drug targets—it is one connected learning and reasoning journey.</p>
          </div>
          <div className="space-y-2">
            {TIMELINE.map(([n, title, body]) => (
              <div key={n} className="panacea-feature-card flex gap-4 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d8bb70]/25 bg-[#d8bb70]/10 text-xs font-black text-[#f0d68a]">{n}</span><div><div className="text-sm font-black text-white">{title}</div><p className="mt-1 text-xs leading-relaxed text-white/48">{body}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-3 lg:grid-cols-3">
          {TRUST.map(([title, body], i) => (
            <article key={title} className="panacea-feature-card p-5"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#f0d68a]">Trust layer {i + 1}</div><h3 className="mt-3 text-lg font-black text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/52">{body}</p></article>
          ))}
        </div>
      </section>

      <section id="mission" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="rounded-[32px] border border-white/[.09] bg-gradient-to-br from-white/[.07] to-white/[.025] p-6 backdrop-blur-2xl sm:p-9">
          <div className="panacea-kicker">Vision & mission</div>
          <div className="mt-5 grid gap-7 lg:grid-cols-2">
            <div><h2 className="text-3xl font-black tracking-[-.035em] text-white">Make health understandable before it becomes overwhelming.</h2><p className="mt-4 text-sm leading-relaxed text-white/55">PanaceaMed’s product identity is a bridge: between everyday life and medicine, between medical education and clinical practice, and between a human-scale story and the molecular mechanisms underneath it.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">{PERSONAS.map(([title, body]) => <div key={title} className="rounded-2xl border border-white/[.07] bg-black/10 p-4"><div className="text-sm font-black text-white">{title}</div><p className="mt-2 text-xs leading-relaxed text-white/45">{body}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="panacea-kicker">Why the story matters</div>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-.035em] text-white sm:text-5xl">Healthcare evolved from observation to measurement to computation. PanaceaMed should make that evolution visible.</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            ['Observe', 'Anatomy, symptoms, examination and the human story.'],
            ['Measure', 'Laboratory data, imaging, physiology and longitudinal sensors.'],
            ['Connect', 'Pathology, molecular pathways, genomics and drug mechanisms.'],
            ['Explain', 'A visual interface that changes depth with the person using it.'],
          ].map(([title, body], i) => <div key={title} className="panacea-feature-card p-5"><div className="text-[10px] font-black text-[#f0d68a]">0{i + 1}</div><div className="mt-4 text-base font-black text-white">{title}</div><p className="mt-2 text-xs leading-relaxed text-white/48">{body}</p></div>)}
        </div>
      </section>

      <MedicalNews />

      <section id="pricing" className="border-t border-white/[.06]"><PricingSection onMasuk={onMasuk} promo={promo} /></section>

      <section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#d8bb70]/20 bg-[#d8bb70]/10 text-[#f0d68a]"><IconSparkle size={24} /></div>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">A health app should feel easier the more powerful it becomes.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50">Start simple. Go deeper only when you want to. Keep sources, uncertainty and human judgment visible.</p>
        <button onClick={onMasuk} className="liquid-orbit-button mt-7 !min-h-[46px] !px-6 !text-xs">Enter PanaceaMed <span aria-hidden>→</span></button>
      </section>

      <footer className="border-t border-white/[.06] px-5 py-8 text-center text-[10px] text-white/30">PanaceaMed · educational, wellness and clinical-support software. Reference visualizations are not automatically patient-specific findings.</footer>
    </main>
  )
}