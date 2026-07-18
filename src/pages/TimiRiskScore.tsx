import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// TIMI Risk Score for UA/NSTEMI — Antman, E.M., et al. (2000), JAMA,
// 284(7):835-842. Predicts 14-day risk of death, (re)infarction, or urgent
// revascularization in unstable angina / NSTEMI. 7 criteria, 1 point each.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'age', label: 'Age ≥ 65 years' },
  { key: 'riskFactors', label: '≥3 CAD risk factors (hypertension, diabetes, smoking, dyslipidemia, family history)' },
  { key: 'knownCad', label: 'Known CAD (coronary stenosis ≥ 50% on prior angiography)' },
  { key: 'aspirin', label: 'Aspirin use in the past 7 days' },
  { key: 'angina', label: 'Severe angina (≥2 episodes in the past 24 hours)' },
  { key: 'stDeviation', label: 'ST-segment deviation ≥ 0.5 mm on presenting ECG' },
  { key: 'markers', label: 'Elevated cardiac biomarkers (troponin or CK-MB)' },
] as const

const RISK_BY_SCORE: Record<number, string> = {
  0: '4.7%', 1: '4.7%', 2: '8.3%', 3: '13.2%', 4: '19.9%', 5: '26.2%', 6: '40.9%', 7: '40.9%',
}

function band(score: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (score <= 2) return { label: 'Low risk', tone: 'brand' }
  if (score <= 4) return { label: 'Intermediate risk', tone: 'low' }
  return { label: 'High risk', tone: 'critical' }
}

export function TimiRiskScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = Object.values(checked).filter(Boolean).length
  const result = band(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="TIMI Risk Score" subtitle="Unstable angina / NSTEMI 14-day risk (Antman et al. 2000)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Predicts 14-day risk of death, (re)infarction, or need for urgent revascularization in
          patients with unstable angina or NSTEMI. 7 criteria, 1 point each.
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
          <span className="text-3xl font-black text-brand-dark">{score} / 7</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">14-day risk of death, MI, or urgent revascularization: ~{RISK_BY_SCORE[score]}.</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Antman, E.M., et al. (2000). The TIMI risk score for unstable angina/non-ST elevation MI.
        <i> JAMA</i>, 284(7), 835-842. Decision-support estimate — management decisions should follow
        current ACC/AHA guidelines and clinical judgment.
      </div>
    </div>
  )
}

export default TimiRiskScore
