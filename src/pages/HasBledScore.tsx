import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// HAS-BLED — Pisters, R., et al. (2010), Chest, 138(5):1093-1100. Estimates
// 1-year major bleeding risk in patients on anticoagulation for atrial
// fibrillation, meant to be used alongside (not instead of) CHA2DS2-VASc
// stroke risk — a high HAS-BLED does not by itself mean anticoagulation
// should be withheld, but flags modifiable bleeding-risk factors to address.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'htn', label: 'Hypertension (uncontrolled, SBP > 160 mmHg)', pts: 1 },
  { key: 'renal', label: 'Abnormal renal function (dialysis, transplant, Cr > 2.26 mg/dL)', pts: 1 },
  { key: 'liver', label: 'Abnormal liver function (cirrhosis, bilirubin > 2x normal, AST/ALT/ALP > 3x normal)', pts: 1 },
  { key: 'stroke', label: 'Prior stroke', pts: 1 },
  { key: 'bleeding', label: 'Prior major bleeding or predisposition to bleeding', pts: 1 },
  { key: 'inr', label: 'Labile INR (unstable/high, time in therapeutic range < 60%)', pts: 1 },
  { key: 'elderly', label: 'Elderly (age > 65)', pts: 1 },
  { key: 'drugs', label: 'Drugs predisposing to bleeding (antiplatelets, NSAIDs)', pts: 1 },
  { key: 'alcohol', label: 'Alcohol use (≥8 drinks/week)', pts: 1 },
] as const

function risk(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; bleed: string } {
  if (score === 0) return { label: 'Low risk', tone: 'brand', bleed: '~1.1 bleeds per 100 patient-years' }
  if (score === 1) return { label: 'Low risk', tone: 'brand', bleed: '~1.0 bleeds per 100 patient-years' }
  if (score === 2) return { label: 'Moderate risk', tone: 'low', bleed: '~1.9 bleeds per 100 patient-years' }
  if (score === 3) return { label: 'High risk', tone: 'critical', bleed: '~3.7 bleeds per 100 patient-years' }
  return { label: 'Very high risk', tone: 'critical', bleed: '~8-12+ bleeds per 100 patient-years' }
}

export function HasBledScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = Object.values(checked).filter(Boolean).length
  const result = risk(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="HAS-BLED Score" subtitle="1-year major bleeding risk on anticoagulation (Pisters et al. 2010)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Used alongside CHA2DS2-VASc stroke risk, not as a reason to withhold anticoagulation — a
          high score flags modifiable bleeding-risk factors (blood pressure control, labile INR,
          concurrent NSAIDs/antiplatelets, alcohol) to address rather than an automatic contraindication.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {ITEMS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score} / 9</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{result.bleed}. Score ≥3 warrants caution and correction of modifiable risk factors, with regular clinical review.</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Pisters, R., et al. (2010). A novel user-friendly score (HAS-BLED) to assess 1-year risk of
        major bleeding. <i>Chest</i>, 138(5), 1093-1100. Decision-support estimate — anticoagulation
        decisions should weigh this alongside stroke risk (CHA2DS2-VASc) and patient preference.
      </div>
    </div>
  )
}

export default HasBledScore
