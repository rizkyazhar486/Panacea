import { useEffect, useRef, useState } from 'react'
import { api, GalatApi } from '../../lib/api'

// Intake hasil lab oleh perawat/staf lab untuk pasien yang DITUGASKAN. Server menegakkan penugasan; formulir hanya menawarkan pasien yang ditugaskan.
// Tidak menafsirkan nilai dan tidak menebak rentang rujukan.
export function StaffIntakeForm({ onSaved }: { onSaved: () => void }) {
  const [patients, setPatients] = useState<string[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [collectedAt, setCollectedAt] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    let alive = true
    api.staffMine().then((a) => { if (alive) { const ids = [...new Set(a)].sort(); setPatients(ids); setPatientId((p) => p || ids[0] || '') } })
      .catch(() => { if (alive) setLoadError(true) })
    return () => { alive = false }
  }, [])

  const numeric = Number(value)
  const valid = Boolean(patientId) && name.trim().length > 0 && value.trim() !== '' && Number.isFinite(numeric) && /^\d{4}-\d{2}-\d{2}$/.test(collectedAt)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy || inFlight.current) return
    inFlight.current = true; setBusy(true); setMsg(null)
    try {
      await api.labResultCreate({ patientId, source: 'lab-intake', item: { name: name.trim(), value: numeric, ...(unit.trim() ? { unit: unit.trim() } : {}), collectedAt } })
      setMsg({ kind: 'ok', text: 'Result recorded.' }); setName(''); setValue(''); setUnit(''); onSaved()
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof GalatApi && err.status === 403 ? 'You are not assigned to this patient.' : 'Could not record this result.' })
    } finally { setBusy(false); inFlight.current = false }
  }

  return (
    <form onSubmit={submit} aria-label="Record a lab result" className="space-y-3 border border-white/10 p-4">
      <h2 className="text-sm font-black">Record a result</h2>
      {patients === null && !loadError && <p role="status" className="text-xs text-white/60">Loading assigned patients…</p>}
      {loadError && <p role="alert" className="text-xs text-red-200">Could not load your assigned patients.</p>}
      {patients !== null && patients.length === 0 && <p className="text-xs text-white/60">No patients are assigned to you yet. Ask the owner to assign one.</p>}
      {patients !== null && patients.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-black text-white/60">Patient
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm">
              {patients.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs font-black text-white/60">Test name
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
          </label>
          <label className="text-xs font-black text-white/60">Value
            <input value={value} inputMode="decimal" onChange={(e) => setValue(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
          </label>
          <label className="text-xs font-black text-white/60">Unit (optional)
            <input value={unit} maxLength={24} onChange={(e) => setUnit(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
          </label>
          <label className="text-xs font-black text-white/60">Collected on
            <input type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
          </label>
        </div>
      )}
      {patients !== null && patients.length > 0 && (
        <button type="submit" disabled={!valid || busy} className="min-h-[44px] border-b border-emerald-200/60 text-sm font-black text-emerald-100 disabled:opacity-40">{busy ? 'Saving…' : 'Record result'}</button>
      )}
      {msg && <p role={msg.kind === 'error' ? 'alert' : 'status'} className={`text-xs ${msg.kind === 'error' ? 'text-amber-200' : 'text-emerald-200'}`}>{msg.text}</p>}
    </form>
  )
}
