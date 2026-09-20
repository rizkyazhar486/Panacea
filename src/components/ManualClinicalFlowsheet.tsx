import { useMemo, useState } from 'react'
import type { SupportiveResult, VitalSign } from '../lib/types'

type FieldKind = 'number' | 'text' | 'textarea'
type GroupId = 'vitals' | 'resp' | 'hemo' | 'io' | 'labs' | 'support'

interface FieldDef {
  key: string
  label: string
  unit?: string
  kind?: FieldKind
  category: SupportiveResult['category']
}

interface FlowGroup {
  id: GroupId
  label: string
  fields: FieldDef[]
}

interface ManualClinicalFlowsheetProps {
  onAddVital: (vital: VitalSign) => void
  onAddSupportive: (result: SupportiveResult) => void
}

const GROUPS: FlowGroup[] = [
  {
    id: 'vitals',
    label: 'Vitals',
    fields: [
      { key: 'systolic', label: 'SBP', unit: 'mmHg', category: 'Lainnya' },
      { key: 'diastolic', label: 'DBP', unit: 'mmHg', category: 'Lainnya' },
      { key: 'map', label: 'MAP', unit: 'mmHg', category: 'Lainnya' },
      { key: 'heartRate', label: 'Pulse', unit: '/min', category: 'Lainnya' },
      { key: 'respRate', label: 'RR', unit: '/min', category: 'Lainnya' },
      { key: 'tempC', label: 'Temperature', unit: '°C', category: 'Lainnya' },
      { key: 'spo2', label: 'SpO₂', unit: '%', category: 'Lainnya' },
      { key: 'glucose', label: 'Blood glucose', unit: 'mg/dL', category: 'Lab' },
      { key: 'ecgRhythm', label: 'ECG rhythm', kind: 'text', category: 'EKG' },
      { key: 'pacing', label: 'PPM / temporary pacing', kind: 'text', category: 'EKG' },
    ],
  },
  {
    id: 'resp',
    label: 'Resp',
    fields: [
      { key: 'oxygenMode', label: 'Ventilator / O₂ mode', kind: 'text', category: 'Lainnya' },
      { key: 'fio2', label: 'FiO₂', unit: '%', category: 'Lainnya' },
      { key: 'ventRate', label: 'Set RR', unit: '/min', category: 'Lainnya' },
      { key: 'tidalVolume', label: 'Tidal volume', unit: 'mL', category: 'Lainnya' },
      { key: 'minuteVolume', label: 'Minute volume', unit: 'L/min', category: 'Lainnya' },
      { key: 'inspiratoryPressure', label: 'Inspiratory pressure', unit: 'cmH₂O', category: 'Lainnya' },
      { key: 'peep', label: 'PEEP', unit: 'cmH₂O', category: 'Lainnya' },
      { key: 'humidifierTemp', label: 'Humidifier temperature', unit: '°C', category: 'Lainnya' },
      { key: 'sleepPosition', label: 'Position', kind: 'text', category: 'Lainnya' },
      { key: 'secretions', label: 'Airway secretions', kind: 'text', category: 'Lainnya' },
    ],
  },
  {
    id: 'hemo',
    label: 'Hemodynamics',
    fields: [
      { key: 'cvp', label: 'CVP', unit: 'mmHg', category: 'Lainnya' },
      { key: 'pap', label: 'PAP', unit: 'mmHg', kind: 'text', category: 'Lainnya' },
      { key: 'pawp', label: 'PAWP / PAD', unit: 'mmHg', category: 'Lainnya' },
      { key: 'cardiacOutput', label: 'Cardiac output', unit: 'L/min', category: 'Lainnya' },
      { key: 'cardiacIndex', label: 'Cardiac index', unit: 'L/min/m²', category: 'Lainnya' },
      { key: 'svr', label: 'SVR', unit: 'dyn·s/cm⁵', category: 'Lainnya' },
      { key: 'svri', label: 'SVRI', unit: 'dyn·s·m²/cm⁵', category: 'Lainnya' },
      { key: 'pvr', label: 'PVR', unit: 'dyn·s/cm⁵', category: 'Lainnya' },
      { key: 'pvri', label: 'PVRI', unit: 'dyn·s·m²/cm⁵', category: 'Lainnya' },
      { key: 'svo2', label: 'SvO₂', unit: '%', category: 'Lab' },
      { key: 'iabpPressure', label: 'IABP pressure / augmentation', kind: 'text', category: 'Lainnya' },
      { key: 'iabpTrigger', label: 'IABP trigger / ratio', kind: 'text', category: 'Lainnya' },
      { key: 'crrtTherapy', label: 'CRRT therapy type', kind: 'text', category: 'Lainnya' },
      { key: 'crrtBloodFlow', label: 'CRRT blood flow', unit: 'mL/min', category: 'Lainnya' },
      { key: 'crrtAccessPressure', label: 'CRRT access pressure', unit: 'mmHg', category: 'Lainnya' },
      { key: 'crrtReturnPressure', label: 'CRRT return pressure', unit: 'mmHg', category: 'Lainnya' },
      { key: 'crrtTmp', label: 'CRRT TMP', unit: 'mmHg', category: 'Lainnya' },
      { key: 'crrtReplacement', label: 'CRRT replacement fluid', unit: 'mL/h', category: 'Lainnya' },
      { key: 'crrtDialysate', label: 'CRRT dialysate', unit: 'mL/h', category: 'Lainnya' },
      { key: 'crrtUltrafiltration', label: 'CRRT ultrafiltration', unit: 'mL/h', category: 'Lainnya' },
      { key: 'crrtBalance', label: 'CRRT cumulative balance', unit: 'mL', category: 'Lainnya' },
      { key: 'actHeparin', label: 'ACT / heparin dose', kind: 'text', category: 'Lab' },
      { key: 'ecmoBloodFlow', label: 'ECMO blood flow', unit: 'L/min', category: 'Lainnya' },
      { key: 'ecmoPumpSpeed', label: 'ECMO pump speed', unit: 'rpm', category: 'Lainnya' },
      { key: 'ecmoSweep', label: 'ECMO gas sweep', unit: 'L/min', category: 'Lainnya' },
      { key: 'ecmoFio2', label: 'ECMO FiO₂', unit: '%', category: 'Lainnya' },
    ],
  },
  {
    id: 'io',
    label: 'I/O',
    fields: [
      { key: 'colloid', label: 'Colloid', unit: 'mL', category: 'Lainnya' },
      { key: 'crystalloid', label: 'Crystalloid', unit: 'mL', category: 'Lainnya' },
      { key: 'ngtIntake', label: 'NGT / enteral intake', unit: 'mL', category: 'Lainnya' },
      { key: 'oralIntake', label: 'Oral intake', unit: 'mL', category: 'Lainnya' },
      { key: 'otherIntake', label: 'Other infusion / intake', unit: 'mL', category: 'Lainnya' },
      { key: 'totalIntake', label: 'Total intake', unit: 'mL', category: 'Lainnya' },
      { key: 'drainIntrapleural', label: 'Intrapleural drain', unit: 'mL', category: 'Lainnya' },
      { key: 'drainSubsternal', label: 'Substernal drain', unit: 'mL', category: 'Lainnya' },
      { key: 'drainIntrapericardial', label: 'Intrapericardial drain', unit: 'mL', category: 'Lainnya' },
      { key: 'otherDrain', label: 'Other drain', unit: 'mL', category: 'Lainnya' },
      { key: 'ngtOutput', label: 'NGT / vomit', unit: 'mL', category: 'Lainnya' },
      { key: 'urine', label: 'Urine', unit: 'mL', category: 'Lainnya' },
      { key: 'stool', label: 'Stool', kind: 'text', category: 'Lainnya' },
      { key: 'iwl', label: 'IWL', unit: 'mL', category: 'Lainnya' },
      { key: 'totalOutput', label: 'Total output', unit: 'mL', category: 'Lainnya' },
      { key: 'totalBalance', label: 'Total balance', unit: 'mL', category: 'Lainnya' },
    ],
  },
  {
    id: 'labs',
    label: 'Labs',
    fields: [
      { key: 'ph', label: 'pH', category: 'Lab' },
      { key: 'pao2', label: 'PaO₂', unit: 'mmHg', category: 'Lab' },
      { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', category: 'Lab' },
      { key: 'hco3', label: 'HCO₃⁻', unit: 'mmol/L', category: 'Lab' },
      { key: 'be', label: 'BE', unit: 'mmol/L', category: 'Lab' },
      { key: 'sao2', label: 'SaO₂', unit: '%', category: 'Lab' },
      { key: 'potassium', label: 'K', unit: 'mmol/L', category: 'Lab' },
      { key: 'sodium', label: 'Na', unit: 'mmol/L', category: 'Lab' },
      { key: 'chloride', label: 'Cl', unit: 'mmol/L', category: 'Lab' },
      { key: 'calcium', label: 'Ca', unit: 'mg/dL', category: 'Lab' },
      { key: 'magnesium', label: 'Mg', unit: 'mg/dL', category: 'Lab' },
      { key: 'gds', label: 'GDS', unit: 'mg/dL', category: 'Lab' },
      { key: 'hemoglobin', label: 'Hb', unit: 'g/dL', category: 'Lab' },
      { key: 'hematocrit', label: 'Ht', unit: '%', category: 'Lab' },
      { key: 'leukocytes', label: 'Leukocytes', unit: '/µL', category: 'Lab' },
      { key: 'platelets', label: 'Platelets', unit: '/µL', category: 'Lab' },
      { key: 'urea', label: 'Urea', unit: 'mg/dL', category: 'Lab' },
      { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', category: 'Lab' },
      { key: 'ck', label: 'CK', unit: 'U/L', category: 'Lab' },
      { key: 'ckmb', label: 'CK-MB', unit: 'ng/mL', category: 'Lab' },
      { key: 'hsTroponin', label: 'hs-Troponin', unit: 'ng/L', category: 'Lab' },
      { key: 'ast', label: 'AST', unit: 'U/L', category: 'Lab' },
      { key: 'alt', label: 'ALT', unit: 'U/L', category: 'Lab' },
      { key: 'albumin', label: 'Albumin', unit: 'g/dL', category: 'Lab' },
      { key: 'lactate', label: 'Lactate', unit: 'mmol/L', category: 'Lab' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    fields: [
      { key: 'consciousness', label: 'Consciousness', kind: 'text', category: 'Lainnya' },
      { key: 'gcsEye', label: 'GCS Eye', category: 'Lainnya' },
      { key: 'gcsVerbal', label: 'GCS Verbal', category: 'Lainnya' },
      { key: 'gcsMotor', label: 'GCS Motor', category: 'Lainnya' },
      { key: 'rass', label: 'RASS', category: 'Lainnya' },
      { key: 'painScore', label: 'Pain score', category: 'Lainnya' },
      { key: 'pupils', label: 'Pupils / light reflex', kind: 'text', category: 'Lainnya' },
      { key: 'airwayDevice', label: 'ETT / tracheostomy', kind: 'text', category: 'Lainnya' },
      { key: 'ngtDevice', label: 'NGT', kind: 'text', category: 'Lainnya' },
      { key: 'centralLine', label: 'Central venous line / CVP', kind: 'text', category: 'Lainnya' },
      { key: 'arterialLine', label: 'Arterial line', kind: 'text', category: 'Lainnya' },
      { key: 'drainDevice', label: 'Drains', kind: 'text', category: 'Lainnya' },
      { key: 'pacerDevice', label: 'Pacer', kind: 'text', category: 'Lainnya' },
      { key: 'urinaryCatheter', label: 'Urinary catheter', kind: 'text', category: 'Lainnya' },
      { key: 'otherDevice', label: 'Other support (NO / HFO / etc.)', kind: 'text', category: 'Lainnya' },
      { key: 'medicalDiagnosis', label: 'Medical diagnosis', kind: 'textarea', category: 'Lainnya' },
      { key: 'procedure', label: 'Procedure / operation', kind: 'textarea', category: 'Lainnya' },
      { key: 'nursingNotes', label: 'Clinical / nursing notes', kind: 'textarea', category: 'Lainnya' },
    ],
  },
]

const ALL_FIELDS = GROUPS.flatMap((group) => group.fields.map((field) => ({ ...field, group: group.label })))
const CORE_VITAL_KEYS = new Set(['systolic', 'diastolic', 'heartRate', 'respRate', 'tempC', 'spo2'])
const CORE_VITAL_LIST = ['systolic', 'diastolic', 'heartRate', 'respRate', 'tempC', 'spo2'] as const

function localDateTimeNow(): string {
  const now = new Date()
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return shifted.toISOString().slice(0, 16)
}

function id(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function finiteValue(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function ManualClinicalFlowsheet({ onAddVital, onAddSupportive }: ManualClinicalFlowsheetProps) {
  const [activeGroup, setActiveGroup] = useState<GroupId>('vitals')
  const [takenAt, setTakenAt] = useState(localDateTimeNow)
  const [values, setValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')

  const group = GROUPS.find((item) => item.id === activeGroup) ?? GROUPS[0]

  const mapPreview = useMemo(() => {
    const sbp = finiteValue(values.systolic)
    const dbp = finiteValue(values.diastolic)
    return sbp != null && dbp != null ? (sbp + 2 * dbp) / 3 : null
  }, [values.diastolic, values.systolic])

  const balancePreview = useMemo(() => {
    const input = finiteValue(values.totalIntake)
    const output = finiteValue(values.totalOutput)
    return input != null && output != null ? input - output : null
  }, [values.totalIntake, values.totalOutput])

  function setValue(key: string, value: string) {
    setStatus('')
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save() {
    const date = new Date(takenAt)
    if (!takenAt || Number.isNaN(date.getTime())) {
      setStatus('Choose a valid charting date and time.')
      return
    }

    const entered = ALL_FIELDS.filter((field) => (values[field.key] ?? '').trim() !== '')
    if (entered.length === 0) {
      setStatus('Enter at least one value before saving.')
      return
    }

    const coreComplete = CORE_VITAL_LIST.every((key) => finiteValue(values[key]) != null)
    const iso = date.toISOString()
    let saved = 0

    if (coreComplete) {
      const glucose = finiteValue(values.glucose)
      onAddVital({
        id: id(),
        takenAt: iso,
        systolic: Number(values.systolic),
        diastolic: Number(values.diastolic),
        heartRate: Number(values.heartRate),
        respRate: Number(values.respRate),
        tempC: Number(values.tempC),
        spo2: Number(values.spo2),
        glucose: glucose ?? undefined,
        note: 'Manual ICU flowsheet entry',
      })
      saved += 1
    }

    for (const field of entered) {
      if (coreComplete && (CORE_VITAL_KEYS.has(field.key) || field.key === 'glucose')) continue
      onAddSupportive({
        id: id(),
        takenAt: iso,
        category: field.category,
        name: 'ICU · ' + field.group + ' · ' + field.label,
        value: values[field.key].trim(),
        unit: field.unit,
      })
      saved += 1
    }

    setValues({})
    setTakenAt(localDateTimeNow())
    setStatus(
      coreComplete
        ? 'Saved ' + saved + ' chart item' + (saved === 1 ? '' : 's') + '. Core vitals were also added to the vital-sign timeline.'
        : 'Saved ' + saved + ' manual chart item' + (saved === 1 ? '' : 's') + '. Complete SBP, DBP, pulse, RR, temperature and SpO₂ together to also create a vital-sign snapshot.',
    )
  }

  return (
    <section id="manual-icu-flowsheet" aria-labelledby="manual-icu-flowsheet-title" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="manual-icu-flowsheet-title" className="text-sm font-black text-ink dark:text-white">Manual ICU flowsheet</h3>
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-white/45">Hourly bedside charting · values are stored exactly as entered · no automatic clinical interpretation.</p>
        </div>
        <label className="min-w-[220px]">
          <span className="block text-[9px] font-black uppercase tracking-[.12em] text-neutral-400 dark:text-white/35">Chart time</span>
          <input
            type="datetime-local"
            value={takenAt}
            onChange={(event) => setTakenAt(event.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-xs font-semibold outline-none focus:border-[#00BF63] dark:border-white/10"
          />
        </label>
      </div>

      <div className="flex gap-5 overflow-x-auto border-b border-neutral-100 px-5 dark:border-white/10" role="tablist" aria-label="ICU flowsheet groups">
        {GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeGroup === item.id}
            onClick={() => setActiveGroup(item.id)}
            className={'min-h-[46px] shrink-0 border-b-2 px-0 text-[10px] font-black uppercase tracking-[.1em] transition ' + (activeGroup === item.id ? 'border-[#00BF63] text-[#00BF63]' : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-white')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.fields.map((field) => (
            <label key={field.key} className={field.kind === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}>
              <span className="flex min-h-[18px] items-end justify-between gap-2 text-[10px] font-bold text-neutral-500 dark:text-white/50">
                <span>{field.label}</span>
                {field.unit && <span className="font-medium text-neutral-300 dark:text-white/25">{field.unit}</span>}
              </span>
              {field.kind === 'textarea' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#00BF63] dark:border-white/10"
                />
              ) : (
                <input
                  type={field.kind === 'text' ? 'text' : 'number'}
                  inputMode={field.kind === 'text' ? undefined : 'decimal'}
                  step={field.kind === 'text' ? undefined : 'any'}
                  value={values[field.key] ?? ''}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  placeholder="—"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-sm font-bold tabular-nums outline-none placeholder:text-neutral-250 focus:border-[#00BF63] dark:border-white/10"
                />
              )}
            </label>
          ))}
        </div>

        {activeGroup === 'vitals' && (
          <div className="mt-4 rounded-xl border border-neutral-100 px-3 py-2 text-[10px] text-neutral-500 dark:border-white/10 dark:text-white/40">
            MAP preview: <strong className="text-ink dark:text-white">{mapPreview == null ? '—' : mapPreview.toFixed(1) + ' mmHg'}</strong>
            <span className="ml-2">MAP = (SBP + 2×DBP) ÷ 3</span>
          </div>
        )}

        {activeGroup === 'io' && (
          <div className="mt-4 rounded-xl border border-neutral-100 px-3 py-2 text-[10px] text-neutral-500 dark:border-white/10 dark:text-white/40">
            Balance preview: <strong className="text-ink dark:text-white">{balancePreview == null ? '—' : balancePreview.toFixed(0) + ' mL'}</strong>
            <span className="ml-2">balance = total intake − total output</span>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="min-h-[18px] text-[10px] leading-relaxed text-neutral-500 dark:text-white/45">{status}</p>
          <button
            type="button"
            onClick={save}
            className="min-h-[44px] shrink-0 rounded-full bg-[#00BF63] px-5 text-xs font-black text-black transition active:scale-[.98]"
          >
            Save chart entry
          </button>
        </div>
      </div>
    </section>
  )
}

export default ManualClinicalFlowsheet
