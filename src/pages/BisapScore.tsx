import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// BISAP Score — Wu, B.U., et al. (2008), Gut, 57(12):1698-1703. Bedside
// severity/mortality prediction for acute pancreatitis, designed to be
// calculable from data available within the first 24 hours — simpler than
// Ranson's Criteria (which needs 48h data) and comparable in accuracy.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'bun', label: 'BUN > 25 mg/dL' },
  { key: 'mental', label: 'Impaired mental status (GCS < 15)' },
  { key: 'sirs', label: 'SIRS present (≥2 of: temp <36 or >38°C, HR >90, RR >20 or PaCO₂ <32, WBC <4k or >12k/mm³ or >10% bands)' },
  { key: 'age', label: 'Age > 60 years' },
  { key: 'effusion', label: 'Pleural effusion on imaging' },
] as const

function mortality(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; pct: string } {
  if (score <= 2) return { label: 'Low risk', tone: 'brand', pct: '<2% mortality' }
  if (score === 3) return { label: 'Elevated risk', tone: 'low', pct: '~5% mortality' }
  if (score === 4) return { label: 'High risk', tone: 'critical', pct: '~13% mortality' }
  return { label: 'Very high risk', tone: 'critical', pct: '~22%+ mortality' }
}

export function BisapScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = Object.values(checked).filter(Boolean).length
  const result = mortality(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="BISAP Score" subtitle="Bedside pancreatitis severity — usable within 24h (Wu et al. 2008)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          5 criteria, calculable from data available in the first 24 hours of admission — a simpler
          alternative to Ranson's Criteria (which requires waiting 48 hours) with comparable accuracy.
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
          <span className="text-3xl font-black text-brand-dark">{score} / 5</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{result.pct}. A score ≥3 is associated with a marked step-up in mortality and risk of organ failure/necrosis.</p>
        <CopyNote text={`BISAP ${score}/5 — ${result.label.toLowerCase()}, ${result.pct} [Wu 2008]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Wu, B.U., et al. (2008). The early prediction of mortality in acute pancreatitis: a large
        population-based study. <i>Gut</i>, 57(12), 1698-1703. Decision-support estimate — clinical
        judgment and serial reassessment remain essential.
      </div>
    </div>
  )
}

export default BisapScore
