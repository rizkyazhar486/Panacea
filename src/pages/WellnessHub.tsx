import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Wellness Hub — one flagship surface for the longevity / mental-health /
// aesthetic / futuristic suite. Ties together the pioneering wellness features
// (new and existing) so the "live longer, feel better, age well" journey is one
// place, searchable by intent. Pure catalog, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Feat { to: string; name: string; what: string; kw: string; tag: string }

const GROUPS: { title: string; emoji: string; feats: Feat[] }[] = [
  {
    title: 'Longevity & Anti-Aging',
    emoji: '🧬',
    feats: [
      { to: '/health-simulator', name: 'What-If Health Simulator', what: "See how today's choices reshape your 10-year risk", kw: 'simulator digital twin future risk what-if prevent timeline', tag: 'New' },
      { to: '/findrisc', name: 'Diabetes Risk (FINDRISC)', what: 'Your 10-year diabetes risk — and how to lower it', kw: 'diabetes findrisc prediabetes prevention metabolic glucose', tag: 'New' },
      { to: '/biological-age', name: 'Biological Age', what: 'How old your body is really functioning, from your data', kw: 'phenoage biomarker aging longevity', tag: 'Antiaging' },
      { to: '/longevity', name: 'Longevity Blueprint', what: 'Your personalized healthspan levers and risk drivers', kw: 'lifespan healthspan risk', tag: 'Longevity' },
      { to: '/organ-vitality', name: 'Organ Vitality', what: 'System-by-system health snapshot', kw: 'organ heart liver kidney vitality', tag: 'Longevity' },
      { to: '/supplements', name: 'Supplement Guide', what: 'Evidence-graded longevity supplements', kw: 'supplement vitamin omega creatine stack', tag: 'Antiaging' },
    ],
  },
  {
    title: 'Mind & Mental Wellness',
    emoji: '🧠',
    feats: [
      { to: '/breathwork', name: 'Breathwork Pacer', what: 'Animated paced breathing to calm you in minutes', kw: 'breathing box 478 coherence anxiety stress calm vagus', tag: 'New' },
      { to: '/gratitude', name: 'Gratitude Journal', what: '"Three Good Things" — a proven mood lift', kw: 'gratitude journal happiness positive psychology mood', tag: 'New' },
      { to: '/mental-health-screen', name: 'Mental Health Check', what: 'Validated depression & anxiety screening', kw: 'phq gad depression anxiety screen mental', tag: 'Mental' },
      { to: '/ikigai', name: 'Ikigai & Purpose', what: 'Find your reason for being', kw: 'ikigai purpose meaning japanese', tag: 'Wellness' },
      { to: '/life-compass', name: 'Life Compass', what: 'Plan your vision, mission, and next step', kw: 'vision mission purpose goals future anxiety worry planning', tag: 'New' },
      { to: '/resilience-stories', name: 'Resilience Stories', what: 'Real people, real hardship, real comebacks', kw: 'motivation inspiration resilience hardship comeback stories', tag: 'New' },
    ],
  },
  {
    title: 'Sleep & Circadian',
    emoji: '🌙',
    feats: [
      { to: '/sleep-debt', name: 'Sleep Debt', what: 'Track the rolling gap between sleep need and sleep got', kw: 'sleep debt insomnia tired rest hours', tag: 'New' },
      { to: '/chronotype', name: 'Chronotype', what: 'Are you a morning lark or night owl?', kw: 'chronotype morning owl circadian rmeq', tag: 'Circadian' },
      { to: '/epworth-sleepiness', name: 'Epworth Sleepiness', what: 'How sleepy are you during the day?', kw: 'epworth sleepiness daytime somnolence', tag: 'Sleep' },
      { to: '/sleep-apnea-screen', name: 'Sleep Apnea (STOP-BANG)', what: 'Screen your risk of obstructive sleep apnea', kw: 'apnea snoring stopbang osa', tag: 'Sleep' },
    ],
  },
  {
    title: 'Metabolic & Body',
    emoji: '⚡',
    feats: [
      { to: '/fasting', name: 'Metabolic Fasting', what: 'Time-restricted eating window & metabolic phases', kw: 'fasting intermittent eating window metabolic autophagy', tag: 'Metabolic' },
      { to: '/thermal-therapy', name: 'Thermal Therapy', what: 'Sauna & cold-exposure protocols with the evidence', kw: 'sauna cold plunge heat ice thermal recovery', tag: 'New' },
      { to: '/nutrition', name: 'Nutrition & BMR', what: 'Calories, macros, and metabolic rate', kw: 'nutrition calorie macro bmr tdee diet', tag: 'Wellness' },
      { to: '/hydration', name: 'Hydration', what: 'Your daily water target', kw: 'water hydration drink fluid', tag: 'Wellness' },
    ],
  },
  {
    title: 'Aesthetic & Skin',
    emoji: '✨',
    feats: [
      { to: '/aesthetic', name: 'Aesthetic Studio', what: 'Skin, face, and aesthetic guidance', kw: 'aesthetic skin face beauty antiaging glow', tag: 'Aesthetic' },
      { to: '/sun-exposure', name: 'Sun & Vitamin D', what: 'Safe sun for vitamin D without skin damage', kw: 'sun uv vitamin d sunscreen skin', tag: 'Aesthetic' },
    ],
  },
]

const TAG_STYLE: Record<string, string> = {
  New: 'bg-brand text-white',
  Antiaging: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  Longevity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Mental: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Wellness: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
  Circadian: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  Sleep: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  Metabolic: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Aesthetic: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
}

export function WellnessHub() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return GROUPS
    return GROUPS.map((g) => ({ ...g, feats: g.feats.filter((f) => (f.name + ' ' + f.what + ' ' + f.kw).toLowerCase().includes(q)) })).filter((g) => g.feats.length > 0)
  }, [q])

  const total = GROUPS.reduce((s, g) => s + g.feats.length, 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Wellness Hub" subtitle="Live longer, feel better, age well — your whole journey in one place" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Longevity, mental wellness, sleep, metabolism, and aesthetics — {total} tools, each grounded
          in evidence and yours to build a daily practice around.
        </p>
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search: stress, sleep, aging, skin, fasting…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {filtered.length === 0 && (
        <Card className="!p-5 text-center text-sm text-neutral-400">Nothing matches "{query}" — try "sleep", "stress", "aging", or "skin".</Card>
      )}

      {filtered.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{g.emoji} {g.title}</div>
          <div className="mt-3 space-y-1.5">
            {g.feats.map((f) => (
              <a key={f.to} href={`#${f.to}`} className="group flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 transition hover:bg-brand/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink group-hover:text-brand-dark dark:text-white">{f.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TAG_STYLE[f.tag] ?? TAG_STYLE.Wellness}`}>{f.tag}</span>
                  </div>
                  <div className="text-[12px] leading-snug text-neutral-500">{f.what}</div>
                </div>
                <span className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-dark">→</span>
              </a>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Every tool cites its evidence on-page. Wellbeing support — not a replacement for medical care.
      </div>
    </div>
  )
}

export default WellnessHub
