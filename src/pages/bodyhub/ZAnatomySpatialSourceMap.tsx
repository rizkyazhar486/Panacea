import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  anatomySourceNodeOrigin,
  getEffectiveAnatomySourceNodeSnapshot,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import {
  buildZAnatomySpatialSourceMap,
  Z_ANATOMY_SPATIAL_LAYERS,
  type ZAnatomySpatialSourceCell,
} from '../../lib/anatomySpatialSourceMap'
import { WHOLE_BODY_REGIONS, type AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (sourceNames: string[]) => void
  onFocusRegion?: (sourceNamesOrHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

const LAYER_LABEL: Readonly<Record<AtlasLayerKey, string>> = {
  surface: 'Surface',
  skeletal: 'Skeleton',
  muscular: 'Muscles',
  cardiovascular: 'Vessels',
  nervous: 'Nerves',
  visceral: 'Viscera',
  lymphoid: 'Lymphoid',
}

function cellTone(cell: ZAnatomySpatialSourceCell) {
  if (cell.state === 'empty') return 'border-transparent bg-neutral-50/50 text-neutral-300 dark:bg-white/[0.015] dark:text-neutral-700'
  if (cell.state === 'not-represented') return 'border-amber-300/30 bg-amber-400/[0.04] text-amber-700 dark:border-amber-400/20 dark:text-amber-200'
  if (cell.state === 'unresolved') return 'border-neutral-300 border-dashed bg-neutral-50 text-neutral-500 dark:border-white/15 dark:bg-white/[0.02]'
  return anatomySourceNodeOrigin(cell.file) === 'runtime'
    ? 'border-brand/35 bg-brand/[0.07] text-brand'
    : 'border-blue-300/35 bg-blue-500/[0.05] text-blue-700 dark:border-blue-400/25 dark:text-blue-200'
}

function statusLabel(cell: ZAnatomySpatialSourceCell) {
  if (cell.state === 'empty') return 'No catalogue target'
  if (cell.state === 'not-represented') return 'No direct geometry'
  if (cell.state === 'unresolved') return 'No name match'
  return anatomySourceNodeOrigin(cell.file) === 'runtime' ? 'Loaded runtime' : 'Indexed source'
}

export function ZAnatomySpatialSourceMap({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )
  const cells = useMemo(() => buildZAnatomySpatialSourceMap(sourceBundles), [sourceBundles])
  const firstResolved = cells.find((cell) => cell.state === 'resolved') ?? cells.find((cell) => cell.targets.length) ?? cells[0]
  const [selectedKey, setSelectedKey] = useState(firstResolved?.key ?? '')
  const selected = cells.find((cell) => cell.key === selectedKey) ?? firstResolved

  function inspect(cell: ZAnatomySpatialSourceCell) {
    if (!cell.targets.length) return
    setSelectedKey(cell.key)
    onEnableLayer?.(cell.layer)
    onHighlight?.([...cell.sourceNames])
    onFocusRegion?.(cell.sourceNames.length ? [...cell.sourceNames] : [...cell.nodeHints])
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
      <div className="border-b border-neutral-200 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 p-4 text-white dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">Spatial source map · interactive 3D routing</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h4 className="text-xl font-black">Region × anatomy system</h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">See where the reviewed whole-body catalogue has exact named source meshes, then route that region-system intersection into the shared Z-Anatomy viewer. The map distinguishes loaded runtime geometry from source names that are indexed but not currently mounted.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black">
            <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-brand">loaded runtime</span>
            <span className="rounded-full border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-blue-200">indexed source</span>
            <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-200">not directly represented</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[150px_repeat(7,minmax(96px,1fr))] gap-1.5">
            <div className="flex items-end px-2 pb-1 text-[8px] font-black uppercase tracking-[0.14em] text-neutral-400">Body region</div>
            {Z_ANATOMY_SPATIAL_LAYERS.map((layer) => (
              <div key={layer} className="px-1 pb-1 text-center text-[8px] font-black uppercase tracking-wide text-neutral-400">{LAYER_LABEL[layer]}</div>
            ))}

            {WHOLE_BODY_REGIONS.flatMap((region) => {
              const regionCells = Z_ANATOMY_SPATIAL_LAYERS.map((layer) => cells.find((cell) => cell.regionKey === region.key && cell.layer === layer)!)
              return [
                <div key={`${region.key}:label`} className="flex min-h-[78px] items-center rounded-xl border border-neutral-200 px-3 text-[10px] font-black text-ink dark:border-white/10 dark:text-white">{region.label}</div>,
                ...regionCells.map((cell) => {
                  const active = selected?.key === cell.key
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={!cell.targets.length}
                      aria-pressed={active}
                      onClick={() => inspect(cell)}
                      className={`min-h-[78px] rounded-xl border p-2 text-left transition ${cellTone(cell)} ${active ? 'ring-2 ring-brand/30' : ''} disabled:cursor-default`}
                    >
                      {cell.targets.length ? (
                        <>
                          <div className="text-base font-black leading-none">{cell.targets.length}</div>
                          <div className="mt-1 text-[8px] font-black">catalogue target{cell.targets.length === 1 ? '' : 's'}</div>
                          <div className="mt-1 text-[8px] opacity-75">{cell.sourceNames.length} source name{cell.sourceNames.length === 1 ? '' : 's'}</div>
                          <div className="mt-1 text-[7.5px] font-bold opacity-70">{statusLabel(cell)}</div>
                        </>
                      ) : (
                        <div className="text-center text-[8px]">—</div>
                      )}
                    </button>
                  )
                }),
              ]
            })}
          </div>
        </div>
      </div>

      {selected && selected.targets.length > 0 && (
        <div className="grid gap-0 border-t border-neutral-200 dark:border-white/10 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Selected intersection</div>
            <h5 className="mt-1 text-lg font-black text-ink dark:text-white">{selected.regionLabel} · {LAYER_LABEL[selected.layer]}</h5>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{selected.file}</span>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${cellTone(selected)}`}>{statusLabel(selected)}</span>
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Clicking a cell enables the relevant viewer layer, highlights exact resolved source names when available, and frames those nodes in the existing shared 3D scene. If exact names are unresolved, only reviewed lookup hints are used for framing.</p>
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.02] lg:border-l lg:border-t-0">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Reviewed targets</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.targets.map((target) => (
                <span key={target.id} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[8px] font-bold text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">{target.label}</span>
              ))}
            </div>
            {selected.sourceNames.length > 0 && (
              <>
                <div className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Resolved original source names</div>
                <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {selected.sourceNames.slice(0, 24).map((name) => (
                    <button key={name} type="button" onClick={() => { onEnableLayer?.(selected.layer); onHighlight?.([name]); onFocusRegion?.([name]) }} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 font-mono text-[8px] text-neutral-600 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">{name}</button>
                  ))}
                </div>
                {selected.sourceNames.length > 24 && <div className="mt-1 text-[8px] text-neutral-400">Showing first 24 of {selected.sourceNames.length} resolved names.</div>}
              </>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-neutral-200 px-4 py-3 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10">
        Cell counts are inventory/navigation facts only. They are <strong>not</strong> anatomical completeness, tissue volume, segmentation quality, clinical importance, surgical safety, or a percentage of the human body. An indexed source match proves a named mesh exists in a shipped bundle; only “loaded runtime” means that bundle is currently mounted in the WebGL scene.
      </div>
    </section>
  )
}

export default ZAnatomySpatialSourceMap
