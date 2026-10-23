import { useCallback, useEffect, useRef, useState } from 'react'
import { api, GalatApi } from '../../lib/api'
import type { Role } from '../../lib/types'

type Staf = { id: string; name: string; email: string; role: Role; patientIds: string[] }
const ALASAN: Record<string, string> = {
  'not-eligible': 'This account cannot be changed (clinician, admin or owner accounts are never converted).', 'not-found': 'Account not found.',
  'invalid-input': 'Check the values you entered.', forbidden: 'Only the owner can manage staff access.',
}

// Owner-only: memberi/mencabut peran perawat atau lab dan menugaskan pasien (hak akses minimum). Server menegakkan semua aturan.
export function OwnerStaffPanel() {
  const [staff, setStaff] = useState<Staf[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<{ id: string; name: string; role: Role }[] | null>(null)
  const [patientFor, setPatientFor] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    try { setStaff(await api.ownerStaff()); setLoadError(false) } catch { setLoadError(true) }
  }, [])
  useEffect(() => { void load() }, [load])

  const run = async (fn: () => Promise<void>) => {
    if (busy || inFlight.current) return
    inFlight.current = true; setBusy(true); setMsg(null)
    try { await fn() } catch (e) { setMsg({ kind: 'error', text: e instanceof GalatApi ? (ALASAN[e.message] ?? 'The server rejected this request.') : 'Could not reach the server.' }) }
    finally { setBusy(false); inFlight.current = false }
  }
  const search = () => run(async () => {
    const q = query.trim()
    if (q.length < 2) { setFound([]); return }
    setFound((await api.cariOrang(q)).filter((p) => p.role === 'pasien'))
  })
  const grant = (id: string, name: string, role: 'perawat' | 'lab') => run(async () => { await api.ownerStaffRole(id, role); setMsg({ kind: 'ok', text: `${name} is now ${role === 'perawat' ? 'a nurse' : 'lab staff'}.` }); setFound(null); await load() })
  const revokeRole = (id: string) => run(async () => { await api.ownerStaffRole(id, 'pasien'); setMsg({ kind: 'ok', text: 'Staff role removed; all patient access removed.' }); await load() })
  const assign = (id: string, revoke: boolean) => run(async () => {
    const pid = (patientFor[id] ?? '').trim()
    if (!pid) { setMsg({ kind: 'error', text: 'Enter a patient ID first.' }); return }
    const r = await api.ownerStaffAssign(id, pid, revoke)
    setMsg({ kind: 'ok', text: revoke ? (r.changed ? 'Patient access removed.' : 'That patient was not assigned.') : (r.changed ? 'Patient access granted.' : 'That patient was already assigned.') })
    await load()
  })

  return (
    <section aria-label="Manage lab staff" className="space-y-3 border border-white/10 p-4">
      <h2 className="text-sm font-black">Nurse and lab staff</h2>
      <p className="text-xs text-white/50">Staff see only the patients you assign. Removing a role removes all of its patient access.</p>
      {loadError && <p role="alert" className="text-xs text-red-200">Could not load staff accounts.</p>}
      {staff !== null && staff.length === 0 && <p className="text-xs text-white/60">No nurse or lab accounts yet.</p>}
      {staff !== null && staff.length > 0 && (
        <ul className="space-y-3">
          {staff.map((s) => (
            <li key={s.id} className="space-y-2 border-t border-white/10 pt-2 text-xs">
              <p><span className="font-black">{s.name}</span> · {s.role === 'perawat' ? 'Nurse' : 'Lab'} · {s.patientIds.length} patient{s.patientIds.length === 1 ? '' : 's'}</p>
              {s.patientIds.length > 0 && <p className="break-all font-mono text-white/60">{s.patientIds.join(', ')}</p>}
              <label className="block font-black text-white/60">Patient ID for {s.name}
                <input value={patientFor[s.id] ?? ''} maxLength={96} onChange={(e) => setPatientFor((p) => ({ ...p, [s.id]: e.target.value }))} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={() => void assign(s.id, false)} className="min-h-[44px] border-b border-emerald-200/60 font-black text-emerald-100 disabled:opacity-40">Give patient access to {s.name}</button>
                <button type="button" disabled={busy} onClick={() => void assign(s.id, true)} className="min-h-[44px] border-b border-amber-200/60 font-black text-amber-100 disabled:opacity-40">Remove patient access from {s.name}</button>
                <button type="button" disabled={busy} onClick={() => void revokeRole(s.id)} className="min-h-[44px] border-b border-red-300/60 font-black text-red-100 disabled:opacity-40">Remove staff role from {s.name}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className="block text-xs font-black text-white/60">Find an account by name to make staff
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 block min-h-[44px] w-full bg-black/40 px-2 text-sm" />
      </label>
      <button type="button" disabled={busy || query.trim().length < 2} onClick={() => void search()} className="min-h-[44px] border-b border-white/40 text-sm font-black disabled:opacity-40">Search</button>
      {found !== null && found.length === 0 && <p className="text-xs text-white/60">No patient accounts match.</p>}
      {found !== null && found.length > 0 && (
        <ul className="space-y-1">
          {found.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{p.name}</span>
              <span className="flex gap-3">
                <button type="button" disabled={busy} onClick={() => void grant(p.id, p.name, 'perawat')} className="min-h-[44px] border-b border-emerald-200/60 font-black text-emerald-100 disabled:opacity-40">Make nurse: {p.name}</button>
                <button type="button" disabled={busy} onClick={() => void grant(p.id, p.name, 'lab')} className="min-h-[44px] border-b border-emerald-200/60 font-black text-emerald-100 disabled:opacity-40">Make lab staff: {p.name}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {msg && <p role={msg.kind === 'error' ? 'alert' : 'status'} className={`text-xs ${msg.kind === 'error' ? 'text-amber-200' : 'text-emerald-200'}`}>{msg.text}</p>}
    </section>
  )
}
