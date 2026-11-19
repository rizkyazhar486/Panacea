import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useOptionalStore } from '../../lib/store'
import type { BetaFeedbackCategory } from '../../domains/beta/index.ts'
import { submitBetaFeedbackClient } from './betaClientAdapter'
import { InfoDisclosure } from '../ui/InfoDisclosure'

const TAGS: readonly { readonly id: BetaFeedbackCategory; readonly label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'confusing', label: 'Confusing' },
  { id: 'slow', label: 'Slow' },
  { id: 'love', label: 'Love' },
]

export function BetaFeedbackWidget({ mode = 'card' }: { readonly mode?: 'pill' | 'card' }) {
  const store = useOptionalStore()
  const loc = useLocation()
  const account = store?.account ?? null

  const [open, setOpen] = useState(mode === 'card')
  const [rating, setRating] = useState<number>(5)
  const [category, setCategory] = useState<BetaFeedbackCategory>('love')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const hidePill =
    mode === 'pill' &&
    (loc.pathname.startsWith('/body-explorer') ||
      loc.pathname.startsWith('/body-exposure') ||
      loc.pathname.startsWith('/profile') ||
      loc.pathname.startsWith('/settings'))

  if (hidePill) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const res = await submitBetaFeedbackClient({
        account,
        routeHash: `#${loc.pathname}`,
        rating1To5: rating,
        category,
        note,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setStatus(res.statusMessage)
      setNote('')
      if (mode === 'pill') {
        window.setTimeout(() => setOpen(false), 1200)
      }
    } finally {
      setBusy(false)
    }
  }

  const formCard = (
    <section
      aria-label="Beta Feedback"
      className="dark rounded-2xl border border-cyan-400/25 bg-[#060a10] p-4 text-white shadow-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white">Beta Feedback</h3>
          <p className="text-[11px] text-slate-300">Rate your 3-second mobile experience.</p>
        </div>
        <div className="flex items-center gap-1">
          <InfoDisclosure title="Cohort Telemetry Privacy" badge="Non-PHI">
            <p>Saves only rating, 1-word tag, short note, and viewport size without medical files.</p>
          </InfoDisclosure>
          {mode === 'pill' && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close feedback panel"
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-white/15 text-xs font-bold text-slate-300 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-3 space-y-2.5">
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Rating 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              data-testid={`feedback-rate-${n}`}
              onClick={() => setRating(n)}
              className={`min-h-[44px] rounded-xl border font-mono text-xs font-black transition ${
                rating === n
                  ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                  : 'border-white/15 bg-white/[0.04] text-slate-300'
              }`}
            >
              {n}★
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Feedback tag">
          {TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              role="radio"
              aria-checked={category === tag.id}
              data-testid={`feedback-tag-${tag.id}`}
              onClick={() => setCategory(tag.id)}
              className={`min-h-[44px] rounded-xl border px-2 text-xs font-bold transition ${
                category === tag.id
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/15 bg-white/[0.04] text-slate-300'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <input
          aria-label="Short feedback sentence"
          data-testid="feedback-note-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="One sentence: what felt fast, broken, or unclear?"
          maxLength={320}
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          disabled={busy || note.trim().length < 1}
          data-testid="feedback-submit-btn"
          className="min-h-[44px] w-full rounded-xl bg-emerald-500 px-4 text-xs font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send Feedback'}
        </button>

        {error && <p role="alert" className="font-mono text-[11px] text-rose-300">{error}</p>}
        {status && (
          <p role="status" data-testid="feedback-status-msg" className="font-mono text-[11px] text-emerald-300">
            {status}
          </p>
        )}
      </form>
    </section>
  )

  if (mode === 'card') {
    return formCard
  }

  return (
    <div
      className="fixed left-3 z-40"
      style={{ bottom: 'max(14px, env(safe-area-inset-bottom))' }}
    >
      {open ? (
        <div style={{ width: 'min(340px, calc(100vw - 24px))' }}>{formCard}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="beta-feedback-pill"
          className="dark inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-cyan-400/35 bg-[#060a10]/95 px-3.5 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:border-emerald-400"
        >
          <span>Beta Feedback</span>
        </button>
      )}
    </div>
  )
}

export default BetaFeedbackWidget
