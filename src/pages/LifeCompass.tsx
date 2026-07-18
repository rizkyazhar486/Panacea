import { useEffect, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Life Compass — a vision/mission/purpose planner. Combines two validated
// psychological frameworks (values clarification + implementation intentions)
// with a plain-language digest of how different wisdom traditions frame
// meaning and hardship — offered neutrally, side by side, for the user to
// draw from whichever resonates, alongside the secular psychology. Pure
// localStorage, no external API, no diagnosis or therapy.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_lifecompass_v1'
interface State {
  values: string[]
  vision: string
  mission: string
  goals: { domain: string; goal: string; nextStep: string }[]
}
const DOMAINS = ['Health', 'Career / Craft', 'Relationships', 'Growth & Learning', 'Contribution']
function load(): State {
  try { return { values: [], vision: '', mission: '', goals: DOMAINS.map((d) => ({ domain: d, goal: '', nextStep: '' })), ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') } } catch { /* ignore */ }
  return { values: [], vision: '', mission: '', goals: DOMAINS.map((d) => ({ domain: d, goal: '', nextStep: '' })) }
}

const VALUE_OPTIONS = [
  'Family', 'Health', 'Freedom', 'Mastery', 'Honesty', 'Faith', 'Curiosity', 'Service to others',
  'Financial security', 'Creativity', 'Courage', 'Discipline', 'Compassion', 'Adventure', 'Legacy', 'Peace of mind',
]

interface Wisdom { tradition: string; teaching: string }
const WISDOM: Wisdom[] = [
  { tradition: 'Stoicism (Epictetus, Marcus Aurelius)', teaching: 'Separate what is in your control (your effort, attitude, choices) from what isn\'t (outcomes, other people, the past). Anxiety about the future often comes from trying to control the uncontrollable — redirect that energy to your next right action instead.' },
  { tradition: 'Islam', teaching: 'Tawakkul — do everything within your ability, then trust the outcome to God. Effort is your responsibility; the result is not entirely yours to carry alone, which is meant to ease the weight of worry.' },
  { tradition: 'Christianity', teaching: '"Do not worry about tomorrow, for tomorrow will worry about itself" (Matthew 6:34) — a repeated call to stay present, paired with the idea that hardship can produce endurance and character over time (Romans 5:3-4).' },
  { tradition: 'Buddhism', teaching: 'Suffering often comes from clinging to a fixed idea of how things must turn out. Impermanence cuts both ways: hardship passes, and so does any single failure — non-attachment to outcome reduces suffering without reducing effort.' },
  { tradition: 'Hinduism (Bhagavad Gita)', teaching: '"You have a right to your actions, but never to the fruits of your actions" — act with full commitment, but release your grip on the specific result, which is the root of a calmer mind.' },
  { tradition: 'Japanese Ikigai / ganbaru', teaching: 'Purpose sits at the overlap of what you love, what you\'re good at, what the world needs, and what can sustain you — and steady, unglamorous persistence (ganbaru) through difficulty is itself respected, not just the outcome.' },
  { tradition: 'Positive psychology (post-traumatic growth)', teaching: 'Tedeschi & Calhoun\'s research found that many people who go through serious adversity report genuine psychological growth afterward — not despite the struggle, but partly through processing it with meaning-making and social support.' },
]

export function LifeCompass() {
  const [s, setS] = useState<State>(load)
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  const toggleValue = (v: string) =>
    setS((x) => ({ ...x, values: x.values.includes(v) ? x.values.filter((y) => y !== v) : x.values.length < 5 ? [...x.values, v] : x.values }))

  const setGoal = (domain: string, field: 'goal' | 'nextStep', val: string) =>
    setS((x) => ({ ...x, goals: x.goals.map((g) => (g.domain === domain ? { ...g, [field]: val } : g)) }))

  const filledGoals = s.goals.filter((g) => g.goal.trim()).length

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Life Compass" subtitle="Plan your vision, mission, and next step — so the future feels like a direction, not a worry" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Anxiety about the future often comes from having no plan to point it at. This page walks
          through two things psychology consistently finds helpful: naming what actually matters to
          you (values clarification), and turning big dreams into one concrete next step
          (implementation intentions — shown to meaningfully improve follow-through vs. goals alone).
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Step 1 — Your core values (pick up to 5)</div>
        <p className="mt-1 text-[12px] text-neutral-500">Not what you think you <i>should</i> value — what actually feels non-negotiable to you.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VALUE_OPTIONS.map((v) => (
            <button key={v} onClick={() => toggleValue(v)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${s.values.includes(v) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{v}</button>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Step 2 — Your vision (10-20 years from now)</div>
        <p className="mt-1 text-[12px] text-neutral-500">If things went as well as they realistically could, what would your life look like?</p>
        <textarea className={`${inputClass} mt-2 min-h-[80px] resize-none`} placeholder="e.g. I want to be a doctor known for..." value={s.vision} onChange={(e) => setS((x) => ({ ...x, vision: e.target.value }))} />
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Step 3 — Your mission (what you do, and for whom)</div>
        <p className="mt-1 text-[12px] text-neutral-500">One or two sentences: what you do, who it's for, why it matters.</p>
        <textarea className={`${inputClass} mt-2 min-h-[70px] resize-none`} placeholder="e.g. I help my patients understand their health clearly enough to take charge of it." value={s.mission} onChange={(e) => setS((x) => ({ ...x, mission: e.target.value }))} />
      </Card>

      <Card className="!p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Step 4 — One goal + one next step, per life domain</div>
          <Badge tone={filledGoals > 0 ? 'brand' : 'low'}>{filledGoals}/{DOMAINS.length} started</Badge>
        </div>
        <div className="mt-3 space-y-4">
          {s.goals.map((g) => (
            <div key={g.domain} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="text-[12px] font-black text-brand-dark">{g.domain}</div>
              <input className={`${inputClass} mt-1.5`} placeholder="A goal in this area…" value={g.goal} onChange={(e) => setGoal(g.domain, 'goal', e.target.value)} />
              <input className={`${inputClass} mt-1.5`} placeholder="This week's concrete next step…" value={g.nextStep} onChange={(e) => setGoal(g.domain, 'nextStep', e.target.value)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">When you're worried about the future</div>
        <p className="mt-1 text-[12px] text-neutral-500">
          Different traditions frame this differently — shown side by side, not to tell you which to
          believe, but so you can draw from whichever speaks to you.
        </p>
        <div className="mt-3 space-y-3">
          {WISDOM.map((w) => (
            <div key={w.tradition} className="rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div className="text-[12px] font-black text-ink dark:text-white">{w.tradition}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{w.teaching}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Frameworks: Schwartz values theory; Gollwitzer's implementation-intention research
        (meta-analytic effect on goal follow-through, Gollwitzer &amp; Sheeran, 2006); Tedeschi &amp;
        Calhoun's post-traumatic growth model. Wisdom-tradition summaries are necessarily brief —
        explore the primary sources and your own community for depth. This tool is for reflection, not
        therapy — if anxiety about the future feels overwhelming, please also reach out to a mental
        health professional (see Mental Health Check in this app).
      </div>
    </div>
  )
}

export default LifeCompass
