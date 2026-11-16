import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SuperPageCapabilityRail } from '../../components/SuperPageCapabilityRail'
import { ForYouOmniFeed } from '../../components/ForYouOmniFeed'
import { useOptionalStore } from '../../lib/store'
import { useOptionalLongitudinalState } from '../../lib/useLongitudinalState'
import { getVitals } from '../../lib/healthVitals'
import {
  IconBook,
  IconChat,
  IconEMR,
  IconPlan,
  IconSettings,
  IconUser,
  IconUsers,
} from '../../components/icons'

type Destination = {
  label: string
  to: string
  icon: typeof IconUsers
}

const INTELLIGENCE: Destination[] = [
  { label: 'Ask Panacea', to: '/chatbot', icon: IconChat },
  { label: 'AI-EMR', to: '/emr', icon: IconEMR },
  { label: 'Care', to: '/care-episode', icon: IconPlan },
  { label: 'Materials', to: '/my-materials', icon: IconBook },
]

const MOTIVATION = [
  'Small systems beat heroic bursts.',
  'Make the next healthy action obvious.',
  'Consistency compounds quietly.',
  'Protect attention; spend it on what matters.',
]

function DestinationRail({ label, items }: { label: string; items: Destination[] }) {
  return (
    <section aria-label={label} className="border-t border-white/10 pt-4">
      <div className="mb-1 text-[9px] font-black uppercase tracking-[.14em] text-white/34">{label}</div>
      <nav className="flex gap-6 overflow-x-auto no-scrollbar">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-[52px] shrink-0 items-center gap-2 text-xs font-black text-white/58 transition hover:text-white"
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <span aria-hidden>↗</span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}

export function ForYouHub() {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const account = store?.account ?? null
  const vitals = useMemo(() => getVitals(account), [account, longitudinal])
  const name = account?.name?.trim().split(/\s+/)[0] || 'You'
  const [score, setScore] = useState<number | null>(null)
  const [budget, setBudget] = useState('')
  const [motivation, setMotivation] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [saved, setSaved] = useState(false)

  const triage = useMemo(() => {
    const pos = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)
    const rhr = pos(vitals.restingHr)
    const sbp = pos(vitals.systolic)
    const spo2 = pos(vitals.spo2Pct)
    const sleep = pos(vitals.sleepH)
    if (rhr == null && sbp == null && spo2 == null && sleep == null) {
      return {
        tier: 'NEUTRAL',
        badge: 'AWAITING FIRST READING',
        tone: '#94a3b8',
        title: 'Start with one simple check-in or wearable sync',
        action: 'Open My Health Data to pair Bluetooth sensors or log sleep/blood pressure. Missing values stay empty.',
        to: '/fitness-hub?view=health-data',
        cta: 'Sync Health Data',
      }
    }
    if ((spo2 != null && spo2 < 94) || (sbp != null && sbp >= 160) || (rhr != null && rhr >= 120)) {
      return {
        tier: 'RED',
        badge: 'PROMPT CHECK RECOMMENDED',
        tone: '#fb7185',
        title: 'A recorded reading sits outside comfortable resting bounds',
        action: 'Sit quietly for 5 minutes and repeat measurement; if symptoms (chest pain, shortness of breath, dizziness) occur, seek urgent clinical evaluation.',
        to: '/emergency',
        cta: 'Emergency Triage',
      }
    }
    if ((sbp != null && sbp >= 135) || (sleep != null && sleep < 6) || (rhr != null && rhr >= 95)) {
      return {
        tier: 'AMBER',
        badge: 'GENTLE ATTENTION',
        tone: '#fbbf24',
        title: 'Recovery or cardiovascular load deserves an easy day',
        action: 'Prioritize hydration, 10 minutes slow breathing, and an earlier bedtime tonight; discuss persistent elevated readings with a doctor.',
        to: '/fitness-hub?view=recovery',
        cta: 'Open Recovery',
      }
    }
    return {
      tier: 'GREEN',
      badge: 'WITHIN REFERENCE BOUNDS',
      tone: '#34d399',
      title: 'Today’s recorded signals look steady',
      action: 'Keep up brisk walking / Zone-2 movement, regular sleep timing, and balanced meals. Draft preventive summary (clinicallyReviewed: false).',
      to: '/fitness-hub?view=body',
      cta: 'Review Your Body',
    }
  }, [vitals])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const rawScore = window.localStorage.getItem('pm_for_you_score')
    const stored = rawScore == null ? Number.NaN : Number(rawScore)
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) setScore(stored)
    setBudget(window.localStorage.getItem('pm_for_you_budget_note') ?? '')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || score == null) return
    window.localStorage.setItem('pm_for_you_score', String(score))
  }, [score])

  const saveBudget = () => {
    if (typeof window !== 'undefined' && budget.trim()) {
      window.localStorage.setItem('pm_for_you_budget_note', budget.trim())
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1200)
  }

  const handoffPrompt = () => {
    if (typeof window !== 'undefined' && prompt.trim()) {
      window.sessionStorage.setItem('pm_chat_draft', prompt.trim())
    }
  }

  return (
    <main className="space-y-8 pb-28 text-white" aria-label="For You super page">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/34">For You</div>
          <h1 className="truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">{name}</h1>
        </div>
        <Link to="/profile" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 transition hover:text-white" aria-label="Open account">
          <IconUser size={19} />
        </Link>
      </header>

      <nav className="grid grid-cols-3 border-b border-white/10" aria-label="Personal controls">
        <Link to="/messages" className="grid min-h-[52px] place-items-center border-r border-white/10 text-[11px] font-black text-white/64 hover:text-white">Messages</Link>
        <Link to="/notifikasi" className="grid min-h-[52px] place-items-center border-r border-white/10 text-[11px] font-black text-white/64 hover:text-white">Alerts</Link>
        <Link to="/settings" className="flex min-h-[52px] items-center justify-center gap-1.5 text-[11px] font-black text-white/64 hover:text-white"><IconSettings size={14} />Settings</Link>
      </nav>

      <section aria-label="Ask Panacea" className="border-b border-white/10 pb-8">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
          <label className="flex min-h-[52px] items-center gap-3 border-b border-white/20 px-1 focus-within:border-white/70">
            <IconChat size={16} />
            <span className="sr-only">Ask Panacea</span>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Panacea"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
            />
          </label>
          <Link to="/chatbot" onClick={handoffPrompt} className="grid min-h-[52px] place-items-center rounded-full bg-white px-4 text-xs font-black text-black transition active:scale-[.98]">
            Ask →
          </Link>
        </div>
      </section>

      <section aria-label="Personalized preventive triage" className="border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: triage.tone }}>{triage.badge} · PUBLIC READINESS &amp; 24H COMPANION (UNREVIEWED DRAFT)</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={triage.to} className="inline-flex min-h-[44px] items-center text-xs font-black text-emerald-300 hover:text-white">{triage.cta} →</Link>
            <Link to="/emergency" className="inline-flex min-h-[44px] items-center text-xs font-black text-rose-300 hover:text-white">Darurat 118/119 →</Link>
          </div>
        </div>
        <h2 className="mt-1 text-base font-black text-white">{triage.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/65">{triage.action}</p>
      </section>

      <ForYouOmniFeed />

      <DestinationRail label="Intelligence" items={INTELLIGENCE} />

      <section aria-label="Personal tools" className="border-t border-white/10">
        <details className="group border-b border-white/10">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-xs font-black">
            <span>Daily check-in</span>
            <span className="text-2xl tabular-nums">{score == null ? '—' : score}</span>
          </summary>
          <div className="pb-5">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-[.12em] text-white/32">Self-rated · 0–100</div>
            <input type="range" min="0" max="100" value={score ?? 50} onChange={(event) => setScore(Number(event.target.value))} className="w-full accent-emerald-300" aria-label="Self-rated daily check-in" />
          </div>
        </details>

        <details className="group border-b border-white/10">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-xs font-black">
            <span>Budget note</span>
            <span className="text-white/35" aria-hidden>＋</span>
          </summary>
          <div className="grid gap-3 pb-5 sm:grid-cols-[minmax(0,1fr)_96px]">
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Budget note"
              className="min-h-[44px] border-b border-white/15 bg-transparent text-sm font-semibold outline-none placeholder:text-white/28"
            />
            <button type="button" onClick={saveBudget} className="min-h-[44px] rounded-full border border-white/12 text-[10px] font-black text-white/70">
              {saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </details>

        <details className="group border-b border-white/10">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-xs font-black">
            <span>Motivation</span>
            <span className="text-white/35" aria-hidden>＋</span>
          </summary>
          <div className="flex items-center justify-between gap-4 pb-5">
            <span className="truncate text-sm font-bold text-white/72">{MOTIVATION[motivation]}</span>
            <button type="button" onClick={() => setMotivation((value) => (value + 1) % MOTIVATION.length)} className="min-h-[44px] shrink-0 px-2 text-xs font-black text-white/55 hover:text-white">Next →</button>
          </div>
        </details>

        <Link to="/prayer-times" className="flex min-h-[56px] items-center justify-between border-b border-white/10 text-xs font-black text-white/60 hover:text-white">
          <span>Prayer times</span><span aria-hidden>→</span>
        </Link>
      </section>

      <SuperPageCapabilityRail domain="for-you" initialLimit={24} />
    </main>
  )
}

export default ForYouHub
