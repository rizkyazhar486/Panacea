import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { ScoreTrend } from '../../../components/ScoreTrend'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { parseNumberField, sofaScore, type CvLevel } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// SOFA Score (Sequential Organ Failure Assessment) — Vincent, J.L., et al.
// (1996), Intensive Care Med, 22(7):707-710. Full 6-organ-system severity
// score for ICU patients (distinct from the bedside qSOFA screening tool
// elsewhere in this app) — used for both prognosis and trending organ
// dysfunction over time. Pure checklist/threshold scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const CV_OPTS: { label: string; pts: CvLevel }[] = [
  { label: 'MAP ≥ 70 mmHg, no vasopressors', pts: 0 },
  { label: 'MAP < 70 mmHg, no vasopressors', pts: 1 },
  { label: 'Dopamine ≤5 mcg/kg/min, or any dobutamine', pts: 2 },
  { label: 'Dopamine >5, or epinephrine ≤0.1, or norepinephrine ≤0.1 mcg/kg/min', pts: 3 },
  { label: 'Dopamine >15, or epinephrine >0.1, or norepinephrine >0.1 mcg/kg/min', pts: 4 },
]

export function SofaScore() {
  // Empat nilai lab dan satu skala neurologis dimulai kosong. Dengan nilai
  // lamanya -- PaO2/FiO2 350, trombosit 180, bilirubin 0,8, GCS 15,
  // kreatinin 1,0 -- keenam subskor bernilai NOL, jadi halaman ini terbuka
  // pada SOFA 0 dengan perkiraan mortalitas "<10%", dan menyimpannya sebagai
  // titik tren.
  //
  // Tingkat kardiovaskular 0 ("tanpa hipotensi") dan "tidak disokong
  // ventilasi" TETAP: keduanya penilaian yang memang dijawab, bukan kolom
  // yang dibiarkan kosong.
  const [pf, setPf] = useState('')
  const [supported, setSupported] = useState(false)
  const [plt, setPlt] = useState('')
  const [bili, setBili] = useState('')
  const [cv, setCv] = useState<CvLevel>(0)
  const [gcs, setGcs] = useState('')
  const [creat, setCreat] = useState('')

  const res = sofaScore({ pf: parseNumberField(pf), plt: parseNumberField(plt), bili: parseNumberField(bili), creat: parseNumberField(creat), gcs: parseNumberField(gcs), supported, cv })
  const belum = res.missing
  const lengkap = res.total !== null
  const { resp, coag, liver, renal, cns } = res.points
  const total = res.total
  const band = res.band

  const rows = [
    { name: 'Respiration (PaO₂/FiO₂)', pts: resp },
    { name: 'Coagulation (platelets)', pts: coag },
    { name: 'Liver (bilirubin)', pts: liver },
    { name: 'Cardiovascular (MAP/vasopressors)', pts: res.points.cv },
    { name: 'CNS (Glasgow Coma Scale)', pts: cns },
    { name: 'Renal (creatinine)', pts: renal },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="SOFA Score" subtitle="Sequential Organ Failure Assessment (Vincent et al. 1996)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">A full ICU severity score across 6 organ systems — different from the bedside qSOFA screening tool. Used for prognosis and tracking organ dysfunction over time, not as an initial screen.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="PaO₂/FiO₂ ratio">
            <input className={inputClass} type="number" min={0} value={pf} onChange={(e) => setPf(e.target.value)} />
          </Field>
          <Field label="Platelets (×10³/µL)">
            <input className={inputClass} type="number" min={0} value={plt} onChange={(e) => setPlt(e.target.value)} />
          </Field>
          <Field label="Bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bili} onChange={(e) => setBili(e.target.value)} />
          </Field>
          <Field label="Creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={creat} onChange={(e) => setCreat(e.target.value)} />
          </Field>
          <Field label="Glasgow Coma Scale">
            <input className={inputClass} type="number" min={3} max={15} value={gcs} onChange={(e) => setGcs(e.target.value)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={supported} onChange={(e) => setSupported(e.target.checked)} className="h-4 w-4 rounded" />
          On mechanical ventilation or CPAP (needed to score respiration ≥3)
        </label>
        <div className="mt-3">
          <Field label="Cardiovascular status">
            <select className={inputClass} value={cv} onChange={(e) => setCv(Number(e.target.value) as CvLevel)}>
              {CV_OPTS.map((o) => (
                <option key={o.pts} value={o.pts}>{o.label} ({o.pts} pt)</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Per-system breakdown</div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div className="text-sm font-bold text-ink dark:text-ink">{r.name}</div>
              <div className="text-lg font-black text-brand-dark">{r.pts ?? '—'}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Total SOFA Score</div>
        {lengkap && band !== null && total !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{total} / 24</span>
              <Badge tone={band.tone}>{band.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">Estimated mortality: {band.mortality} (population-level estimate).</p>
            <CopyNote text={`SOFA ${total}/24 (resp ${resp}, coag ${coag}, liver ${liver}, CV ${cv}, CNS ${cns}, renal ${renal}) — ${band.label.toLowerCase()}, est. mortality ${band.mortality} [Vincent 1996]`} />
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet.{belum.length > 0 && <> Still needed: {belum.join(', ')}.</>}
            {res.invalid.map((m) => <span key={m} role="alert" className="block font-semibold text-amber-700 dark:text-amber-300">{m}</span>)}
            {' '}The cardiovascular level and the ventilation question are already answered. The five measurements are
            not — and with their old starting values every subscore was zero, so this page opened at SOFA 0 with an
            estimated mortality under 10% and wrote that to a trend.
          </p>
        )}
      </Card>

      {lengkap && total !== null && (
      <ScoreTrend
        storageKey="pmd_sofa_trend_v1"
        scoreName="SOFA"
        total={total}
        maxScore={24}
        detail={`Resp ${resp}, Coag ${coag}, Liver ${liver}, CV ${cv}, CNS ${cns}, Renal ${renal}`}
      />
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Vincent, J.L., et al. (1996). The SOFA score. <i>Intensive Care Med</i>, 22(7), 707-710.
        Decision-support estimate — trend the score serially rather than relying on a single value.
      </div>
    </div>
  )
}

export default SofaScore
