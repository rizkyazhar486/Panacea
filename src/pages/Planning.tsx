import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconPlan, IconCheck, IconPlus, IconSparkle, IconShield } from '../components/icons'
import { scorePlanItem, WEIGHTS, S_THRESHOLD } from '../lib/cdss'
import { checkInteractions } from '../lib/ddi'
import type { PlanItem, Patient } from '../lib/types'

const CATEGORIES: PlanItem['category'][] = [
  'Suportif',
  'Definitif',
  'Edukasi',
  'Follow-up',
  'Monitoring',
]

export function Planning() {
  const { state, activePatient, saveRecord } = useStore()
  const record = state.records[activePatient.id]
  const [newCat, setNewCat] = useState<PlanItem['category']>('Definitif')
  const [newText, setNewText] = useState('')

  if (!record) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <IconPlan size={40} className="mx-auto text-brand" />
        <h3 className="mt-3 text-lg font-bold">No plan yet</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Draft a plan in the <b>AI Chatbot</b> first to generate AI plan suggestions.
        </p>
        <Link to="/chatbot" className="mt-4 inline-block">
          <Button>Open AI Chatbot</Button>
        </Link>
      </Card>
    )
  }

  function update(plan: PlanItem[]) {
    saveRecord({ ...record!, plan, updatedAt: new Date().toISOString() })
  }
  function setStatus(id: string, status: PlanItem['status']) {
    update(record!.plan.map((p) => (p.id === id ? { ...p, status } : p)))
  }
  function add() {
    if (!newText.trim()) return
    update([
      ...record!.plan,
      { id: uid(), category: newCat, text: newText.trim(), source: 'Dokter', status: 'diverifikasi' },
    ])
    setNewText('')
  }
  function remove(id: string) {
    update(record!.plan.filter((p) => p.id !== id))
  }

  const verified = record.plan.filter((p) => p.status === 'diverifikasi').length
  const pending = record.plan.filter((p) => p.status === 'usulan').length

  return (
    <div className="space-y-6">
      <CdssPanel plan={record.plan} patient={activePatient} />
      <DDICheck texts={[...record.plan.map((p) => p.text), record.anamnesis.riwayatPengobatan, ...activePatient.allergies]} />
      <SurgeryCard />

      <Card>
        <SectionTitle
          icon={<IconPlan size={20} />}
          title="Planning — AI Recommendations, Physician Verification"
          subtitle="AI proposes a treatment plan; the physician verifies, rejects, or adds to it"
          right={
            <div className="flex gap-2">
              <Badge tone="brand">{verified} verified</Badge>
              {pending > 0 && <Badge tone="high">{pending} pending</Badge>}
            </div>
          }
        />

        <div className="space-y-3">
          {record.plan.map((pi) => (
            <div
              key={pi.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 ${
                pi.status === 'diverifikasi'
                  ? 'border-brand/30 bg-brand-50/40'
                  : pi.status === 'ditolak'
                    ? 'border-neutral-200 bg-neutral-50'
                    : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone="neutral">{pi.category}</Badge>
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {pi.source === 'AI' ? <IconSparkle size={12} /> : <IconCheck size={12} />}
                    {pi.source}
                  </span>
                  {pi.status === 'usulan' && <Badge tone="high">Proposed</Badge>}
                  {pi.status === 'ditolak' && <Badge tone="neutral">Rejected</Badge>}
                </div>
                <p className={`text-sm ${pi.status === 'ditolak' ? 'text-neutral-400 line-through' : ''}`}>
                  {pi.text}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {pi.status !== 'diverifikasi' && (
                  <Button variant="outline" onClick={() => setStatus(pi.id, 'diverifikasi')}>
                    <IconCheck size={14} /> Verify
                  </Button>
                )}
                {pi.status !== 'ditolak' ? (
                  <Button variant="ghost" onClick={() => setStatus(pi.id, 'ditolak')}>
                    Reject
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => remove(pi.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {record.plan.length === 0 && (
            <p className="text-sm text-neutral-400">No plan items yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconPlus size={18} />} title="Add Physician's Plan" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field label="Category">
              <select
                className={inputClass}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as PlanItem['category'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="min-w-[240px] flex-1">
            <Field label="Instructions / Treatment">
              <input
                className={inputClass}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="e.g. Furosemide 40 mg IV — verify dose against the formulary"
              />
            </Field>
          </div>
          <Button onClick={add} disabled={!newText.trim()}>
            <IconPlus size={16} /> Add
          </Button>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          ⚕️ For high-alert medications (anticoagulants, insulin, opioids, vasopressors), AI only provides
          a range & reference — the final dose is calculated and verified by the physician.
        </p>
      </Card>
    </div>
  )
}

// ---- Drug–drug interaction (DDI) checker ----------------------------------
function DDICheck({ texts }: { texts: string[] }) {
  const hits = checkInteractions(texts)
  const toneFor = (s: string): 'critical' | 'high' | 'normal' =>
    s === 'mayor' ? 'critical' : s === 'moderat' ? 'high' : 'normal'
  return (
    <Card>
      <SectionTitle
        icon={<IconShield size={18} />}
        title="Drug–Drug Interaction (DDI) Checker"
        subtitle="Automatic screening of the plan + medication history & allergies"
        right={hits.length === 0 ? <Badge tone="brand">No interactions</Badge> : <Badge tone="critical">{hits.length} interactions</Badge>}
      />
      {hits.length === 0 ? (
        <p className="text-sm text-neutral-400">No significant interactions detected in the current list.</p>
      ) : (
        <div className="space-y-2">
          {hits.map((h, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-neutral-100 p-3">
              <Badge tone={toneFor(h.severity)}>{h.severity}</Badge>
              <div className="text-sm">
                <span className="font-bold capitalize">{h.drugs[0]} × {h.drugs[1]}</span>
                <p className="text-neutral-600">{h.effect}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ---- Surgery recommendation + multi-stage informed consent ----------------
function SurgeryCard() {
  const { state, activePatient, saveRecord } = useStore()
  const record = state.records[activePatient.id]
  if (!record) return null
  const s = record.surgery

  function recommend() {
    const dx = record!.problems[0]?.title ?? 'procedure'
    saveRecord({
      ...record!,
      surgery: {
        recommended: true,
        procedure: 'Surgical procedure per indication',
        indication: dx,
        pre: 'Fasting 6–8 hours, pre-surgical evaluation (labs, ECG, anesthesia consult), informed consent, comorbidity optimization, antibiotic prophylaxis if needed.',
        intra: 'Anesthesia per ASA status, continuous vital sign monitoring, aseptic technique, WHO surgical safety checklist (sign-in/time-out/sign-out).',
        post: 'Recovery room monitoring, pain control, early mobilization, wound care, complication-sign education, follow-up schedule.',
        risks: 'Bleeding, infection, anesthesia reaction, procedure-specific risks — discussed during informed consent.',
        consent: (['Chatbot-AI', 'Rekomendasi Operasi', 'Pemberian Obat', 'Tindakan/Operasi'] as const).map((stage) => ({ stage, agreed: false })),
      },
      updatedAt: new Date().toISOString(),
    })
  }

  function patch(field: string, value: string) {
    saveRecord({ ...record!, surgery: { ...record!.surgery!, [field]: value }, updatedAt: new Date().toISOString() })
  }

  if (!s?.recommended) {
    return (
      <Card>
        <SectionTitle icon={<IconShield size={18} />} title="Surgical / Procedure Recommendation" subtitle="If needed, pre/intra/post-operative education & multi-stage informed consent become active" />
        <Button onClick={recommend}>Recommend Surgery</Button>
      </Card>
    )
  }

  const agreed = s.consent.filter((c) => c.agreed).length
  return (
    <Card className="border-2 border-brand/20">
      <SectionTitle
        icon={<IconShield size={18} />}
        title="Surgery Recommended"
        subtitle="Education & consent appear in the patient's account"
        right={<Badge tone={agreed === s.consent.length ? 'brand' : 'high'}>{agreed}/{s.consent.length} consent</Badge>}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Procedure</label>
          <input className={inputClass} value={s.procedure} onChange={(e) => patch('procedure', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Indication</label>
          <input className={inputClass} value={s.indication} onChange={(e) => patch('indication', e.target.value)} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(['pre', 'intra', 'post'] as const).map((k) => (
          <div key={k}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {k === 'pre' ? 'Pre-Operative' : k === 'intra' ? 'Intra-Operative' : 'Post-Operative'}
            </label>
            <textarea className={inputClass} rows={4} value={s[k]} onChange={(e) => patch(k, e.target.value)} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-400">Multi-stage informed consent (Chatbot-AI → Recommendation → Medication → Procedure) approved by the patient on the Education page.</p>
    </Card>
  )
}

// ---- CDSS hybrid safety engine -------------------------------------------
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[10px] font-bold text-neutral-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-[10px] font-bold tabular-nums">{value.toFixed(2)}</span>
    </div>
  )
}

function CdssPanel({ plan, patient }: { plan: PlanItem[]; patient: Patient }) {
  const [open, setOpen] = useState(true)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [drafting, setDrafting] = useState<string>('')
  const [note, setNote] = useState('')

  const scored = plan.map((p) => ({ item: p, s: scorePlanItem(p, patient) }))
  const blocked = scored.filter((x) => x.s.blocked && !overrides[x.item.id])

  return (
    <Card className="border-2 border-brand/20">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="CDSS Safety Engine — Hybrid Lateral + Vertical"
        subtitle={`Ensemble  α·V + β·L + γ·S  (α=${WEIGHTS.alpha}, β=${WEIGHTS.beta}, γ=${WEIGHTS.gamma}) · safety gate S ≥ ${S_THRESHOLD}`}
        right={
          <div className="flex items-center gap-2">
            {blocked.length > 0 ? (
              <Badge tone="critical">{blocked.length} blocked</Badge>
            ) : (
              <Badge tone="brand">Safe</Badge>
            )}
            <Button variant="ghost" onClick={() => setOpen((o) => !o)}>
              {open ? 'Hide' : 'Show'}
            </Button>
          </div>
        }
      />
      {open && (
        <div className="space-y-2.5">
          {scored.length === 0 && <p className="text-sm text-neutral-400">No items to score yet.</p>}
          {scored.map(({ item, s }) => {
            const isBlocked = s.blocked && !overrides[item.id]
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 ${
                  isBlocked ? 'border-accent/40 bg-red-50/50' : 'border-neutral-100'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="neutral">{item.category}</Badge>
                      {s.highAlert && <Badge tone="critical">High-alert</Badge>}
                      {overrides[item.id] && <Badge tone="high">Clinician override</Badge>}
                    </div>
                    <p className="text-sm">{item.text}</p>
                  </div>
                  <div className="w-44 shrink-0 space-y-1">
                    <ScoreBar label="V" value={s.V} color="#0b7a4b" />
                    <ScoreBar label="L" value={s.L} color="#3b82f6" />
                    <ScoreBar label="S" value={s.S} color={s.blocked ? '#FF3131' : '#00BF63'} />
                    <div className="flex justify-between border-t border-neutral-100 pt-1 text-[11px] font-bold">
                      <span className="text-neutral-400">Final</span>
                      <span className={isBlocked ? 'text-accent' : 'text-brand-dark'}>
                        {isBlocked ? 'BLOCKED' : s.final.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {s.reasons.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-accent">
                    {s.reasons.map((r, i) => (
                      <li key={i}>⚠ {r}</li>
                    ))}
                  </ul>
                )}

                {isBlocked && (
                  <div className="mt-2 border-t border-red-100 pt-2">
                    {drafting === item.id ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[220px] flex-1">
                          <input
                            className={inputClass}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Clinical justification required to override…"
                          />
                        </div>
                        <Button
                          variant="danger"
                          disabled={!note.trim()}
                          onClick={() => {
                            setOverrides((o) => ({ ...o, [item.id]: note.trim() }))
                            setDrafting('')
                            setNote('')
                          }}
                        >
                          Log & Override
                        </Button>
                        <Button variant="ghost" onClick={() => setDrafting('')}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-accent">
                          🚫 Blocked by safety gate — clinician override with justification required.
                        </span>
                        <Button variant="outline" onClick={() => setDrafting(item.id)}>
                          Override (justification)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {overrides[item.id] && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                    📝 Audit: clinician override — "{overrides[item.id]}"
                  </p>
                )}
              </div>
            )
          })}
          <p className="text-[11px] leading-relaxed text-neutral-400">
            V = vertical (guideline/dosing concordance) · L = lateral (LLM suggestion/patient fit) · S =
            safety (DDI/allergy/contraindication). Items with S &lt; {S_THRESHOLD} are blocked and require
            a recorded clinician justification (doctor-in-the-loop).
          </p>
        </div>
      )}
    </Card>
  )
}
