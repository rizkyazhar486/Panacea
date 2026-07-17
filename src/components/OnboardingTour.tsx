import { useEffect, useState } from 'react'

const KEY = 'panacea_onboarded_v1'

// First-run tutorial — icon-first so it's understandable even with limited
// reading ability. Shown once per device; dismissible.
export function OnboardingTour() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(KEY) !== '1' } catch { return false }
  })
  if (!show) return null
  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
    setShow(false)
    window.dispatchEvent(new Event('panacea:onboarded'))
  }

  const steps = [
    { icon: '🏠', title: 'Home', desc: 'View & share posts, photos, videos.' },
    { icon: '🫂', title: 'Community', desc: 'Support each other with challenges & health buddies.' },
    { icon: '➕', title: 'Add Button', desc: 'Create a new post or story.' },
    { icon: '💓', title: 'VitaPulse', desc: 'Check your health: blood pressure, calories, sleep, and more.' },
    { icon: '🩺', title: 'Consultation', desc: 'Chat & video calls with a doctor.' },
    { icon: '🧪', title: 'Performance Lab & Initial Assessment', desc: 'Strength, endurance, speed & injury-risk screening — in the Fitness menu.' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-label="New user guide">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-1 text-center text-2xl font-black text-ink">Welcome 👋</div>
        <p className="mb-5 text-center text-sm text-neutral-500">Here are the main buttons you'll use most — tap through them anytime:</p>

        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.title} className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm">{s.icon}</span>
              <div>
                <div className="text-sm font-bold text-ink">{s.title}</div>
                <div className="text-xs text-neutral-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={close} className="mt-6 w-full rounded-2xl py-3.5 text-base font-bold text-white transition active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Get Started ✓
        </button>
      </div>
    </div>
  )
}

const PROMPT_KEY = 'panacea_assessment_prompt_v1'
const ASSESSMENT_KEY = 'pm_assessment_v1'

// Shown once, right after the onboarding tour is dismissed, if the user
// hasn't completed the Initial Assessment (movement/pain/asymmetry screen).
// Skippable — this is a nudge, not a hard gate.
function shouldPrompt(): boolean {
  try {
    const onboarded = localStorage.getItem('panacea_onboarded_v1') === '1'
    const prompted = localStorage.getItem(PROMPT_KEY) === '1'
    const done = JSON.parse(localStorage.getItem(ASSESSMENT_KEY) || '{}').done === true
    return onboarded && !prompted && !done
  } catch { return false }
}

export function AssessmentPrompt() {
  const [show, setShow] = useState(shouldPrompt)
  useEffect(() => {
    const onOnboarded = () => setShow(shouldPrompt())
    window.addEventListener('panacea:onboarded', onOnboarded)
    return () => window.removeEventListener('panacea:onboarded', onOnboarded)
  }, [])
  if (!show) return null
  function dismiss() { try { localStorage.setItem(PROMPT_KEY, '1') } catch { /* ignore */ }; setShow(false) }
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-label="Initial assessment prompt">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-3xl">
        <div className="text-4xl">🧪</div>
        <div className="mt-2 text-xl font-black text-ink">Before you start training…</div>
        <p className="mt-2 text-sm text-neutral-500">
          Complete the <b>Initial Assessment</b> (2-3 minutes): movement patterns, pain, baseline strength & left-right asymmetry.
          This helps make your training program safer and more effective from day one.
        </p>
        <a href="#/assessment" onClick={dismiss} className="mt-5 block w-full rounded-2xl py-3.5 text-center text-base font-bold text-white transition active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Complete Now →
        </a>
        <button onClick={dismiss} className="mt-2 w-full rounded-2xl py-3 text-sm font-bold text-neutral-400">Maybe later</button>
      </div>
    </div>
  )
}
