import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { ForYouSocialPulse } from '../components/ForYouSocialPulse'
import { ForYouDailyStack } from '../components/ForYouDailyStack'
import { useStore } from '../lib/store'
import {
  IconBook,
  IconChat,
  IconEMR,
  IconHeart,
  IconMoon,
  IconPlan,
  IconSettings,
  IconSparkle,
  IconStore,
  IconUser,
  IconUsers,
  IconWallet,
} from '../components/icons'

type Destination = {
  label: string
  to: string
  icon: typeof IconUsers
}

const LIFE: Destination[] = [
  { label: 'Social', to: '/?t=social', icon: IconUsers },
  { label: 'Community', to: '/?t=community', icon: IconHeart },
  { label: 'Clubs', to: '/?t=clubs', icon: IconSparkle },
  { label: 'Faith', to: '/?t=religion', icon: IconMoon },
  { label: 'Finance', to: '/?t=finance', icon: IconWallet },
  { label: 'Markets', to: '/?t=markets', icon: IconStore },
]

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
  const { account } = useStore()
  const name = account?.name?.trim().split(/\s+/)[0] || 'You'
  const [score, setScore] = useState<number | null>(null)
  const [budget, setBudget] = useState('')
  const [motivation, setMotivation] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [saved, setSaved] = useState(false)

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

      <ForYouSocialPulse />
      <ForYouDailyStack />

      <DestinationRail label="Life" items={LIFE} />
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
