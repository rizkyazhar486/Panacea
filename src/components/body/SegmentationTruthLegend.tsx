import { useState } from 'react'

const LAPISAN = [
  {
    id: 'reference',
    label: 'Reference anatomy',
    short: 'Atlas',
    detail: 'A teaching reference from a separately sourced anatomical atlas. It is not extracted from the scan you opened and must not be treated as that person’s anatomy.',
  },
  {
    id: 'model',
    label: 'Model segmentation',
    short: 'AI mask',
    detail: 'A segmentation model can propose voxel labels for structures in an image. A proposed mask is an algorithmic output, not ground truth and not a clinical finding.',
  },
  {
    id: 'reviewed',
    label: 'Clinician-reviewed finding',
    short: 'Reviewed',
    detail: 'Only a separately documented human review can support this state. Panacea never upgrades an AI mask or reference atlas into “reviewed” automatically.',
  },
] as const

type Id = (typeof LAPISAN)[number]['id']

export function SegmentationTruthLegend() {
  const [aktif, setAktif] = useState<Id>('model')
  const pilihan = LAPISAN.find((x) => x.id === aktif)!

  return (
    <section className="mt-3 rounded-2xl border border-neutral-200/70 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[.03]" aria-label="Segmentation truth layers">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">What kind of anatomy am I looking at?</div>
      <div className="mt-2 grid grid-cols-3 gap-1.5" role="tablist" aria-label="Anatomy evidence type">
        {LAPISAN.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={aktif === x.id} onClick={() => setAktif(x.id)}
            className={`min-h-11 rounded-xl border px-2 text-[11px] font-black ${aktif === x.id ? 'border-brand bg-brand text-white' : 'border-neutral-300/70 text-neutral-600 dark:border-white/15 dark:text-neutral-300'}`}>
            {x.short}
          </button>
        ))}
      </div>
      <div className="mt-2.5 rounded-xl border border-neutral-200/70 p-3 dark:border-white/10">
        <div className="text-xs font-black text-ink dark:text-white">{pilihan.label}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{pilihan.detail}</p>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        TotalSegmentator is the required reference for the future model-segmentation layer. Until an exact model version, input study and produced mask are actually connected here, Panacea shows no synthetic organ mask and reports no model performance. Reference anatomy, algorithmic segmentation and clinician review remain visibly separate.
      </p>
    </section>
  )
}
