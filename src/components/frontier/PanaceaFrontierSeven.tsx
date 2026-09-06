import { useMemo, useState } from 'react'

type ToolKey = 'time' | 'decision' | 'knowledge' | 'family' | 'social' | 'autopilot' | 'future'
type Domain = 'Time' | 'Health' | 'Money' | 'Knowledge' | 'Social' | 'Family' | 'Career'

const STORE = 'pmd-frontier-seven-v1'

interface StoredState {
  weeklyHours?: number
  decision?: string
  prediction?: string
  knowledge?: string
  nextAction?: string
  legacy?: string
  social?: Record<string, number>
  autopilot?: Domain[]
  future?: string
  horizon?: number
  savedAt?: string
}

const TOOLS: { key: ToolKey; emoji: string; title: string; oneLine: string }[] = [
  { key: 'time', emoji: '⏳', title: 'Time-to-Life Exchange', oneLine: 'Translate recurring hours into a year of life you can see.' },
  { key: 'decision', emoji: '🕰️', title: 'Decision Time Capsule', oneLine: 'Freeze what you believed before hindsight rewrites the story.' },
  { key: 'knowledge', emoji: '⚡', title: 'Knowledge → Action Engine', oneLine: 'Every useful idea must leave as one visible action.' },
  { key: 'family', emoji: '🧬', title: 'Family Legacy Capsule', oneLine: 'Preserve the story, habit or value that records normally lose.' },
  { key: 'social', emoji: '🫂', title: 'Social Resilience Radar', oneLine: 'See connection as support infrastructure, not follower count.' },
  { key: 'autopilot', emoji: '🧭', title: 'Human Autopilot', oneLine: 'Choose three forms of wealth; Panacea builds three tiny moves.' },
  { key: 'future', emoji: '🌌', title: 'Future-Self Contract', oneLine: 'Name the capability your future self should still possess.' },
]

const DOMAINS: Domain[] = ['Time', 'Health', 'Money', 'Knowledge', 'Social', 'Family', 'Career']
const SOCIAL_AXES = ['Belonging', 'Support', 'Reciprocity', 'Reach'] as const

const MICRO: Record<Domain, string[]> = {
  Time: ['Protect one 30-minute block from interruption.', 'Remove one low-value task from today.', 'Choose the one outcome that would make today worthwhile.'],
  Health: ['Take a ten-minute walk or mobility break.', 'Choose tonight’s wind-down time now.', 'Prepare the next healthy choice before you need willpower.'],
  Money: ['Review one recurring expense.', 'Move one small amount toward a buffer or goal.', 'Write down one money decision before acting on it.'],
  Knowledge: ['Retrieve five facts without notes.', 'Explain one idea in five jargon-free sentences.', 'Turn one saved article into one action.'],
  Social: ['Send one genuine check-in.', 'Ask one question you do not know the answer to.', 'Thank one person specifically for something they did.'],
  Family: ['Give one family member ten phone-free minutes.', 'Capture one family story with permission.', 'Do one small care task before being asked.'],
  Career: ['Practice one compounding skill for twenty minutes.', 'Record one concrete contribution from this week.', 'Run one small experiment that tests a career assumption.'],
}

function loadState(): StoredState {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}') as StoredState
  } catch {
    return {}
  }
}

function saveState(next: StoredState) {
  try { localStorage.setItem(STORE, JSON.stringify({ ...next, savedAt: new Date().toISOString() })) } catch { /* local experimental state */ }
}

export function PanaceaFrontierSeven() {
  const [active, setActive] = useState<ToolKey>('time')
  const [state, setState] = useState<StoredState>(loadState)
  const [draftDecision, setDraftDecision] = useState(state.decision ?? '')
  const [draftPrediction, setDraftPrediction] = useState(state.prediction ?? '')
  const [draftKnowledge, setDraftKnowledge] = useState(state.knowledge ?? '')
  const [draftAction, setDraftAction] = useState(state.nextAction ?? '')
  const [draftLegacy, setDraftLegacy] = useState(state.legacy ?? '')
  const [draftFuture, setDraftFuture] = useState(state.future ?? '')

  function patch(partial: Partial<StoredState>) {
    setState((current) => {
      const next = { ...current, ...partial }
      saveState(next)
      return next
    })
  }

  const social = state.social ?? Object.fromEntries(SOCIAL_AXES.map((axis) => [axis, 5]))
  const socialAverage = SOCIAL_AXES.reduce((sum, axis) => sum + (social[axis] ?? 0), 0) / SOCIAL_AXES.length
  const weeklyHours = Number.isFinite(state.weeklyHours) ? Math.max(0, state.weeklyHours ?? 0) : 0
  const yearlyHours = weeklyHours * 52
  const yearlyDays = yearlyHours / 24

  const autopilotPlan = useMemo(() => {
    const selected = state.autopilot ?? []
    const seed = new Date().getDate() + new Date().getMonth() * 31
    return selected.map((domain, index) => ({ domain, action: MICRO[domain][(seed + index) % MICRO[domain].length] }))
  }, [state.autopilot])

  function toggleDomain(domain: Domain) {
    const current = state.autopilot ?? []
    const next = current.includes(domain)
      ? current.filter((item) => item !== domain)
      : current.length < 3 ? [...current, domain] : [...current.slice(1), domain]
    patch({ autopilot: next })
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 shadow-[0_20px_60px_rgba(80,50,140,.08)] dark:border-violet-400/15 dark:from-violet-400/[.08] dark:via-[#0b0e12] dark:to-cyan-400/[.06] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">Panacea Frontier Seven</div>
          <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-neutral-950 dark:text-white sm:text-2xl">Seven experiments for a Life OS, not another health dashboard.</h2>
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">These are Panacea-native experimental tools. They are not presented as validated clinical instruments or as verified “world firsts”; originality claims require a separate prior-art review.</p>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-2 text-[9px] font-black text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">LOCAL-FIRST PROTOTYPES</span>
      </div>

      <div className="no-scrollbar -mx-1 mt-4 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        {TOOLS.map((tool) => (
          <button key={tool.key} onClick={() => setActive(tool.key)} className={`w-[176px] shrink-0 snap-start rounded-[22px] border p-3.5 text-left transition active:scale-[.98] ${active === tool.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-white/85 text-neutral-950 dark:border-white/10 dark:bg-white/[.04] dark:text-white'}`}>
            <div className="text-2xl" aria-hidden>{tool.emoji}</div>
            <div className="mt-3 text-[12px] font-black leading-tight">{tool.title}</div>
            <p className={`mt-1.5 text-[9px] font-medium leading-relaxed ${active === tool.key ? 'opacity-65' : 'text-neutral-500 dark:text-neutral-400'}`}>{tool.oneLine}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        {active === 'time' && (
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Time-to-Life Exchange</div>
              <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">What if you reclaim the same hours every week?</h3>
              <label className="mt-3 block text-[10px] font-bold text-neutral-500">Hours reclaimed each week</label>
              <input type="range" min="0" max="20" step="0.5" value={weeklyHours} onChange={(e) => patch({ weeklyHours: Number(e.target.value) })} className="mt-2 w-full" />
              <div className="mt-1 text-[11px] font-black tabular-nums text-neutral-700 dark:text-neutral-200">{weeklyHours.toFixed(1)} h/week</div>
            </div>
            <div className="flex gap-2">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-950 dark:bg-sky-400/15 dark:text-sky-100"><div className="text-2xl font-black tabular-nums">{yearlyHours.toFixed(0)}</div><div className="text-[9px] font-black uppercase">hours/year</div></div>
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-950 dark:bg-cyan-400/15 dark:text-cyan-100"><div className="text-2xl font-black tabular-nums">{yearlyDays.toFixed(1)}</div><div className="text-[9px] font-black uppercase">24h days/year</div></div>
            </div>
            <p className="md:col-span-2 text-[9px] text-neutral-400">Formula: reclaimed hours/year = hours/week × 52; 24-hour days/year = hours/year ÷ 24.</p>
          </div>
        )}

        {active === 'decision' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Decision Time Capsule</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">Record the decision before the outcome edits your memory.</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <textarea value={draftDecision} onChange={(e) => setDraftDecision(e.target.value)} placeholder="What decision are you making?" className="min-h-24 rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
              <textarea value={draftPrediction} onChange={(e) => setDraftPrediction(e.target.value)} placeholder="What do you expect, and why?" className="min-h-24 rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
            </div>
            <button onClick={() => patch({ decision: draftDecision.trim().slice(0, 500), prediction: draftPrediction.trim().slice(0, 500) })} className="mt-3 rounded-full bg-amber-500 px-3.5 py-2 text-[10px] font-black text-white">Seal capsule</button>
            {state.decision && <p className="mt-3 text-[10px] text-neutral-500 dark:text-neutral-400">Saved locally. Re-open later and compare process with outcome instead of judging the past only by what happened.</p>}
          </div>
        )}

        {active === 'knowledge' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">Knowledge → Action Engine</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">No idea gets to stay abstract.</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input value={draftKnowledge} onChange={(e) => setDraftKnowledge(e.target.value)} placeholder="One idea worth keeping" className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
              <input value={draftAction} onChange={(e) => setDraftAction(e.target.value)} placeholder="One observable next action" className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
            </div>
            <button onClick={() => patch({ knowledge: draftKnowledge.trim().slice(0, 220), nextAction: draftAction.trim().slice(0, 220) })} className="mt-3 rounded-full bg-fuchsia-600 px-3.5 py-2 text-[10px] font-black text-white">Convert to action</button>
          </div>
        )}

        {active === 'family' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">Family Legacy Capsule</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">Preserve what medical records and photo albums both miss.</h3>
            <textarea value={draftLegacy} onChange={(e) => setDraftLegacy(e.target.value)} placeholder="A family story, value, recipe, turning point, health history context, or lesson — shared only with permission." className="mt-3 min-h-28 w-full rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
            <button onClick={() => patch({ legacy: draftLegacy.trim().slice(0, 800) })} className="mt-3 rounded-full bg-rose-600 px-3.5 py-2 text-[10px] font-black text-white">Save legacy note</button>
          </div>
        )}

        {active === 'social' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">Social Resilience Radar</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">Connection quality, without turning people into a popularity score.</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {SOCIAL_AXES.map((axis) => {
                const value = social[axis] ?? 5
                return <label key={axis} className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]"><div className="flex justify-between text-[10px] font-black text-neutral-700 dark:text-neutral-200"><span>{axis}</span><span>{value}/10</span></div><input type="range" min="0" max="10" step="1" value={value} onChange={(e) => patch({ social: { ...social, [axis]: Number(e.target.value) } })} className="mt-2 w-full" /></label>
              })}
            </div>
            <div className="mt-3 text-[11px] font-black text-neutral-700 dark:text-neutral-200">Self-rating average {socialAverage.toFixed(1)}/10</div>
            <p className="mt-1 text-[9px] text-neutral-400">This is a private reflection tool, not a validated mental-health or loneliness scale.</p>
          </div>
        )}

        {active === 'autopilot' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Human Autopilot</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">Pick three forms of wealth. Get three tiny moves for today.</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DOMAINS.map((domain) => {
                const on = (state.autopilot ?? []).includes(domain)
                return <button key={domain} onClick={() => toggleDomain(domain)} className={`rounded-full px-3 py-2 text-[10px] font-black ${on ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{on ? '✓ ' : '+ '}{domain}</button>
              })}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {autopilotPlan.map((item) => <div key={item.domain} className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-400/[.08]"><div className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300">{item.domain}</div><p className="mt-1 text-[10px] font-semibold leading-relaxed text-neutral-700 dark:text-neutral-200">{item.action}</p></div>)}
            </div>
          </div>
        )}

        {active === 'future' && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Future-Self Contract</div>
            <h3 className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">What should still be true about your life later?</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 5, 10, 20].map((years) => <button key={years} onClick={() => patch({ horizon: years })} className={`rounded-full px-3 py-2 text-[10px] font-black ${state.horizon === years ? 'bg-cyan-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{years} year{years > 1 ? 's' : ''}</button>)}
            </div>
            <textarea value={draftFuture} onChange={(e) => setDraftFuture(e.target.value)} placeholder="Example: I can still run with my children, understand new technology, call my family often, and choose work rather than be trapped by it." className="mt-3 min-h-28 w-full rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
            <button onClick={() => patch({ future: draftFuture.trim().slice(0, 800), horizon: state.horizon ?? 10 })} className="mt-3 rounded-full bg-cyan-600 px-3.5 py-2 text-[10px] font-black text-white">Save contract</button>
          </div>
        )}
      </div>
    </section>
  )
}

export default PanaceaFrontierSeven
