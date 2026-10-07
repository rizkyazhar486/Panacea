import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { parseNumberField, serumOsmolality } from '../../../domains/clinical-calculators'

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

export function SerumOsmolality() {
  // Teks mentah: Na/glukosa/BUN kosong tetap "belum diisi" (NaN). Etanol dan osmolalitas terukur opsional: kosong = tidak diberikan.
  const [na, setNa] = useState('140')
  const [glucose, setGlucose] = useState('90')
  const [bun, setBun] = useState('14')
  const [ethanol, setEthanol] = useState('')
  const [measured, setMeasured] = useState('')

  const optional = (t: string) => (t.trim() === '' ? undefined : parseNumberField(t))
  const res = serumOsmolality({ na: parseNumberField(na), glucose: parseNumberField(glucose), bun: parseNumberField(bun), ethanol: optional(ethanol), measured: optional(measured) })

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Serum Osmolality & Osmolal Gap" subtitle="Calculated osmolality + its gap against the measured value (toxic-alcohol screening)" />
        <BatasKlaimSkorTerbit />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Calculated osmolality = 2×Na + glucose/18 + BUN/2.8 (+ ethanol/3.7 if measured).
          Comparing this with the lab-measured osmolality gives the osmolal gap — a gap {'>'}10 mOsm/kg
          indicates unmeasured osmoles, classically toxic alcohols (methanol, ethylene glycol, isopropanol).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={na} onChange={(e) => setNa(e.target.value)} />
          </Field>
          <Field label="Glucose (mg/dL)">
            <input className={inputClass} type="number" min={0} value={glucose} onChange={(e) => setGlucose(e.target.value)} />
          </Field>
          <Field label="BUN (mg/dL)">
            <input className={inputClass} type="number" min={0} value={bun} onChange={(e) => setBun(e.target.value)} />
          </Field>
          <Field label="Ethanol (mg/dL, optional)">
            <input className={inputClass} type="number" min={0} value={ethanol} onChange={(e) => setEthanol(e.target.value)} />
          </Field>
          <Field label="Measured osmolality (mOsm/kg, optional)">
            <input className={inputClass} type="number" min={0} value={measured} onChange={(e) => setMeasured(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        {!res.ok ? (
          <p role="alert" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{res.reason}</p>
        ) : (
          <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Calculated osmolality</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{res.data.calculated.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-500">mOsm/kg</div>
            <Badge tone={res.data.band.tone}>{res.data.band.label}</Badge>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Osmolal gap</div>
            {res.data.gap != null ? (
              <>
                <div className="mt-1 text-2xl font-black text-ink dark:text-ink">{res.data.gap.toFixed(0)}</div>
                <div className="text-[11px] text-neutral-500">mOsm/kg</div>
                {res.data.gapBand && <Badge tone={res.data.gapBand.tone}>{res.data.gapBand.label}</Badge>}
              </>
            ) : (
              <p className="mt-1 text-[12px] text-neutral-500">Enter the measured osmolality to calculate the gap.</p>
            )}
          </div>
        </div>
        {res.data.gap != null && res.data.gap > 10 && (
          <Prosa kelas="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Widened osmolal gap — in the appropriate clinical setting (decreased consciousness, unexplained metabolic acidosis), consider toxic-alcohol poisoning and send confirmatory levels; treatment (fomepizole) should not wait for confirmation when suspicion is strong.</Prosa>
        )}
          </>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Dorwart, W.V. &amp; Chalmers, L. (1975). Comparison of methods for calculating serum osmolality.
        <i> Clin Chem</i>, 21(2), 190-194. Decision-support estimate — a normal gap does not fully
        exclude toxic alcohol ingestion late in its course (the parent alcohol may already be metabolized).
      </div>
    </div>
  )
}

export default SerumOsmolality
