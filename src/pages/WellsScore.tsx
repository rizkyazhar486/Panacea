import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Wells Score — two related, extremely widely used clinical decision rules
// for venous thromboembolism, combined with D-dimer testing to guide imaging:
//   - DVT: Wells, P.S., et al. (2003), NEJM, 349:1227-1235.
//   - PE: Wells, P.S., et al. (2000), Thromb Haemost, 83(3):416-420.
// Pure arithmetic scoring, no external API. Two-tier interpretation shown
// (the modern, most commonly used approach alongside D-dimer); a three-tier
// version also exists in the literature.
// ─────────────────────────────────────────────────────────────────────────────

interface Item { key: string; label: string; points: number }

const DVT_ITEMS: Item[] = [
  { key: 'cancer', label: 'Active cancer (treatment within 6 months, or palliative)', points: 1 },
  { key: 'paralysis', label: 'Paralysis, paresis, or recent plaster immobilization of the leg', points: 1 },
  { key: 'bedridden', label: 'Recently bedridden ≥3 days, or major surgery within 12 weeks', points: 1 },
  { key: 'tenderness', label: 'Localized tenderness along the deep venous system', points: 1 },
  { key: 'legSwollen', label: 'Entire leg swollen', points: 1 },
  { key: 'calfSwelling', label: 'Calf swelling >3cm compared to the other leg', points: 1 },
  { key: 'pittingEdema', label: 'Pitting edema confined to the symptomatic leg', points: 1 },
  { key: 'collateral', label: 'Collateral superficial (non-varicose) veins', points: 1 },
  { key: 'priorDvt', label: 'Previously documented DVT', points: 1 },
  { key: 'altDiagnosis', label: 'An alternative diagnosis is at least as likely as DVT', points: -2 },
]

const PE_ITEMS: Item[] = [
  { key: 'dvtSigns', label: 'Clinical signs/symptoms of DVT', points: 3 },
  { key: 'peLikely', label: 'PE is the #1 diagnosis, or equally likely', points: 3 },
  { key: 'hr100', label: 'Heart rate > 100 bpm', points: 1.5 },
  { key: 'immobilized', label: 'Immobilization ≥3 days, or surgery in the previous 4 weeks', points: 1.5 },
  { key: 'priorVte', label: 'Previous DVT or PE', points: 1.5 },
  { key: 'hemoptysis', label: 'Hemoptysis', points: 1 },
  { key: 'malignancy', label: 'Malignancy (treated within 6 months, or palliative)', points: 1 },
]

function itemsScore(items: Item[], checked: Record<string, boolean>): number {
  return items.reduce((s, it) => s + (checked[it.key] ? it.points : 0), 0)
}

export function WellsScore() {
  const [tab, setTab] = useState<'dvt' | 'pe'>('dvt')
  const [dvt, setDvt] = useState<Record<string, boolean>>({})
  const [pe, setPe] = useState<Record<string, boolean>>({})

  const dvtScore = itemsScore(DVT_ITEMS, dvt)
  const peScore = itemsScore(PE_ITEMS, pe)
  const dvtLikely = dvtScore >= 2
  const peLikely = peScore > 4

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Wells Score" subtitle="Venous thromboembolism risk — DVT and PE, combined with D-dimer" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Two related, widely used clinical decision rules used alongside D-dimer testing to decide
          whether imaging (ultrasound for DVT, CT pulmonary angiogram for PE) is needed.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setTab('dvt')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'dvt' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>DVT (leg)</button>
          <button onClick={() => setTab('pe')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'pe' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>PE (lung)</button>
        </div>
      </Card>

      {tab === 'dvt' ? (
        <>
          <Card className="!p-5">
            <div className="space-y-2">
              {DVT_ITEMS.map((it) => (
                <label key={it.key} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
                  <span className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                    <input type="checkbox" className="h-4 w-4 accent-brand" checked={!!dvt[it.key]} onChange={(e) => setDvt((c) => ({ ...c, [it.key]: e.target.checked }))} />
                    {it.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">{it.points > 0 ? `+${it.points}` : it.points}</span>
                </label>
              ))}
            </div>
          </Card>
          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">DVT Result</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{dvtScore}</span>
              <Badge tone={dvtLikely ? 'critical' : 'brand'}>{dvtLikely ? 'DVT likely' : 'DVT unlikely'}</Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              {dvtLikely
                ? 'Score ≥2 — proceed to compression ultrasound.'
                : 'Score ≤1 — a negative D-dimer can reasonably rule out DVT without imaging; if D-dimer is positive, proceed to ultrasound.'}
            </p>
          </Card>
        </>
      ) : (
        <>
          <Card className="!p-5">
            <div className="space-y-2">
              {PE_ITEMS.map((it) => (
                <label key={it.key} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
                  <span className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                    <input type="checkbox" className="h-4 w-4 accent-brand" checked={!!pe[it.key]} onChange={(e) => setPe((c) => ({ ...c, [it.key]: e.target.checked }))} />
                    {it.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{it.points}</span>
                </label>
              ))}
            </div>
          </Card>
          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">PE Result</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{peScore}</span>
              <Badge tone={peLikely ? 'critical' : 'brand'}>{peLikely ? 'PE likely' : 'PE unlikely'}</Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              {peLikely
                ? 'Score >4 — proceed to CT pulmonary angiogram (or V/Q scan if contraindicated).'
                : 'Score ≤4 — a negative D-dimer can reasonably rule out PE without imaging; if D-dimer is positive, proceed to CT pulmonary angiogram.'}
            </p>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Wells, P.S., et al. DVT (2003), <i>NEJM</i>, 349, 1227-1235; PE (2000), <i>Thromb Haemost</i>,
        83(3), 416-420. Decision-support tool used alongside D-dimer and clinical judgment — not a
        substitute for imaging when clinically indicated.
      </div>
    </div>
  )
}

export default WellsScore
