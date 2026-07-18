import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// GRACE Score (in-hospital mortality) — Granger, C.B., et al. (2003),
// Arch Intern Med, 163(19):2345-2353. Risk of in-hospital death across the
// full ACS spectrum (STEMI, NSTEMI, UA) from 8 admission variables, using
// the original published point table. Risk categories (registry convention):
//   ≤108 low (<1%), 109-140 intermediate (1-3%), >140 high (>3%).
// Complements the TIMI UA/NSTEMI score elsewhere in this app — GRACE covers
// all ACS and is preferred in ESC guidance for invasive-timing decisions.
// Pure lookup-table arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function agePts(v: number): number {
  if (v < 30) return 0
  if (v < 40) return 8
  if (v < 50) return 25
  if (v < 60) return 41
  if (v < 70) return 58
  if (v < 80) return 75
  if (v < 90) return 91
  return 100
}
function hrPts(v: number): number {
  if (v < 50) return 0
  if (v < 70) return 3
  if (v < 90) return 9
  if (v < 110) return 15
  if (v < 150) return 24
  if (v < 200) return 38
  return 46
}
function sbpPts(v: number): number {
  if (v < 80) return 58
  if (v < 100) return 53
  if (v < 120) return 43
  if (v < 140) return 34
  if (v < 160) return 24
  if (v < 200) return 10
  return 0
}
function creatPts(v: number): number {
  if (v < 0.4) return 1
  if (v < 0.8) return 4
  if (v < 1.2) return 7
  if (v < 1.6) return 10
  if (v < 2.0) return 13
  if (v < 4.0) return 21
  return 28
}
const KILLIP_PTS = [0, 20, 39, 59] // class I-IV

function band(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; mortality: string } {
  if (score <= 108) return { label: 'Low risk', tone: 'brand', mortality: '<1% in-hospital mortality' }
  if (score <= 140) return { label: 'Intermediate risk', tone: 'low', mortality: '1-3% in-hospital mortality' }
  return { label: 'High risk', tone: 'critical', mortality: '>3% in-hospital mortality' }
}

export function GraceScore() {
  const [age, setAge] = useState(60)
  const [hr, setHr] = useState(75)
  const [sbp, setSbp] = useState(130)
  const [creat, setCreat] = useState(1.0)
  const [killip, setKillip] = useState(0)
  const [arrest, setArrest] = useState(false)
  const [stDev, setStDev] = useState(false)
  const [markers, setMarkers] = useState(false)

  const score =
    agePts(age) + hrPts(hr) + sbpPts(sbp) + creatPts(creat) + KILLIP_PTS[killip] +
    (arrest ? 39 : 0) + (stDev ? 28 : 0) + (markers ? 14 : 0)
  const result = band(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="GRACE Score" subtitle="ACS in-hospital mortality (Granger et al. 2003)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Covers the full ACS spectrum (STEMI, NSTEMI, unstable angina) and is preferred in ESC
          guidance for timing the invasive strategy — complements the UA/NSTEMI-specific TIMI score.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Heart rate (bpm)">
            <input className={inputClass} type="number" min={0} value={hr || ''} onChange={(e) => setHr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbp || ''} onChange={(e) => setSbp(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={creat || ''} onChange={(e) => setCreat(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Killip class">
            <select className={inputClass} value={killip} onChange={(e) => setKillip(Number(e.target.value))}>
              <option value={0}>I — no heart failure (0 pt)</option>
              <option value={1}>II — rales / elevated JVP (20 pt)</option>
              <option value={2}>III — pulmonary edema (39 pt)</option>
              <option value={3}>IV — cardiogenic shock (59 pt)</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={arrest} onChange={(e) => setArrest(e.target.checked)} className="h-4 w-4 rounded" />
            Cardiac arrest at admission (+39)
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={stDev} onChange={(e) => setStDev(e.target.checked)} className="h-4 w-4 rounded" />
            ST-segment deviation (+28)
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} className="h-4 w-4 rounded" />
            Elevated cardiac biomarkers (+14)
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">GRACE Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score}</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">
          {result.mortality}. Categories: ≤108 low · 109-140 intermediate · {'>'}140 high. In NSTE-ACS,
          higher GRACE risk supports an earlier invasive strategy per ESC guidance.
        </p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Granger, C.B., et al. (2003). Predictors of hospital mortality in the Global Registry of
        Acute Coronary Events. <i>Arch Intern Med</i>, 163(19), 2345-2353. Decision-support estimate
        using the original in-hospital mortality point table (GRACE 2.0 uses a continuous online model).
      </div>
    </div>
  )
}

export default GraceScore
