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
    try {
      localStorage.setItem(KEY, '1')
      localStorage.setItem(PROMPT_KEY, '1')
    } catch { /* ignore */ }
    setShow(false)
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
          style={{ background: 'linear-gradient(135deg, #00BF63, #00A857)' }}>
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
    <div
      className="fixed bottom-6 right-6 z-40 max-w-sm rounded-3xl border border-emerald-500/20 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/95"
      role="region"
      aria-label="Initial assessment prompt"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-xl dark:bg-emerald-950/60">🧪</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink">Before you start training…</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Selesaikan <b>Initial Assessment</b> (2-3 menit) untuk personalisasi program latihan Anda.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href="#/assessment"
              onClick={dismiss}
              className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-105"
            >
              Mulai Sekarang →
            </a>
            <button
              onClick={dismiss}
              className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              Nanti saja
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          aria-label="Tutup prompt asesmen"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
