import { useMemo, useState } from 'react'
import {
  evaluateClinicalToClaimShield,
  type CareSetting,
  type ClinicalUserRole,
  type ExecutionMode,
} from '../../domains/clinical-operations/engine/clinicalToClaimShieldEngine'

const MODES: ReadonlyArray<{ id: ExecutionMode; label: string }> = [
  { id: 'UPSTREAM_ENCOUNTER', label: 'Upstream' },
  { id: 'REALTIME_SHIELD', label: 'Shield' },
  { id: 'DISCHARGE_AUDIT', label: 'Discharge' },
  { id: 'BPJS_CONFIRMATION_COPILOT', label: 'BPJS Copilot' },
]

const ROLES: ReadonlyArray<{ id: ClinicalUserRole; label: string }> = [
  { id: 'DOCTOR', label: 'Doctor' },
  { id: 'NURSE', label: 'Nurse' },
  { id: 'CASEMIX_CODER', label: 'Casemix' },
]

const SETTINGS: ReadonlyArray<{ id: CareSetting; label: string }> = [
  { id: 'RAWAT_JALAN', label: 'RJTL' },
  { id: 'IGD', label: 'IGD' },
  { id: 'IGD_PONEK', label: 'PONEK' },
  { id: 'RAWAT_INAP', label: 'RITL' },
  { id: 'ICU_NICU_PICU_HCU', label: 'ICU' },
]

const PRESETS = [
  {
    id: 'icu_vent',
    label: 'ICU Vent 108h',
    setting: 'ICU_NICU_PICU_HCU' as CareSetting,
    ventHours: 108,
    note: 'Pasien gagal napas akut dengan pneumonia berat, intubasi dan ventilasi mekanis invasif 108 jam di ICU. Tidak ada sepsis. Foto toraks infiltrat bilateral, AGD PaO2/FiO2 140.',
    query: 'Mohon klarifikasi durasi ventilator >96 jam (96.72) dan kelengkapan berkas Group J.',
  },
  {
    id: 'kll',
    label: 'KLL Jasa Raharja',
    setting: 'IGD' as CareSetting,
    ventHours: 0,
    note: 'Pasien datang ke IGD post kecelakaan lalu lintas sepeda motor 1 jam SMRS, fraktur tertutup femur kanan, kesadaran CM. Tidak ada perdarahan intrakranial.',
    query: 'Konfirmasi penjamin pertama KLL (Jasa Raharja vs BPJS).',
  },
  {
    id: 'acs',
    label: 'NSTEMI + Negasi',
    setting: 'RAWAT_INAP' as CareSetting,
    ventHours: 0,
    note: 'Nyeri dada tipikal menjalar ke lengan kiri, Troponin I meningkat 2.4 ng/mL, EKG ST depresi V4-V6. Riwayat hipertensi, menyangkal diabetes melitus, tidak ada stroke.',
    query: 'Verifikasi diagnosis utama I21.4 dan konsistensi terapi PNPK.',
  },
] as const

export default function ClinicalToClaimShieldWorkbench() {
  const [mode, setMode] = useState<ExecutionMode>('REALTIME_SHIELD')
  const [role, setRole] = useState<ClinicalUserRole>('DOCTOR')
  const [setting, setSetting] = useState<CareSetting>('ICU_NICU_PICU_HCU')
  const [ventHours, setVentHours] = useState<number>(108)
  const [note, setNote] = useState<string>(PRESETS[0].note)
  const [query, setQuery] = useState<string>(PRESETS[0].query)
  const [showInfo, setShowInfo] = useState(false)

  const result = useMemo(
    () =>
      evaluateClinicalToClaimShield({
        execution_mode: mode,
        user_role: role,
        care_setting: setting,
        raw_clinical_input: note,
        ventilator_hours: ventHours > 0 ? ventHours : null,
        bpjs_pending_query: mode === 'BPJS_CONFIRMATION_COPILOT' ? query : null,
      }),
    [mode, role, setting, note, ventHours, query],
  )

  const riskTone =
    result.pending_prevention_shield.risk_level === 'HIGH'
      ? 'border-rose-400/50 bg-rose-500/15 text-rose-200'
      : result.pending_prevention_shield.risk_level === 'MEDIUM'
        ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
        : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'

  return (
    <section
      data-claim-shield-workbench
      aria-label="Clinical-to-Claim Shield Workbench"
      className="space-y-3 rounded-2xl border border-white/15 bg-neutral-950 p-3.5 text-white"
    >
      {/* Top Bar: Presets + Role Governance + Disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSetting(p.setting)
                setVentHours(p.ventHours)
                setNote(p.note)
                setQuery(p.query)
              }}
              className="min-h-[36px] rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 font-mono text-[10px] font-black text-cyan-200 hover:bg-cyan-500/20"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              aria-pressed={role === r.id}
              className={`min-h-[36px] rounded-full border px-2.5 font-mono text-[10px] font-black ${
                role === r.id
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                  : 'border-white/15 bg-white/5 text-white/60'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-label="Clinical-to-Claim governance rules"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 font-mono text-xs font-black text-white/80"
          >
            i
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="rounded-xl border border-cyan-400/25 bg-black/60 px-3 py-2 text-[11px] text-white/75">
          Clinical truth over tariff optimization (zero upcoding). NURSE role strictly omits ICD-10/INA-CBG/BPJS confirmation blocks. Clinician sign-off required before claim submission.
        </div>
      )}

      {/* Mode + Care Setting + Ventilator Hours */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`min-h-[34px] rounded-lg border px-2 font-mono text-[10px] font-bold ${
                mode === m.id ? 'border-white/60 bg-white text-black' : 'border-white/15 bg-white/5 text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {SETTINGS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSetting(s.id)}
              aria-pressed={setting === s.id}
              className={`min-h-[34px] rounded-lg border px-2 font-mono text-[10px] font-bold ${
                setting === s.id ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-white/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-amber-200">
          <span>Vent {ventHours}h</span>
          <input
            type="range"
            min={0}
            max={144}
            step={4}
            value={ventHours}
            onChange={(e) => setVentHours(Number(e.target.value))}
            aria-label="Ventilator hours"
            className="w-24 accent-amber-400"
          />
          <span>{ventHours >= 96 ? '96.72' : ventHours > 0 ? '96.71' : '—'}</span>
        </label>
      </div>

      {/* Compact Clinical Note & Optional BPJS Verifier Query */}
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Clinical encounter input"
          className="w-full rounded-xl border border-white/15 bg-black/50 p-2 text-xs text-white outline-none focus:border-cyan-400/60"
        />
        <textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="BPJS verifier pending query"
          placeholder="BPJS verifier query (Copilot mode)"
          className="w-full rounded-xl border border-white/15 bg-black/50 p-2 text-xs text-white outline-none focus:border-cyan-400/60"
        />
      </div>

      {/* KPI Strip: Pending Risk + Payer Routing + Negations + INA-CBG / Role Guard */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-[10px]">
        <div className={`rounded-xl border px-2.5 py-2 ${riskTone}`}>
          <div className="opacity-70">PENDING RISK</div>
          <div className="text-sm font-black">{result.pending_prevention_shield.risk_level}</div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
          <div className="text-white/50">PAYER ROUTING</div>
          <div className="text-sm font-black text-cyan-200">{result.meta.payer_routing_alert}</div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
          <div className="text-white/50">NEGATIONS DETECTED</div>
          <div className="text-sm font-black text-emerald-200">{result.meta.negations_and_resolved_conditions.length}</div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
          <div className="text-white/50">CODING BLOCK</div>
          <div className="text-sm font-black text-amber-200">
            {result.clinical_coding
              ? `${result.clinical_coding.principal_diagnosis.icd10} · ${result.clinical_coding.ina_cbg_grouping.code}`
              : 'OMITTED (NURSE)'}
          </div>
        </div>
      </div>

      {/* Coding & Missing Artifacts Matrix */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <div className="mb-1.5 font-mono text-[10px] font-black uppercase text-white/60">
            ICD-10 / ICD-9-CM · {role}
          </div>
          {result.clinical_coding ? (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1">
                <span className="font-mono font-black text-emerald-200">{result.clinical_coding.principal_diagnosis.icd10}</span>
                <span className="truncate pl-2 text-white/90">{result.clinical_coding.principal_diagnosis.description}</span>
              </div>
              {result.clinical_coding.procedures_icd9cm.map((proc) => (
                <div key={proc.icd9cm} className="flex items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2 py-1">
                  <span className="font-mono font-black text-cyan-200">{proc.icd9cm}</span>
                  <span className="truncate pl-2 text-white/80">{proc.description} ({proc.duration_or_multiplicity})</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 font-mono text-[10px] text-amber-200">
              Strict Role Governance Active: ICD-10, INA-CBG, and BPJS billing fields omitted for NURSE role.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <div className="mb-1.5 font-mono text-[10px] font-black uppercase text-white/60">
            Missing Evidence Artifacts ({result.pending_prevention_shield.missing_evidence_artifacts.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.pending_prevention_shield.missing_evidence_artifacts.length === 0 ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10px] text-emerald-200">
                Complete · Ready for Clinician Sign-Off
              </span>
            ) : (
              result.pending_prevention_shield.missing_evidence_artifacts.map((m) => (
                <span
                  key={m.artifact}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                    m.urgency === 'HIGH'
                      ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                      : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                  }`}
                >
                  {m.category}: {m.artifact}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Forensic BPJS Confirmation Copilot Draft */}
      {result.bpjs_confirmation_draft && (
        <div className="rounded-xl border border-cyan-400/35 bg-cyan-950/30 p-2.5 text-[11px]">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] font-black text-cyan-200">
            <span>FORENSIC BPJS CONFIRMATION DRAFT</span>
            <span>{result.bpjs_confirmation_draft.recommended_action}</span>
          </div>
          <p className="text-white/85">{result.bpjs_confirmation_draft.forensic_cited_response}</p>
        </div>
      )}
    </section>
  )
}
