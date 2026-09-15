import { useMemo, useState } from 'react'
import { Badge, Button, Card, SectionTitle } from '../../components/ui'
import { IconCheck, IconShield, IconSparkle } from '../../components/icons'
import { useStore } from '../../lib/store'
import {
  appendAudit,
  buildHolisticChartFromLegacy,
  calculateHolisticCompleteness,
  createEmptyHolisticChart,
  newClinicalId,
  type ClinicalProvenance,
  type HolisticAllergy,
  type HolisticChart,
  type HolisticEMRRecord,
  type HolisticMedication,
} from '../../lib/holisticEmr'

function clinicianProvenance(actor: string): ClinicalProvenance {
  return {
    sourceType: 'clinician',
    sourceLabel: 'Holistic AI-EMR clinician reconciliation',
    recordedAt: new Date().toISOString(),
    recordedBy: actor,
    verification: 'verified',
  }
}

function domainStyle(state: 'complete' | 'partial' | 'missing') {
  if (state === 'complete') return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
  if (state === 'partial') return 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300'
  return 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400'
}

export function HolisticEmrFoundation() {
  const { state, activePatient, saveRecord } = useStore()
  const maybeRecord = state.records[activePatient.id] as HolisticEMRRecord | undefined
  const actor = state.settings.doctorName || state.account?.name || 'Clinician'
  const [allergyName, setAllergyName] = useState('')
  const [allergyReaction, setAllergyReaction] = useState('')
  const [medicationName, setMedicationName] = useState('')
  const [medicationDose, setMedicationDose] = useState('')
  const [medicationFrequency, setMedicationFrequency] = useState('')

  const chart = useMemo<HolisticChart>(() => {
    if (!maybeRecord) return createEmptyHolisticChart(activePatient.id)
    return buildHolisticChartFromLegacy({
      patient: activePatient,
      record: maybeRecord,
      vitals: state.vitals[activePatient.id] ?? [],
      supportive: state.supportive[activePatient.id] ?? [],
      actor,
    })
  }, [maybeRecord, activePatient, state.vitals, state.supportive, actor])
  const completeness = useMemo(() => calculateHolisticCompleteness(chart), [chart])

  if (!maybeRecord) return null
  const record: HolisticEMRRecord = maybeRecord

  function commit(nextChart: HolisticChart, action: string, target?: string, detail?: string) {
    const now = new Date().toISOString()
    const holistic = appendAudit({ ...nextChart, updatedAt: now }, actor, action, target, detail, now)
    const nextRecord: HolisticEMRRecord = { ...record, holistic, updatedAt: now }
    saveRecord(nextRecord)
  }

  function reviewProblems() {
    commit(
      { ...chart, problemListStatus: chart.problems.length ? 'reviewed' : 'reviewed-empty' },
      'problem-list.review', 'problems', `${chart.problems.length} problem(s) reviewed`,
    )
  }

  function addAllergy() {
    const substance = allergyName.trim()
    if (!substance) return
    const item: HolisticAllergy = {
      id: newClinicalId('allergy'), substance, reaction: allergyReaction.trim() || undefined,
      severity: 'unknown', status: 'active', provenance: clinicianProvenance(actor),
    }
    commit({ ...chart, allergyStatus: 'known-allergies', allergies: [...chart.allergies, item] }, 'allergy.add', item.id, substance)
    setAllergyName('')
    setAllergyReaction('')
  }

  function reconcileAllergies() {
    if (!chart.allergies.length) {
      commit({ ...chart, allergyStatus: 'no-known-allergies' }, 'allergy.reconcile', 'allergies', 'No known allergies attested')
      return
    }
    const at = new Date().toISOString()
    const allergies = chart.allergies.map((item) => ({
      ...item,
      provenance: { ...item.provenance, verification: 'verified' as const, recordedBy: actor, recordedAt: at },
    }))
    commit({ ...chart, allergyStatus: 'known-allergies', allergies }, 'allergy.verify', 'allergies', `${allergies.length} allergy entry/entries verified`)
  }

  function addMedication() {
    const name = medicationName.trim()
    if (!name) return
    const item: HolisticMedication = {
      id: newClinicalId('medication'), name, dose: medicationDose.trim() || undefined,
      frequency: medicationFrequency.trim() || undefined, status: 'active', provenance: clinicianProvenance(actor),
    }
    commit({ ...chart, medicationReconciliation: 'reconciled', medications: [...chart.medications, item] }, 'medication.add', item.id, name)
    setMedicationName('')
    setMedicationDose('')
    setMedicationFrequency('')
  }

  function reconcileMedications() {
    const status = chart.medications.length ? 'reconciled' as const : 'no-current-medications' as const
    commit(
      { ...chart, medicationReconciliation: status },
      'medication.reconcile', 'medications',
      chart.medications.length ? `${chart.medications.length} medication(s) reconciled` : 'No current medications attested',
    )
  }

  const criticalReady = completeness.missingCritical.length === 0

  return (
    <Card className="overflow-hidden border-2 border-brand/15 bg-gradient-to-br from-white via-white to-brand-50/40 dark:from-[#08111d] dark:via-[#08111d] dark:to-[#071914]">
      <SectionTitle
        icon={<IconShield size={19} />}
        title="Holistic AI-EMR · Longitudinal Clinical Graph"
        subtitle="One patient · one longitudinal source of truth · provenance on every clinical object"
        right={<Badge tone={criticalReady ? 'brand' : completeness.score >= 50 ? 'high' : 'critical'}>{completeness.score}% information coverage</Badge>}
      />

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Clinical completeness gate</div>
              <p className="mt-1 text-sm font-semibold text-ink dark:text-white">C = Σ(wᵢ × cᵢ) / Σwᵢ · safety-critical domains carry the highest weights.</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-black ${criticalReady ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
              {criticalReady ? 'Critical chart ready' : `${completeness.missingCritical.length} critical gap(s)`}
            </div>
          </div>
          {!criticalReady && (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {completeness.missingCritical.map((gap) => <div key={gap} className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">• {gap}</div>)}
            </div>
          )}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {completeness.domains.map((item) => (
              <div key={item.id} className={`rounded-xl border px-3 py-2 ${domainStyle(item.state)}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-black">{item.label}</span><span className="text-[10px] font-black">{Math.round(item.completeness * 100)}%</span></div>
                <div className="mt-0.5 truncate text-[10px] opacity-80" title={item.detail}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300"><IconSparkle size={15} /> AI clinical boundary</div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">AI may summarize, draft, reconcile and surface contradictions. It cannot autonomously sign a note, commit a medication change, or place a clinical order. Source-linked evidence and clinician review remain mandatory.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold">
            {['Draft-only AI', 'Evidence provenance', 'Human sign-off', 'Audit trail'].map((label) => <span key={label} className="rounded-lg bg-white/70 px-2 py-1.5 text-emerald-700 dark:bg-white/5 dark:text-emerald-300">✓ {label}</span>)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <SafetyPanel title="1 · Problem reconciliation" status={chart.problemListStatus} danger={chart.problemListStatus === 'unknown' || chart.problemListStatus === 'unreviewed'}>
          <p className="text-sm font-semibold">{chart.problems.length} longitudinal problem(s)</p>
          <div className="mt-2 max-h-24 space-y-1 overflow-y-auto">
            {chart.problems.slice(0, 8).map((problem) => <div key={problem.id} className="rounded-lg bg-neutral-50 px-2 py-1.5 text-[11px] dark:bg-white/5"><b>{problem.display}</b>{problem.code ? ` · ${problem.code}` : ''}</div>)}
            {!chart.problems.length && <p className="text-[11px] text-neutral-400">No problem entries yet. Explicit review is still required.</p>}
          </div>
          <Button variant="outline" className="mt-3 w-full" onClick={reviewProblems}><IconCheck size={14} /> Review problem list</Button>
        </SafetyPanel>

        <SafetyPanel title="2 · Allergy safety" status={chart.allergyStatus} danger={chart.allergyStatus === 'unknown'}>
          <div className="max-h-20 space-y-1 overflow-y-auto">
            {chart.allergies.map((item) => <div key={item.id} className="rounded-lg bg-red-50/70 px-2 py-1.5 text-[11px] text-red-800 dark:bg-red-500/10 dark:text-red-300"><b>{item.substance}</b>{item.reaction ? ` · ${item.reaction}` : ''} · {item.provenance.verification}</div>)}
            {!chart.allergies.length && <p className="text-[11px] text-neutral-400">No allergy object recorded. Do not assume NKDA.</p>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5"><Input value={allergyName} onChange={setAllergyName} placeholder="Substance" /><Input value={allergyReaction} onChange={setAllergyReaction} placeholder="Reaction" /></div>
          <div className="mt-2 flex flex-wrap gap-1.5"><Button variant="outline" onClick={addAllergy} disabled={!allergyName.trim()}>Add allergy</Button><Button variant="outline" onClick={reconcileAllergies}>{chart.allergies.length ? 'Verify list' : 'Attest NKDA'}</Button></div>
        </SafetyPanel>

        <SafetyPanel title="3 · Medication reconciliation" status={chart.medicationReconciliation} danger={chart.medicationReconciliation === 'unknown'}>
          <div className="max-h-20 space-y-1 overflow-y-auto">
            {chart.medications.map((item) => <div key={item.id} className="rounded-lg bg-brand-50/70 px-2 py-1.5 text-[11px] text-brand-dark dark:bg-brand/10"><b>{item.name}</b>{item.dose ? ` · ${item.dose}` : ''}{item.frequency ? ` · ${item.frequency}` : ''}</div>)}
            {!chart.medications.length && <p className="text-[11px] text-neutral-400">No structured current-medication list. Free text is not treated as reconciled.</p>}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5"><Input value={medicationName} onChange={setMedicationName} placeholder="Medication" /><Input value={medicationDose} onChange={setMedicationDose} placeholder="Dose" /><Input value={medicationFrequency} onChange={setMedicationFrequency} placeholder="Frequency" /></div>
          <div className="mt-2 flex flex-wrap gap-1.5"><Button variant="outline" onClick={addMedication} disabled={!medicationName.trim()}>Add medication</Button><Button variant="outline" onClick={reconcileMedications}>{chart.medications.length ? 'Reconcile list' : 'Attest no current meds'}</Button></div>
        </SafetyPanel>
      </div>

      <details className="mt-4 rounded-2xl border border-neutral-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Longitudinal chart ledger · {chart.encounters.length} encounters · {chart.notes.length} notes · {chart.diagnostics.length} diagnostics · {chart.audit.length} audit events</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Ledger label="Problems" value={chart.problems.length} /><Ledger label="Allergies" value={chart.allergies.length} /><Ledger label="Medications" value={chart.medications.length} /><Ledger label="Vitals" value={chart.vitals.length} />
          <Ledger label="Diagnostics" value={chart.diagnostics.length} /><Ledger label="Imaging" value={chart.imaging.length} /><Ledger label="Procedures" value={chart.procedures.length} /><Ledger label="Orders" value={chart.orders.length} />
          <Ledger label="Care plans" value={chart.carePlans.length} /><Ledger label="Prevention" value={chart.preventiveCare.length} /><Ledger label="Immunizations" value={chart.immunizations.length} /><Ledger label="Genomics / devices" value={chart.genomics.length + chart.devices.length} />
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-neutral-500">Empty arrays mean “not yet represented”, never “normal” or “none”. Existing SOAP, vitals, results, chronic problems and patient history migrate into this layer without inventing missing facts.</p>
      </details>
    </Card>
  )
}

function SafetyPanel({ title, status, danger, children }: { title: string; status: string; danger: boolean; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5"><div className="mb-2 flex items-center justify-between gap-2"><div className="text-xs font-black uppercase tracking-wide text-neutral-500">{title}</div><Badge tone={danger ? 'critical' : 'brand'}>{status}</Badge></div>{children}</div>
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 min-w-0 rounded-lg border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" />
}

function Ledger({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 dark:border-white/5 dark:bg-white/5"><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</div><div className="mt-0.5 text-lg font-black text-ink dark:text-white">{value}</div></div>
}

export default HolisticEmrFoundation
