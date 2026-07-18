import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Ranson's Criteria — Ranson, J.H.C., et al. (1974), Surg Gynecol Obstet,
// 139:69-81. Severity/mortality prediction for acute pancreatitis, split into
// findings at admission and findings at 48 hours (non-gallstone version;
// thresholds below are the original, most widely cited set). Pure checklist
// scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ADMISSION = [
  { key: 'age', label: 'Age > 55 years' },
  { key: 'wbc', label: 'WBC > 16,000 /mm³' },
  { key: 'glucose', label: 'Glucose > 200 mg/dL' },
  { key: 'ldh', label: 'LDH > 350 IU/L' },
  { key: 'ast', label: 'AST > 250 IU/L' },
] as const

const H48 = [
  { key: 'hct', label: 'Hematocrit fall > 10%' },
  { key: 'bun', label: 'BUN increase > 5 mg/dL (despite fluids)' },
  { key: 'calcium', label: 'Serum calcium < 8 mg/dL' },
  { key: 'pao2', label: 'PaO₂ < 60 mmHg' },
  { key: 'base', label: 'Base deficit > 4 mEq/L' },
  { key: 'fluid', label: 'Estimated fluid sequestration > 6 L' },
] as const

function mortality(score: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (score <= 2) return { label: '~1% predicted mortality', tone: 'brand' }
  if (score <= 4) return { label: '~15% predicted mortality', tone: 'low' }
  if (score <= 6) return { label: '~40% predicted mortality', tone: 'critical' }
  return { label: '~100% predicted mortality — critical', tone: 'critical' }
}

export function RansonCriteria() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = Object.values(checked).filter(Boolean).length
  const result = mortality(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Ranson's Criteria" subtitle="Acute pancreatitis severity & mortality prediction (Ranson et al. 1974)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          11 criteria evaluated at two time points — 5 at admission, 6 more re-assessed at 48 hours.
          Score = total criteria met.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">At admission</div>
        <div className="mt-3 space-y-2">
          {ADMISSION.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">At 48 hours</div>
        <div className="mt-3 space-y-2">
          {H48.map((c) => (
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
          <span className="text-3xl font-black text-brand-dark">{score} / 11</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">A score ≥3 has historically been used as a threshold suggesting severe pancreatitis and possible ICU-level monitoring.</p>
        <CopyNote text={`Ranson ${score}/11 — ${result.label} [Ranson 1974]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Ranson, J.H.C., et al. (1974). Prognostic signs and the role of operative management in acute
        pancreatitis. <i>Surg Gynecol Obstet</i>, 139, 69-81. Largely superseded in modern practice by
        BISAP and APACHE II for early severity assessment — decision-support estimate only.
      </div>
    </div>
  )
}

export default RansonCriteria
