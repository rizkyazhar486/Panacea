import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Glasgow-Blatchford Score (GBS) — Blatchford, O., et al. (2000), Lancet,
// 356(9238):1318-1323. Pre-endoscopy risk stratification for upper GI
// bleeding — a score of 0 identifies patients low-risk enough that some
// guidelines support outpatient management without admission. Pure checklist
// scoring, no external API. BUN cutoffs below use mg/dL (US units); original
// UK study used mmol/L urea (≈ mg/dL / 2.8).
// ─────────────────────────────────────────────────────────────────────────────

function bunPts(v: number): number {
  if (v < 18.2) return 0
  if (v < 22.4) return 2
  if (v < 28) return 3
  if (v < 70) return 4
  return 6
}
function hgbPts(v: number, sex: 'M' | 'F'): number {
  if (sex === 'M') {
    if (v >= 13) return 0
    if (v >= 12) return 1
    if (v >= 10) return 3
    return 6
  }
  if (v >= 12) return 0
  if (v >= 10) return 1
  return 6
}
function sbpPts(v: number): number {
  if (v >= 110) return 0
  if (v >= 100) return 1
  if (v >= 90) return 2
  return 3
}

export function GlasgowBlatchfordScore() {
  const [bun, setBun] = useState(15)
  const [hgb, setHgb] = useState(14)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [sbp, setSbp] = useState(120)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setFlags((c) => ({ ...c, [key]: !c[key] }))

  const flagPts: Record<string, number> = { hr: 1, melena: 1, syncope: 2, hepatic: 2, cardiac: 2 }
  const flagScore = Object.entries(flags).reduce((sum, [k, v]) => sum + (v ? flagPts[k] ?? 0 : 0), 0)

  const score = bunPts(bun) + hgbPts(hgb, sex) + sbpPts(sbp) + flagScore
  const lowRisk = score === 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Glasgow-Blatchford Score" subtitle="Pre-endoscopy upper GI bleed risk (Blatchford et al. 2000)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Calculated before endoscopy from clinical and lab data alone. A score of 0 identifies
          patients low-risk enough that some guidelines support outpatient management without
          admission or urgent endoscopy.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="BUN (mg/dL)">
            <input className={inputClass} type="number" min={0} value={bun || ''} onChange={(e) => setBun(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Hemoglobin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={hgb || ''} onChange={(e) => setHgb(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbp || ''} onChange={(e) => setSbp(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Other findings</div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.hr} onChange={() => toggle('hr')} />
            Heart rate ≥ 100 bpm
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.melena} onChange={() => toggle('melena')} />
            Melena present
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.syncope} onChange={() => toggle('syncope')} />
            Syncope
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.hepatic} onChange={() => toggle('hepatic')} />
            Known hepatic disease (history or exam)
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.cardiac} onChange={() => toggle('cardiac')} />
            Known cardiac failure (history or exam)
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Glasgow-Blatchford Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score}</span>
          <Badge tone={lowRisk ? 'brand' : score <= 5 ? 'low' : 'critical'}>
            {lowRisk ? 'Very low risk' : score <= 5 ? 'Low-moderate risk' : 'High risk'}
          </Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">
          {lowRisk
            ? 'Score of 0: some guidelines support safe outpatient management without hospital admission.'
            : 'A score ≥1 generally warrants admission and inpatient endoscopy per most guidelines; higher scores correlate with need for transfusion, endoscopic intervention, or surgery.'}
        </p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Blatchford, O., et al. (2000). A risk score to predict need for treatment for upper-
        gastrointestinal haemorrhage. <i>Lancet</i>, 356(9238), 1318-1323. Decision-support estimate —
        clinical judgment and local protocols should guide final admission decisions.
      </div>
    </div>
  )
}

export default GlasgowBlatchfordScore
