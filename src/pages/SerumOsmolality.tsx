import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Serum Osmolality & Osmolal Gap — standard calculated osmolality formula
// (widely attributed to Dorwart & Chalmers, 1975, Clin Chem 21:190-194):
//   Calculated osmolality = 2·Na + glucose/18 + BUN/2.8   (mOsm/kg)
//   (+ ethanol/3.7 when a measured ethanol level is available)
// Osmolal gap = measured − calculated. A gap >10 mOsm/kg suggests
// unmeasured osmoles — classically toxic alcohols (methanol, ethylene
// glycol, isopropanol) — making this a core toxicology screening tool.
// Divisors convert mg/dL to mmol/L (glucose MW 180 → /18; BUN as
// nitrogen 28 → /2.8; ethanol MW 46 → /4.6, with /3.7 the empirically
// preferred divisor). Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function gapBand(gap: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (gap > 20) return { label: 'Markedly elevated gap', tone: 'critical' }
  if (gap > 10) return { label: 'Elevated gap', tone: 'low' }
  if (gap >= -10) return { label: 'Normal gap', tone: 'brand' }
  return { label: 'Negative gap — recheck values/units', tone: 'low' }
}

function osmBand(osm: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (osm < 275) return { label: 'Hypo-osmolal', tone: 'low' }
  if (osm <= 295) return { label: 'Normal', tone: 'brand' }
  if (osm <= 320) return { label: 'Hyperosmolal', tone: 'low' }
  return { label: 'Severely hyperosmolal', tone: 'critical' }
}

export function SerumOsmolality() {
  const [na, setNa] = useState(140)
  const [glucose, setGlucose] = useState(90)
  const [bun, setBun] = useState(14)
  const [ethanol, setEthanol] = useState(0)
  const [measured, setMeasured] = useState(0)

  const calculated = 2 * na + glucose / 18 + bun / 2.8 + (ethanol > 0 ? ethanol / 3.7 : 0)
  const gap = measured > 0 ? measured - calculated : null
  const cBand = osmBand(calculated)
  const gBand = gap != null ? gapBand(gap) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Serum Osmolality & Osmolal Gap" subtitle="Calculated osmolality + gap vs. measured (toxic alcohol screen)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Calculated osmolality = 2×Na + glucose/18 + BUN/2.8 (+ ethanol/3.7 if measured). Comparing
          it against a lab-measured osmolality gives the osmolal gap — a gap {'>'}10 mOsm/kg suggests
          unmeasured osmoles, classically the toxic alcohols (methanol, ethylene glycol, isopropanol).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={na || ''} onChange={(e) => setNa(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Glucose (mg/dL)">
            <input className={inputClass} type="number" min={0} value={glucose || ''} onChange={(e) => setGlucose(Number(e.target.value) || 0)} />
          </Field>
          <Field label="BUN (mg/dL)">
            <input className={inputClass} type="number" min={0} value={bun || ''} onChange={(e) => setBun(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Ethanol (mg/dL, optional)">
            <input className={inputClass} type="number" min={0} value={ethanol || ''} onChange={(e) => setEthanol(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Measured osmolality (mOsm/kg, optional)">
            <input className={inputClass} type="number" min={0} value={measured || ''} onChange={(e) => setMeasured(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Calculated osmolality</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{calculated.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-400">mOsm/kg</div>
            <Badge tone={cBand.tone}>{cBand.label}</Badge>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Osmolal gap</div>
            {gap != null ? (
              <>
                <div className="mt-1 text-2xl font-black text-ink dark:text-white">{gap.toFixed(0)}</div>
                <div className="text-[11px] text-neutral-400">mOsm/kg</div>
                {gBand && <Badge tone={gBand.tone}>{gBand.label}</Badge>}
              </>
            ) : (
              <p className="mt-1 text-[12px] text-neutral-400">Enter a measured osmolality to compute the gap.</p>
            )}
          </div>
        </div>
        {gap != null && gap > 10 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Elevated osmolal gap — in the right clinical context (altered mental status, unexplained
            metabolic acidosis), consider toxic alcohol ingestion and send specific levels; treatment
            (fomepizole) should not wait for confirmation if suspicion is high.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Dorwart, W.V. &amp; Chalmers, L. (1975). Comparison of methods for calculating serum osmolality.
        <i> Clin Chem</i>, 21(2), 190-194. Decision-support estimate — a normal gap does not fully
        exclude toxic alcohol ingestion late in its course (the parent alcohol may already be metabolized).
      </div>
    </div>
  )
}

export default SerumOsmolality
