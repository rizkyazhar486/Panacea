import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  anatomySourceNodeOrigin,
  getEffectiveAnatomySourceNodeSnapshot,
  normalizeAnatomySourceName,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import type { AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

const LAYER_BY_FILE: Record<string, AtlasLayerKey> = {
  'surface.glb': 'surface',
  'skeletal.glb': 'skeletal',
  'muscular.glb': 'muscular',
  'cardiovascular.glb': 'cardiovascular',
  'nervous.glb': 'nervous',
  'visceral.glb': 'visceral',
  'lymphoid.glb': 'lymphoid',
}

const QUICK_QUERIES = ['femur', 'aorta', 'median nerve', 'rectus femoris'] as const
const MAX_RESULTS = 36

type Result = {
  file: string
  name: string
  layer?: AtlasLayerKey
}

export function ZAnatomySourceMeshBrowser({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const [query, setQuery] = useState('')
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )

  const normalizedQuery = normalizeAnatomySourceName(query)
  const sourceNameCount = sourceBundles.reduce((total, bundle) => total + bundle.names.length, 0)
  const runtimeBundleCount = sourceBundles.filter((bundle) => anatomySourceNodeOrigin(bundle.file) === 'runtime').length

  const results = useMemo<Result[]>(() => {
    if (!normalizedQuery) return []
    return resolveAllAnatomySourceNodes([normalizedQuery], sourceBundles, 12)
      .flatMap((match) => match.names.map((name) => ({
        file: match.file,
        name,
        layer: LAYER_BY_FILE[match.file],
      })))
      .slice(0, MAX_RESULTS)
  }, [normalizedQuery, sourceBundles])

  function inspect(result: Result) {
    if (result.layer) onEnableLayer?.(result.layer)
    onHighlight?.([result.name])
    onFocusRegion?.([result.name])
  }

  return (
    <details className="group rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Advanced source-name lookup</div>
          <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Source mesh browser</div>
        </div>
        <div className="text-right text-[9px] leading-relaxed text-neutral-500">
          {sourceNameCount.toLocaleString()} indexed names<br />
          {runtimeBundleCount}/{sourceBundles.length} bundles loaded runtime
        </div>
      </summary>

      <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-white/10">
        <p className="text-[10px] leading-relaxed text-neutral-500">
          Search the original named meshes shipped with the anatomy GLBs. This is a source-name inventory, not anatomy coverage. A generated-index match proves a named mesh exists in a shipped GLB; runtime means that same bundle is currently mounted in the shared viewer.
        </p>

        <label className="mt-3 block text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400" htmlFor="z-anatomy-source-mesh-search">Original GLTF node name</label>
        <input
          id="z-anatomy-source-mesh-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search source nodes: femur, aorta, median nerve…"
          className="mt-2 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-ink outline-none transition focus:border-brand dark:border-white/10 dark:bg-neutral-950 dark:text-white"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map((value) => (
            <button key={value} type="button" onClick={() => setQuery(value)} className="min-h-9 rounded-full border border-neutral-200 px-3 text-[9px] font-bold text-neutral-500 transition hover:border-brand/40 hover:text-brand dark:border-white/10">
              {value}
            </button>
          ))}
        </div>

        {normalizedQuery && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 text-[9px] font-bold text-neutral-400">
              <span>{results.length} conservative source-name match{results.length === 1 ? '' : 'es'}</span>
              {results.length === MAX_RESULTS && <span>showing first {MAX_RESULTS}</span>}
            </div>

            {results.length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((result) => {
                  const origin = anatomySourceNodeOrigin(result.file)
                  return (
                    <button key={`${result.file}:${result.name}`} type="button" onClick={() => inspect(result)} className="min-h-14 rounded-xl border border-neutral-200 bg-white p-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand/40 dark:border-white/10 dark:bg-neutral-950">
                      <div className="break-words font-mono text-[10px] font-bold text-ink dark:text-white">{result.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[8px] font-bold text-neutral-400">
                        <span>{result.file}</span>
                        {result.layer && <span>· {result.layer}</span>}
                        <span className={origin === 'runtime' ? 'text-brand' : 'text-blue-500'}>· {origin === 'runtime' ? 'loaded runtime' : 'generated GLB index'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-dashed border-neutral-200 p-4 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10">
                No conservative source-name match. Short terms match exact tokens; reviewed stems of five or more characters may match token prefixes. This result is not evidence that an anatomical structure is absent.
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  )
}
