import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { ScoreTrend } from '../../../components/ScoreTrend'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { childPugh, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Child-Pugh Score — Pugh, R.N.H., et al. (1973), Br J Surg, 60(8):646-649
// (modification of Child & Turcotte, 1964). Cirrhosis severity, surgical risk
// stratification, and (alongside MELD-Na) prognosis. 5 criteria, 1-3 points
// each, summed 5-15. Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Level = 1 | 2 | 3

const ASCITES_OPTS: { label: string; pts: Level }[] = [
  { label: 'None', pts: 1 },
  { label: 'Mild (diuretic-responsive)', pts: 2 },
  { label: 'Moderate-severe (refractory)', pts: 3 },
]
const ENCEPH_OPTS: { label: string; pts: Level }[] = [
  { label: 'None', pts: 1 },
  { label: 'Grade 1-2 (mild-moderate)', pts: 2 },
  { label: 'Grade 3-4 (severe/coma)', pts: 3 },
]

export function ChildPughScore() {
  // Tiga nilai lab dimulai kosong. Asites dan ensefalopati TIDAK: keduanya
  // berskala 1-3 dengan 1 berarti "tidak ada", yaitu jawaban klinis yang sah
  // bernilai satu poin, bukan kekosongan.
  const [bilirubin, setBilirubin] = useState('')
  const [albumin, setAlbumin] = useState('')
  const [inr, setInr] = useState('')
  const [ascites, setAscites] = useState<Level>(1)
  const [enceph, setEnceph] = useState<Level>(1)

  const res = childPugh({ bilirubin: parseNumberField(bilirubin), albumin: parseNumberField(albumin), inr: parseNumberField(inr), ascites, enceph })
  const belum = res.missing
  const lengkap = res.pts !== null
  const pts = res.pts
  const cls = res.cls

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Child-Pugh Score" subtitle="Cirrhosis severity & surgical risk (Pugh et al. 1973)" />
        <BatasKlaimSkorTerbit />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Five criteria, 1-3 points each (5-15 total). Used alongside MELD-Na for prognosis, and
          specifically for surgical risk stratification and drug-dosing decisions in cirrhosis.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Total bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bilirubin} onChange={(e) => setBilirubin(e.target.value)} />
          </Field>
          <Field label="Albumin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={albumin} onChange={(e) => setAlbumin(e.target.value)} />
          </Field>
          <Field label="INR">
            <input className={inputClass} type="number" step="0.1" min={0} value={inr} onChange={(e) => setInr(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Field label="Ascites">
            <select className={inputClass} value={ascites} onChange={(e) => setAscites(Number(e.target.value) as Level)}>
              {ASCITES_OPTS.map((o) => (
                <option key={o.pts} value={o.pts}>{o.label} ({o.pts} pt)</option>
              ))}
            </select>
          </Field>
          <Field label="Hepatic encephalopathy">
            <select className={inputClass} value={enceph} onChange={(e) => setEnceph(Number(e.target.value) as Level)}>
              {ENCEPH_OPTS.map((o) => (
                <option key={o.pts} value={o.pts}>{o.label} ({o.pts} pt)</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Child-Pugh Class</div>
        {lengkap && cls !== null && pts !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{pts} pts</span>
              <Badge tone={cls.tone}>{cls.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">Estimated {cls.survival} (population-level estimate, not individual prognosis).</p>
            <CopyNote text={`Child-Pugh ${pts} points, ${cls.label} (bilirubin ${bilirubin} mg/dL, albumin ${albumin} g/dL, INR ${inr}, ascites ${ascites}pt, encephalopathy ${enceph}pt) — est. ${cls.survival} [Pugh 1973]`} />
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No class yet.{belum.length > 0 && <> Still needed: {belum.join(', ')}.</>}
            {res.invalid.map((m) => <span key={m} role="alert" className="block font-semibold text-amber-700 dark:text-amber-300">{m}</span>)}
            {' '}Ascites and encephalopathy are already answered — "none" is a real finding worth one point each —
            but the three laboratory values are not answers until someone draws them.
          </p>
        )}
      </Card>

      {lengkap && pts !== null && (
      <ScoreTrend
        storageKey="pmd_childpugh_trend_v1"
        scoreName="Child-Pugh"
        total={pts}
        maxScore={15}
        detail={`Bili ${bilirubin}, Alb ${albumin}, INR ${inr}, ascites ${ascites}pt, enceph ${enceph}pt`}
      />
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Pugh, R.N.H., et al. (1973). Transection of the oesophagus for bleeding oesophageal varices.
        <i> Br J Surg</i>, 60(8), 643-649. Decision-support estimate — verify classification against
        the primary literature for surgical or transplant decisions.
      </div>
    </div>
  )
}

export default ChildPughScore
