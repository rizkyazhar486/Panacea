import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { ScoreTrend } from '../components/ScoreTrend'

// ─────────────────────────────────────────────────────────────────────────────
// NEWS2 (National Early Warning Score 2) — Royal College of Physicians (2017).
// Standard ward-based physiological deterioration score, aggregating 7 vital
// signs into a single trigger for escalation. Pure threshold scoring, no
// external API. Uses SpO2 Scale 1 (normal target range) — a separate Scale 2
// exists for patients with hypercapnic respiratory failure on a lower target
// range, not implemented here.
// ─────────────────────────────────────────────────────────────────────────────

function rrPts(v: number): number {
  if (v <= 8) return 3
  if (v <= 11) return 1
  if (v <= 20) return 0
  if (v <= 24) return 2
  return 3
}
function spo2Pts(v: number): number {
  if (v <= 91) return 3
  if (v <= 93) return 2
  if (v <= 95) return 1
  return 0
}
function sbpPts(v: number): number {
  if (v <= 90) return 3
  if (v <= 100) return 2
  if (v <= 110) return 1
  if (v <= 219) return 0
  return 3
}
function hrPts(v: number): number {
  if (v <= 40) return 3
  if (v <= 50) return 1
  if (v <= 90) return 0
  if (v <= 110) return 1
  if (v <= 130) return 2
  return 3
}
function tempPts(v: number): number {
  if (v <= 35.0) return 3
  if (v <= 36.0) return 1
  if (v <= 38.0) return 0
  if (v <= 39.0) return 1
  return 2
}

function band(total: number, anyThree: boolean): { label: string; tone: 'brand' | 'low' | 'critical'; action: string } {
  if (total >= 7) return { label: 'High risk', tone: 'critical', action: 'Urgent/emergency clinical review — continuous monitoring, consider critical care referral.' }
  if (total >= 5 || anyThree) return { label: 'Medium risk', tone: 'low', action: 'Urgent review by a clinician skilled in acute illness, increased monitoring frequency.' }
  if (total >= 1) return { label: 'Low-medium risk', tone: 'brand', action: 'Ward nurse review, consider increasing monitoring frequency.' }
  return { label: 'Low risk', tone: 'brand', action: 'Routine monitoring per ward protocol.' }
}

export function News2Score() {
  const [rr, setRr] = useState(16)
  const [spo2, setSpo2] = useState(98)
  const [onOxygen, setOnOxygen] = useState(false)
  const [sbp, setSbp] = useState(120)
  const [hr, setHr] = useState(75)
  const [alert, setAlert] = useState(true)
  const [temp, setTemp] = useState(37.0)

  const rrScore = rrPts(rr)
  const spo2Score = spo2Pts(spo2)
  const oxygenScore = onOxygen ? 2 : 0
  const sbpScore = sbpPts(sbp)
  const hrScore = hrPts(hr)
  const consciousnessScore = alert ? 0 : 3
  const tempScore = tempPts(temp)

  const rows = [
    { name: 'Respiration rate', pts: rrScore },
    { name: 'SpO₂', pts: spo2Score },
    { name: 'Air or oxygen', pts: oxygenScore },
    { name: 'Systolic BP', pts: sbpScore },
    { name: 'Pulse', pts: hrScore },
    { name: 'Consciousness (AVPU)', pts: consciousnessScore },
    { name: 'Temperature', pts: tempScore },
  ]
  const total = rows.reduce((s, r) => s + r.pts, 0)
  const anyThree = rows.some((r) => r.pts === 3)
  const result = band(total, anyThree)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="NEWS2 Score" subtitle="National Early Warning Score — ward deterioration risk (RCP 2017)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Aggregates 7 routine vital signs into a single escalation trigger. Widely used across UK and
          international hospital wards to standardize the response to acute deterioration.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Respiration rate (/min)">
            <input className={inputClass} type="number" min={0} value={rr || ''} onChange={(e) => setRr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="SpO₂ (%)">
            <input className={inputClass} type="number" min={0} max={100} value={spo2 || ''} onChange={(e) => setSpo2(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbp || ''} onChange={(e) => setSbp(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Pulse (bpm)">
            <input className={inputClass} type="number" min={0} value={hr || ''} onChange={(e) => setHr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Temperature (°C)">
            <input className={inputClass} type="number" step="0.1" value={temp || ''} onChange={(e) => setTemp(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={onOxygen} onChange={(e) => setOnOxygen(e.target.checked)} className="h-4 w-4 rounded" />
          Requires supplemental oxygen
        </label>
        <label className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="h-4 w-4 rounded" />
          Alert (uncheck if confused, responds only to voice/pain, or unresponsive — AVPU)
        </label>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Per-parameter breakdown</div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div className="text-sm font-bold text-ink dark:text-white">{r.name}</div>
              <div className="text-lg font-black text-brand-dark">{r.pts}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Total NEWS2 Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{total}</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{result.action}</p>
      </Card>

      <ScoreTrend
        storageKey="pmd_news2_trend_v1"
        scoreName="NEWS2"
        total={total}
        maxScore={20}
        detail={`RR ${rr}, SpO₂ ${spo2}%${onOxygen ? ' on O₂' : ''}, SBP ${sbp}, HR ${hr}, ${alert ? 'alert' : 'not alert'}, T ${temp.toFixed(1)}°C`}
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Royal College of Physicians (2017). National Early Warning Score (NEWS) 2. Decision-support
        estimate — uses SpO₂ Scale 1 (not the alternate Scale 2 for hypercapnic respiratory failure);
        always follow your institution's escalation protocol.
      </div>
    </div>
  )
}

export default News2Score
