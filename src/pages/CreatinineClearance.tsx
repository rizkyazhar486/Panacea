import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Cockcroft-Gault Creatinine Clearance — Cockcroft, D.W. & Gault, M.H. (1976),
// Nephron, 16(1):31-41. Distinct from (and still used alongside) the CKD-EPI
// eGFR elsewhere in this app: many drug package inserts and dosing
// nomograms specify renal dose adjustment by Cockcroft-Gault CrCl
// specifically, not eGFR, so both have a real clinical role. Pure
// arithmetic, no external API.
//
// CrCl (mL/min) = [(140 - age) x weight(kg) x (0.85 if female)] / (72 x SCr mg/dL)
// Weight choice matters: actual body weight overestimates CrCl in obesity;
// many references recommend ideal body weight (or an adjusted weight) when
// actual weight is >20-30% above ideal.
// ─────────────────────────────────────────────────────────────────────────────

function idealBodyWeight(heightCm: number, sex: 'M' | 'F'): number {
  const heightIn = heightCm / 2.54
  const inchesOver5ft = Math.max(0, heightIn - 60)
  return (sex === 'M' ? 50 : 45.5) + 2.3 * inchesOver5ft
}

function band(crcl: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (crcl >= 90) return { label: 'Normal', tone: 'brand' }
  if (crcl >= 60) return { label: 'Mildly reduced', tone: 'brand' }
  if (crcl >= 30) return { label: 'Moderately reduced — many drugs need dose adjustment', tone: 'low' }
  if (crcl >= 15) return { label: 'Severely reduced — significant dose adjustment needed', tone: 'critical' }
  return { label: 'Kidney failure — many drugs contraindicated or need major adjustment', tone: 'critical' }
}

export function CreatinineClearance() {
  const demo = getDemo()
  const [age, setAge] = useState(demo.age || 40)
  const [weightKg, setWeightKg] = useState(demo.weightKg || 70)
  const [heightCm, setHeightCm] = useState(demo.heightCm || 170)
  const [sex, setSex] = useState<'M' | 'F'>(demo.sex || 'M')
  const [scr, setScr] = useState(1.0)
  const [weightBasis, setWeightBasis] = useState<'actual' | 'ideal'>('actual')

  const ibw = idealBodyWeight(heightCm, sex)
  const useWeight = weightBasis === 'ideal' ? ibw : weightKg
  const crcl = scr > 0 ? ((140 - age) * useWeight * (sex === 'F' ? 0.85 : 1)) / (72 * scr) : 0
  const obese = weightKg > ibw * 1.25
  const bandInfo = band(crcl)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Creatinine Clearance (Cockcroft-Gault)" subtitle="Renal function for drug dosing — distinct from CKD-EPI eGFR" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Many drug package inserts and dosing nomograms specify renal dose adjustment by this formula
          specifically, not by eGFR — both have a real role and aren't interchangeable.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" min={20} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Height (cm)">
            <input className={inputClass} type="number" min={100} value={heightCm || ''} onChange={(e) => setHeightCm(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Serum creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0.1} value={scr || ''} onChange={(e) => setScr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Weight basis">
            <select className={inputClass} value={weightBasis} onChange={(e) => setWeightBasis(e.target.value as 'actual' | 'ideal')}>
              <option value="actual">Actual body weight</option>
              <option value="ideal">Ideal body weight</option>
            </select>
          </Field>
        </div>
        {obese && weightBasis === 'actual' && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Actual weight is {'>'}25% above ideal body weight ({ibw.toFixed(0)}kg) — actual-weight CrCl may
            overestimate renal function. Consider switching to ideal body weight above.
          </p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Result</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{crcl.toFixed(0)}</span>
          <span className="text-sm font-semibold text-neutral-500">mL/min</span>
          <Badge tone={bandInfo.tone}>{bandInfo.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">Ideal body weight (reference): {ibw.toFixed(1)} kg</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Cockcroft, D.W. &amp; Gault, M.H. (1976). Prediction of creatinine clearance from serum
        creatinine. <i>Nephron</i>, 16(1), 31-41. Decision-support estimate — verify against the
        specific drug's package insert and consult a pharmacist for renal dose adjustment.
      </div>
    </div>
  )
}

export default CreatinineClearance
