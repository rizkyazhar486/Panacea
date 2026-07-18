import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconPill, IconBell } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import type { MedReminder } from '../lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Medication Reminders — daily push notifications at a chosen time, backed by
// the server's push infrastructure (a minute-by-minute scheduler in
// server/src/index.ts). `nextFireAt` is computed HERE, client-side, from the
// user's local wall-clock time-of-day, so the server never needs to know
// their timezone: it's just a UTC instant the server compares Date.now()
// against, then rolls forward by exactly 24h after firing.
// ─────────────────────────────────────────────────────────────────────────────

// Next occurrence (today or tomorrow) of a local "HH:MM" time, as a UTC ISO instant.
function nextFireAtFor(timeOfDay: string): string {
  const [h, m] = timeOfDay.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  return d.toISOString()
}

export function MedicationReminders() {
  const [reminders, setReminders] = useState<MedReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [medName, setMedName] = useState('')
  const [dose, setDose] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('08:00')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!backendEnabled) { setLoading(false); return }
    api.listReminders().then(setReminders).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function add() {
    if (!medName.trim() || busy) return
    setBusy(true)
    try {
      const r = await api.addReminder({ medName: medName.trim(), dose: dose.trim(), timeOfDay, nextFireAt: nextFireAtFor(timeOfDay) })
      setReminders((rs) => [...rs, r])
      setMedName(''); setDose('')
    } finally { setBusy(false) }
  }

  async function toggle(r: MedReminder) {
    const updated = await api.updateReminder(r.id, { active: !r.active })
    setReminders((rs) => rs.map((x) => (x.id === r.id ? updated : x)))
  }

  async function remove(id: string) {
    await api.removeReminder(id)
    setReminders((rs) => rs.filter((r) => r.id !== id))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconPill size={20} />} title="Medication Reminders" subtitle="Get a push notification when it's time to take your medicine" />
        {!backendEnabled && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Reminders need the backend (and push notifications turned on in Settings) to actually notify you.
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Medicine name">
              <input className={inputClass} value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="e.g. Metformin" />
            </Field>
          </div>
          <Field label="Dose (optional)">
            <input className={inputClass} value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg, 2 tablets" />
          </Field>
          <Field label="Time">
            <input className={inputClass} type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
          </Field>
          <div className="sm:col-span-2 flex items-end">
            <Button onClick={add} disabled={!medName.trim() || busy} className="w-full sm:w-auto">
              <IconBell size={16} /> {busy ? 'Adding…' : 'Add reminder'}
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="!p-8 text-center"><span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></Card>
      ) : reminders.length === 0 ? (
        <Card className="!p-6 text-center text-sm text-neutral-400">No reminders yet — add your first one above.</Card>
      ) : (
        <div className="space-y-2">
          {reminders
            .slice()
            .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay))
            .map((r) => (
              <Card key={r.id} className="!p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink dark:text-white">{r.medName}</span>
                      <Badge tone={r.active ? 'brand' : 'neutral'}>{r.active ? 'Active' : 'Paused'}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {r.dose && <>{r.dose} · </>}Daily at {r.timeOfDay}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => toggle(r)}>{r.active ? 'Pause' : 'Resume'}</Button>
                    <button onClick={() => remove(r.id)} className="text-xs font-semibold text-rose-500 hover:underline">Remove</button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Reminders repeat daily at the chosen time via push notification — make sure push is turned on in
        Settings. This is a scheduling aid, not a substitute for your prescriber's instructions; always
        follow the dosing on your actual prescription/label.
      </div>
    </div>
  )
}

export default MedicationReminders
