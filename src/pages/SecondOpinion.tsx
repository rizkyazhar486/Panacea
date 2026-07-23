import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconStethoscope } from '../components/icons'
import { api, type BackendSecondOpinion } from '../lib/api'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Second Opinion — human-in-the-loop, same pattern as AI-EMR: a patient
// submits their current diagnosis/treatment/symptoms, an AI drafts a
// structured analysis PRIVATELY, and a real licensed doctor reviews, edits,
// and approves it before the patient ever sees anything. The patient never
// receives the raw AI draft — only the doctor's finalized opinion.
// Server-persisted (see server/src/store.ts SecondOpinion + server/src/ai.ts
// draftSecondOpinion).
// ─────────────────────────────────────────────────────────────────────────────

function PatientView({ email }: { email: string }) {
  const [currentDiagnosis, setCurrentDiagnosis] = useState('')
  const [currentTreatment, setCurrentTreatment] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [history, setHistory] = useState('')
  const [requests, setRequests] = useState<BackendSecondOpinion[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const refresh = () => {
    api.listSecondOpinions().then(setRequests).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { refresh() }, [])

  const submit = async () => {
    if (!currentDiagnosis.trim() && !symptoms.trim()) { setError('Describe your current diagnosis or your symptoms at minimum.'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.submitSecondOpinion({ currentDiagnosis: currentDiagnosis.trim(), currentTreatment: currentTreatment.trim(), symptoms: symptoms.trim(), history: history.trim() })
      setCurrentDiagnosis(''); setCurrentTreatment(''); setSymptoms(''); setHistory('')
      setSubmitted(true)
      refresh()
    } catch {
      setError('Could not submit your request — check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Request a Second Opinion" subtitle="AI drafts privately, a real doctor reviews before you see anything" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Describe your current diagnosis, treatment, symptoms, and relevant history. An AI assistant
          drafts a structured analysis, but <b>you will never see that draft</b> — a licensed doctor
          reviews it, edits it, and writes the opinion you actually receive. Think of the AI as the
          doctor's research assistant, not your doctor.
        </p>
      </Card>

      <Card className="!p-5">
        <Field label="Your current diagnosis (if any)">
          <textarea className={`${inputClass} min-h-16`} placeholder="e.g. Diagnosed with type 2 diabetes 6 months ago" value={currentDiagnosis} onChange={(e) => setCurrentDiagnosis(e.target.value)} />
        </Field>
        <Field label="Your current treatment/medication (if any)">
          <textarea className={`${inputClass} mt-3 min-h-16`} placeholder="e.g. Metformin 500mg twice daily" value={currentTreatment} onChange={(e) => setCurrentTreatment(e.target.value)} />
        </Field>
        <Field label="Symptoms you're experiencing">
          <textarea className={`${inputClass} mt-3 min-h-16`} placeholder="e.g. Persistent fatigue and tingling in both feet for the last month" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        </Field>
        <Field label="Relevant history (other conditions, family history, allergies)">
          <textarea className={`${inputClass} mt-3 min-h-16`} placeholder="e.g. Father had type 2 diabetes; no known drug allergies" value={history} onChange={(e) => setHistory(e.target.value)} />
        </Field>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button onClick={submit} disabled={submitting} className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit for doctor review'}
        </button>
        {submitted && <p className="mt-2 text-center text-[12px] font-semibold text-brand-dark">Submitted — you'll see the doctor's opinion here once it's ready.</p>}
      </Card>

      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your requests</div>
      {loading && <Card className="!p-5 text-center text-sm text-neutral-400">Loading…</Card>}
      {!loading && requests.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-400">No requests yet.</Card>}
      {requests.map((r) => (
        <Card key={r.id} className="!p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-neutral-500">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <Badge tone={r.status === 'completed' ? 'brand' : 'low'}>{r.status === 'completed' ? 'Reviewed' : 'Awaiting doctor'}</Badge>
          </div>
          <p className="mt-1.5 text-[13px] text-neutral-600 dark:text-neutral-300"><b>You reported:</b> {r.currentDiagnosis || r.symptoms}</p>
          {r.status === 'completed' && r.finalOpinion && (
            <div className="mt-3 rounded-xl bg-brand/10 p-3">
              <div className="text-[11px] font-bold text-brand-dark">Dr. {r.doctorName}'s opinion</div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink dark:text-white">{r.finalOpinion}</p>
            </div>
          )}
        </Card>
      ))}
    </>
  )
}

function DoctorView({ name, email }: { name: string; email: string }) {
  const [queue, setQueue] = useState<BackendSecondOpinion[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)
  const [draftText, setDraftText] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const refresh = () => {
    api.listSecondOpinions().then((rows) => {
      setQueue(rows)
      setDraftText((s) => {
        const next = { ...s }
        for (const r of rows) if (next[r.id] === undefined) next[r.id] = r.aiDraft || ''
        return next
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { refresh() }, [])

  const submit = async (id: string) => {
    const text = (draftText[id] || '').trim()
    if (!text) return
    setSaving(id)
    try {
      await api.completeSecondOpinion(id, text)
      setOpen(null)
      refresh()
    } catch { /* ignore transient failure — doctor can retry */ }
    setSaving(null)
  }

  return (
    <>
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Second Opinion — Review Queue" subtitle="AI drafts privately; your edited answer is what the patient receives" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Every request below includes an AI-drafted analysis as a starting point. Edit it freely — the
          patient only ever sees what you submit, never the raw draft.
        </p>
      </Card>

      {loading && <Card className="!p-5 text-center text-sm text-neutral-400">Loading…</Card>}
      {!loading && queue.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-400">No pending requests — queue is clear.</Card>}

      {queue.map((r) => {
        const isOpen = open === r.id
        return (
          <Card key={r.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : r.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
              <div className="min-w-0">
                <div className="text-[15px] font-black text-ink dark:text-white">{r.patientName}</div>
                <div className="truncate text-[12px] text-neutral-500">{r.currentDiagnosis || r.symptoms}</div>
              </div>
              <span className="shrink-0 text-neutral-300">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 p-4 dark:border-white/10">
                <div className="grid gap-2 text-[13px]">
                  {r.currentDiagnosis && <p><b className="text-neutral-500">Current diagnosis:</b> {r.currentDiagnosis}</p>}
                  {r.currentTreatment && <p><b className="text-neutral-500">Current treatment:</b> {r.currentTreatment}</p>}
                  {r.symptoms && <p><b className="text-neutral-500">Symptoms:</b> {r.symptoms}</p>}
                  {r.history && <p><b className="text-neutral-500">History:</b> {r.history}</p>}
                </div>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-400">Your opinion (AI draft prefilled — edit freely)</div>
                <textarea
                  className={`${inputClass} mt-1.5 min-h-40`}
                  value={draftText[r.id] ?? ''}
                  onChange={(e) => setDraftText((s) => ({ ...s, [r.id]: e.target.value }))}
                />
                <button
                  onClick={() => submit(r.id)}
                  disabled={saving === r.id || !(draftText[r.id] || '').trim()}
                  className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving === r.id ? 'Sending…' : `Send opinion as Dr. ${name}`}
                </button>
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}

export function SecondOpinion() {
  const { account } = useStore()
  const isDoctor = account?.role === 'dokter' || account?.role === 'owner'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {isDoctor
        ? <DoctorView name={account?.name || 'Doctor'} email={account?.email || ''} />
        : <PatientView email={account?.email || ''} />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        AI drafts a starting analysis, but every second opinion sent to a patient is written and
        approved by a licensed doctor — the same human-in-the-loop review already used for AI-EMR.
        This does not replace an in-person evaluation for anything urgent.
      </div>
    </div>
  )
}

export default SecondOpinion
