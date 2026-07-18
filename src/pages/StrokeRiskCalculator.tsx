import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// CHA2DS2-VASc Score — Lip, G.Y.H., et al. (2010), Chest, 137(2):263-272.
// The standard clinical tool for estimating stroke risk in atrial
// fibrillation and guiding the anticoagulation decision, used constantly in
// cardiology and internal medicine. Pure arithmetic scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Item { key: string; label: string; points: number }
const ITEMS: Item[] = [
  { key: 'chf', label: 'Congestive heart failure / LV dysfunction', points: 1 },
  { key: 'htn', label: 'Hypertension', points: 1 },
  { key: 'age75', label: 'Age ≥ 75', points: 2 },
  { key: 'dm', label: 'Diabetes mellitus', points: 1 },
  { key: 'stroke', label: 'Prior stroke, TIA, or thromboembolism', points: 2 },
  { key: 'vasc', label: 'Vascular disease (prior MI, peripheral artery disease, or aortic plaque)', points: 1 },
  { key: 'age65', label: 'Age 65-74', points: 1 },
  { key: 'female', label: 'Female sex', points: 1 },
]

function recommendation(score: number, isFemale: boolean): { label: string; tone: 'brand' | 'low' | 'critical' } {
  // Common guideline-based action thresholds (e.g. ESC/ACC/AHA): a lone
  // "female sex" point without any other risk factor doesn't itself raise
  // risk enough to change management, so a female-only score of 1 is treated
  // like a male score of 0.
  const effectiveZero = score === 0 || (isFemale && score === 1)
  if (effectiveZero) return { label: 'Low risk — anticoagulation generally not recommended', tone: 'brand' }
  if (score === 1) return { label: 'Low-moderate risk — anticoagulation may be considered', tone: 'low' }
  return { label: 'Anticoagulation generally recommended', tone: 'critical' }
}

export function StrokeRiskCalculator() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const score = ITEMS.reduce((s, it) => s + (checked[it.key] ? it.points : 0), 0)
  const rec = recommendation(score, !!checked.female)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="CHA₂DS₂-VASc Score" subtitle="Stroke risk in atrial fibrillation (Lip et al., 2010)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          The standard clinical tool for estimating annual stroke risk in patients with atrial
          fibrillation and guiding the anticoagulation decision. Check every factor that applies.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {ITEMS.map((it) => (
            <label key={it.key} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
              <span className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                <input type="checkbox" className="h-4 w-4 accent-brand" checked={!!checked[it.key]} onChange={(e) => setChecked((c) => ({ ...c, [it.key]: e.target.checked }))} />
                {it.label}
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{it.points}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Result</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score}/9</span>
          <Badge tone={rec.tone}>{rec.label}</Badge>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
          Higher scores correspond to progressively higher estimated annual stroke risk. This is
          decision support — the final anticoagulation decision should weigh bleeding risk (e.g. via
          HAS-BLED), patient preference, and drug interactions, in discussion with the treating physician.
        </p>
        <CopyNote text={`CHA2DS2-VASc ${score}/9 — ${rec.label} [Lip 2010]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Lip, G.Y.H., et al. (2010). Refining clinical risk stratification for predicting stroke and
        thromboembolism in atrial fibrillation using a novel risk factor-based approach.
        <i> Chest</i>, 137(2), 263-272. Decision-support tool, not a substitute for clinical judgment.
      </div>
    </div>
  )
}

export default StrokeRiskCalculator
