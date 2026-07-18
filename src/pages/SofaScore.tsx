import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { ScoreTrend } from '../components/ScoreTrend'

// ─────────────────────────────────────────────────────────────────────────────
// SOFA Score (Sequential Organ Failure Assessment) — Vincent, J.L., et al.
// (1996), Intensive Care Med, 22(7):707-710. Full 6-organ-system severity
// score for ICU patients (distinct from the bedside qSOFA screening tool
// elsewhere in this app) — used for both prognosis and trending organ
// dysfunction over time. Pure checklist/threshold scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function respPts(pf: number, supported: boolean): number {
  if (pf < 100 && supported) return 4
  if (pf < 200 && supported) return 3
  if (pf < 300) return 2
  if (pf < 400) return 1
  return 0
}
function coagPts(plt: number): number {
  if (plt < 20) return 4
  if (plt < 50) return 3
  if (plt < 100) return 2
  if (plt < 150) return 1
  return 0
}
function liverPts(bili: number): number {
  if (bili >= 12.0) return 4
  if (bili >= 6.0) return 3
  if (bili >= 2.0) return 2
  if (bili >= 1.2) return 1
  return 0
}
function renalPts(creat: number): number {
  if (creat >= 5.0) return 4
  if (creat >= 3.5) return 3
  if (creat >= 2.0) return 2
  if (creat >= 1.2) return 1
  return 0
}
function cnsPts(gcs: number): number {
  if (gcs < 6) return 4
  if (gcs < 10) return 3
  if (gcs < 13) return 2
  if (gcs < 15) return 1
  return 0
}

type CvLevel = 0 | 1 | 2 | 3 | 4
const CV_OPTS: { label: string; pts: CvLevel }[] = [
  { label: 'MAP ≥ 70 mmHg, no vasopressors', pts: 0 },
  { label: 'MAP < 70 mmHg, no vasopressors', pts: 1 },
  { label: 'Dopamine ≤5 mcg/kg/min, or any dobutamine', pts: 2 },
  { label: 'Dopamine >5, or epinephrine ≤0.1, or norepinephrine ≤0.1 mcg/kg/min', pts: 3 },
  { label: 'Dopamine >15, or epinephrine >0.1, or norepinephrine >0.1 mcg/kg/min', pts: 4 },
]

function mortalityBand(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; mortality: string } {
  if (score <= 1) return { label: 'Minimal dysfunction', tone: 'brand', mortality: '<10%' }
  if (score <= 5) return { label: 'Mild-moderate dysfunction', tone: 'low', mortality: '~10-20%' }
  if (score <= 9) return { label: 'Moderate-severe dysfunction', tone: 'critical', mortality: '~20-40%' }
  if (score <= 12) return { label: 'Severe dysfunction', tone: 'critical', mortality: '~50-60%' }
  return { label: 'Extreme dysfunction', tone: 'critical', mortality: '>80%' }
}

export function SofaScore() {
  const [pf, setPf] = useState(350)
  const [supported, setSupported] = useState(false)
  const [plt, setPlt] = useState(180)
  const [bili, setBili] = useState(0.8)
  const [cv, setCv] = useState<CvLevel>(0)
  const [gcs, setGcs] = useState(15)
  const [creat, setCreat] = useState(1.0)

  const resp = respPts(pf, supported)
  const coag = coagPts(plt)
  const liver = liverPts(bili)
  const renal = renalPts(creat)
  const cns = cnsPts(gcs)
  const total = resp + coag + liver + renal + cns + cv
  const band = mortalityBand(total)

  const rows = [
    { name: 'Respiration (PaO₂/FiO₂)', pts: resp },
    { name: 'Coagulation (platelets)', pts: coag },
    { name: 'Liver (bilirubin)', pts: liver },
    { name: 'Cardiovascular (MAP/vasopressors)', pts: cv },
    { name: 'CNS (Glasgow Coma Scale)', pts: cns },
    { name: 'Renal (creatinine)', pts: renal },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="SOFA Score" subtitle="Sequential Organ Failure Assessment (Vincent et al. 1996)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Full 6-organ-system ICU severity score — distinct from the bedside qSOFA screening tool.
          Used for prognosis and to trend organ dysfunction over time, not as an initial screen.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="PaO₂/FiO₂ ratio">
            <input className={inputClass} type="number" min={0} value={pf || ''} onChange={(e) => setPf(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Platelets (×10³/µL)">
            <input className={inputClass} type="number" min={0} value={plt || ''} onChange={(e) => setPlt(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bili || ''} onChange={(e) => setBili(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={creat || ''} onChange={(e) => setCreat(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Glasgow Coma Scale">
            <input className={inputClass} type="number" min={3} max={15} value={gcs || ''} onChange={(e) => setGcs(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={supported} onChange={(e) => setSupported(e.target.checked)} className="h-4 w-4 rounded" />
          On mechanical ventilation or CPAP (needed to score respiration ≥3)
        </label>
        <div className="mt-3">
          <Field label="Cardiovascular status">
            <select className={inputClass} value={cv} onChange={(e) => setCv(Number(e.target.value) as CvLevel)}>
              {CV_OPTS.map((o) => (
                <option key={o.pts} value={o.pts}>{o.label} ({o.pts} pt)</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Per-system breakdown</div>
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
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Total SOFA Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{total} / 24</span>
          <Badge tone={band.tone}>{band.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">Estimated mortality: {band.mortality} (population-level estimate).</p>
      </Card>

      <ScoreTrend
        storageKey="pmd_sofa_trend_v1"
        scoreName="SOFA"
        total={total}
        maxScore={24}
        detail={`Resp ${resp}, Coag ${coag}, Liver ${liver}, CV ${cv}, CNS ${cns}, Renal ${renal}`}
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Vincent, J.L., et al. (1996). The SOFA score. <i>Intensive Care Med</i>, 22(7), 707-710.
        Decision-support estimate — trend the score serially rather than relying on a single value.
      </div>
    </div>
  )
}

export default SofaScore
