import { useMemo, useState, useSyncExternalStore } from 'react'
import { compileAtlasAgainstSource, type CompiledAtlasNode } from '../../lib/anatomy/atlasCompiler'
import type { AtlasGeometryStatus, AtlasManifest, AtlasNode, AtlasScale, AtlasSystemId } from '../../lib/anatomy/atlasKernel'
import { RESPIRATORY_ATLAS_NODES } from '../../lib/anatomy/respiratoryAtlas'
import { WHOLE_BODY_ATLAS } from '../../lib/anatomy/wholeBodyAtlas'
import {
  getEffectiveAnatomySourceNodeSnapshot,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import type { AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (sourceNames: string[]) => void
  onFocusRegion?: (namesOrHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

const SYSTEM_LABEL: Record<AtlasSystemId, string> = {
  surface: 'Surface',
  skeletal: 'Skeletal',
  articular: 'Articular',
  muscular: 'Muscular',
  cardiovascular: 'Cardiovascular',
  lymphatic: 'Lymphatic',
  nervous: 'Nervous',
  respiratory: 'Respiratory',
  digestive: 'Digestive',
  urinary: 'Urinary',
  endocrine: 'Endocrine',
  reproductive: 'Reproductive',
  sensory: 'Sensory',
  fascial: 'Fascial',
}

const SCALE_ORDER: Record<AtlasScale, number> = {
  organism: 0,
  region: 1,
  organ: 2,
  suborgan: 3,
  tissue: 4,
  microstructure: 5,
}

const STATUS_LABEL: Record<AtlasGeometryStatus, string> = {
  shipped: 'Shipped geometry',
  partial: 'Partial geometry',
  'reference-only': 'Reference only',
  planned: 'Planned',
}

const STATUS_CLASS: Record<AtlasGeometryStatus, string> = {
  shipped: 'border-brand/30 bg-brand/[0.07] text-brand',
  partial: 'border-amber-300/40 bg-amber-400/[0.07] text-amber-700 dark:text-amber-200',
  'reference-only': 'border-blue-300/40 bg-blue-400/[0.07] text-blue-700 dark:text-blue-200',
  planned: 'border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5',
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

function combinedManifest(): AtlasManifest {
  const nodes = new Map<string, AtlasNode>()
  for (const node of WHOLE_BODY_ATLAS.nodes) nodes.set(node.id, node)
  for (const node of RESPIRATORY_ATLAS_NODES) if (!nodes.has(node.id)) nodes.set(node.id, node)
  return {
    id: `${WHOLE_BODY_ATLAS.id}+respiratory`,
    revision: `${WHOLE_BODY_ATLAS.revision}+segmental-respiratory`,
    nodes: [...nodes.values()],
  }
}

function nodeDepth(node: AtlasNode, byId: ReadonlyMap<string, AtlasNode>) {
  let depth = 0
  let cursor = node
  const seen = new Set<string>([node.id])
  while (cursor.parentId && depth < 8) {
    const parent = byId.get(cursor.parentId)
    if (!parent || seen.has(parent.id)) break
    seen.add(parent.id)
    depth += 1
    cursor = parent
  }
  return Math.max(0, depth - 1)
}

function breadcrumb(node: AtlasNode, byId: ReadonlyMap<string, AtlasNode>) {
  const items: AtlasNode[] = [node]
  let cursor = node
  const seen = new Set<string>([node.id])
  while (cursor.parentId && items.length < 9) {
    const parent = byId.get(cursor.parentId)
    if (!parent || seen.has(parent.id)) break
    seen.add(parent.id)
    items.unshift(parent)
    cursor = parent
  }
  return items
}

function sourceNames(entry: CompiledAtlasNode) {
  return [...new Set(entry.footprint.sourceNodeNames)]
}

export function ZAnatomySystemExplorer({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const bundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )
  const manifest = useMemo(combinedManifest, [])
  const compiled = useMemo(() => compileAtlasAgainstSource(manifest, bundles), [manifest, bundles])
  const byId = useMemo(() => new Map(manifest.nodes.map((node) => [node.id, node] as const)), [manifest])
  const [system, setSystem] = useState<AtlasSystemId>('cardiovascular')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('cv:heart')

  const systems = useMemo(() => {
    const present = new Set(manifest.nodes.map((node) => node.system))
    return (Object.keys(SYSTEM_LABEL) as AtlasSystemId[]).filter((id) => present.has(id))
  }, [manifest])

  const systemEntries = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    return compiled.nodes
      .filter((entry) => entry.node.system === system)
      .filter((entry) => {
        if (!q) return true
        const node = entry.node
        return [node.label, node.id, node.scale, node.laterality, ...node.regions, ...(node.synonyms ?? []), ...node.source.nodeHints]
          .join(' ')
          .toLocaleLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        const depth = nodeDepth(a.node, byId) - nodeDepth(b.node, byId)
        if (depth) return depth
        const scale = SCALE_ORDER[a.node.scale] - SCALE_ORDER[b.node.scale]
        return scale || a.node.label.localeCompare(b.node.label)
      })
  }, [compiled.nodes, system, query, byId])

  const selected = compiled.nodes.find((entry) => entry.node.id === selectedId && entry.node.system === system)
    ?? systemEntries.find((entry) => entry.node.scale !== 'organism')
    ?? systemEntries[0]
    ?? null

  const selectedCrumbs = selected ? breadcrumb(selected.node, byId) : []
  const systemCounts = useMemo(() => {
    const entries = compiled.nodes.filter((entry) => entry.node.system === system)
    return {
      nodes: entries.length,
      shipped: entries.filter((entry) => entry.node.geometryStatus === 'shipped').length,
      partial: entries.filter((entry) => entry.node.geometryStatus === 'partial').length,
      reference: entries.filter((entry) => entry.node.geometryStatus === 'reference-only').length,
    }
  }, [compiled.nodes, system])

  function enableFiles(files: readonly string[]) {
    for (const file of files) {
      const layer = LAYER_BY_FILE[file]
      if (layer) onEnableLayer?.(layer)
    }
  }

  function inspect(entry: CompiledAtlasNode) {
    const node = entry.node
    setSelectedId(node.id)

    if (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned') {
      onHighlight?.([])
      onFocusRegion?.([...node.source.nodeHints])
      return
    }

    const names = sourceNames(entry)
    const files = [...new Set([
      ...(node.source.files ?? []),
      ...entry.sourceMatches.map((match) => match.file),
    ])]
    enableFiles(files)
    onHighlight?.(names)
    onFocusRegion?.(names.length ? names : [...node.source.nodeHints])
  }

  function inspectExact(name: string, file: string) {
    const layer = LAYER_BY_FILE[file]
    if (layer) onEnableLayer?.(layer)
    onHighlight?.([name])
    onFocusRegion?.([name])
  }

  function changeSystem(next: AtlasSystemId) {
    setSystem(next)
    setQuery('')
    const first = compiled.nodes.find((entry) => entry.node.system === next && entry.node.scale !== 'organism')
      ?? compiled.nodes.find((entry) => entry.node.system === next)
    if (first) {
      setSelectedId(first.node.id)
      inspect(first)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
      <div className="border-b border-neutral-200 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 p-4 text-white dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">Semantic anatomy → source geometry</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h4 className="text-xl font-black">Z-Anatomy system map</h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">Navigate system → organ → suborgan or segment, then resolve the reviewed semantic node against the exact names shipped in the anatomy GLBs. This is an educational hierarchy, not a completeness or diagnostic score.</p>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[8px] font-bold">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"><div className="text-sm font-black text-white">{systemCounts.nodes}</div><div className="text-neutral-500">nodes</div></div>
            <div className="rounded-lg border border-brand/20 bg-brand/10 px-2 py-1.5"><div className="text-sm font-black text-brand">{systemCounts.shipped}</div><div className="text-neutral-500">shipped</div></div>
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2 py-1.5"><div className="text-sm font-black text-amber-200">{systemCounts.partial}</div><div className="text-neutral-500">partial</div></div>
            <div className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-2 py-1.5"><div className="text-sm font-black text-blue-200">{systemCounts.reference}</div><div className="text-neutral-500">reference</div></div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[0.55fr_1.05fr_0.9fr]">
        <div className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">System</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-1">
            {systems.map((id) => {
              const count = compiled.nodes.filter((entry) => entry.node.system === id).length
              return (
                <button key={id} type="button" aria-pressed={system === id} onClick={() => changeSystem(id)} className={`min-h-11 rounded-xl border px-3 py-2 text-left transition ${system === id ? 'border-brand bg-brand text-white shadow-sm' : 'border-neutral-200 text-neutral-600 hover:border-brand/40 dark:border-white/10 dark:text-neutral-300'}`}>
                  <div className="text-[10px] font-black">{SYSTEM_LABEL[id]}</div>
                  <div className={`mt-0.5 text-[8px] font-bold ${system === id ? 'text-white/70' : 'text-neutral-400'}`}>{count} semantic nodes</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
          <label htmlFor="z-anatomy-system-search" className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Hierarchy</label>
          <input id="z-anatomy-system-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${SYSTEM_LABEL[system]}…`} className="mt-2 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-xs text-ink outline-none transition focus:border-brand dark:border-white/10 dark:text-white" />
          <div className="mt-3 max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
            {systemEntries.map((entry) => {
              const node = entry.node
              const depth = nodeDepth(node, byId)
              const active = selected?.node.id === node.id
              return (
                <button key={node.id} type="button" onClick={() => inspect(entry)} className={`w-full rounded-xl border p-2.5 text-left transition ${active ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 hover:border-brand/40 dark:border-white/10'}`} style={{ marginLeft: Math.min(depth, 4) * 8, width: `calc(100% - ${Math.min(depth, 4) * 8}px)` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black text-ink dark:text-white">{node.label}</div>
                      <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{node.scale} · {node.laterality}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black ${STATUS_CLASS[node.geometryStatus]}`}>{STATUS_LABEL[node.geometryStatus]}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[8px] text-neutral-400">{node.regions.map((region) => <span key={region}>{region}</span>)}</div>
                </button>
              )
            })}
            {!systemEntries.length && <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-[10px] text-neutral-500 dark:border-white/10">No semantic node matches this search.</div>}
          </div>
        </div>

        <div className="p-4">
          {selected ? (
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Selected semantic node</div>
              <h5 className="mt-1 text-lg font-black text-ink dark:text-white">{selected.node.label}</h5>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[8px] font-bold text-neutral-400">
                {selectedCrumbs.map((item, index) => <span key={item.id}>{index ? '→ ' : ''}{item.label}</span>)}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${STATUS_CLASS[selected.node.geometryStatus]}`}>{STATUS_LABEL[selected.node.geometryStatus]}</span>
                <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{selected.node.scale}</span>
                <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{selected.node.laterality}</span>
                {selected.node.surgicalLandmark && <span className="rounded-full border border-red-300/40 bg-red-400/[0.05] px-2 py-1 text-[8px] font-black text-red-600 dark:text-red-300">surgical landmark</span>}
                {selected.node.physiologyCapable && <span className="rounded-full border border-blue-300/40 bg-blue-400/[0.05] px-2 py-1 text-[8px] font-black text-blue-600 dark:text-blue-300">physiology context</span>}
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Source proof</div>
                  <div className="text-[8px] font-bold text-neutral-400">{selected.footprint.sourceNodeCount} exact names</div>
                </div>

                {selected.node.geometryStatus === 'reference-only' || selected.node.geometryStatus === 'planned' ? (
                  <div className="mt-2 rounded-xl border border-blue-300/30 bg-blue-400/[0.04] p-3 text-[9px] leading-relaxed text-neutral-500">This semantic node is metadata-only in the current atlas. No source mesh is highlighted, even if a similar source-node name happens to exist elsewhere.</div>
                ) : selected.sourceMatches.length ? (
                  <div className="mt-2 space-y-2">
                    {selected.sourceMatches.map((match) => (
                      <div key={`${match.file}:${match.hint}`} className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[8px] font-bold">
                          <span className="font-mono text-brand">{match.file}</span>
                          <span className="text-neutral-400">{selected.sourceOrigins[match.file] === 'runtime' ? 'loaded runtime' : 'generated GLB index'} · hint: {match.hint}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {match.names.map((name) => <button key={`${match.file}:${name}`} type="button" onClick={() => inspectExact(name, match.file)} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-[8px] text-neutral-600 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">{name}</button>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-neutral-200 p-3 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10">No conservative source-node match was resolved. This is not evidence that the anatomical structure is absent; it means the current reviewed hints did not resolve to a named source mesh.</div>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-neutral-200 p-3 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10">
                <div className="font-black text-ink dark:text-white">Provenance</div>
                <div className="mt-1">{selected.node.provenance.sourceId} · revision {selected.node.provenance.sourceRevision}</div>
                <div>{selected.node.provenance.license}</div>
                <div className="mt-1">Review: {selected.node.provenance.reviewStatus}</div>
                {selected.node.provenance.reviewerScope && <div className="mt-1">{selected.node.provenance.reviewerScope}</div>}
              </div>

              <p className="mt-3 text-[8.5px] leading-relaxed text-neutral-500">Raw node counts describe this semantic manifest only. They are not anatomy-completeness percentages. A source-name match proves correspondence to a named mesh in a shipped/indexed bundle; it does not establish patient-specific anatomy, surgical clearance, pathology, biomechanical force, or clinical validation.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-[10px] text-neutral-500 dark:border-white/10">Select a system and semantic node.</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ZAnatomySystemExplorer
