import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { DOCTOR_REVIEW_CHECKLIST, doctorReviewIsComplete } from '../domains/clinical-review'
import { Prosa } from '../components/Prosa'

export function DoctorReviewChecklist() {
  const { account } = useStore()
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set())
  const [reviewerId, setReviewerId] = useState('')
  const [notes, setNotes] = useState('')
  const [reviewedAt, setReviewedAt] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const authorized = account?.role === 'dokter' || Boolean(account?.isOwner)
  const requiredComplete = useMemo(() => doctorReviewIsComplete(checkedIds), [checkedIds])
  const canMarkReviewed = authorized && requiredComplete && Boolean(reviewerId.trim())

  const toggle = (id: string) => {
    setReviewedAt(null)
    setCheckedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markReviewed = () => {
    if (!canMarkReviewed) return
    setReviewedAt(new Date().toISOString())
  }

  const copySummary = async () => {
    if (!reviewedAt) return
    const completed = DOCTOR_REVIEW_CHECKLIST.filter((item) => checkedIds.has(item.id)).map((item) => `- [x] ${item.label}`)
    const summary = [
      'Panacea Doctor Review',
      `Reviewer: ${reviewerId.trim()}`,
      `Reviewed at: ${reviewedAt}`,
      '',
      ...completed,
      '',
      'Notes:',
      notes.trim() || 'No additional notes.',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  if (!authorized) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 py-10">
        <p className="text-xs font-black uppercase tracking-[.14em] text-white/45">Doctor surface</p>
        <h1 className="text-3xl font-black tracking-[-.04em]">Review checklist</h1>
        <p className="max-w-2xl text-sm leading-6 text-white/60">
          This workspace is reserved for the doctor team. Engineering work and automated validation continue independently of this human-review surface.
        </p>
        <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center border-b border-white/30 text-sm font-black">Back to Clinical →</Link>
      </main>
    )
  }

  return (
    <main className="dark mx-auto w-full max-w-4xl space-y-8 pb-24 text-white">
      <header className="border-b border-white/10 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200/65">Doctor workspace · human review</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-[-.05em] sm:text-4xl">Review Checklist</h1>
            <Prosa kelas="mt-3 max-w-2xl text-sm leading-6 text-white/55">{'Review means inspect, document, and leave human notes. There is no approve/reject control on this page. Automated safety, provenance, privacy, and CI gates remain separate and continue to run independently.'}</Prosa>
          </div>
          <div className="flex gap-4"><Link to="/doctor-review/body" className="text-xs font-black text-white/50 hover:text-white">Body structures →</Link><Link to="/clinical-hub" className="text-xs font-black text-white/50 hover:text-white">Clinical →</Link></div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]" aria-label="Reviewer identity">
        <label className="border-b border-white/10 pb-3">
          <span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Reviewer identifier</span>
          <input
            value={reviewerId}
            onChange={(event) => { setReviewerId(event.target.value); setReviewedAt(null) }}
            placeholder="Doctor / reviewer ID"
            className="mt-2 w-full bg-transparent text-sm font-bold outline-none placeholder:text-white/25"
          />
        </label>
        <div className="border-b border-white/10 pb-3 text-right">
          <span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Required items</span>
          <strong className="mt-2 block text-xl tabular-nums">
            {DOCTOR_REVIEW_CHECKLIST.filter((item) => item.required && checkedIds.has(item.id)).length}/
            {DOCTOR_REVIEW_CHECKLIST.filter((item) => item.required).length}
          </strong>
        </div>
      </section>

      <section className="divide-y divide-white/10 border-y border-white/10" aria-label="Doctor review checklist items">
        {DOCTOR_REVIEW_CHECKLIST.map((item) => {
          const checked = checkedIds.has(item.id)
          return (
            <label key={item.id} className="grid cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-3 py-4">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.id)}
                className="mt-1 h-4 w-4 accent-emerald-400"
              />
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{item.label}</strong>
                  {item.required && <span className="text-[9px] font-black uppercase tracking-[.12em] text-emerald-200/55">required</span>}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/45">{item.detail}</span>
              </span>
            </label>
          )
        })}
      </section>

      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-[.14em] text-white/40">Human notes</span>
        <textarea
          value={notes}
          onChange={(event) => { setNotes(event.target.value); setReviewedAt(null) }}
          rows={5}
          placeholder="Observations, corrections, follow-up items. Avoid unnecessary patient identifiers."
          className="mt-3 w-full resize-y border border-white/10 bg-white/[.025] p-4 text-sm leading-6 outline-none focus:border-white/25"
        />
      </label>

      <section className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={markReviewed}
          disabled={!canMarkReviewed}
          className="min-h-[46px] rounded-full bg-white px-5 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-30"
        >
          Mark reviewed
        </button>
        <button
          type="button"
          onClick={copySummary}
          disabled={!reviewedAt}
          className="min-h-[46px] rounded-full border border-white/15 px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Copy review summary
        </button>
        <button
          type="button"
          onClick={() => { setCheckedIds(new Set()); setReviewerId(''); setNotes(''); setReviewedAt(null); setCopyState('idle') }}
          className="min-h-[46px] px-3 text-xs font-black text-white/45 hover:text-white"
        >
          New review
        </button>
      </section>

      <output aria-live="polite" className="block border-l-2 border-emerald-300/40 pl-4 text-xs leading-5 text-white/55">
        {reviewedAt
          ? `Reviewed by ${reviewerId.trim()} at ${reviewedAt}. This is a human review record for the current session, not a clinical authorization decision.`
          : requiredComplete
            ? 'Required checklist complete. Add a reviewer identifier to mark this review as reviewed.'
            : 'Review remains open. Engineering and automated validation are not blocked by this checklist.'}
        {copyState === 'copied' ? ' Summary copied.' : copyState === 'failed' ? ' Clipboard copy failed.' : ''}
      </output>
    </main>
  )
}

export default DoctorReviewChecklist
