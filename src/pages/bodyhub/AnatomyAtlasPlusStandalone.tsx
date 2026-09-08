import { useState } from 'react'
import {
  ANATOMY_LAYERS,
  Body3D,
  CT_WINDOWS,
  MOTION_OFF,
  type AnatomyLayer,
  type RenderMode,
  type SlicePlane,
} from '../../components/Body3D'
import AnatomyAtlasPlus from './AnatomyAtlasPlus'
import BreathAtlasLab from './BreathAtlasLab'
import type { AtlasPlusEntry } from './anatomyAtlasPlusData'

type StudyMode = 'atlas-plus' | 'breath-atlas'

const DEFAULT_LAYERS = new Set<AnatomyLayer['key']>(['visceral'])

export function AnatomyAtlasPlusStandalone() {
  const [studyMode, setStudyMode] = useState<StudyMode>('atlas-plus')
  const [layers, setLayers] = useState<Set<AnatomyLayer['key']>>(() => new Set(DEFAULT_LAYERS))
  const [highlighted, setHighlighted] = useState<string[]>([])
  const [focusKeywords, setFocusKeywords] = useState<string[] | null>(['lung', 'pulmon'])
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomy')
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('none')
  const [slicePos, setSlicePos] = useState(0.5)
  const [pickedLabel, setPickedLabel] = useState('Lungs')

  function enableLayer(layer: AnatomyLayer['key']) {
    setLayers((current) => (current.has(layer) ? current : new Set(current).add(layer)))
  }

  function focus(entry: AtlasPlusEntry) {
    enableLayer(entry.layer)
    setHighlighted([])
    setFocusKeywords(entry.keywords)
    setRenderMode('anatomy')
    setSlicePlane('none')
    setPickedLabel(entry.label)
  }

  function isolate(entry: AtlasPlusEntry) {
    setLayers(new Set([entry.layer]))
    setHighlighted([])
    setFocusKeywords(entry.keywords)
    setRenderMode('anatomy')
    setSlicePlane('none')
    setPickedLabel(entry.label)
  }

  function compare(entries: AtlasPlusEntry[]) {
    const nextLayers = new Set<AnatomyLayer['key']>()
    const nextKeywords: string[] = []
    for (const entry of entries) {
      nextLayers.add(entry.layer)
      nextKeywords.push(...entry.keywords)
    }
    setLayers(nextLayers)
    setHighlighted([])
    setFocusKeywords(Array.from(new Set(nextKeywords)))
    setRenderMode('anatomy')
    setSlicePlane('none')
    setPickedLabel(entries.map((entry) => entry.label).join(' + '))
  }

  function crossSection(entry: AtlasPlusEntry) {
    setLayers(new Set([entry.layer]))
    setHighlighted([])
    setFocusKeywords(entry.keywords)
    setRenderMode('ct')
    setSlicePlane('axial')
    setSlicePos(0.5)
    setPickedLabel(`${entry.label} · CT teaching section`)
  }

  function handleBreathHighlight(names: string[]) {
    setHighlighted(names)
    if (names.length) setPickedLabel('Breath Atlas · exact source nodes')
  }

  function handleBreathFocus(hints: string[]) {
    setFocusKeywords(hints.length ? hints : null)
    setRenderMode('anatomy')
    setSlicePlane('none')
  }

  const ctWindow = CT_WINDOWS.find((window) => window.key === (focusKeywords?.some((keyword) => /lung|bronch|alveol|pulmon/.test(keyword)) ? 'lung' : 'soft')) ?? CT_WINDOWS[0]

  return (
    <div id="anatomy-atlas-plus" className="space-y-3">
      <div className="rounded-2xl border border-brand/30 bg-brand/[0.04] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-sm font-black text-ink dark:text-white">Atlas+ study viewport</div>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-neutral-500">
              One lazy-loaded Body3D viewport powers curated Atlas+ study and the source-aware Breath Atlas. Both reuse the same Panacea-controlled source meshes and runtime cache.
            </p>
          </div>
          <span className="rounded-full border border-brand/30 px-2.5 py-1 text-[10px] font-black text-brand">{pickedLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['atlas-plus', 'Atlas+'],
          ['breath-atlas', 'Breath Atlas'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={studyMode === key}
            onClick={() => {
              setStudyMode(key)
              setRenderMode('anatomy')
              setSlicePlane('none')
              if (key === 'breath-atlas') {
                enableLayer('visceral')
                setPickedLabel('Breath Atlas')
              }
            }}
            className={`min-h-[36px] rounded-lg text-[11px] font-black ${studyMode === key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 p-1 dark:border-white/10">
        <Body3D
          layers={layers}
          highlighted={highlighted}
          focusKeywords={focusKeywords}
          renderMode={renderMode}
          ctWindow={ctWindow}
          slicePlane={slicePlane}
          slicePos={slicePos}
          motion={MOTION_OFF}
          unfold={0}
          dissect={0}
          onPick={(rawName, label) => {
            setHighlighted([rawName])
            setPickedLabel(label)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => { setRenderMode('anatomy'); setSlicePlane('none') }}
          className={`min-h-[32px] rounded-full border px-2.5 text-[10.5px] font-black ${renderMode === 'anatomy' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}
        >
          Anatomy
        </button>
        <button
          type="button"
          onClick={() => { setRenderMode('ct'); setSlicePlane('axial') }}
          className={`min-h-[32px] rounded-full border px-2.5 text-[10.5px] font-black ${renderMode === 'ct' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}
        >
          CT section
        </button>
        {renderMode === 'ct' && (
          <label className="min-w-[150px] flex-1 text-[9.5px] font-black uppercase tracking-wide text-neutral-500">
            Slice {Math.round(slicePos * 100)}%
            <input type="range" min={0} max={1} step={0.01} value={slicePos} onChange={(event) => setSlicePos(Number(event.target.value))} className="mt-1 w-full accent-brand" aria-label="Atlas Plus CT slice" />
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ANATOMY_LAYERS.map((layer) => (
          <button
            key={layer.key}
            type="button"
            onClick={() => setLayers((current) => {
              const next = new Set(current)
              if (next.has(layer.key)) next.delete(layer.key)
              else next.add(layer.key)
              return next
            })}
            className={`min-h-[30px] rounded-full border px-2.5 text-[10px] font-bold ${layers.has(layer.key) ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {studyMode === 'atlas-plus' ? (
        <AnatomyAtlasPlus
          onFocusEntry={focus}
          onIsolateEntry={isolate}
          onCompareEntries={compare}
          onCrossSection={crossSection}
        />
      ) : (
        <BreathAtlasLab
          onHighlight={handleBreathHighlight}
          onFocusRegion={handleBreathFocus}
          onEnableLayer={(layer) => enableLayer(layer)}
        />
      )}
    </div>
  )
}

export default AnatomyAtlasPlusStandalone
