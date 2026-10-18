import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { api, backendEnabled, GalatApi } from '../../lib/api'
import { COMMUNICATION_CHANNELS, MAX_NOTE, bolehLangkah, buildAdvance, buildQueue, formatValue, parseLabResults, peranMeja, type LabResultRecord, type QueueRow } from '../../domains/lab-results'
import { StaffIntakeForm } from '../../components/clinical/StaffIntakeForm'
import { OwnerStaffPanel } from '../../components/clinical/OwnerStaffPanel'

const STATUS_LABEL: Record<string, string> = { received: 'Received', pending_review: 'Awaiting review', reviewed: 'Reviewed', communicated: 'Communicated', closed: 'Closed' }
const ACTION_LABEL: Record<string, string> = { pending_review: 'Mark awaiting review', reviewed: 'Mark reviewed', communicated: 'Record communication', closed: 'Close result' }
const ERROR_TEXT: Record<string, string> = {
  'stale-status': 'This result changed since you opened it. The list was refreshed.',
  forbidden: 'Your role is not allowed to do this.', 'role-not-permitted': 'Your role is not allowed to do this step.',
  'clinician-not-authorized': 'Only an authorized clinician can mark a result reviewed.', 'evidence-required': 'Add how the result was communicated.',
  'not-found': 'Result not found.', 'trail-corrupt': 'Audit trail failed verification; this result is blocked.',
}

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; records: LabResultRecord[] }

export function LabResultReview() {
  const { account } = useStore()
  const peran = peranMeja(account?.role, Boolean(account?.isOwner))
  const authorized = peran !== null
  const staff = peran === 'perawat' || peran === 'lab'
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [busy, setBusy] = useState<string | null>(null)
  // Prevent repeat taps before React has rendered the busy state.
  const actionInFlight = useRef(false)
  const [cooldownRows, setCooldownRows] = useState<Record<string, boolean>>({})
  const cooldownTimers = useRef<number[]>([])
  useEffect(() => () => { for (const timer of cooldownTimers.current) window.clearTimeout(timer) }, [])
  const [notice, setNotice] = useState<string | null>(null)
  const [comm, setComm] = useState<{ channel: string; note: string }>({ channel: COMMUNICATION_CHANNELS[0], note: '' })

  const refresh = useCallback(async () => {
    try {
      const parsed = parseLabResults(await api.labResultsList())
      setLoad(parsed.ok ? { state: 'ready', records: parsed.records } : { state: 'error', message: 'The server returned results in an unexpected shape, so nothing is shown.' })
    } catch (e) {
      setLoad({ state: 'error', message: e instanceof GalatApi && e.status === 403 ? ERROR_TEXT.forbidden : 'Could not load lab results. Try again.' })
    }
  }, [])
  useEffect(() => { if (authorized && backendEnabled) void refresh() }, [authorized, refresh])

  const rows: QueueRow[] = useMemo(() => (load.state === 'ready' ? buildQueue(load.records, new Date()) : []), [load])

  const advance = async (row: QueueRow) => {
    if (busy || actionInFlight.current || cooldownRows[row.id]) return
    const built = buildAdvance(row, comm)
    if (!built.ok) { setNotice(built.reason === 'note-too-long' ? `Note is limited to ${MAX_NOTE} characters.` : ERROR_TEXT['evidence-required']); return }
    actionInFlight.current = true; setBusy(row.id); setNotice(null)
    try {
      await api.labResultAdvance(row.id, built.request)
      // The same screen coordinate becomes a different clinical action after refresh.
      // Ignore repeat physical taps on this result for 1.5 seconds after success.
      setCooldownRows((prev) => ({ ...prev, [row.id]: true }))
      cooldownTimers.current.push(window.setTimeout(() => {
        setCooldownRows((prev) => { const next = { ...prev }; delete next[row.id]; return next })
      }, 1500))
      if (built.request.communication) setComm((c) => ({ ...c, note: '' }))
    } catch (e) {
      setNotice(e instanceof GalatApi ? (ERROR_TEXT[e.message] ?? 'The server rejected this step.') : 'Could not reach the server.')
    } finally {
      try { await refresh() } finally { setBusy(null); actionInFlight.current = false }
    }
  }

  if (!authorized) {
    return (
      <section aria-label="Lab review access" className="mx-auto w-full max-w-3xl space-y-5 py-10 text-slate-900">
        <h1 className="text-3xl font-black tracking-[-.04em]">Lab result review</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">This queue is reserved for clinicians and verified nursing and lab staff.</p>
        <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center border-b border-slate-500 text-sm font-black">Back to Clinical →</Link>
      </section>
    )
  }

  return (
    <section aria-label="Lab result review" className="dark mx-auto w-full max-w-4xl space-y-6 rounded-xl bg-slate-950 px-4 pb-24 pt-6 text-white sm:px-6">
      <header className="border-b border-white/10 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200/65">{staff ? 'Staff workspace · assigned patients only' : 'Doctor workspace · workflow only'}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">Lab result review</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Review, communicate and close results; every step is audited.</p>
        <Prosa kelas="mt-1 max-w-2xl text-xs leading-5 text-white/45">It does not interpret values. Reference ranges are shown only as recorded, and the server decides who may review.</Prosa>
      </header>

      {staff && backendEnabled && <StaffIntakeForm onSaved={() => void refresh()} />}
      {account?.isOwner && backendEnabled && <OwnerStaffPanel />}
      {!backendEnabled && <p role="status" className="text-sm text-white/60">The server is not connected in this build, so there are no results to show.</p>}
      {backendEnabled && load.state === 'loading' && <p role="status" className="text-sm text-white/60">Loading results…</p>}
      {load.state === 'error' && (
        <div role="alert" className="space-y-3 border border-red-300/30 p-4 text-sm text-red-100">
          <p>{load.message}</p>
          <button type="button" onClick={() => { setLoad({ state: 'loading' }); void refresh() }} className="min-h-[44px] border-b border-white/40 font-black">Retry</button>
        </div>
      )}
      {notice && <p role="alert" className="text-sm text-amber-200">{notice}</p>}
      {load.state === 'ready' && rows.length === 0 && <p className="text-sm text-white/60">No lab results recorded yet.</p>}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border border-white/10 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-base font-black">{r.item.name} <span className="font-mono text-white/80">{formatValue(r.item)}</span></p>
              <span className={`text-[11px] font-black uppercase tracking-[.12em] ${r.needsReview ? 'text-amber-200' : 'text-white/50'}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Patient {r.patientId} · collected {r.item.collectedAt.slice(0, 10)} · {r.source === 'lab-intake' ? 'lab intake' : 'manual entry'}
              {r.item.referenceRange ? ` · recorded range ${r.item.referenceRange}` : ' · no range recorded'}
              {r.ageHours === null ? '' : ` · ${Math.floor(r.ageHours)} h since recorded`}
            </p>
            {r.nextStatus && bolehLangkah(peran, r.nextStatus) && (
              <div className="mt-3 space-y-2">
                {r.nextStatus === 'communicated' && (
                  <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                    <label className="text-xs font-black text-white/60">Channel
                      <select value={comm.channel} onChange={(e) => setComm({ ...comm, channel: e.target.value })} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm">
                        {COMMUNICATION_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-black text-white/60">What was communicated
                      <input value={comm.note} maxLength={MAX_NOTE} onChange={(e) => setComm({ ...comm, note: e.target.value })} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
                    </label>
                  </div>
                )}
                <button type="button" disabled={busy !== null || Boolean(cooldownRows[r.id]) || (r.nextStatus === 'communicated' && !comm.note.trim())} onClick={() => void advance(r)}
                  className="min-h-[44px] border-b border-emerald-200/60 text-sm font-black text-emerald-100 disabled:opacity-40">
                  {busy === r.id ? 'Saving…' : cooldownRows[r.id] ? 'Wait before next step…' : ACTION_LABEL[r.nextStatus]}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!staff && <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center text-xs font-black text-white/50 hover:text-white">Clinical →</Link>}
    </section>
  )
}
