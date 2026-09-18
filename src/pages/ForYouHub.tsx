import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { PanaceaMusicPlayer } from '../components/PanaceaMusicPlayer'
import { SuperPageActivityFeed } from '../components/SuperPageActivityFeed'
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

type Tile = {
  label: string
  to: string
  icon: typeof IconUsers
  tone: string
  meta: string
}

const PERSONAL_TILES: Tile[] = [
  { label: 'Social', to: '/?t=social', icon: IconUsers, tone: 'from-rose-400/22 via-fuchsia-400/[.08] to-transparent', meta: 'Feed' },
  { label: 'Community', to: '/?t=community', icon: IconHeart, tone: 'from-cyan-400/22 via-blue-400/[.08] to-transparent', meta: 'People' },
  { label: 'Clubs', to: '/?t=clubs', icon: IconSparkle, tone: 'from-violet-400/22 via-indigo-400/[.08] to-transparent', meta: 'Groups' },
  { label: 'Faith', to: '/?t=religion', icon: IconMoon, tone: 'from-emerald-400/22 via-teal-400/[.08] to-transparent', meta: 'Practice' },
  { label: 'Finance', to: '/?t=finance', icon: IconWallet, tone: 'from-amber-300/22 via-orange-400/[.08] to-transparent', meta: 'Money' },
  { label: 'Markets', to: '/?t=markets', icon: IconStore, tone: 'from-sky-400/22 via-cyan-400/[.08] to-transparent', meta: 'Track' },
]

const INTELLIGENCE_TILES: Tile[] = [
  { label: 'Ask Panacea', to: '/chatbot', icon: IconChat, tone: 'from-cyan-300/24 via-blue-500/[.09] to-transparent', meta: 'AI' },
  { label: 'AI-EMR', to: '/emr', icon: IconEMR, tone: 'from-violet-300/24 via-fuchsia-500/[.08] to-transparent', meta: 'Record' },
  { label: 'Care', to: '/care-episode', icon: IconPlan, tone: 'from-emerald-300/24 via-teal-500/[.08] to-transparent', meta: 'Episode' },
  { label: 'Materials', to: '/my-materials', icon: IconBook, tone: 'from-amber-300/24 via-orange-500/[.08] to-transparent', meta: 'Library' },
]

const MOTIVATION = [
  'Small systems beat heroic bursts.',
  'Make the next healthy action obvious.',
  'Consistency compounds quietly.',
  'Protect attention; spend it on what matters.',
]

function TileCard({ tile }: { tile: Tile }) {
  const Icon = tile.icon
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: .18 }}>
      <Link to={tile.to} className={`liquid-action liquid-glass liquid-spectral-edge pmd-liquid-metal group relative block min-h-[116px] overflow-hidden rounded-[24px] bg-gradient-to-br ${tile.tone} p-4`} aria-label={`${tile.label} — ${tile.meta}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="liquid-lens grid h-11 w-11 place-items-center rounded-[16px] text-white" aria-hidden><Icon size={20} /></span>
          <span className="text-sm text-white/32 transition group-hover:translate-x-0.5 group-hover:text-white/70" aria-hidden>↗</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-2">
          <span className="truncate text-[15px] font-black tracking-[-.02em] text-white">{tile.label}</span>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-[.16em] text-white/38">{tile.meta}</span>
        </div>
      </Link>
    </motion.div>
  )
}

export function ForYouHub() {
  const { account } = useStore()
  const name = account?.name?.trim().split(/\s+/)[0] || 'You'
  const [score, setScore] = useState(72)
  const [budget, setBudget] = useState('')
  const [motivation, setMotivation] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = Number(window.localStorage.getItem('pm_for_you_score'))
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) setScore(stored)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('pm_for_you_score', String(score))
  }, [score])

  const saveBudget = () => {
    if (typeof window !== 'undefined' && budget.trim()) window.localStorage.setItem('pm_for_you_budget_note', budget.trim())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1200)
  }

  const handoffPrompt = () => {
    if (typeof window !== 'undefined' && prompt.trim()) window.sessionStorage.setItem('pm_chat_draft', prompt.trim())
  }

  return (
    <main className="space-y-7 pb-28 text-white" aria-label="For You super page">
      <section className="liquid-glass-strong liquid-spectral-edge overflow-hidden rounded-[30px] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-[9px] font-black uppercase tracking-[.18em] text-cyan-100/45">Super page 03 · For You</div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">{name}'s space</h1>
          </div>
          <Link to="/profile" className="liquid-lens grid h-14 w-14 shrink-0 place-items-center rounded-full" aria-label="Open account"><IconUser size={22} /></Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Link to="/messages" className="liquid-action rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-center text-[11px] font-black text-white/75">Messages</Link>
          <Link to="/notifikasi" className="liquid-action rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-center text-[11px] font-black text-white/75">Alerts</Link>
          <Link to="/settings" className="liquid-action flex items-center justify-center gap-1.5 rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-[11px] font-black text-white/75"><IconSettings size={14} />Settings</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="For You live widgets">
        <motion.div layout className="rounded-[24px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between"><span className="truncate text-[10px] font-black uppercase tracking-[.14em] text-white/40">Daily score</span><strong className="text-3xl tabular-nums">{score}</strong></div>
          <input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} className="mt-5 w-full accent-cyan-300" aria-label="Daily score" />
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div animate={{ width: `${score}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300" /></div>
        </motion.div>

        <div className="rounded-[24px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between"><span className="truncate text-[10px] font-black uppercase tracking-[.14em] text-white/40">Faith</span><Link to="/prayer-times" className="text-sm text-emerald-200/70" aria-label="Open prayer times">↗</Link></div>
          <div className="mt-5 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-300/15 bg-emerald-300/[.06]"><IconMoon size={20} /></span><div className="min-w-0"><strong className="block truncate text-sm">Prayer + reflection</strong><Link to="/?t=religion" className="mt-1 block truncate text-[10px] font-black text-white/38">Open faith space</Link></div></div>
        </div>

        <div className="rounded-[24px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between"><span className="truncate text-[10px] font-black uppercase tracking-[.14em] text-white/40">Finance</span><Link to="/?t=finance" className="text-sm text-amber-200/70" aria-label="Open finance">↗</Link></div>
          <label className="mt-4 flex min-h-[44px] items-center rounded-[14px] border border-white/[.07] bg-black/20 px-3 focus-within:border-amber-200/30"><input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Budget note…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-white/24" /></label>
          <button type="button" onClick={saveBudget} className="mt-3 w-full rounded-[13px] border border-white/[.07] bg-white/[.025] py-2 text-[9px] font-black text-white/55">{saved ? 'Saved ✓' : 'Save locally'}</button>
        </div>

        <div className="rounded-[24px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between"><span className="truncate text-[10px] font-black uppercase tracking-[.14em] text-white/40">Motivation</span><button type="button" onClick={() => setMotivation((value) => (value + 1) % MOTIVATION.length)} className="text-sm text-violet-200/70" aria-label="Next motivation">↻</button></div>
          <motion.div key={motivation} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-7 line-clamp-1 text-sm font-black text-white/80">{MOTIVATION[motivation]}</motion.div>
          <div className="mt-5 flex gap-1">{MOTIVATION.map((_, index) => <i key={index} className={`h-1 flex-1 rounded-full ${index === motivation ? 'bg-violet-300' : 'bg-white/[.07]'}`} />)}</div>
        </div>
      </section>

      <PanaceaMusicPlayer />

      <section className="rounded-[26px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl" aria-label="AI quick handoff">
        <div className="flex items-center justify-between gap-3"><strong className="truncate text-sm">Ask Panacea</strong><span className="shrink-0 text-[9px] font-black uppercase tracking-[.14em] text-cyan-100/38">context handoff</span></div>
        <label className="mt-4 flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/[.07] bg-black/20 px-3 focus-within:border-cyan-200/30"><IconChat size={16} /><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask anything…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-white/24" /></label>
        <div className="mt-3 grid grid-cols-3 gap-2"><Link to="/chatbot" onClick={handoffPrompt} className="grid min-h-[42px] place-items-center rounded-[14px] bg-gradient-to-r from-cyan-200 to-violet-200 text-[9px] font-black text-black">Ask</Link><Link to="/emr" className="grid min-h-[42px] place-items-center rounded-[14px] border border-white/[.07] text-[9px] font-black text-white/55">AI-EMR</Link><Link to="/care-episode" className="grid min-h-[42px] place-items-center rounded-[14px] border border-white/[.07] text-[9px] font-black text-white/55">Care</Link></div>
      </section>

      <section aria-label="Personal spaces">
        <div className="mb-2 flex items-center justify-between px-1"><h2 className="truncate text-xs font-black uppercase tracking-[.15em] text-white/50">Life</h2><span className="text-[10px] font-black text-cyan-100/45">6 spaces</span></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{PERSONAL_TILES.map((tile) => <TileCard key={tile.label} tile={tile} />)}</div>
      </section>

      <section aria-label="Personal intelligence">
        <div className="mb-2 flex items-center justify-between px-1"><h2 className="truncate text-xs font-black uppercase tracking-[.15em] text-white/50">Intelligence</h2><span className="text-[10px] font-black text-violet-100/45">4 tools</span></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{INTELLIGENCE_TILES.map((tile) => <TileCard key={tile.label} tile={tile} />)}</div>
      </section>

      <SuperPageActivityFeed domain="for-you" initialLimit={18} />

      <SuperPageCapabilityRail domain="for-you" initialLimit={24} />
    </main>
  )
}

export default ForYouHub
