import { useEffect, useMemo, useState } from 'react'
import {
  BREAST_GUIDE_STAGES,
  breastGuideSourceName,
  type BreastGuideStage,
  type BreastSide,
} from '../../lib/breastAtlasGuide'

interface Props {
  selected: string | null
  onSelect: (name: string) => void
}

function selectedStage(selected: string | null, side: BreastSide): BreastGuideStage | null {
  if (!selected) return null
  return BREAST_GUIDE_STAGES.find((stage) => breastGuideSourceName(side, stage) === selected) ?? null
}

export function BreastAtlasGuide({ selected, onSelect }: Props) {
  const [side, setSide] = useState<BreastSide>(selected?.startsWith('Right ') ? 'Right' : 'Left')

  useEffect(() => {
    if (selected?.startsWith('Right ')) setSide('Right')
    else if (selected?.startsWith('Left ')) setSide('Left')
  }, [selected])

  const activeStage = useMemo(() => selectedStage(selected, side), [selected, side])
  const activeIndex = activeStage ? BREAST_GUIDE_STAGES.findIndex((stage) => stage.id === activeStage.id) : -1

  function chooseSide(next: BreastSide) {
    setSide(next)
    const stage = activeStage ?? BREAST_GUIDE_STAGES[0]
    onSelect(breastGuideSourceName(next, stage))
  }

  function chooseStage(stage: BreastGuideStage) {
    onSelect(breastGuideSourceName(side, stage))
  }

  return (
    <section
      data-breast-atlas-guide="v1"
      className="overflow-hidden rounded-2xl border border-pink-300/25 bg-gradient-to-br from-pink-400/[0.06] via-transparent to-brand/[0.04] p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-pink-600 dark:text-pink-300">
            Guided breast anatomy · HuBMAP female reference
          </div>
          <h3 className="mt-1 text-sm font-black text-ink dark:text-white">Trace all 16 shipped structures in the existing 3D atlas</h3>
          <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
            Choose a side and structure below. The existing source-backed viewer will isolate and frame that exact named mesh; no replacement geometry is generated.
          </p>
        </div>
        <div className="flex rounded-xl border border-neutral-200 bg-white p-1 dark:border-white/10 dark:bg-white/5" aria-label="Breast side">
          {(['Left', 'Right'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={side === item}
              onClick={() => chooseSide(item)}
              className={`min-h-11 rounded-lg px-4 text-[10px] font-black transition ${
                side === item ? 'bg-pink-500 text-white shadow-sm' : 'text-neutral-500 hover:text-ink dark:hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8" role="group" aria-label={`${side} breast guided structures`}>
        {BREAST_GUIDE_STAGES.map((stage, index) => {
          const sourceName = breastGuideSourceName(side, stage)
          const active = selected === sourceName
          return (
            <button
              key={stage.id}
              type="button"
              aria-pressed={active}
              onClick={() => chooseStage(stage)}
              className={`min-h-12 rounded-xl border px-2 py-2 text-left transition ${
                active
                  ? 'border-pink-400 bg-pink-500 text-white shadow-md shadow-pink-500/10'
                  : 'border-neutral-200 bg-white/70 text-neutral-600 hover:border-pink-300 dark:border-white/10 dark:bg-white/[0.035] dark:text-neutral-300'
              }`}
            >
              <span className={`block text-[8px] font-black uppercase tracking-wide ${active ? 'text-white/70' : 'text-pink-500'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mt-0.5 block text-[9.5px] font-black leading-tight">{stage.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-black/20" aria-live="polite">
        {activeStage ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-black text-ink dark:text-white">{selected}</div>
              <span className="rounded-full border border-pink-300/40 px-2 py-0.5 text-[8px] font-black text-pink-600 dark:text-pink-300">
                {activeIndex + 1} / {BREAST_GUIDE_STAGES.length}
              </span>
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-neutral-500">{activeStage.description}</p>
          </>
        ) : (
          <p className="text-[9.5px] leading-relaxed text-neutral-500">
            Select any guided structure to frame it in 3D. You can still tap another verified mesh directly in the viewer.
          </p>
        )}
      </div>

      <p className="mt-2 text-[8.5px] leading-relaxed text-neutral-500">
        Educational source geometry only. This is not mammography, ultrasound or MRI; it does not simulate milk flow, infer a lesion, screen for cancer, or represent an individual patient. Human academic review remains separate from engineering validation.
      </p>
    </section>
  )
}

export default BreastAtlasGuide
