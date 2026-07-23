import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconShield } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Vaccine / Immunization Schedule Tracker — log your last dose of each common
// adult vaccine and see when the next one is due, based on standard
// WHO / CDC / Indonesian Ministry of Health adult immunization interval
// guidance. Not a substitute for your clinician's recommendation — intervals
// vary by local epidemiology, risk factors, and specific vaccine brand.
// Pure client-side arithmetic + localStorage, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface VaccineDef { id: string; name: string; everyYears: number | null; note: string }
const VACCINES: VaccineDef[] = [
  { id: 'influenza', name: 'Influenza (flu)', everyYears: 1, note: 'Annual, ideally before flu season.' },
  { id: 'tdap', name: 'Tdap / Td (tetanus-diphtheria-pertussis)', everyYears: 10, note: 'Booster every 10 years for adults; sooner after a dirty/deep wound if it has been >5 years.' },
  { id: 'covid', name: 'COVID-19 booster', everyYears: 1, note: 'Interval varies with current local health-ministry guidance — treat this as a rough annual reminder, confirm the latest recommendation.' },
  { id: 'hepb', name: 'Hepatitis B', everyYears: null, note: 'Typically a 2-3 dose primary series, not a routine repeat booster for most healthy adults — check your prior series status with a clinician.' },
  { id: 'mmr', name: 'MMR (measles-mumps-rubella)', everyYears: null, note: 'Usually 1-2 lifetime doses for adults without documented immunity — not a routine repeat.' },
  { id: 'varicella', name: 'Varicella (chickenpox)', everyYears: null, note: '2-dose series if no prior infection/vaccination — not a routine repeat.' },
  { id: 'pneumococcal', name: 'Pneumococcal (PCV/PPSV)', everyYears: null, note: 'Recommended once age 65+ or with certain risk conditions — timing/sequence is specific, discuss with a clinician.' },
  { id: 'shingles', name: 'Shingles (zoster)', everyYears: null, note: '2-dose series recommended from age 50 — not an annual repeat.' },
  { id: 'hpv', name: 'HPV', everyYears: null, note: '2-3 dose series typically completed by age 26 — not an annual repeat.' },
]

const LS_KEY = 'pmd_vaccine_tracker_v1'
type Log = Record<string, string> // vaccineId -> ISO date of last dose

function load(): Log {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return {}
}
function save(log: Log) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(log)) } catch { /* ignore */ }
}

function addYears(iso: string, years: number): Date {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + years)
  return d
}
function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

export function VaccineTracker() {
  const [log, setLog] = useState<Log>(load)

  const setDate = (id: string, date: string) => {
    setLog((s) => {
      const next = { ...s, [id]: date }
      save(next)
      return next
    })
  }
  const clear = (id: string) => {
    setLog((s) => {
      const next = { ...s }
      delete next[id]
      save(next)
      return next
    })
  }

  const rows = useMemo(() => {
    return VACCINES.map((v) => {
      const last = log[v.id]
      let dueDate: Date | null = null
      let daysLeft: number | null = null
      if (last && v.everyYears) {
        dueDate = addYears(last, v.everyYears)
        daysLeft = daysUntil(dueDate)
      }
      return { v, last, dueDate, daysLeft }
    })
  }, [log])

  const overdue = rows.filter((r) => r.daysLeft !== null && r.daysLeft <= 0)
  const dueSoon = rows.filter((r) => r.daysLeft !== null && r.daysLeft > 0 && r.daysLeft <= 30)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Vaccine / Immunization Tracker" subtitle="Log your last dose, see when the next is due" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Enter the date of your last dose for each vaccine — for the ones given on a regular interval
          (flu, Tdap, COVID booster), you'll see a due date. Multi-dose series (MMR, HPV, shingles,
          pneumococcal, hepatitis B) aren't routine repeats, so track your series status with a
          clinician instead of a countdown here.
        </p>
      </Card>

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Card className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Reminders</div>
          <div className="mt-2 space-y-1.5">
            {overdue.map((r) => (
              <div key={r.v.id} className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-[13px] dark:bg-red-500/10">
                <span className="font-bold text-red-700 dark:text-red-300">{r.v.name}</span>
                <Badge tone="critical">Overdue {Math.abs(r.daysLeft!)}d</Badge>
              </div>
            ))}
            {dueSoon.map((r) => (
              <div key={r.v.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-[13px] dark:bg-amber-500/10">
                <span className="font-bold text-amber-700 dark:text-amber-300">{r.v.name}</span>
                <Badge tone="low">Due in {r.daysLeft}d</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rows.map(({ v, last, dueDate }) => (
        <Card key={v.id} className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-black text-ink dark:text-white">{v.name}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{v.note}</p>
            </div>
            {v.everyYears && <Badge tone="brand">Every {v.everyYears}y</Badge>}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <Field label="Last dose date">
              <input className={inputClass} type="date" value={last || ''} onChange={(e) => setDate(v.id, e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            {last && <button onClick={() => clear(v.id)} className="mb-0.5 rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] font-bold text-neutral-500 dark:bg-white/10">Clear</button>}
          </div>
          {dueDate && (
            <p className="mt-2 text-[12px] font-semibold text-neutral-500">
              Next due: {dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Based on typical WHO/CDC adult immunization interval guidance — actual recommendations vary by
        country, age, prior doses, and health conditions. This is a personal reminder tool, not medical
        advice; confirm your schedule with a clinician or your local immunization program.
      </div>
    </div>
  )
}

export default VaccineTracker
