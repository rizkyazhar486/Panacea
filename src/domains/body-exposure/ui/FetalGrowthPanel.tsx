import { useEffect, useMemo, useState } from 'react'
import { assessMeasurement, parseFetalTables, type FetalTables, type MeasureId, type ReferenceId } from '../engine/fetalBiometry'

// Biometri janin terhadap acuan WHO 2017 / INTERGROWTH-21st. Dimuat malas saat dibuka; keluaran hanya posisi terhadap acuan terbit beserta sumbernya.
const MEASURES: { id: MeasureId; label: string; hint: string }[] = [
  { id: 'bpd', label: 'Biparietal diameter (BPD)', hint: 'mm' }, { id: 'hc', label: 'Head circumference (HC)', hint: 'mm' }, { id: 'ac', label: 'Abdominal circumference (AC)', hint: 'mm' },
  { id: 'fl', label: 'Femur length (FL)', hint: 'mm' }, { id: 'efw', label: 'Estimated fetal weight (EFW)', hint: 'g' }, { id: 'efw_female', label: 'EFW, female fetus', hint: 'g' }, { id: 'efw_male', label: 'EFW, male fetus', hint: 'g' },
]
const REFS: { id: ReferenceId; label: string }[] = [{ id: 'who_2017', label: 'WHO 2017' }, { id: 'intergrowth_2014', label: 'INTERGROWTH-21st' }]
const fmtP = (p: number) => (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.round(p * 10) / 10))

export function FetalGrowthPanel({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false)
  const [tables, setTables] = useState<FetalTables | null>(null)
  const [error, setError] = useState('')
  const [reference, setReference] = useState<ReferenceId>('who_2017')
  const [measure, setMeasure] = useState<MeasureId>('hc')
  const [weeks, setWeeks] = useState('28')
  const [days, setDays] = useState('0')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!open || tables || error) return
    let live = true
    fetch(`${baseUrl}fetal_reference_tables.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { const p = parseFetalTables(j); if (!live) return; if (p.ok) setTables(p.tables); else setError(`The fetal reference tables failed validation (${p.error}).`) })
      .catch((e) => { if (live) setError(`The fetal reference tables could not be loaded (${e.message}).`) })
    return () => { live = false }
  }, [open, tables, error, baseUrl])

  const result = useMemo(() => {
    if (!tables || value.trim() === '') return null
    return assessMeasurement(tables, { reference, measure, weeks: Number(weeks), days: Number(days), value: Number(value) })
  }, [tables, reference, measure, weeks, days, value])
  const unit = MEASURES.find((m) => m.id === measure)?.hint ?? ''

  return (
    <details className="rounded-2xl border border-neutral-200 p-3 text-sm dark:border-white/10" data-testid="fetal-growth-panel" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer font-bold">Fetal growth: where a measurement sits against published references</summary>
      <p className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-300">Places one fetal measurement (14+0 to 40+0 weeks) against a published reference, as a position only that needs a qualified clinician.</p>
      {error && <p className="mt-2 text-[13px] text-amber-800 dark:text-amber-200" role="alert">{error}</p>}
      {open && !tables && !error && <p className="mt-2 text-[13px]">Loading reference tables…</p>}
      {tables && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reference">
            {REFS.map((r) => (
              <button key={r.id} role="radio" aria-checked={reference === r.id} onClick={() => setReference(r.id)}
                className={`min-h-[40px] rounded-full border px-3 text-[13px] font-bold ${reference === r.id ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-300 dark:border-white/20'}`}>{r.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-[13px] font-bold">Measurement
              <select value={measure} onChange={(e) => setMeasure(e.target.value as MeasureId)} className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-2 dark:border-white/15 dark:bg-white/5">
                {MEASURES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-bold">Weeks
              <input inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} aria-label="Gestational weeks" className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 dark:border-white/15 dark:bg-white/5" />
            </label>
            <label className="text-[13px] font-bold">Days (0 to 6)
              <input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Gestational days" className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 dark:border-white/15 dark:bg-white/5" />
            </label>
            <label className="col-span-2 text-[13px] font-bold">Value ({unit})
              <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Measured value" className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 dark:border-white/15 dark:bg-white/5" />
            </label>
          </div>
          {result?.status === 'unavailable' && <p className="rounded-xl border border-amber-500/40 p-2 text-[13px]" data-testid="fetal-unavailable" role="status">Not available: {result.message}</p>}
          {result?.status === 'ok' && (
            <div className="space-y-1 rounded-xl border border-neutral-200 p-2 dark:border-white/10" data-testid="fetal-result">
              <p className="text-base font-black">
                {result.band === 'within' && result.percentile !== null ? `${fmtP(result.percentile)}th percentile` : result.band === 'below_lowest' ? `Below the ${fmtP(result.lowestPercentile)}th percentile` : `Above the ${fmtP(result.highestPercentile)}th percentile`}
              </p>
              <p className="text-[13px]">{result.label}: {result.value} {result.unit} at {Math.floor(result.gestationalAgeWeeks)}+{Math.round((result.gestationalAgeWeeks % 1) * 7)} weeks. Reference median {Math.round(result.referenceMedian * 100) / 100} {result.unit}{result.zScore !== null ? ` · z-score ${result.zScore.toFixed(2)}` : ''}.</p>
              {result.gaInterpolated && <p className="text-[12px] text-neutral-600 dark:text-neutral-300">The published tables give exact weeks; this age is interpolated linearly between neighbouring weeks.</p>}
              <p className="text-[11px] leading-snug text-neutral-500">Source: {result.source.name}. {result.source.citation}. Licence: {result.source.licence}. Population: {result.source.population}. Method: {result.source.method}</p>
              <p className="text-[12px] font-bold">{result.caveat}</p>
            </div>
          )}
          <p className="text-[11px] text-neutral-500">Embryologic milestones are not part of these growth references and are not shown here.</p>
        </div>
      )}
    </details>
  )
}
