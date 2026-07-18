import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Corrected Calcium — Payne, R.B., et al. (1973), BMJ, 4(5893):643-646.
// Roughly half of serum calcium is protein-bound (mostly to albumin), so low
// albumin makes TOTAL calcium read falsely low even when the physiologically
// active ionized fraction is normal — a very common bedside pitfall,
// especially in hospitalized/malnourished/cirrhotic patients. Pure
// arithmetic, no external API.
//
// Corrected Ca (mg/dL) = Measured total Ca (mg/dL) + 0.8 x (4.0 - albumin g/dL)
// ─────────────────────────────────────────────────────────────────────────────

function band(ca: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (ca < 7.0) return { label: 'Severe hypocalcemia', tone: 'critical' }
  if (ca < 8.5) return { label: 'Hypocalcemia', tone: 'low' }
  if (ca <= 10.5) return { label: 'Normal', tone: 'brand' }
  if (ca <= 12) return { label: 'Hypercalcemia', tone: 'low' }
  return { label: 'Severe hypercalcemia', tone: 'critical' }
}

export function CorrectedCalcium() {
  const [totalCa, setTotalCa] = useState(8.0)
  const [albumin, setAlbumin] = useState(2.5)

  const corrected = totalCa + 0.8 * (4.0 - albumin)
  const totalBand = band(totalCa)
  const correctedBand = band(corrected)
  const changesCategory = totalBand.label !== correctedBand.label

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Corrected Calcium" subtitle="Adjusts total calcium for low albumin (Payne et al., 1973)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          About half of serum calcium is protein-bound (mostly to albumin) — low albumin makes total
          calcium read falsely low even when the physiologically active (ionized) fraction is normal. A
          very common bedside pitfall in hospitalized, malnourished, or cirrhotic patients.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Measured total calcium (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={totalCa || ''} onChange={(e) => setTotalCa(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Serum albumin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={albumin || ''} onChange={(e) => setAlbumin(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Measured total Ca</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{totalCa.toFixed(1)}</div>
            <Badge tone={totalBand.tone}>{totalBand.label}</Badge>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Corrected Ca</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{corrected.toFixed(1)}</div>
            <Badge tone={correctedBand.tone}>{correctedBand.label}</Badge>
          </div>
        </div>
        {changesCategory && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            The correction changes the clinical category — acting on the uncorrected total calcium alone
            here would be misleading.
          </p>
        )}
        <p className="mt-3 text-[11px] text-neutral-400">
          When available and in critically ill or borderline cases, a directly measured ionized calcium
          is more reliable than either total or corrected calcium.
        </p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Payne, R.B., et al. (1973). Interpretation of serum calcium in patients with abnormal serum
        proteins. <i>BMJ</i>, 4(5893), 643-646. Decision-support estimate, not a substitute for ionized
        calcium when clinically indicated.
      </div>
    </div>
  )
}

export default CorrectedCalcium
