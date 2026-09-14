import { useMemo, useState } from 'react'

interface Props {
  heartRate: number
  onHeartRateChange?: (value: number) => void
}

type Focus = 'p' | 'qrs' | 't'
type LeadName = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6'

const LEADS: Array<{ id: LeadName; group: 'Limb' | 'Chest'; view: string; weight: number; tWeight: number }> = [
  { id: 'I', group: 'Limb', view: 'leftward frontal plane', weight: 0.82, tWeight: 0.82 },
  { id: 'II', group: 'Limb', view: 'inferior-left frontal plane', weight: 1.0, tWeight: 1.0 },
  { id: 'III', group: 'Limb', view: 'inferior-right frontal plane', weight: 0.7, tWeight: 0.78 },
  { id: 'aVR', group: 'Limb', view: 'right-upper frontal plane', weight: -0.72, tWeight: -0.7 },
  { id: 'aVL', group: 'Limb', view: 'left-upper frontal plane', weight: 0.48, tWeight: 0.5 },
  { id: 'aVF', group: 'Limb', view: 'inferior frontal plane', weight: 0.9, tWeight: 0.92 },
  { id: 'V1', group: 'Chest', view: 'right anterior septal chest', weight: -0.38, tWeight: 0.12 },
  { id: 'V2', group: 'Chest', view: 'anterior septal chest', weight: -0.18, tWeight: 0.24 },
  { id: 'V3', group: 'Chest', view: 'anterior transition zone', weight: 0.2, tWeight: 0.38 },
  { id: 'V4', group: 'Chest', view: 'anterior apical chest', weight: 0.68, tWeight: 0.58 },
  { id: 'V5', group: 'Chest', view: 'left lateral chest', weight: 0.86, tWeight: 0.72 },
  { id: 'V6', group: 'Chest', view: 'far-left lateral chest', weight: 0.72, tWeight: 0.68 },
]

const FOCUS: Record<Focus, { label: string; anatomy: string; explanation: string }> = {
  p: {
    label: 'P wave',
    anatomy: 'Atrial activation',
    explanation: 'Educational correspondence: atrial depolarisation precedes atrial contraction. Surface leads see different projections of the same activation vector.',
  },
  qrs: {
    label: 'QRS complex',
    anatomy: 'Ventricular activation',
    explanation: 'Educational correspondence: rapid ventricular depolarisation produces the QRS complex. Lead polarity and amplitude change with viewing direction; this synthetic display is not a diagnostic template.',
  },
  t: {
    label: 'T wave',
    anatomy: 'Ventricular repolarisation',
    explanation: 'Educational correspondence: ventricular repolarisation is represented by the T wave. It is intentionally simplified and carries no patient-state inference.',
  },
}

const STATEMENTS = [
  'Rhythm statement',
  'Conduction statement',
  'Axis / orientation statement',
  'Repolarisation statement',
] as const

function gaussian(x: number, centre: number, width: number, amplitude: number) {
  const z = (x - centre) / width
  return amplitude * Math.exp(-0.5 * z * z)
}

function syntheticEcg(phase: number, lead: { weight: number; tWeight: number }) {
  const p = gaussian(phase, 0.18, 0.035, 0.16 * Math.sign(lead.weight || 1) * Math.max(0.55, Math.abs(lead.weight)))
  const q = gaussian(phase, 0.34, 0.012, -0.12 * Math.max(0.45, Math.abs(lead.weight)))
  const r = gaussian(phase, 0.365, 0.014, 1.0 * lead.weight)
  const s = gaussian(phase, 0.405, 0.018, -0.32 * lead.weight)
  const t = gaussian(phase, 0.67, 0.07, 0.34 * lead.tWeight)
  return p + q + r + s + t
}

function pointsForLead(lead: { weight: number; tWeight: number }, compact = false) {
  const count = compact ? 120 : 240
  const width = compact ? 148 : 304
  const x0 = compact ? 4 : 8
  const baseline = compact ? 38 : 78
  const gain = compact ? 24 : 55
  return Array.from({ length: count }, (_, index) => {
    const phase = index / (count - 1)
    const x = x0 + phase * width
    const y = baseline - syntheticEcg(phase, lead) * gain
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function EcgAnatomyStudio({ heartRate, onHeartRateChange }: Props) {
  const [focus, setFocus] = useState<Focus>('qrs')
  const [leadName, setLeadName] = useState<LeadName>('II')
  const [showAll, setShowAll] = useState(true)
  const rrSeconds = 60 / Math.max(1, heartRate)
  const lead = LEADS.find((item) => item.id === leadName) ?? LEADS[1]
  const points = useMemo(() => pointsForLead(lead), [lead])
  const miniPoints = useMemo(() => new Map(LEADS.map((item) => [item.id, pointsForLead(item, true)])), [])

  const marker = focus === 'p' ? 0.18 : focus === 'qrs' ? 0.37 : 0.67
  const markerX = 8 + marker * 304

  return (
    <section data-ecg-anatomy-studio="v2" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-sky-500/[0.08] p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Heart anatomy × 12-lead ECG</div>
        <h3 className="mt-1 text-sm font-black text-ink dark:text-white">Rotate the electrical view across all twelve standard leads</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          Every waveform on this screen is generated locally for teaching and is not recorded ECG data. It does not classify a patient rhythm. PTB-XL is a future source-backed compatibility target for record playback and multi-label statement exploration; no PTB-XL records, labels, model weights or performance claims are bundled here. HaneenElyamani/ECG-classification remains a capability reference only because repository-level reuse terms have not been verified.
        </p>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Selected lead</div>
            <div className="text-lg font-black text-ink dark:text-white">{lead.id} · {lead.view}</div>
          </div>
          <button type="button" onClick={() => setShowAll((value) => !value)} aria-pressed={showAll} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-[10px] font-black dark:border-white/10">
            {showAll ? 'Focus one lead' : 'Show 12 leads'}
          </button>
        </div>

        <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-white/10 dark:bg-white/[0.035]">
          <svg viewBox="0 0 320 112" role="img" aria-label={`Synthetic educational ${lead.id} ECG at ${heartRate} beats per minute`} className="w-full">
            {Array.from({ length: 17 }, (_, i) => <line key={`v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={112} stroke="currentColor" className="text-neutral-200 dark:text-white/5" strokeWidth="0.5" />)}
            {Array.from({ length: 7 }, (_, i) => <line key={`h-${i}`} x1={0} y1={i * 18.7} x2={320} y2={i * 18.7} stroke="currentColor" className="text-neutral-200 dark:text-white/5" strokeWidth="0.5" />)}
            <line x1={0} y1={78} x2={320} y2={78} stroke="currentColor" className="text-neutral-300 dark:text-white/10" strokeWidth="1" />
            <polyline points={points} fill="none" stroke="currentColor" className="text-brand" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            <line x1={markerX} y1={7} x2={markerX} y2={105} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx={markerX} cy={9} r={3.5} fill="#0ea5e9" />
          </svg>
        </div>

        <div className="mt-2 grid grid-cols-6 gap-1.5" role="group" aria-label="12-lead ECG selector">
          {LEADS.map((item) => (
            <button key={item.id} type="button" aria-pressed={leadName === item.id} onClick={() => setLeadName(item.id)} className={`min-h-11 rounded-lg border px-1 text-[10px] font-black ${leadName === item.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
              {item.id}
            </button>
          ))}
        </div>

        {showAll && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label="Twelve synthetic ECG lead overview">
            {LEADS.map((item) => (
              <button key={`mini-${item.id}`} type="button" onClick={() => setLeadName(item.id)} className={`min-h-24 rounded-xl border p-1.5 text-left ${leadName === item.id ? 'border-brand bg-brand/[0.04]' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="flex items-center justify-between text-[9px] font-black"><span>{item.id}</span><span className="text-neutral-400">{item.group}</span></div>
                <svg viewBox="0 0 156 76" className="mt-1 w-full" role="img" aria-label={`${item.id} synthetic lead thumbnail`}>
                  <line x1="0" x2="156" y1="38" y2="38" stroke="currentColor" className="text-neutral-200 dark:text-white/10" strokeWidth="0.7" />
                  <polyline points={miniPoints.get(item.id)} fill="none" stroke="currentColor" className="text-brand" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="ECG phase focus">
          {(Object.keys(FOCUS) as Focus[]).map((key) => (
            <button key={key} type="button" aria-pressed={focus === key} onClick={() => setFocus(key)} className={`min-h-11 rounded-xl border px-2 text-[10.5px] font-black ${focus === key ? 'border-sky-500 bg-sky-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
              {FOCUS[key].label}
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-2.5">
          <div className="text-[9px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-300">{FOCUS[focus].anatomy}</div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{FOCUS[focus].explanation}</p>
        </div>

        <div className="mt-2 rounded-xl border border-violet-400/20 bg-violet-400/[0.05] p-2.5">
          <div className="text-[9px] font-black uppercase tracking-wide text-violet-600 dark:text-violet-300">Multi-label statement learning</div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {STATEMENTS.map((statement) => <div key={statement} className="rounded-lg border border-violet-400/15 bg-white/60 px-2 py-1.5 text-[9.5px] font-bold text-neutral-600 dark:bg-white/[0.03] dark:text-neutral-300">{statement}</div>)}
          </div>
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-neutral-500">These are statement categories only. No statement is inferred from this synthetic waveform and no autonomous diagnosis is performed.</p>
        </div>

        <label className="mt-3 block text-[10px] font-black uppercase tracking-wide text-neutral-500">
          Heart rate · {heartRate} bpm · RR {rrSeconds.toFixed(2)} s
          <input type="range" min={40} max={180} value={heartRate} onChange={(event) => onHeartRateChange?.(Number(event.target.value))} className="mt-1 block min-h-11 w-full accent-[var(--brand,#00bf63)]" aria-label="Synthetic ECG heart rate" />
        </label>

        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-2 text-[9.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          <b className="text-amber-600 dark:text-amber-300">Boundary.</b> RR = 60 / heart rate is used only for timing. Lead morphology is a deliberately simplified projection model for visual teaching, not measured voltage, a validated simulator, diagnostic ECG generation, or patient-specific rhythm. Real PTB-XL integration must preserve record provenance, labels and evaluation boundaries before it can replace this synthetic layer.
        </div>
      </div>
    </section>
  )
}

export default EcgAnatomyStudio
