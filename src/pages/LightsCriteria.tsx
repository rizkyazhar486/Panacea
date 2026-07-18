import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Light's Criteria — Light, R.W., et al. (1972), Ann Intern Med, 77(4):507-513.
// Distinguishes exudative from transudative pleural effusion. Fluid is
// exudative if ANY ONE of the three ratio/threshold criteria is met — very
// high sensitivity for exudate, at some cost to specificity (transudates can
// occasionally misclassify as exudate, especially with diuretic use). Pure
// arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function LightsCriteria() {
  const [pleuralProtein, setPleuralProtein] = useState(3.5)
  const [serumProtein, setSerumProtein] = useState(6.5)
  const [pleuralLdh, setPleuralLdh] = useState(180)
  const [serumLdh, setSerumLdh] = useState(200)
  const [serumLdhUln, setSerumLdhUln] = useState(200)

  const proteinRatio = serumProtein > 0 ? pleuralProtein / serumProtein : 0
  const ldhRatio = serumLdh > 0 ? pleuralLdh / serumLdh : 0
  const ldhVsUln = serumLdhUln > 0 ? pleuralLdh / ((2 / 3) * serumLdhUln) : 0

  const criteria = [
    { label: 'Pleural/serum protein ratio > 0.5', value: proteinRatio.toFixed(2), met: proteinRatio > 0.5 },
    { label: 'Pleural/serum LDH ratio > 0.6', value: ldhRatio.toFixed(2), met: ldhRatio > 0.6 },
    { label: 'Pleural LDH > ⅔ upper limit of normal serum LDH', value: pleuralLdh.toFixed(0), met: ldhVsUln > 1 },
  ]
  const exudate = criteria.some((c) => c.met)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Light's Criteria" subtitle="Exudate vs. transudate pleural effusion (Light et al. 1972)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          The fluid is classified as exudative if ANY ONE of the three criteria is met. Highly
          sensitive for exudate, but diuretic-treated heart failure can occasionally cross the
          threshold and appear falsely exudative.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Pleural fluid protein (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={pleuralProtein || ''} onChange={(e) => setPleuralProtein(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Serum protein (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={serumProtein || ''} onChange={(e) => setSerumProtein(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Pleural fluid LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={pleuralLdh || ''} onChange={(e) => setPleuralLdh(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Serum LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={serumLdh || ''} onChange={(e) => setSerumLdh(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Lab's upper limit of normal serum LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={serumLdhUln || ''} onChange={(e) => setSerumLdhUln(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {criteria.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div>
                <div className="text-sm font-bold text-ink dark:text-white">{c.label}</div>
                <div className="text-[11px] text-neutral-400">Value: {c.value}</div>
              </div>
              <Badge tone={c.met ? 'critical' : 'brand'}>{c.met ? 'Met' : 'Not met'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Classification</div>
        <div className="mt-2 flex items-center gap-3">
          <Badge tone={exudate ? 'critical' : 'brand'}>{exudate ? 'Exudate' : 'Transudate'}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">
          {exudate
            ? 'Exudative effusions warrant further workup for local causes (infection, malignancy, inflammation) — consider cytology, culture, pH, glucose, and adenosine deaminase as indicated.'
            : 'Transudative effusions are typically due to a systemic process (heart failure, cirrhosis, nephrotic syndrome) and rarely need further fluid analysis beyond addressing the underlying condition.'}
        </p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Light, R.W., et al. (1972). Pleural effusions: the diagnostic separation of transudates and
        exudates. <i>Ann Intern Med</i>, 77(4), 507-513. Decision-support estimate — correlate with
        clinical context, imaging, and further fluid analysis as indicated.
      </div>
    </div>
  )
}

export default LightsCriteria
