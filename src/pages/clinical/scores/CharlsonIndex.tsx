import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { getDemoTersimpan } from '../../../lib/profile'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { CHARLSON_CONDITIONS, charlsonIndex, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Charlson Comorbidity Index (CCI) — Charlson, M.E., et al. (1987),
// J Chronic Dis, 40(5):373-383. The most widely used comorbidity burden
// index, weighting 19 conditions (1/2/3/6 points) with an age adjustment
// (+1 per decade from age 50, i.e. 50-59=1 … ≥80=4). The combined
// age-comorbidity score maps to an estimated 10-year survival via
//   10-yr survival = 0.983 ^ exp(0.9 × score)
// Pure checklist arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function CharlsonIndex() {
  const [age, setAge] = useState(() => { const a = getDemoTersimpan().age; return a && a > 0 ? String(a) : '' })
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const res = charlsonIndex(parseNumberField(age), checked)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Charlson Comorbidity Index" subtitle="Comorbidity burden & estimated 10-year survival (Charlson et al. 1987)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Indeks komorbiditas yang paling luas dipakai — 19 penyakit berbobot ditambah penyesuaian umur. Bila bentuk ringan dan berat dari penyakit yang sama sama-sama dicentang, hanya bentuk beratnya yang dihitung (sesuai indeks aslinya).</Prosa>
        <div className="mt-3 max-w-[200px]">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} max={110} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {CHARLSON_CONDITIONS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              <span className="flex-1">{c.label}</span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{c.pts}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        {!res.ok ? (
          <p role="alert" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{res.reason}</p>
        ) : (
          <>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Comorbidity</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-ink">{res.data.comorbidityPts}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Age points</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-ink">{res.data.agePts}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Total CCI</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{res.data.total}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{res.data.survival10y.toFixed(0)}%</span>
          <Badge tone={res.data.tone}>Estimated 10-year survival</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">10-yr survival = 0.983 ^ exp(0.9 × score) — a population-level estimate from the original cohort, not an individual prognosis.</p>
        <CopyNote text={`Charlson Comorbidity Index ${res.data.total} (comorbidity ${res.data.comorbidityPts} + age ${res.data.agePts}) — est. 10-year survival ${res.data.survival10y.toFixed(0)}% [Charlson 1987]`} />
          </>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Charlson, M.E., et al. (1987). A new method of classifying prognostic comorbidity in
        longitudinal studies. <i>J Chronic Dis</i>, 40(5), 373-383. Decision-support estimate —
        widely used in research and surgical risk discussion; individual prognosis depends on far
        more than the index.
      </div>
    </div>
  )
}

export default CharlsonIndex
