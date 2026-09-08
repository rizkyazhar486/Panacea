import { useState } from 'react'
import type { PhysiologyDeepDive } from '../../lib/physiologyDeepDives'
import {
  BREATH_ATLAS_REFERENCE_BOUNDARY,
  BREATH_ATLAS_REFERENCE_URL,
  BREATH_ATLAS_SCIENCE_BOUNDARY,
  BREATH_ATLAS_STATIONS,
  BREATH_ATLAS_TOPIC,
  THEBUGGEDDEV_ANATOMY_REPOSITORY,
  THEBUGGEDDEV_ANATOMY_REVIEWED_REVISION,
} from '../../lib/breathAtlas'

interface Props {
  onFocus: (topic: PhysiologyDeepDive) => void
}

export function BreathAtlasPanel({ onFocus }: Props) {
  const [stationId, setStationId] = useState(BREATH_ATLAS_STATIONS[0].id)
  const station = BREATH_ATLAS_STATIONS.find((item) => item.id === stationId) ?? BREATH_ATLAS_STATIONS[0]

  return (
    <section aria-labelledby="breath-atlas-title" className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-500/20 dark:bg-sky-500/[0.06]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-sky-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-sky-700 dark:border-sky-500/30 dark:text-sky-300">
              Breath Atlas
            </span>
            <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-white/10">
              Shared Body3D · reference physiology
            </span>
          </div>
          <h3 id="breath-atlas-title" className="mt-2 text-base font-black text-ink dark:text-white">Breathing anatomy → respiratory mechanics</h3>
          <p className="mt-1 max-w-2xl text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            A compact respiratory learning path inspired by the supplied Breath Atlas product reference, implemented independently on Panacea's existing anatomy and evidence stack.
          </p>
        </div>
        <button
          type="button"
          disabled={!BREATH_ATLAS_TOPIC}
          onClick={() => BREATH_ATLAS_TOPIC && onFocus(BREATH_ATLAS_TOPIC)}
          className="min-h-11 shrink-0 rounded-full border border-brand px-3 text-[10px] font-black text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Focus respiratory system in shared 3D →
        </button>
      </div>

      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Breath Atlas stations">
        {BREATH_ATLAS_STATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={station.id === item.id}
            onClick={() => setStationId(item.id)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-bold transition ${
              station.id === item.id
                ? 'border-sky-500 bg-sky-600 text-white'
                : 'border-neutral-200 bg-white/70 text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.6fr)]">
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{station.label}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.description}</p>
          {BREATH_ATLAS_TOPIC && station.id === 'mechanics' && (
            <div className="mt-2 space-y-1.5">
              {BREATH_ATLAS_TOPIC.formulas.map((formula) => (
                <div key={formula.label} className="rounded-lg bg-neutral-50 p-2 dark:bg-white/[0.04]">
                  <div className="text-[9px] font-bold text-neutral-500">{formula.label}</div>
                  <code className="mt-0.5 block overflow-x-auto whitespace-nowrap font-mono text-[10px] font-bold text-ink dark:text-white">{formula.expression}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Scientific boundary</div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-900 dark:text-amber-200">{BREATH_ATLAS_SCIENCE_BOUNDARY}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">External reference provenance</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{BREATH_ATLAS_REFERENCE_BOUNDARY}</p>
            <p className="mt-1 text-[9px] font-mono text-neutral-400">Reviewed repo revision: {THEBUGGEDDEV_ANATOMY_REVIEWED_REVISION}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <a href={THEBUGGEDDEV_ANATOMY_REPOSITORY} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-neutral-200 px-3 py-3 text-[9.5px] font-bold text-neutral-600 underline-offset-2 hover:border-brand hover:text-brand hover:underline dark:border-white/10 dark:text-neutral-300">
                thebuggeddev/anatomy ↗
              </a>
              <a href={BREATH_ATLAS_REFERENCE_URL} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-neutral-200 px-3 py-3 text-[9.5px] font-bold text-neutral-600 underline-offset-2 hover:border-brand hover:text-brand hover:underline dark:border-white/10 dark:text-neutral-300">
                Breath Atlas reference ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {BREATH_ATLAS_TOPIC && (
        <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-500">
          Existing evidence anchor: {BREATH_ATLAS_TOPIC.label}. {BREATH_ATLAS_TOPIC.boundary}
        </p>
      )}
    </section>
  )
}

export default BreathAtlasPanel
