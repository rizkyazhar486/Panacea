import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Fractional Excretion of Sodium (FeNa) — Espinel, C.H. (1976), JAMA,
// 236(6):579-581. Distinguishes prerenal azotemia (kidneys appropriately
// conserving sodium) from intrinsic acute tubular necrosis in acute kidney
// injury. Not valid if the patient has already received diuretics — use
// FeUrea (not implemented here) in that setting instead.
//
// FeNa (%) = (Urine Na x Plasma Creatinine) / (Plasma Na x Urine Creatinine) x 100
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function interpret(fena: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (fena < 1) return { label: 'Prerenal azotemia likely', tone: 'brand' }
  if (fena <= 2) return { label: 'Indeterminate zone', tone: 'low' }
  return { label: 'Intrinsic renal injury (e.g. ATN) likely', tone: 'critical' }
}

export function FenaCalculator() {
  const [urineNa, setUrineNa] = useState(20)
  const [plasmaCr, setPlasmaCr] = useState(2.0)
  const [plasmaNa, setPlasmaNa] = useState(140)
  const [urineCr, setUrineCr] = useState(60)
  const [onDiuretics, setOnDiuretics] = useState(false)

  const denom = plasmaNa * urineCr
  const fena = denom > 0 ? (urineNa * plasmaCr) / denom * 100 : 0
  const result = interpret(fena)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Fractional Excretion of Sodium (FeNa)" subtitle="Prerenal azotemia vs. acute tubular necrosis (Espinel, 1976)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          In acute kidney injury, a low FeNa suggests the kidneys are appropriately conserving sodium
          (prerenal cause, e.g. hypovolemia); a high FeNa suggests intrinsic tubular damage. Needs a
          simultaneous urine and plasma sample.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Urine sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={urineNa || ''} onChange={(e) => setUrineNa(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Plasma sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={plasmaNa || ''} onChange={(e) => setPlasmaNa(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Urine creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={urineCr || ''} onChange={(e) => setUrineCr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Plasma creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={plasmaCr || ''} onChange={(e) => setPlasmaCr(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={onDiuretics} onChange={(e) => setOnDiuretics(e.target.checked)} className="h-4 w-4 rounded" />
          Patient has received diuretics recently
        </label>
        {onDiuretics && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            FeNa is unreliable after diuretic use (diuretics force sodium wasting regardless of
            cause). Fractional Excretion of Urea is the preferred alternative in this setting.
          </p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">FeNa</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{fena.toFixed(2)}%</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">Reference: FeNa {'<'}1% prerenal · 1-2% indeterminate · {'>'}2% intrinsic renal.</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Espinel, C.H. (1976). The FENa test. <i>JAMA</i>, 236(6), 579-581. Decision-support estimate —
        interpret alongside clinical context, urinalysis, and imaging.
      </div>
    </div>
  )
}

export default FenaCalculator
