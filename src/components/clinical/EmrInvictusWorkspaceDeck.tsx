import { useMemo, useState } from 'react'
import type { EMRRecord, Patient, SupportiveResult, VitalSign } from '../../lib/types'
import {
  CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
  analyzeIcdToInaCbg,
  analyzeSoapToIcd,
  evaluateBpjsPendingRisk,
  recordCodemaxDecision,
  type CodemaxDecisionAudit,
} from '../../domains/clinical-operations/engine/codemaxVerifierSdk'
import {
  DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1,
  QUICK_CONSULT_TEMPLATES,
  SYNTHETIC_QUICK_CONSULT_EXAMPLES,
  calculateAdultAnthropometry,
  calculateFluidAndInfusion,
  formatQuickConsultOutput,
  generateSubspecialistClinicalDraft,
  type QuickConsultInput,
  type QuickConsultOutputFormat,
} from '../../domains/clinical-operations/engine/subspecialistClinicalDocEngine'
import {
  addChecklistItem,
  computeChecklistProgress,
  createReferralChecklistState,
  resetReferralChecklist,
  toggleChecklistItem,
  transitionReferralLifecycle,
  type ReferralLifecycleStage,
} from '../../domains/clinical-operations/engine/externalReferralChecklistEngine'
import { ageFromDob } from '../../lib/anthro'

type DeckTab = 'quick-consult' | 'subspecialist' | 'codemax' | 'referral'

const EMPTY_CONSULT: QuickConsultInput = {
  templateId: 'konsul_dpjp_general',
  targetSpecialist: '',
  patientIdentity: '',
  chiefComplaintAndHistory: '',
  comorbiditiesAndThorax: '',
  vitalsAndPhysicalExam: '',
  workingAssessment: '',
  supportiveSummary: '',
  therapyGiven: '',
  planOrConsultGoal: '',
  senderIdentity: 'Dokter Jaga',
  careUnit: 'IGD',
}

const OUT_FORMATS: readonly { id: QuickConsultOutputFormat; label: string }[] = [
  { id: 'whatsapp_draft', label: 'Chat WA Draft' },
  { id: 'sbar', label: 'SBAR' },
  { id: 'soap', label: 'SOAP' },
  { id: 'cppt', label: 'CPPT' },
  { id: 'structured_emr', label: 'EMR' },
  { id: 'fhir_composition_json', label: 'FHIR JSON' },
]

const LIFECYCLES: readonly ReferralLifecycleStage[] = [
  'Draft',
  'Submitted',
  'Awaiting Acceptance',
  'Accepted',
  'Preparation',
  'Ready for Transfer',
  'In Transit',
  'Arrived',
  'Handover',
  'Closed',
]

export default function EmrInvictusWorkspaceDeck({
  patient,
  record,
  vitals,
  supportive,
}: {
  patient: Patient
  record: EMRRecord | null
  vitals: readonly VitalSign[]
  supportive: readonly SupportiveResult[]
}) {
  const [tab, setTab] = useState<DeckTab>('quick-consult')

  // Tab 1: Quick Consult Auto-Formatter (Screenshot 4)
  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : undefined
  const [consult, setConsult] = useState<QuickConsultInput>(() => ({
    ...EMPTY_CONSULT,
    patientIdentity: patient.id !== 'none' ? `${patient.name} / ${ageFromDob(patient.dob)} th / ${patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}` : '',
    chiefComplaintAndHistory: record?.anamnesis.keluhanUtama || '',
    comorbiditiesAndThorax: record?.anamnesis.rpd || '',
    vitalsAndPhysicalExam: record?.physicalExam.vitalsNote || '',
    workingAssessment: record?.primaryDiagnosis?.title || record?.problems[0]?.title || '',
    therapyGiven: record?.plan.map((p) => p.text).slice(0, 3).join(', ') || '',
  }))
  const [outFormat, setOutFormat] = useState<QuickConsultOutputFormat>('whatsapp_draft')
  const [redactPhi, setRedactPhi] = useState(false)
  const [copied, setCopied] = useState(false)
  const formattedConsult = useMemo(
    () => formatQuickConsultOutput(consult, outFormat, { redactDirectIdentifiers: redactPhi }),
    [consult, outFormat, redactPhi],
  )

  // Tab 2: Subspecialist AI-EMR & Deterministic Anthropometry / Fluid
  const [promptText, setPromptText] = useState(DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1.promptText)
  const [bbKg, setBbKg] = useState<string>(patient.weightKg > 0 ? String(patient.weightKg) : '65')
  const [tbCm, setTbCm] = useState<string>(patient.heightCm > 0 ? String(patient.heightCm) : '170')
  const [ageY, setAgeY] = useState<string>(patient.dob ? String(ageFromDob(patient.dob)) : '35')
  const [intakeMl, setIntakeMl] = useState('1500')
  const [outputMl, setOutputMl] = useState('900')
  const [hours, setHours] = useState('24')
  const [ekgDone, setEkgDone] = useState(false)
  const [paDone, setPaDone] = useState(false)

  const anthro = useMemo(() => calculateAdultAnthropometry(bbKg, tbCm, ageY), [bbKg, tbCm, ageY])
  const fluid = useMemo(() => calculateFluidAndInfusion({ intakeMl, outputMl, weightKg: bbKg, durationHours: hours, targetVolumeMl: intakeMl, dropFactor: 20 }), [intakeMl, outputMl, bbKg, hours])
  const subspecialistDraft = useMemo(() => generateSubspecialistClinicalDraft({
    patientCode: patient.id === 'none' ? 'PASIEN-SINTETIK' : patient.id,
    ageYears: ageY ? Number(ageY) : null,
    sex: patient.sex === 'L' ? 'Laki-laki' : patient.sex === 'P' ? 'Perempuan' : 'Tidak diketahui',
    weightKg: bbKg ? Number(bbKg) : null,
    heightCm: tbCm ? Number(tbCm) : null,
    chiefComplaint: consult.chiefComplaintAndHistory || 'Keluhan sesuai catatan klinik',
    rps: record?.anamnesis.rps || consult.chiefComplaintAndHistory || '',
    rpd: record?.anamnesis.rpd || '',
    rpk: record?.anamnesis.rpk || '',
    medicationHistory: record?.anamnesis.riwayatPengobatan || '',
    allergies: record?.anamnesis.riwayatAlergi || '',
    vitals: { td: latestVital ? `${latestVital.systolic}/${latestVital.diastolic}` : undefined, hrBpm: latestVital?.heartRate ?? null, rr: latestVital?.respRate ?? null, tempC: latestVital?.tempC ?? null, spo2Pct: latestVital?.spo2 ?? null },
    documentedExamFindings: consult.vitalsAndPhysicalExam || record?.physicalExam.perSystem || '',
    imagingSummary: supportive.filter((s) => s.category === 'Radiologi').map((s) => `${s.name}: ${s.value}`).join('; '),
    labResults: supportive.filter((s) => s.category === 'Lab').map((s) => ({ name: s.name, value: s.value, abnormal: s.flag === 'high' || s.flag === 'critical' })),
    ekgPerformed: ekgDone,
    histopathologyConfirmed: paDone,
    administeredTherapies: consult.therapyGiven ? [consult.therapyGiven] : [],
    plannedProcedure: consult.planOrConsultGoal || undefined,
  }, { ...DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1, promptText }), [patient, ageY, bbKg, tbCm, consult, record, vitals, supportive, ekgDone, paDone, promptText])

  // Tab 3: Codemax Verifier SDK
  const [cmNote, setCmNote] = useState(() => consult.workingAssessment || 'Obs gagal napas / takikardi nadi 140x/m, membutuhkan evaluasi AGD dan foto toraks.')
  const [cmSetting, setCmSetting] = useState<'IGD' | 'RAWAT_JALAN' | 'RAWAT_INAP' | 'ICU_NICU_PICU_HCU'>('IGD')
  const [cmConfirm, setCmConfirm] = useState('')
  const [cmAudit, setCmAudit] = useState<CodemaxDecisionAudit[]>([])
  const [cmRejectReason, setCmRejectReason] = useState('')

  const cmSoap = useMemo(() => analyzeSoapToIcd({
    soapNote: cmNote,
    careSetting: cmSetting,
    role: 'DOCTOR',
    ekgRecorded: ekgDone,
    histopathologyConfirmed: paDone,
  }), [cmNote, cmSetting, ekgDone, paDone])
  const cmIna = useMemo(() => analyzeIcdToInaCbg({
    primaryIcd10: cmSoap.candidates[0]?.code ?? 'Z09.8',
    secondaryIcd10: cmSoap.candidates.slice(1).map((c) => c.code),
    careSetting: cmSetting,
    soapNote: cmNote,
    ekgRecorded: ekgDone,
    histopathologyConfirmed: paDone,
  }), [cmSoap, cmSetting, cmNote, ekgDone, paDone])
  const cmPending = useMemo(() => evaluateBpjsPendingRisk({
    soapToIcd: cmSoap,
    inaCbg: cmIna,
    confirmationDraftText: cmConfirm,
  }), [cmSoap, cmIna, cmConfirm])

  // Tab 4: External Referral Checklist (Screenshot 3)
  const [refState, setRefState] = useState(() =>
    createReferralChecklistState({
      patientId: patient.id,
      encounterId: record?.id ?? 'enc-draft',
      nowIso: new Date().toISOString(),
    }),
  )
  const [sisruteManualOk, setSisruteManualOk] = useState(false)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemBadge, setNewItemBadge] = useState('1 Rangkap')
  const [refError, setRefError] = useState('')
  const refProgress = useMemo(() => computeChecklistProgress({ ...refState, sisruteStatus: sisruteManualOk ? 'verified_manually' : 'api_not_configured_manual_required' }), [refState, sisruteManualOk])

  function copyConsult() {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(formattedConsult.text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleTransition(next: ReferralLifecycleStage) {
    const res = transitionReferralLifecycle(refState, next, {
      nowIso: new Date().toISOString(),
      manualSisruteConfirmed: sisruteManualOk,
    })
    if (!res.ok) {
      setRefError(res.reason)
      return
    }
    setRefError('')
    setRefState(res.state)
  }

  return (
    <section
      aria-label="PanaceaMed Invictus Clinical EMR Studio"
      className="dark rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white shadow-xl sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300">
            INVICTUS CLINICAL WORKBENCH · clinically_reviewed = false
          </span>
          <h2 className="mt-2 text-lg font-extrabold tracking-tight text-white">
            Isi Data Cepat · AI-EMR Subspesialis · Codemax SDK · Checklist Rujukan
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {([
            ['quick-consult', 'Isi Data Cepat'],
            ['subspecialist', 'Subspesialis & Antro'],
            ['codemax', 'Codemax Verifier SDK'],
            ['referral', 'Checklist Rujukan'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition ${
                tab === id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/15 bg-white/[0.04] text-white/75 hover:border-white/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'quick-consult' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-white">Isi Data Cepat Konsul / EMR</span>
            <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-2.5 py-1 font-mono text-[10px] font-bold text-teal-300">
              AUTO-FORMATTER
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SYNTHETIC_QUICK_CONSULT_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setConsult(ex.data)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-white hover:border-cyan-400"
              >
                {ex.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setConsult(EMPTY_CONSULT)}
              className="min-h-11 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200"
            >
              Kosongkan Form
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/80">
              Pilih Jenis Format Template
              <select
                value={consult.templateId}
                onChange={(e) => setConsult((c) => ({ ...c, templateId: e.target.value as QuickConsultInput['templateId'] }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white"
              >
                {QUICK_CONSULT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-white/80">
              Nama Dokter Spesialis (DPJP) / Tujuan
              <input value={consult.targetSpecialist} onChange={(e) => setConsult((c) => ({ ...c, targetSpecialist: e.target.value }))} placeholder="Contoh: dr. Ruddy Sp.PD" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80">
              Identitas Pasien (Nama/Usia/JK/Unit)
              <input value={consult.patientIdentity} onChange={(e) => setConsult((c) => ({ ...c, patientIdentity: e.target.value }))} placeholder="Contoh sintetik / 72 tahun / Perempuan" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80">
              Diagnosis Kerja / Assessment
              <input value={consult.workingAssessment} onChange={(e) => setConsult((c) => ({ ...c, workingAssessment: e.target.value }))} placeholder="Contoh: Obs. Chest Pain ec Susp. ACS" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80 sm:col-span-2">
              Anamnesis (S) / Riwayat Komorbid / Hasil Toraks
              <input value={consult.chiefComplaintAndHistory} onChange={(e) => setConsult((c) => ({ ...c, chiefComplaintAndHistory: e.target.value }))} placeholder="Keluhan utama, onset, faktor risiko" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80 sm:col-span-2">
              Pemeriksaan Fisik &amp; TTV (O)
              <input value={consult.vitalsAndPhysicalExam} onChange={(e) => setConsult((c) => ({ ...c, vitalsAndPhysicalExam: e.target.value }))} placeholder="CM, TD 150/90, N 88x, RR 20x, SpO2 98%" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80 sm:col-span-2">
              Terapi IGD / Rencana Tindakan / Lab Diorder
              <input value={consult.therapyGiven} onChange={(e) => setConsult((c) => ({ ...c, therapyGiven: e.target.value }))} placeholder="IVFD RL 15 tpm, lab/EKG" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white" />
            </label>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#040811] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {OUT_FORMATS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setOutFormat(f.id)} className={`min-h-11 rounded-lg px-2.5 text-xs font-bold ${outFormat === f.id ? 'bg-cyan-600 text-white' : 'bg-white/[0.06] text-white/75'}`}>
                    {f.label}
                  </button>
                ))}
                <button type="button" onClick={() => setRedactPhi((v) => !v)} className="min-h-11 rounded-lg border border-white/15 px-2.5 text-xs text-white/80">
                  {redactPhi ? 'Anonimisasi PHI: ON' : 'Anonimisasi PHI: OFF'}
                </button>
              </div>
              <button type="button" onClick={copyConsult} className="min-h-11 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-slate-950">
                {copied ? 'Tersalin!' : 'Salin Format Chat'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-cyan-100">{formattedConsult.text}</pre>
          </div>
        </div>
      )}

      {tab === 'subspecialist' && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-white/80">BB (kg)<input value={bbKg} onChange={(e) => setBbKg(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
            <label className="text-xs text-white/80">TB (cm)<input value={tbCm} onChange={(e) => setTbCm(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
            <label className="text-xs text-white/80">Usia (th)<input value={ageY} onChange={(e) => setAgeY(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
            <label className="text-xs text-white/80">Intake (mL)<input value={intakeMl} onChange={(e) => setIntakeMl(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
            <label className="text-xs text-white/80">Output Urine (mL)<input value={outputMl} onChange={(e) => setOutputMl(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
            <label className="text-xs text-white/80">Durasi (jam)<input value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-sm text-white" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 font-mono text-xs">
              <div className="font-bold text-cyan-300">Antropometri &amp; Guard Pediatrik</div>
              <div className="mt-1">IMT: {anthro.bmiKgM2 ?? '—'} kg/m² · {anthro.bmiCategoryAsiaPacific ?? anthro.note}</div>
              <div>BSA Mosteller: {anthro.bsaMostellerM2 ?? '—'} m²</div>
              <div className="text-amber-300">BB/U · TB/U · BB/TB: {anthro.pediatricIndices.bbPerU}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 font-mono text-xs">
              <div className="font-bold text-emerald-300">Kalkulator Cairan &amp; Infus</div>
              <div className="mt-1">Balance: {fluid.fluidBalanceMl ?? '—'} mL</div>
              <div>Urine Output: {fluid.urineOutputMlKgH ?? '—'} mL/kg/jam {fluid.urineWarning ? `(${fluid.urineWarning})` : ''}</div>
              <div>Kecepatan Infus: {fluid.infusionRateMlPerH ?? '—'} mL/jam ({fluid.dropsPerMin ?? '—'} tpm makro)</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" checked={ekgDone} onChange={(e) => setEkgDone(e.target.checked)} /> EKG sudah dilakukan</label>
            <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" checked={paDone} onChange={(e) => setPaDone(e.target.checked)} /> Histopatologi / PA terkonfirmasi</label>
          </div>
          <details className="rounded-xl border border-white/10 bg-[#0b1322] p-3 text-xs">
            <summary className="cursor-pointer font-bold text-white/85">Edit Prompt Template Subspesialis ({DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1.version})</summary>
            <textarea rows={5} value={promptText} onChange={(e) => setPromptText(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 font-mono text-xs text-white" />
          </details>
          <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-[#040811] p-3 font-mono text-xs text-slate-200">{subspecialistDraft.sectionsText}</pre>
        </div>
      )}

      {tab === 'codemax' && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {CODEMAX_NON_SUBSTITUTION_DISCLAIMER}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-white/80 sm:col-span-2">
              Catatan Klinis / SOAP untuk Analisis Codemax
              <textarea rows={2} value={cmNote} onChange={(e) => setCmNote(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 p-2.5 text-sm text-white" />
            </label>
            <label className="text-xs text-white/80">
              Unit Layanan
              <select value={cmSetting} onChange={(e) => setCmSetting(e.target.value as typeof cmSetting)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white">
                <option value="IGD">IGD</option>
                <option value="RAWAT_JALAN">Rawat Jalan (RJTL)</option>
                <option value="RAWAT_INAP">Rawat Inap (RITL)</option>
                <option value="ICU_NICU_PICU_HCU">ICU / NICU / PICU</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 text-xs">
              <div className="font-bold text-cyan-300">1. Rekomendasi INA-CBGs &amp; ICD</div>
              {cmIna.recommendedInaCbgs.map((c) => <div key={c.code} className="mt-1.5 font-mono font-bold text-white">{c.code} (Severity {c.severity})</div>)}
              {cmSoap.candidates.map((cand) => (
                <div key={`${cand.system}-${cand.code}`} className="mt-1.5 border-t border-white/10 pt-1.5">
                  <span className="font-mono font-bold text-emerald-300">{cand.system} {cand.code}</span> · {cand.description}
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 text-xs">
              <div className="font-bold text-amber-300">2. Rekomendasi Dokumen Klaim</div>
              {cmIna.recommendedClaimDocuments.map((d) => (
                <div key={d.documentName} className="mt-1.5 flex items-center justify-between gap-2">
                  <span>{d.documentName}</span>
                  <span className="font-mono text-[10px] uppercase text-amber-300">{d.status}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 text-xs">
              <div className="font-bold text-sky-300">3. Rekomendasi Order Lab/Radiologi</div>
              {cmIna.recommendedDiagnosticOrders.length === 0 && <div className="mt-1 text-white/60">Tidak ada gap order kritis terdeteksi.</div>}
              {cmIna.recommendedDiagnosticOrders.map((o) => (
                <div key={o.orderName} className="mt-1.5"><b className="font-mono">{o.modality}:</b> {o.orderName}</div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1322] p-3 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">BPJS Pending Risk: <span className="font-mono text-amber-300">{cmPending.riskLevel} ({cmPending.riskScore}/100)</span></span>
              <span className="font-mono text-cyan-300">Kualitas Jawaban: {cmPending.confirmationQuality}</span>
            </div>
            <input value={cmConfirm} onChange={(e) => setCmConfirm(e.target.value)} placeholder="Uji draft jawaban konfirmasi BPJS (cantumkan tanggal, nilai lab/radiologi)..." className="min-h-11 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-xs text-white" />
            <div className="flex flex-wrap items-center gap-2">
              <input value={cmRejectReason} onChange={(e) => setCmRejectReason(e.target.value)} placeholder="Alasan bila tolak / override kode..." className="min-h-11 flex-1 rounded-lg border border-white/15 bg-slate-900 px-3 text-xs text-white" />
              <button type="button" onClick={() => setCmAudit((log) => recordCodemaxDecision(log, { atIso: new Date().toISOString(), actorName: 'Dokter/Koder', actorRole: 'DOCTOR', targetCode: cmSoap.candidates[0]?.code ?? 'Z09.8', decision: 'accept' }))} className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white">Accept Draft</button>
              <button type="button" onClick={() => { if (cmRejectReason.trim()) setCmAudit((log) => recordCodemaxDecision(log, { atIso: new Date().toISOString(), actorName: 'Dokter/Koder', actorRole: 'DOCTOR', targetCode: cmSoap.candidates[0]?.code ?? 'Z09.8', decision: 'reject', reason: cmRejectReason })) }} className="min-h-11 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 font-bold text-rose-200">Reject (Dengan Alasan)</button>
            </div>
            {cmAudit.length > 0 && <div className="font-mono text-[11px] text-white/70">Audit keputusan ({cmAudit.length}): terakhir {cmAudit[cmAudit.length - 1]?.decision} {cmAudit[cmAudit.length - 1]?.targetCode}</div>}
          </div>
        </div>
      )}

      {tab === 'referral' && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white">Checklist Berkas Rujukan Eksternal</div>
              <div className="font-mono text-xs text-emerald-300">{refProgress.done}/{refProgress.total} ({refProgress.percent}%) · {refProgress.readyForDeparture ? 'Siap Berangkat' : 'Belum Lengkap'}</div>
            </div>
            <button type="button" onClick={() => setRefState((s) => resetReferralChecklist(s, new Date().toISOString()))} className="min-h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-bold text-white">Reset</button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${refProgress.percent}%` }} />
          </div>
          <div className="space-y-2">
            {refState.items.map((item) => (
              <label key={item.id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1322] px-3 py-2 text-xs">
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" checked={item.checked} onChange={() => setRefState((s) => toggleChecklistItem(s, item.id, { actorName: 'Klinisi Jaga', nowIso: new Date().toISOString() }))} className="h-4 w-4 accent-emerald-500" />
                  <span className={item.checked ? 'text-emerald-200 line-through' : 'text-white'}>{item.label}</span>
                </span>
                <span className="shrink-0 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-sky-300">{item.copyBadge}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="Tambah berkas kustom rujukan..." className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white" />
            <input value={newItemBadge} onChange={(e) => setNewItemBadge(e.target.value)} className="min-h-11 w-28 rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-xs text-white" />
            <button type="button" onClick={() => { setRefState((s) => addChecklistItem(s, { label: newItemLabel, copyBadge: newItemBadge, required: true }, new Date().toISOString())); setNewItemLabel('') }} className="min-h-11 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white">Tambah</button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs">
            <label className="flex items-center gap-2 text-amber-100">
              <input type="checkbox" checked={sisruteManualOk} onChange={(e) => setSisruteManualOk(e.target.checked)} />
              Konfirmasi manual SISRUTE (API SISRUTE live tidak tersambung — verifikasi portal SISRUTE manual sebelum berangkat)
            </label>
            <select value={refState.lifecycleStage} onChange={(e) => handleTransition(e.target.value as ReferralLifecycleStage)} className="min-h-11 rounded-lg border border-white/15 bg-slate-900 px-2 text-xs text-white">
              {LIFECYCLES.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          {refError && <div className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs text-rose-200">{refError}</div>}
        </div>
      )}
    </section>
  )
}
