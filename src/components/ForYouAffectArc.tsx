import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import {
  deriveAffectDecision,
  recordAffectEvent,
  resetAffectSession,
  summarizeAffectSession,
  type AffectTrigger,
} from '../domains/affect'
import { Prosa } from './Prosa'

const GRATITUDE_KEY = 'pmd_gratitude_v1'

const GRATITUDE_CHOICES = [
  ['body', 'My body'],
  ['person', 'Someone helped me'],
  ['discipline', 'Discipline'],
  ['opportunity', 'Luck / opportunity'],
  ['faith', 'Faith / God'],
  ['other', 'Something else'],
] as const

const PHASE_COPY = {
  curiosity: ['Curiosity', 'One meaningful thing, then choose the next real action.'],
  anticipation: ['Anticipation', 'You are close to something meaningful. Keep the next action concrete.'],
  effort: ['Effort', 'Stay with the process; Panacea does not reward suffering for its own sake.'],
  peak: ['Peak', 'Take the win. Let the achievement register before chasing another one.'],
  release: ['Release', 'Let the peak settle. Completion is part of the reward loop.'],
  recognition: ['Recognition', 'Turn attention into connection rather than another metric.'],
  gratitude: ['Gratitude', 'Name what helped. Meaning closes the loop better than another notification.'],
  calm: ['Calm', 'Enough stimulation. Leave with one real-world action or a moment of gratitude.'],
} as const

function readRecoveryPct(): number | undefined {
  try {
    const raw = localStorage.getItem('pmd_health_profile')
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return typeof parsed.recoveryPct === 'number' ? parsed.recoveryPct : undefined
  } catch {
    return undefined
  }
}

function saveQuickGratitude(label: string) {
  const today = new Date()
  const key = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  try {
    const parsed = JSON.parse(localStorage.getItem(GRATITUDE_KEY) || '[]')
    const entries = Array.isArray(parsed) ? parsed : []
    const existing = entries.find((entry) => entry?.date === key)
    const items = Array.isArray(existing?.items)
      ? [...existing.items].slice(0, 3)
      : ['', '', '']
    while (items.length < 3) items.push('')
    const note = `Today I appreciate: ${label}.`
    const empty = items.findIndex((item) => !String(item || '').trim())
    if (empty >= 0) items[empty] = note
    else items[2] = note

    const next = [
      { date: key, items },
      ...entries.filter((entry) => entry?.date !== key),
    ]
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(next))
  } catch { /* local-only best effort */ }
}

export function ForYouAffectArc() {
  const { state, account } = useStore()
  const [revision, setRevision] = useState(0)
  const [trigger, setTrigger] = useState<AffectTrigger>('feed')
  const [gratitudeChoice, setGratitudeChoice] = useState('')

  useEffect(() => {
    const update = (event?: Event) => {
      const detail = (event as CustomEvent<{ type?: string }> | undefined)?.detail
      if (detail?.type === 'achievement_view') setTrigger('achievement')
      else if (detail?.type === 'match_view') setTrigger('match')
      else if (detail?.type === 'social_reaction') setTrigger('recognition')
      else if (detail?.type === 'gratitude') setTrigger('gratitude')
      else if (detail?.type === 'return') setTrigger('return')
      else if (detail?.type === 'feed_reveal' || detail?.type === 'mode_switch') setTrigger('feed')
      setRevision((value) => value + 1)
    }

    window.addEventListener('panacea-affect-event', update)
    const timer = window.setInterval(() => update(), 60_000)
    return () => {
      window.removeEventListener('panacea-affect-event', update)
      window.clearInterval(timer)
    }
  }, [])

  const session = useMemo(() => summarizeAffectSession(), [revision])

  const recognition = useMemo(() => {
    if (!account) return 0
    const recent = state.posts
      .filter((post) => post.authorEmail === account.email)
      .filter((post) => Date.now() - Date.parse(post.at) <= 7 * 86_400_000)
    const signal = recent.reduce(
      (sum, post) => sum + (post.likes ?? 0) + (post.comments ?? 0) * 2 + (post.reposts ?? 0) * 2,
      0,
    )
    return Math.max(0, Math.min(1, signal / 20))
  }, [state.posts, account])

  const decision = useMemo(() => deriveAffectDecision({
    trigger,
    rewardObserved: trigger === 'achievement' || trigger === 'match' ? 0.9 : 0.35 + recognition * 0.45,
    expectedReward: 0.45,
    nextStateValue: 0.55,
    personalEffort: trigger === 'achievement' ? 0.85 : 0.55,
    personalMeaning: 0.70,
    socialRelevance: recognition,
    evidenceConfidence: 0.80,
    rapidLoops: session.rapidLoops,
    sessionMinutes: session.sessionMinutes,
    recoveryPct: readRecoveryPct(),
    gratitudeCompleted: session.gratitudeCompleted,
    recentPeak: trigger === 'return' && session.gratitudeCompleted,
  }), [trigger, recognition, session])

  const [phaseTitle, phaseCopy] = PHASE_COPY[decision.phase]

  const chooseGratitude = (label: string) => {
    saveQuickGratitude(label)
    setGratitudeChoice(label)
    recordAffectEvent('gratitude', 1)
    setTrigger('gratitude')
  }

  const reset = () => {
    recordAffectEvent('pause')
    resetAffectSession()
    setTrigger('return')
    setRevision((value) => value + 1)
  }

  return (
    <section className="dark snap-start border-b border-white/[.08] py-6" aria-label="Mind rhythm and gratitude">
      <div className="overflow-hidden rounded-[26px] border border-violet-300/15 bg-[radial-gradient(circle_at_15%_10%,rgba(168,85,247,.13),transparent_34%),radial-gradient(circle_at_85%_88%,rgba(34,211,238,.08),transparent_34%),#050508] p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-200/55">Mind Rhythm</div>
            <h3 className="mt-1 text-xl font-black tracking-[-.035em]">{phaseTitle}</h3>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black text-white/45">
            meaning &gt; compulsion
          </div>
        </div>

        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-white/48">{phaseCopy}</Prosa>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/28">Reward</div>
            <div className="mt-1 text-lg font-black tabular-nums">{Math.round(decision.rewardIntensity * 100)}</div>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/28">Novelty</div>
            <div className="mt-1 text-lg font-black tabular-nums">{Math.round(decision.noveltyBudget * 100)}</div>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/28">Loop risk</div>
            <div className="mt-1 text-lg font-black tabular-nums">{Math.round(decision.compulsionRisk * 100)}</div>
          </div>
        </div>

        {(decision.shouldPromptGratitude || decision.phase === 'release' || decision.phase === 'calm') && (
          <div className="mt-5 border-t border-white/[.08] pt-4">
            <div className="text-[10px] font-black text-white/72">What helped you get here?</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {GRATITUDE_CHOICES.map(([, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => chooseGratitude(label)}
                  className={`min-h-[36px] rounded-full border px-3 text-[9px] font-black transition ${
                    gratitudeChoice === label
                      ? 'border-emerald-200/60 bg-emerald-300/15 text-emerald-100'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {gratitudeChoice && (
              <div className="mt-3 text-[10px] font-bold text-emerald-200/70">
                Saved to Gratitude Journal · no XP, no streak bonus, no leaderboard points.
              </div>
            )}
          </div>
        )}

        {decision.shouldOfferPause && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.08] pt-4">
            <div>
              <div className="text-[10px] font-black text-white/68">The loop is getting intense.</div>
              <div className="mt-0.5 text-[9px] text-white/32">
                {decision.cooldownMinutes ? `Suggested cooldown: ${decision.cooldownMinutes} min.` : 'A short pause can restore choice.'}
              </div>
            </div>
            <button type="button" onClick={reset} className="min-h-[38px] rounded-full border border-white/12 px-4 text-[9px] font-black text-white/62 hover:text-white">
              Close the loop
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-[9px] text-white/28">
          <span>{Math.round(session.sessionMinutes)} min session · {session.rapidLoops} recent loops</span>
          <Link to="/gratitude" className="font-black text-violet-200/55 hover:text-violet-100">Full gratitude journal ↗</Link>
        </div>

        <Prosa kelas="mt-3 text-[9px] leading-relaxed text-white/24">
          These are UX-state estimates, not dopamine, hormone, addiction or mental-health measurements. High loop risk reduces stimulation instead of increasing it.
        </Prosa>
      </div>
    </section>
  )
}

export default ForYouAffectArc
