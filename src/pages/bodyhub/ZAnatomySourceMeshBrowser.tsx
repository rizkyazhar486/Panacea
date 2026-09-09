import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  anatomySourceNodeOrigin,
  getEffectiveAnatomySourceNodeSnapshot,
  normalizeAnatomySourceName,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import { BODY_ATLAS_GRAPH } from '../../lib/bodyAtlasGraph'
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

const LAYER_LABEL: Record<AtlasLayerKey, string> = {
  surface: 'Surface',
  skeletal: 'Skeleton',
  muscular: 'Muscles',
  cardiovascular: 'Cardiovascular',
  nervous: 'Nervous',
  visceral: 'Viscera',
  lymphoid: 'Lymphoid',
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
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )

  const normalizedQuery = normalizeAnatomySourceName(query)
  const sourceNameCount = sourceBundles.reduce((total, bundle) => total + bundle.names.length, 0)
  const runtimeBundleCount = sourceBundles.filter((bundle) => anatomySourceNodeOrigin(bundle.file) === 'runtime').length
  const maxBundleNames = Math.max(1, ...sourceBundles.map((bundle) => bundle.names.length))

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

  const selectedGraphNode = useMemo(() => {
    if (!selectedResult) return null
    return BODY_ATLAS_GRAPH.nodes.find((node) =>
      node.sourceFile === selectedResult.file && node.sourceName === selectedResult.name,
    ) ?? null
  }, [selectedResult])

  const structuralPeers = useMemo(() => {
    if (!selectedGraphNode) return []
    const peers = new Map<string, { kind: 'contralateral' | 'same-structure'; file: string; name: string; layer?: AtlasLayerKey }>()
    for (const edge of BODY_ATLAS_GRAPH.edges) {
      const peerId = edge.source === selectedGraphNode.id
        ? edge.target
        : edge.target === selectedGraphNode.id
          ? edge.source
          : null
      if (!peerId) continue
      const node = BODY_ATLAS_GRAPH.nodeById.get(peerId)
      if (!node) continue
      peers.set(`${edge.kind}:${node.id}`, {
        kind: edge.kind,
        file: node.sourceFile,
        name: node.sourceName,
        layer: LAYER_BY_FILE[node.sourceFile],
      })
    }
    return [...peers.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
  }, [selectedGraphNode])

  function inspect(result: Result) {
    setSelectedResult(result)
    if (result.layer) onEnableLayer?.(result.layer)
    onHighlight?.([result.name])
    onFocusRegion?.([result.name])
  }

  function inspectPeer(peer: { file: string; name: string; layer?: AtlasLayerKey }) {
    setSelectedResult({ file: peer.file, name: peer.name, layer: peer.layer })
    if (peer.layer) onEnableLayer?.(peer.layer)
    onHighlight?.([peer.name])
    onFocusRegion?.([peer.name])
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

        <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Source bundle composition</div>
              <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Named geometry inventory</div>
            </div>
            <div className="text-[8px] font-bold text-neutral-400">bar length = relative named-node count</div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sourceBundles.map((bundle) => {
              const layer = LAYER_BY_FILE[bundle.file]
              const origin = anatomySourceNodeOrigin(bundle.file)
              const width = `${Math.max(4, Math.round((bundle.names.length / maxBundleNames) * 100))}%`
              return (
                <button
                  key={bundle.file}
                  type="button"
                  onClick={() => { if (layer) onEnableLayer?.(layer) }}
                  disabled={!layer}
                  className="min-h-20 rounded-xl border border-neutral-200 p-2.5 text-left transition hover:border-brand/40 disabled:cursor-default dark:border-white/10"
                  aria-label={`${bundle.file}: ${bundle.names.length} named source nodes`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black text-ink dark:text-white">{layer ? LAYER_LABEL[layer] : bundle.file}</div>
                      <div className="mt-0.5 font-mono text-[8px] text-neutral-400">{bundle.file}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-ink dark:text-white">{bundle.names.length.toLocaleString()}</div>
                      <div className="text-[8px] text-neutral-400">named nodes</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand" style={{ width }} />
                  </div>
                  <div className={`mt-1.5 text-[8px] font-black ${origin === 'runtime' ? 'text-brand' : 'text-blue-500'}`}>
                    {origin === 'runtime' ? 'loaded runtime' : 'generated GLB index'}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">
            Node counts compare the source-name inventories of shipped bundles only. They are not anatomical completeness, tissue volume, clinical importance, segmentation quality, or a percentage of the human body.
          </p>
        </div>

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
                  const selected = selectedResult?.file === result.file && selectedResult?.name === result.name
                  return (
                    <button key={`${result.file}:${result.name}`} type="button" aria-pressed={selected} onClick={() => inspect(result)} className={`min-h-14 rounded-xl border bg-white p-2.5 text-left transition hover:-translate-y-0.5 dark:bg-neutral-950 ${selected ? 'border-brand ring-1 ring-brand/20' : 'border-neutral-200 hover:border-brand/40 dark:border-white/10'}`}>
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

        {selectedResult && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Explicit atlas graph</div>
                <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Structural peers</div>
                <div className="mt-1 break-words font-mono text-[9px] text-neutral-500">{selectedResult.name}</div>
              </div>
              <div className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-bold text-neutral-500 dark:border-white/10">
                {structuralPeers.length} explicit link{structuralPeers.length === 1 ? '' : 's'}
              </div>
            </div>

            {structuralPeers.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {structuralPeers.map((peer) => (
                  <button key={`${peer.kind}:${peer.file}:${peer.name}`} type="button" onClick={() => inspectPeer(peer)} className="min-h-12 rounded-xl border border-neutral-200 p-2.5 text-left transition hover:border-brand/40 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="break-words font-mono text-[9px] font-bold text-ink dark:text-white">{peer.name}</span>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[8px] font-black text-neutral-500 dark:bg-white/10">{peer.kind === 'contralateral' ? 'contralateral' : 'same structure'}</span>
                    </div>
                    <div className="mt-1 text-[8px] font-bold text-neutral-400">{peer.file}{peer.layer ? ` · ${peer.layer}` : ''}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-neutral-200 p-3 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10">
                No explicit contralateral or same-structure peer is recorded for this exact source node.
              </div>
            )}

            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">
              These links mean only contralateral pairing or repeated instances of the same named structure in the generated atlas graph. They are not anatomical adjacency, innervation, vascular territory, surgical safety, or biomechanical coupling.
            </p>
          </div>
        )}
      </div>
    </details>
  )
}

export default ZAnatomySourceMeshBrowser