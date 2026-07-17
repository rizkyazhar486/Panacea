import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconHeart, IconShield, IconActivity } from '../components/icons'
import { uid } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Family Health History ("Legacy Tree") — record relatives and their major
// conditions, and get early-screening flags based on how close and how many
// affected relatives you have. Family history is one of the strongest,
// cheapest risk signals in medicine; first-degree relatives (parents, siblings,
// children) weigh far more than distant ones. Pure data + transparent rules,
// stored locally, no images. Meant as an early-warning nudge, not a diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

type Degree = 'first' | 'second'
const RELATIVES: { id: string; label: string; degree: Degree }[] = [
  { id: 'mother', label: 'Mother', degree: 'first' },
  { id: 'father', label: 'Father', degree: 'first' },
  { id: 'sister', label: 'Sister', degree: 'first' },
  { id: 'brother', label: 'Brother', degree: 'first' },
  { id: 'daughter', label: 'Daughter', degree: 'first' },
  { id: 'son', label: 'Son', degree: 'first' },
  { id: 'grandmother', label: 'Grandmother', degree: 'second' },
  { id: 'grandfather', label: 'Grandfather', degree: 'second' },
  { id: 'aunt', label: 'Aunt', degree: 'second' },
  { id: 'uncle', label: 'Uncle', degree: 'second' },
]

const CONDITIONS = [
  { id: 'diabetes', label: 'Type 2 Diabetes', screen: 'Fasting glucose / HbA1c', earlyIfYoung: true },
  { id: 'hypertension', label: 'High Blood Pressure', screen: 'Regular blood-pressure checks' },
  { id: 'heart', label: 'Heart Disease / Heart Attack', screen: 'Lipid panel + cardiovascular risk assessment', earlyIfYoung: true },
  { id: 'stroke', label: 'Stroke', screen: 'Blood pressure + lipids + atrial-fibrillation check' },
  { id: 'breast_ca', label: 'Breast Cancer', screen: 'Earlier / more frequent mammography; consider genetic counselling', earlyIfYoung: true },
  { id: 'colon_ca', label: 'Colorectal Cancer', screen: 'Earlier colonoscopy (often 10 yrs before the relative’s age at diagnosis)', earlyIfYoung: true },
  { id: 'other_ca', label: 'Other Cancer', screen: 'Discuss targeted screening with a clinician' },
  { id: 'kidney', label: 'Kidney Disease', screen: 'Creatinine / eGFR + urine albumin' },
  { id: 'mental', label: 'Depression / Bipolar', screen: 'Mental-health awareness & early support' },
]

interface Member {
  id: string
  relativeId: string
  conditions: string[]
  ageDx?: number    // relative's age at diagnosis (drives "early onset" weighting)
}

const KEY = 'pmd_family_health_v1'
const load = (): Member[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }

interface RiskFlag { condition: string; level: 'elevated' | 'high'; reason: string; screen: string }

function assessRisk(members: Member[]): RiskFlag[] {
  const flags: RiskFlag[] = []
  for (const c of CONDITIONS) {
    const affected = members.filter((m) => m.conditions.includes(c.id))
    if (!affected.length) continue
    const firstDeg = affected.filter((m) => RELATIVES.find((r) => r.id === m.relativeId)?.degree === 'first')
    const earlyOnset = affected.some((m) => (m.ageDx ?? 99) < 55)
    // High: ≥2 relatives affected, OR a first-degree relative with early onset.
    // Elevated: any first-degree relative, or ≥2 second-degree.
    let level: RiskFlag['level'] | null = null
    let reason = ''
    if (affected.length >= 2 || (firstDeg.length >= 1 && earlyOnset)) {
      level = 'high'
      reason = affected.length >= 2
        ? `${affected.length} relatives affected${earlyOnset ? ', with early onset' : ''}`
        : 'A close (first-degree) relative with early onset'
    } else if (firstDeg.length >= 1 || affected.length >= 2) {
      level = 'elevated'
      reason = 'A first-degree relative affected'
    } else {
      level = 'elevated'
      reason = 'A relative affected'
    }
    flags.push({ condition: c.label, level, reason, screen: c.screen })
  }
  // High risk first.
  return flags.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1))
}

export function FamilyHealth() {
  const [members, setMembers] = useState<Member[]>(load)
  const [relativeId, setRelativeId] = useState('mother')
  const [conds, setConds] = useState<string[]>([])
  const [ageDx, setAgeDx] = useState<number | ''>('')

  function persist(next: Member[]) {
    setMembers(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }
  function addMember() {
    if (!conds.length) return
    persist([...members, { id: uid(), relativeId, conditions: conds, ageDx: ageDx === '' ? undefined : Number(ageDx) }])
    setConds([]); setAgeDx('')
  }
  function removeMember(id: string) { persist(members.filter((m) => m.id !== id)) }
  function toggleCond(id: string) { setConds((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]) }

  const flags = useMemo(() => assessRisk(members), [members])
  const relLabel = (id: string) => RELATIVES.find((r) => r.id === id)?.label ?? id
  const condLabel = (id: string) => CONDITIONS.find((c) => c.id === id)?.label ?? id

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Family Health History" subtitle="Your family's conditions are an early-warning map for your own screening. Private & stored on your device." />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Add each relative and the major conditions they've had. Panaceamed flags what you should screen for earlier — closer relatives and early-onset disease weigh the most.
        </p>
      </Card>

      {/* Add relative */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Add a relative" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Relative">
            <select className={inputClass} value={relativeId} onChange={(e) => setRelativeId(e.target.value)}>
              {RELATIVES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Age at diagnosis (optional)">
            <input className={inputClass} type="number" value={ageDx} onChange={(e) => setAgeDx(e.target.value === '' ? '' : +e.target.value)} placeholder="e.g. 52" />
          </Field>
        </div>
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Conditions</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button key={c.id} onClick={() => toggleCond(c.id)}
                className={'rounded-full px-3 py-1.5 text-xs font-bold transition ' + (conds.includes(c.id) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-300')}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={addMember} className="mt-4" >+ Add to family tree</Button>
      </Card>

      {/* Family list */}
      {members.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconHeart size={20} />} title="Your family tree" />
          <div className="mt-3 space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 p-3 dark:border-white/10">
                <div>
                  <div className="text-sm font-bold text-ink dark:text-white">{relLabel(m.relativeId)}{m.ageDx ? ` · dx at ${m.ageDx}` : ''}</div>
                  <div className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">{m.conditions.map(condLabel).join(', ')}</div>
                </div>
                <button onClick={() => removeMember(m.id)} className="shrink-0 text-xs font-bold text-rose-500">Remove</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Risk flags */}
      {flags.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconShield size={20} />} title="Your screening flags" subtitle="Based on your family history — discuss timing with your doctor" />
          <div className="mt-3 space-y-2">
            {flags.map((f, i) => (
              <div key={i} className={'rounded-xl border p-3 ' + (f.level === 'high' ? 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10' : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink dark:text-white">{f.condition}</span>
                  <Badge tone={f.level === 'high' ? 'critical' : 'low'}>{f.level === 'high' ? 'Higher risk' : 'Elevated'}</Badge>
                </div>
                <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">{f.reason}</div>
                <div className="mt-1 text-[12px] font-semibold text-brand-dark">🔎 Screen: {f.screen}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational early-warning tool using standard family-history risk principles — not a genetic test or diagnosis. Share this history with your doctor, who can set the right screening schedule for you. Data stays on your device.
      </div>
    </div>
  )
}

export default FamilyHealth
