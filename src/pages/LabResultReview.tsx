import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { api, backendEnabled, GalatApi } from '../lib/api'
import { COMMUNICATION_CHANNELS, MAX_NOTE, buildAdvance, buildQueue, formatValue, parseLabResults, type LabResultRecord, type QueueRow } from '../domains/lab-results'

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
  const authorized = account?.role === 'dokter' || Boolean(account?.isOwner)
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [busy, setBusy] = useState<string | null>(null)
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
    if (busy) return
    const built = buildAdvance(row, comm)
    if (!built.ok) { setNotice(built.reason === 'note-too-long' ? `Note is limited to ${MAX_NOTE} characters.` : ERROR_TEXT['evidence-required']); return }
    setBusy(row.id); setNotice(null)
    try {
      await api.labResultAdvance(row.id, built.request)
      if (built.request.communication) setComm((c) => ({ ...c, note: '' }))
    } catch (e) {
      setNotice(e instanceof GalatApi ? (ERROR_TEXT[e.message] ?? 'The server rejected this step.') : 'Could not reach the server.')
    } finally {
      await refresh(); setBusy(null)
    }
  }

  if (!authorized) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 py-10">
        <h1 className="text-3xl font-black tracking-[-.04em]">Lab result review</h1>
        <p className="max-w-2xl text-sm leading-6 text-white/60">This queue is reserved for clinicians.</p>
        <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center border-b border-white/30 text-sm font-black">Back to Clinical →</Link>
      </main>
    )
  }

  return (
    <main className="dark mx-auto w-full max-w-4xl space-y-6 pb-24 text-white">
      <header className="border-b border-white/10 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200/65">Doctor workspace · workflow only</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">Lab result review</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Moves a result through review, communication and closure. Every step is audited on the server. It does not interpret values; reference ranges are shown only as recorded.</p>
      </header>

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
            {r.nextStatus && (
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
                <button type="button" disabled={busy !== null || (r.nextStatus === 'communicated' && !comm.note.trim())} onClick={() => void advance(r)}
                  className="min-h-[44px] border-b border-emerald-200/60 text-sm font-black text-emerald-100 disabled:opacity-40">
                  {busy === r.id ? 'Saving…' : ACTION_LABEL[r.nextStatus]}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center text-xs font-black text-white/50 hover:text-white">Clinical →</Link>
    </main>
  )
}
