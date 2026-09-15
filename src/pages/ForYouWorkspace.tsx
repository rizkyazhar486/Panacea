import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

function readNumber(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback
  const n = Number(window.localStorage.getItem(key))
  return Number.isFinite(n) ? n : fallback
}

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[26px] border border-white/[.09] bg-white/[.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-2xl ${className}`}>{children}</section>
}

export function ForYouWorkspace() {
  const { account } = useStore()
  const [dhikr, setDhikr] = useState(() => readNumber('pm_foryou_dhikr', 0))
  const [budget, setBudget] = useState(() => readNumber('pm_foryou_budget', 0))
  const [spent, setSpent] = useState(() => readNumber('pm_foryou_spent', 0))
  const [wellbeing, setWellbeing] = useState(() => readNumber('pm_foryou_wellbeing', 7))
  const [draft, setDraft] = useState(() => typeof window === 'undefined' ? '' : window.localStorage.getItem('pm_foryou_social_draft') ?? '')
  const [emrDraft, setEmrDraft] = useState(() => typeof window === 'undefined' ? '' : window.localStorage.getItem('pm_foryou_emr_draft') ?? '')
  const [focus, setFocus] = useState(() => typeof window === 'undefined' ? false : window.localStorage.getItem('pm_foryou_focus') === '1')
  const [prompt, setPrompt] = useState('')

  const budgetPct = useMemo(() => budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0, [budget, spent])
  const save = (key: string, value: string | number | boolean) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
  }

  return (
    <main className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5">
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />

      <header className="relative mb-5 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200/75">Super page 03</div>
          <h1 className="mt-1 text-2xl font-black tracking-[-.035em]">For You</h1>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black text-white/65">Personal OS</div>
      </header>

      <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Glass>
          <div className="flex items-center justify-between"><b>Faith</b><Link to="/prayer-times" className="text-cyan-200">↗</Link></div>
          <button type="button" onClick={() => { const n = dhikr + 1; setDhikr(n); save('pm_foryou_dhikr', n) }} className="mt-5 grid w-full place-items-center rounded-[20px] border border-emerald-300/15 bg-emerald-300/[.07] py-5 text-4xl font-black tabular-nums active:scale-[.985]">{dhikr}</button>
          <div className="mt-3 flex gap-2"><button type="button" onClick={() => { setDhikr(0); save('pm_foryou_dhikr', 0) }} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">Reset</button><Link to="/?space=for-you&faith=scripture" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">Read</Link></div>
        </Glass>

        <Glass>
          <div className="flex items-center justify-between"><b>Finance</b><Link to="/keuangan" className="text-cyan-200">↗</Link></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${budgetPct}%` }} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input inputMode="numeric" value={budget || ''} onChange={(e) => { const n = Number(e.target.value) || 0; setBudget(n); save('pm_foryou_budget', n) }} placeholder="Budget" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none" />
            <input inputMode="numeric" value={spent || ''} onChange={(e) => { const n = Number(e.target.value) || 0; setSpent(n); save('pm_foryou_spent', n) }} placeholder="Spent" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none" />
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums">{Math.round(budgetPct)}%</div>
        </Glass>

        <Glass>
          <div className="flex items-center justify-between"><b>Score</b><Link to="/clinical-scores" className="text-cyan-200">↗</Link></div>
          <div className="mt-5 flex items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-full border-[8px] border-cyan-300/70 text-2xl font-black">{wellbeing}</div><input aria-label="Daily wellbeing score" type="range" min="1" max="10" value={wellbeing} onChange={(e) => { const n = Number(e.target.value); setWellbeing(n); save('pm_foryou_wellbeing', n) }} className="min-w-0 flex-1" /></div>
          <div className="mt-3 text-[10px] font-black uppercase tracking-[.14em] text-white/45">Daily self-rating · 1–10</div>
        </Glass>

        <Glass>
          <div className="flex items-center justify-between"><b>Social + Community</b><Link to="/feed" className="text-cyan-200">↗</Link></div>
          <textarea value={draft} onChange={(e) => { setDraft(e.target.value); save('pm_foryou_social_draft', e.target.value) }} rows={3} placeholder="Draft a post…" className="mt-4 w-full resize-none rounded-[16px] border border-white/10 bg-black/30 p-3 text-xs outline-none" />
          <div className="mt-2 flex gap-2"><Link to="/feed" className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-black">Continue</Link><Link to="/community" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">People</Link></div>
        </Glass>

        <Glass>
          <div className="flex items-center justify-between"><b>AI Chatbot</b><Link to="/chatbot" className="text-cyan-200">↗</Link></div>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask Panacea…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none" />
          <Link to="/chatbot" onClick={() => { if (typeof window !== 'undefined' && prompt.trim()) window.sessionStorage.setItem('pm_chat_draft', prompt.trim()) }} className="mt-3 inline-grid rounded-full bg-gradient-to-r from-cyan-200 to-violet-200 px-4 py-2 text-[10px] font-black text-black">Ask →</Link>
        </Glass>

        <Glass>
          <div className="flex items-center justify-between"><b>AI-EMR + Care</b><Link to="/emr" className="text-cyan-200">↗</Link></div>
          <textarea value={emrDraft} onChange={(e) => { setEmrDraft(e.target.value); save('pm_foryou_emr_draft', e.target.value) }} rows={3} placeholder="Quick clinical note…" className="mt-4 w-full resize-none rounded-[16px] border border-white/10 bg-black/30 p-3 text-xs outline-none" />
          <div className="mt-2 flex gap-2"><Link to="/emr" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">EMR</Link><Link to="/care-episode" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">Care</Link></div>
        </Glass>

        <Glass className="sm:col-span-2 xl:col-span-3">
          <div className="flex items-center justify-between"><b>Account + System</b><span className="text-xs font-black text-white/45">{account?.name ?? 'Account'}</span></div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { const next = !focus; setFocus(next); save('pm_foryou_focus', next) }} className={`rounded-full border px-4 py-2 text-[10px] font-black ${focus ? 'border-cyan-200/50 bg-cyan-200 text-black' : 'border-white/10 bg-white/[.035]'}`}>Focus {focus ? 'On' : 'Off'}</button>
            <Link to="/settings" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black">System</Link>
            <Link to="/messages" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black">Messages</Link>
            <Link to="/atur-fitur" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black">Manage Features</Link>
            <Link to="/tutorial" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black">Help</Link>
            <Link to="/profile" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black">Account</Link>
          </div>
        </Glass>
      </div>
    </main>
  )
}

export default ForYouWorkspace
