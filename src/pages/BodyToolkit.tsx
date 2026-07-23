import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Body & Skin Toolkit — three small real tools in one page: a drag-order
// skincare routine builder, a body-region symptom tracker (region buttons
// instead of a full SVG map, for reliability across screen sizes), and a NEAT
// (non-exercise activity) daily tracker. Pure client-side state,
// localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'skincare' | 'symptom-map' | 'neat'

const SKINCARE_STEPS = ['Cleanser', 'Vitamin C serum', 'Retinol/Retinoid', 'Moisturizer', 'Sunscreen (SPF)', 'Niacinamide', 'Eye cream', 'Exfoliant (AHA/BHA)']
const SKINCARE_KEY = 'pmd_skincare_routine_v1'
function SkincareBuilder() {
  const [routine, setRoutine] = useState<{ morning: string[]; night: string[] }>(() => {
    try { return JSON.parse(localStorage.getItem(SKINCARE_KEY) || '') } catch { return { morning: [], night: [] } }
  })
  useEffect(() => { try { localStorage.setItem(SKINCARE_KEY, JSON.stringify(routine)) } catch { /* ignore */ } }, [routine])

  const toggle = (period: 'morning' | 'night', step: string) => {
    setRoutine((r) => ({ ...r, [period]: r[period].includes(step) ? r[period].filter((s) => s !== step) : [...r[period], step] }))
  }
  const move = (period: 'morning' | 'night', i: number, dir: -1 | 1) => {
    setRoutine((r) => {
      const list = [...r[period]]
      const j = i + dir
      if (j < 0 || j >= list.length) return r;
      [list[i], list[j]] = [list[j], list[i]]
      return { ...r, [period]: list }
    })
  }

  const Period = ({ period, label }: { period: 'morning' | 'night'; label: string }) => (
    <div>
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {SKINCARE_STEPS.filter((s) => !routine[period].includes(s)).map((s) => (
          <button key={s} onClick={() => toggle(period, s)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">+ {s}</button>
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
        {routine[period].map((s, i) => (
          <div key={s} className="flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2">
            <span className="text-[11px] font-black text-brand-dark">{i + 1}</span>
            <span className="flex-1 text-[13px] font-semibold text-ink dark:text-white">{s}</span>
            <button onClick={() => move(period, i, -1)} className="text-neutral-400">↑</button>
            <button onClick={() => move(period, i, 1)} className="text-neutral-400">↓</button>
            <button onClick={() => toggle(period, s)} className="text-red-500">✕</button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card className="!p-5 space-y-4">
      <p className="text-[13px] text-neutral-500">Tap to add a step, then reorder with the arrows — order matters (thinnest-to-thickest texture, actives before moisturizer, sunscreen last in the morning).</p>
      <Period period="morning" label="☀️ Morning" />
      <Period period="night" label="🌙 Night" />
    </Card>
  )
}

const BODY_REGIONS = ['Head/Neck', 'Chest', 'Abdomen', 'Left Arm', 'Right Arm', 'Lower Back', 'Left Leg', 'Right Leg']
const SYMPTOM_KEY = 'pmd_symptom_map_v1'
interface SymptomLog { t: number; region: string; severity: number; note: string }
function SymptomBodyMap() {
  const [logs, setLogs] = useState<SymptomLog[]>(() => { try { return JSON.parse(localStorage.getItem(SYMPTOM_KEY) || '[]') } catch { return [] } })
  const [region, setRegion] = useState(BODY_REGIONS[0])
  const [severity, setSeverity] = useState(3)
  const [note, setNote] = useState('')
  useEffect(() => { try { localStorage.setItem(SYMPTOM_KEY, JSON.stringify(logs)) } catch { /* ignore */ } }, [logs])

  const save = () => { setLogs((l) => [{ t: Date.now(), region, severity, note: note.trim() }, ...l].slice(0, 30)); setNote('') }
  const byRegion = useMemo(() => {
    const m: Record<string, number> = {}
    for (const l of logs) m[l.region] = (m[l.region] || 0) + 1
    return m
  }, [logs])

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Log where you're feeling pain/fatigue/discomfort — patterns across regions and time are useful to bring to a clinician.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BODY_REGIONS.map((r) => (
          <button key={r} onClick={() => setRegion(r)} className={`rounded-xl px-3 py-2 text-[12px] font-bold transition ${region === r ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
            {r} {byRegion[r] ? <span className="opacity-70">({byRegion[r]})</span> : ''}
          </button>
        ))}
      </div>
      <Field label={`Severity: ${severity}/10`}>
        <input className="mt-1 w-full accent-brand" type="range" min={0} max={10} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} />
      </Field>
      <Field label="Note (optional)">
        <input className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sharp, dull, since when…" />
      </Field>
      <button onClick={save} className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Log entry</button>
      <div className="mt-4 space-y-2">
        {logs.slice(0, 8).map((l) => (
          <div key={l.t} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-[12px] dark:bg-white/5">
            <span className="font-bold text-ink dark:text-white">{l.region}</span>
            <span className="text-neutral-500">{l.severity}/10 · {new Date(l.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const NEAT_KEY = 'pmd_neat_tracker_v1'
function NeatTracker() {
  const today = new Date().toISOString().slice(0, 10)
  const [minutes, setMinutes] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem(NEAT_KEY) || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem(NEAT_KEY, JSON.stringify(minutes)) } catch { /* ignore */ } }, [minutes])
  const todayMin = minutes[today] || 0
  const weekTotal = useMemo(() => {
    let s = 0
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); s += minutes[d.toISOString().slice(0, 10)] || 0 }
    return s
  }, [minutes])
  return (
    <Card className="!p-5">
      <p className="text-[13px] leading-relaxed text-neutral-500">
        NEAT (Non-Exercise Activity Thermogenesis) — walking, standing, fidgeting, chores — often burns
        more calories over a day than a single workout, and standing/walking hours correlate with
        better metabolic health independent of formal exercise.
      </p>
      <Field label="Standing/walking minutes today">
        <input className={`${inputClass} mt-1`} type="number" min={0} max={1440} value={todayMin || ''} onChange={(e) => setMinutes((m) => ({ ...m, [today]: Number(e.target.value) || 0 }))} placeholder="0" />
      </Field>
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-brand/10 p-3"><div className="text-xl font-black text-brand-dark">{Math.round(todayMin / 60 * 10) / 10}h</div><div className="text-[11px] text-neutral-500">Today</div></div>
        <div className="rounded-xl bg-brand/10 p-3"><div className="text-xl font-black text-brand-dark">{Math.round(weekTotal / 60 * 10) / 10}h</div><div className="text-[11px] text-neutral-500">Last 7 days</div></div>
      </div>
      {todayMin >= 180 && <Badge tone="brand">✓ Great NEAT day</Badge>}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'skincare', label: 'Skincare Builder' },
  { id: 'symptom-map', label: 'Symptom Map' },
  { id: 'neat', label: 'NEAT Tracker' },
]

export function BodyToolkit() {
  const [tab, setTab] = useState<Tab>('skincare')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Body & Skin Toolkit" subtitle="Three small real body-tracking tools in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'skincare' && <SkincareBuilder />}
      {tab === 'symptom-map' && <SymptomBodyMap />}
      {tab === 'neat' && <NeatTracker />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Self-tracking tools — not a dermatology consultation or a clinical symptom assessment. Persistent
        or worsening symptoms deserve an actual exam, not just a log entry.
      </div>
    </div>
  )
}

export default BodyToolkit
