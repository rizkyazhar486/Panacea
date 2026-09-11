import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconSparkle } from '../components/icons'

const STORAGE_KEY = 'panacea:mental-safety-plan:v1'

type PlanKey =
  | 'warningSigns'
  | 'coping'
  | 'distraction'
  | 'trustedPeople'
  | 'professionalSupport'
  | 'saferEnvironment'
  | 'reasonsToStay'

interface SafetyPlanState {
  warningSigns: string
  coping: string
  distraction: string
  trustedPeople: string
  professionalSupport: string
  saferEnvironment: string
  reasonsToStay: string
}

const EMPTY_PLAN: SafetyPlanState = {
  warningSigns: '',
  coping: '',
  distraction: '',
  trustedPeople: '',
  professionalSupport: '',
  saferEnvironment: '',
  reasonsToStay: '',
}

const SECTIONS: Array<{
  key: PlanKey
  step: number
  title: string
  prompt: string
  placeholder: string
}> = [
  {
    key: 'warningSigns',
    step: 1,
    title: 'My warning signs',
    prompt: 'What thoughts, feelings, body sensations, situations or behaviors tell you that things are becoming unsafe or much harder?',
    placeholder: 'Example: withdrawing from everyone, not sleeping, feeling trapped, racing thoughts…',
  },
  {
    key: 'coping',
    step: 2,
    title: 'Things I can do by myself first',
    prompt: 'List short activities that can reduce intensity or help you get through the next few minutes without making the situation worse.',
    placeholder: 'Breathing, shower, grounding, walking in a safe place, music, prayer, writing, a familiar routine…',
  },
  {
    key: 'distraction',
    step: 3,
    title: 'People or places that help me feel less alone',
    prompt: 'Who or where can help you reconnect without needing to explain everything immediately?',
    placeholder: 'Friend, sibling, café, mosque/church/temple, gym, public place, community group…',
  },
  {
    key: 'trustedPeople',
    step: 4,
    title: 'People I can tell directly',
    prompt: 'Write the names and contact details of people you trust enough to say: “I am not safe alone right now; please stay with me or help me get care.”',
    placeholder: 'Name — phone / message route — what I want them to do',
  },
  {
    key: 'professionalSupport',
    step: 5,
    title: 'Professional and urgent support',
    prompt: 'Add your psychiatrist, psychologist, doctor, clinic, hospital, local crisis line or emergency service details if you know them.',
    placeholder: 'Clinician / clinic / emergency department / local emergency number…',
  },
  {
    key: 'saferEnvironment',
    step: 6,
    title: 'Make the environment safer',
    prompt: 'Plan how to create distance from anything you could use to hurt yourself, and who can help secure or remove it while the crisis passes.',
    placeholder: 'Where I will go, who will stay with me, what I will ask a trusted person to secure…',
  },
  {
    key: 'reasonsToStay',
    step: 7,
    title: 'What I want to protect',
    prompt: 'Write concrete people, responsibilities, hopes, beliefs, unfinished plans, places, animals or future moments that matter enough to revisit before acting on an impulse.',
    placeholder: 'People I love, a future goal, faith, a responsibility, something unfinished, tomorrow morning…',
  },
]

export function MentalSafetyPlan() {
  const [plan, setPlan] = useState<SafetyPlanState>(EMPTY_PLAN)
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SafetyPlanState>
        setPlan({ ...EMPTY_PLAN, ...parsed })
      }
    } catch {
      // A corrupt/private-storage state should never block the safety page.
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setSavedAt(null)
    }
  }, [loaded, plan])

  const completeness = useMemo(() => {
    const done = SECTIONS.filter((section) => plan[section.key].trim().length > 0).length
    return Math.round((done / SECTIONS.length) * 100)
  }, [plan])

  function update(key: PlanKey, value: string) {
    setPlan((previous) => ({ ...previous, [key]: value }))
  }

  function clearPlan() {
    if (!window.confirm('Clear this safety plan from this device?')) return
    setPlan(EMPTY_PLAN)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* no-op */ }
  }

  return (
    <div className="space-y-4 pb-8">
      <Card className="!p-4">
        <SectionTitle
          icon={<IconSparkle size={20} />}
          title="My Safety Plan"
          subtitle="A private plan for the moments when distress becomes hard to carry alone"
        />

        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="text-xs font-black text-red-700 dark:text-red-200">If you may act on thoughts of harming yourself or someone else now</div>
          <p className="mt-1 text-[11px] leading-relaxed text-red-700 dark:text-red-200">
            Do not rely on this page alone. Move toward other people, contact a trusted person, use your local emergency or crisis service,
            or go to the nearest emergency department. Panacea cannot see this plan in real time and cannot contact emergency services for you.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Link to="/hospitals" className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-[11px] font-black text-red-700 dark:bg-white/10 dark:text-red-200">
              Find care
            </Link>
            <Link to="/consult" className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-[11px] font-black text-red-700 dark:bg-white/10 dark:text-red-200">
              Open consult
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-baseline justify-between gap-2 text-[10px] font-black uppercase tracking-wide text-neutral-500">
              <span>Plan completeness</span><span>{completeness}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
              Formula: completed sections ÷ {SECTIONS.length} × 100%. This measures form completion only — never suicide risk.
            </p>
          </div>
          <div className="text-[10px] text-neutral-400">{savedAt ? `Saved on this device · ${savedAt}` : 'Local storage unavailable'}</div>
        </div>
      </Card>

      {SECTIONS.map((section) => (
        <Card key={section.key} className="!p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">{section.step}</div>
            <div className="min-w-0 flex-1">
              <label htmlFor={`safety-${section.key}`} className="text-sm font-black text-ink dark:text-white">{section.title}</label>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{section.prompt}</p>
              <textarea
                id={`safety-${section.key}`}
                value={plan[section.key]}
                onChange={(event) => update(section.key, event.target.value)}
                rows={4}
                placeholder={section.placeholder}
                className="mt-2 w-full resize-y rounded-2xl border border-neutral-200 bg-white p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>
        </Card>
      ))}

      <Card className="!p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <div className="text-sm font-black text-ink dark:text-white">Privacy & sharing</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
              This version is stored only in this browser/device using localStorage. Panacea does not monitor it.
              You decide whether to show it to a trusted person or clinician. Revisit it when your supports, environment or treatment change.
            </p>
          </div>
          <button type="button" onClick={clearPlan} className="rounded-full border border-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-500 dark:border-white/10">
            Clear local plan
          </button>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
          Evidence note: safety planning is a structured suicide-prevention intervention used in clinical care. This self-directed tool is a preparation aid,
          not a substitute for clinical assessment, follow-up or emergency response.
        </p>
      </Card>
    </div>
  )
}

export default MentalSafetyPlan
