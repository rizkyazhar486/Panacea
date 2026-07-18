import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { ScoreTrend } from '../components/ScoreTrend'

// ─────────────────────────────────────────────────────────────────────────────
// Child-Pugh Score — Pugh, R.N.H., et al. (1973), Br J Surg, 60(8):646-649
// (modification of Child & Turcotte, 1964). Cirrhosis severity, surgical risk
// stratification, and (alongside MELD-Na) prognosis. 5 criteria, 1-3 points
// each, summed 5-15. Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Level = 1 | 2 | 3

function bilirubinPts(v: number): Level {
  if (v < 2) return 1
  if (v <= 3) return 2
  return 3
}
function albuminPts(v: number): Level {
  if (v > 3.5) return 1
  if (v >= 2.8) return 2
  return 3
}
function inrPts(v: number): Level {
  if (v < 1.7) return 1
  if (v <= 2.3) return 2
  return 3
}

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

function classify(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; survival: string } {
  if (score <= 6) return { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' }
  if (score <= 9) return { label: 'Class B', tone: 'low', survival: '~80% 1-year, ~60% 2-year survival' }
  return { label: 'Class C', tone: 'critical', survival: '~45% 1-year, ~35% 2-year survival' }
}

export function ChildPughScore() {
  const [bilirubin, setBilirubin] = useState(1.5)
  const [albumin, setAlbumin] = useState(3.2)
  const [inr, setInr] = useState(1.4)
  const [ascites, setAscites] = useState<Level>(1)
  const [enceph, setEnceph] = useState<Level>(1)

  const pts = bilirubinPts(bilirubin) + albuminPts(albumin) + inrPts(inr) + ascites + enceph
  const cls = classify(pts)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Child-Pugh Score" subtitle="Cirrhosis severity & surgical risk (Pugh et al. 1973)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Five criteria, 1-3 points each (5-15 total). Used alongside MELD-Na for prognosis, and
          specifically for surgical risk stratification and drug-dosing decisions in cirrhosis.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Total bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bilirubin || ''} onChange={(e) => setBilirubin(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Albumin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={albumin || ''} onChange={(e) => setAlbumin(Number(e.target.value) || 0)} />
          </Field>
          <Field label="INR">
            <input className={inputClass} type="number" step="0.1" min={0} value={inr || ''} onChange={(e) => setInr(Number(e.target.value) || 0)} />
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
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Child-Pugh Class</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{pts} pts</span>
          <Badge tone={cls.tone}>{cls.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">Estimated {cls.survival} (population-level estimate, not individual prognosis).</p>
      </Card>

      <ScoreTrend
        storageKey="pmd_childpugh_trend_v1"
        scoreName="Child-Pugh"
        total={pts}
        maxScore={15}
        detail={`Bili ${bilirubin}, Alb ${albumin}, INR ${inr}, ascites ${ascites}pt, enceph ${enceph}pt`}
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Pugh, R.N.H., et al. (1973). Transection of the oesophagus for bleeding oesophageal varices.
        <i> Br J Surg</i>, 60(8), 643-649. Decision-support estimate — verify classification against
        the primary literature for surgical or transplant decisions.
      </div>
    </div>
  )
}

export default ChildPughScore
