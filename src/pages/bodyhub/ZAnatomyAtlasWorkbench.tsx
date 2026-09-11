import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  WHOLE_BODY_REGIONS,
  type AtlasLayerKey,
  type AtlasRegionKey,
  type AtlasStructureTarget,
  type GeometryProvenance,
} from '../../lib/wholeBodyAtlasBlueprint'
import {
  anatomySourceNodeOrigin,
  findReviewedAtlasTargetsForSourceSelection,
  getAnatomySourceSelectionSnapshot,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
  subscribeAnatomySourceSelection,
} from '../../lib/anatomySourceNodeRegistry'
import {
  buildAnatomyContextHandoff,
  publishAnatomyContextHandoff,
  type AnatomyContextDestination,
} from '../../lib/anatomyContextHandoff'
import ZAnatomySpatialSourceMap from './ZAnatomySpatialSourceMap'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
  onOpenSurgical?: () => void
  onOpenBiomechanics?: () => void
}

const LAYER_LABEL: Record<AtlasLayerKey, string> = {
  surface: 'Surface',
  skeletal: 'Skeletal',
  muscular: 'Muscular',
  cardiovascular: 'Cardiovascular',
  nervous: 'Nervous',
  visceral: 'Viscera',
  lymphoid: 'Lymphoid',
}

const LAYER_ACCENT: Record<AtlasLayerKey, string> = {
  surface: 'border-rose-300/30 bg-rose-400/[0.06] text-rose-200',
  skeletal: 'border-amber-100/25 bg-amber-50/[0.06] text-amber-100',
  muscular: 'border-red-400/25 bg-red-500/[0.07] text-red-200',
  cardiovascular: 'border-blue-400/25 bg-blue-500/[0.07] text-blue-200',
  nervous: 'border-yellow-300/25 bg-yellow-400/[0.06] text-yellow-100',
  visceral: 'border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-200',
  lymphoid: 'border-violet-400/25 bg-violet-500/[0.06] text-violet-200',
}

const SOURCE_FILE_BY_LAYER: Record<AtlasLayerKey, string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const CREDITED_Z_ANATOMY_BUNDLES = [
  { file: 'skeletal.glb', role: 'Skeletal reference', note: 'System-separated skeletal derivative named in the current anatomy credits.' },
  { file: 'muscular.glb', role: 'Muscular reference', note: 'System-separated muscular derivative named in the current anatomy credits.' },
  { file: 'cardiovascular.glb', role: 'Cardiovascular reference', note: 'System-separated cardiovascular derivative named in the current anatomy credits.' },
  { file: 'nervous.glb', role: 'Nervous reference', note: 'System-separated nervous derivative named in the current anatomy credits.' },
  { file: 'visceral.glb', role: 'Visceral reference', note: 'System-separated visceral derivative named in the current anatomy credits.' },
] as const

const PROVENANCE_TEXT: Record<GeometryProvenance, string> = {
  'native-geometry': 'Native source geometry',
  'adjacent-geometry': 'Adjacent / partial geometry',
  'not-represented': 'Not directly represented',
}

type GeometryVerificationState = 'runtime' | 'indexed' | 'not-represented'

const GEOMETRY_VERIFICATION: Record<GeometryVerificationState, { label: string; detail: string; tone: string }> = {
  runtime: {
    label: 'Runtime geometry loaded',
    detail: 'This source layer is mounted in the shared WebGL scene. Resolved names below come from the live GLB nodes currently available to selection and highlighting.',
    tone: 'border-brand/25 bg-brand/[0.06] text-brand',
  },
  indexed: {
    label: 'Indexed source available',
    detail: 'The shipped GLB metadata contains source-node names for this layer, but the layer is not mounted yet. Load it to verify selection against runtime node names.',
    tone: 'border-blue-300/30 bg-blue-500/[0.05] text-blue-600 dark:text-blue-300',
  },
  'not-represented': {
    label: 'No direct source geometry',
    detail: 'This reviewed teaching target is intentionally marked as not directly represented. Panacea keeps that absence explicit instead of synthesizing a substitute mesh.',
    tone: 'border-amber-300/30 bg-amber-500/[0.05] text-amber-700 dark:text-amber-200',
  },
}

function structureKey(region: AtlasRegionKey, structure: AtlasStructureTarget) {
  return `${region}:${structure.id}`
}

export function ZAnatomyAtlasWorkbench({ onHighlight, onFocusRegion, onEnableLayer, onOpenSurgical, onOpenBiomechanics }: Props) {
  const entries = useMemo(() => WHOLE_BODY_REGIONS.flatMap((region) =>
    region.structures.map((structure) => ({ region, structure, key: structureKey(region.key, structure) }))), [])
  const [query, setQuery] = useState('')
  const [regionKey, setRegionKey] = useState<AtlasRegionKey>('thorax')
  const [selectedKey, setSelectedKey] = useState(() => structureKey('thorax', WHOLE_BODY_REGIONS.find((r) => r.key === 'thorax')?.structures[0] ?? WHOLE_BODY_REGIONS[0].structures[0]))
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )
  const viewerSelection = useSyncExternalStore(
    subscribeAnatomySourceSelection,
    getAnatomySourceSelectionSnapshot,
    getAnatomySourceSelectionSnapshot,
  )
  const viewerTargets = useMemo(
    () => findReviewedAtlasTargetsForSourceSelection(viewerSelection),
    [viewerSelection.name, viewerSelection.file, viewerSelection.revision],
  )
  const viewerResolved = viewerTargets.length === 1 ? viewerTargets[0] : null

  // A viewer tap may change the reviewed atlas target only when correspondence
  // is unique. Ambiguous source meshes remain highlighted in the viewer without
  // silently choosing between clinically different teaching contexts.
  useEffect(() => {
    if (!viewerResolved) return
    setRegionKey(viewerResolved.region)
    setSelectedKey(viewerResolved.key)
    setQuery('')
  }, [viewerResolved, viewerSelection.revision])

  const selected = entries.find((entry) => entry.key === selectedKey) ?? entries[0]
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filtered = entries.filter(({ region, structure }) => {
    if (region.key !== regionKey) return false
    if (!normalizedQuery) return true
    return [structure.label, structure.layer, structure.level, structure.clinicalWhy, ...structure.nodeHints]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  })

  const layerCounts = useMemo(() => {
    const counts = new Map<AtlasLayerKey, number>()
    for (const { structure } of entries) counts.set(structure.layer, (counts.get(structure.layer) ?? 0) + 1)
    return counts
  }, [entries])

  function matchesFor(structure: AtlasStructureTarget) {
    if (structure.provenance === 'not-represented') return []
    const expectedFile = SOURCE_FILE_BY_LAYER[structure.layer]
    return resolveAllAnatomySourceNodes(
      structure.nodeHints,
      sourceBundles.filter((bundle) => bundle.file === expectedFile),
    )
  }

  function exactNamesFor(structure: AtlasStructureTarget) {
    return [...new Set(matchesFor(structure).flatMap((match) => match.names))]
  }

  const sourceMatches = selected ? matchesFor(selected.structure) : []
  const selectedExactNames = selected ? exactNamesFor(selected.structure) : []
  const selectedHandoff = selected
    ? buildAnatomyContextHandoff(selected.region.key, selected.structure, selectedExactNames)
    : null
  const sourceNameCount = sourceBundles.reduce((total, bundle) => total + bundle.names.length, 0)
  const runtimeBundleCount = sourceBundles.filter((bundle) => anatomySourceNodeOrigin(bundle.file) === 'runtime').length
  const selectedSourceFile = selected ? SOURCE_FILE_BY_LAYER[selected.structure.layer] : ''
  const selectedSourceBundle = selectedSourceFile
    ? sourceBundles.find((bundle) => bundle.file === selectedSourceFile)
    : undefined
  const selectedGeometryState: GeometryVerificationState = selected?.structure.provenance === 'not-represented'
    ? 'not-represented'
    : selectedSourceFile && anatomySourceNodeOrigin(selectedSourceFile) === 'runtime'
      ? 'runtime'
      : 'indexed'
  const selectedGeometryVerification = GEOMETRY_VERIFICATION[selectedGeometryState]
  const inspectLabel = selectedGeometryState === 'runtime'
    ? 'Inspect loaded source geometry →'
    : selectedGeometryState === 'indexed'
      ? 'Load layer & verify geometry →'
      : 'Frame reviewed region →'

  function inspect(region: AtlasRegionKey, structure: AtlasStructureTarget, focus = true) {
    setRegionKey(region)
    setSelectedKey(structureKey(region, structure))
    onEnableLayer?.(structure.layer)
    const exactNames = exactNamesFor(structure)
    onHighlight?.(exactNames)
    if (focus) onFocusRegion?.(exactNames.length ? exactNames : structure.nodeHints)
  }

  function inspectExact(structure: AtlasStructureTarget, name: string) {
    onEnableLayer?.(structure.layer)
    onHighlight?.([name])
    onFocusRegion?.([name])
  }

  function inspectRegion(key: AtlasRegionKey) {
    const region = WHOLE_BODY_REGIONS.find((item) => item.key === key)
    if (!region) return
    setRegionKey(key)
    const first = region.structures[0]
    if (first) setSelectedKey(structureKey(key, first))
    const hints = [...new Set(region.structures.flatMap((structure) => structure.nodeHints))]
    for (const layer of new Set(region.structures.map((structure) => structure.layer))) onEnableLayer?.(layer)
    // A region is broader than one evidence-bearing mesh. Clear exact structure
    // highlighting and use reviewed hints only for camera framing.
    onHighlight?.([])
    onFocusRegion?.(hints)
  }

  function openMappedContext(destination: AnatomyContextDestination) {
    if (!selected || !selectedHandoff) return
    if (destination === 'surgery' && !selectedHandoff.surgicalScenarioId) return
    if (destination === 'biomechanics' && !selectedHandoff.movementJointId) return
    publishAnatomyContextHandoff(selectedHandoff, destination)
    if (destination === 'surgery') onOpenSurgical?.()
    else onOpenBiomechanics?.()
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(0,191,99,0.18),transparent_42%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.15),transparent_38%)] p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-brand">Z-Anatomy source geometry · shared Panacea 3D viewer</div>
            <h4 className="mt-2 max-w-2xl text-2xl font-black tracking-tight">Explore source anatomy as layers, regions and named structures—not as a decorative body model.</h4>
            <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-neutral-400">This workbench controls the existing Body Exposure viewer. It reuses the Z-Anatomy / BodyParts3D-derived source geometry explicitly credited in Panacea, then routes structure selection into the same highlighting and camera-focus system used by biomechanics and surgery.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[9px] font-black text-brand">Z-Anatomy</span>
              <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-[9px] font-black text-blue-200">BodyParts3D lineage</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black text-neutral-300">CC BY-SA 4.0 derivative bundle</span>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/30 p-4 lg:border-l lg:border-t-0">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500">Scientific boundary</div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-300">Atlas geometry is a generic educational reference, not patient-specific anatomy. Missing structures are not synthesized. Adjacent or partial geometry remains explicitly labelled instead of being promoted to native anatomy.</p>
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-[9px] leading-relaxed text-amber-100">Selection changes visibility/highlighting and camera focus only. It does not imply surgical clearance, pathology, force, tissue strain, or a patient-specific safe corridor.</div>
          </div>
        </div>
      </section>

      <ZAnatomySpatialSourceMap
        onHighlight={onHighlight}
        onFocusRegion={onFocusRegion}
        onEnableLayer={onEnableLayer}
      />

      {viewerSelection.name && (
        <section aria-live="polite" className="rounded-2xl border border-brand/20 bg-brand/[0.035] p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-brand">Viewer → reviewed atlas sync</div>
              <div className="mt-1 break-words font-mono text-[10px] font-black text-ink dark:text-white">{viewerSelection.name}</div>
              <div className="mt-1 font-mono text-[8px] text-neutral-400">{viewerSelection.file ?? 'source layer not resolved'}</div>
            </div>
            {viewerResolved ? (
              <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[8px] font-black text-brand">Unique reviewed mapping</span>
            ) : viewerTargets.length > 1 ? (
              <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[8px] font-black text-amber-700 dark:text-amber-200">Ambiguous · {viewerTargets.length} targets</span>
            ) : (
              <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-[8px] font-black text-neutral-500 dark:border-white/15">Exact source node only</span>
            )}
          </div>
          {viewerResolved ? (
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">This exact GLB node maps uniquely to <span className="font-bold text-ink dark:text-white">{viewerResolved.label}</span>. The Workbench region and selected teaching target have been synchronized automatically; the source mesh itself remains the evidence-bearing geometry.</p>
          ) : viewerTargets.length > 1 ? (
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">The exact mesh name overlaps multiple reviewed teaching targets ({viewerTargets.map((target) => target.label).join(', ')}). Panacea keeps the viewer highlight but does not guess which clinical context you intended.</p>
          ) : (
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">The source node is real and remains selected in the 3D viewer, but no unique reviewed catalogue target is claimed from its name. This is a mapping limitation, not evidence that the anatomy is absent.</p>
          )}
        </section>
      )}

      <section className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Anatomy systems</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(LAYER_LABEL) as AtlasLayerKey[]).map((layer) => (
                <button key={layer} type="button" onClick={() => onEnableLayer?.(layer)} className={`min-h-12 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 ${LAYER_ACCENT[layer]}`}>
                  <div className="text-[10px] font-black">{LAYER_LABEL[layer]}</div>
                  <div className="mt-1 text-[8px] opacity-70">{layerCounts.get(layer) ?? 0} catalogue targets</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Counts describe Panacea catalogue targets, not the number of meshes inside a GLB.</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Body region</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {WHOLE_BODY_REGIONS.map((region) => (
                <button key={region.key} type="button" aria-pressed={regionKey === region.key} onClick={() => inspectRegion(region.key)} className={`min-h-11 rounded-xl border px-2 py-2 text-left text-[9px] font-black transition ${regionKey === region.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'}`}>{region.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <label className="block text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400" htmlFor="z-anatomy-structure-search">Structure finder</label>
            <input id="z-anatomy-structure-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${WHOLE_BODY_REGIONS.find((r) => r.key === regionKey)?.label ?? 'region'} structures…`} className="mt-2 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-xs text-ink outline-none transition focus:border-brand dark:border-white/10 dark:text-white" />
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {filtered.map(({ region, structure, key }) => (
                <button key={key} type="button" onClick={() => inspect(region.key, structure, false)} className={`rounded-xl border p-3 text-left transition ${selected?.key === key ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 hover:border-brand/40 dark:border-white/10'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-ink dark:text-white">{structure.label}</span>
                    <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[8px] font-bold text-neutral-500 dark:border-white/10">{LAYER_LABEL[structure.layer]}</span>
                  </div>
                  <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{PROVENANCE_TEXT[structure.provenance]} · {structure.level}</div>
                </button>
              ))}
            </div>
            {!filtered.length && <div className="mt-3 rounded-xl border border-dashed border-neutral-200 p-4 text-center text-[10px] text-neutral-500 dark:border-white/10">No represented catalogue target matches this search in the selected region.</div>}
          </div>

          {selected && (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
              <div className="grid gap-0 md:grid-cols-[1fr_0.8fr]">
                <div className="p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Selected structure</div>
                  <h5 className="mt-1 text-lg font-black text-ink dark:text-white">{selected.structure.label}</h5>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{selected.region.label}</span>
                    <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{LAYER_LABEL[selected.structure.layer]}</span>
                    <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{PROVENANCE_TEXT[selected.structure.provenance]}</span>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">{selected.structure.clinicalWhy}</p>
                  <div aria-live="polite" className={`mt-3 rounded-xl border p-3 ${selectedGeometryVerification.tone}`}>
                    <div className="text-[8px] font-black uppercase tracking-[0.15em] opacity-70">Geometry verification</div>
                    <div className="mt-1 text-[11px] font-black">{selectedGeometryVerification.label}</div>
                    <p className="mt-1 text-[9px] leading-relaxed opacity-80">{selectedGeometryVerification.detail}</p>
                    {selectedGeometryState !== 'not-represented' && (
                      <div className="mt-2 font-mono text-[8px] opacity-75">{selectedSourceFile} · {(selectedSourceBundle?.names.length ?? 0).toLocaleString()} {selectedGeometryState === 'runtime' ? 'runtime' : 'indexed'} source-node names</div>
                    )}
                    {selectedGeometryState === 'not-represented' && (
                      <div className="mt-2 text-[8px] font-bold opacity-75">Reviewed catalogue target · no substitute mesh</div>
                    )}
                  </div>
                  <button type="button" onClick={() => inspect(selected.region.key, selected.structure, true)} className="mt-3 min-h-11 rounded-full bg-brand px-4 text-[10px] font-black text-white shadow-lg shadow-brand/20">{inspectLabel}</button>
                  {selectedHandoff && (selectedHandoff.surgicalScenarioId || selectedHandoff.movementJointId) && (
                    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                      <div className="text-[8px] font-black uppercase tracking-[0.15em] text-neutral-400">Curated teaching handoff</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedHandoff.surgicalScenarioId && (
                          <button type="button" onClick={() => openMappedContext('surgery')} className="min-h-10 rounded-full border border-red-300 px-3 text-[9px] font-black text-red-600 transition hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:text-red-300">Open mapped surgical anatomy →</button>
                        )}
                        {selectedHandoff.movementJointId && (
                          <button type="button" onClick={() => openMappedContext('biomechanics')} className="min-h-10 rounded-full border border-blue-300 px-3 text-[9px] font-black text-blue-600 transition hover:bg-blue-500 hover:text-white dark:border-blue-500/30 dark:text-blue-300">Continue in biomechanics →</button>
                        )}
                      </div>
                      <p className="mt-2 text-[8.5px] leading-relaxed text-neutral-500">Routes are explicit repository mappings. They are not inferred from mesh-name similarity, do not establish qualified human review, and do not turn generic atlas geometry into a patient-specific procedural model.</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.02] md:border-l md:border-t-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Geometry lookup hints</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{selected.structure.nodeHints.map((hint) => <span key={hint} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 font-mono text-[8px] text-neutral-500 dark:border-white/10 dark:bg-neutral-950">{hint}</span>)}</div>
                  <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">These are source-node lookup hints used to locate evidence-bearing geometry in the shared atlas. They are not additional anatomical claims.</p>

                  <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Source-node matches</div>
                      <span className="text-[8px] font-bold text-neutral-400">{runtimeBundleCount ? `${runtimeBundleCount} runtime bundles` : 'GLB index fallback'} · {sourceNameCount} names</span>
                    </div>
                    {sourceMatches.length ? (
                      <div className="mt-2 space-y-2">
                        {sourceMatches.map((match) => (
                          <div key={`${match.file}:${match.hint}`} className="rounded-xl border border-brand/20 bg-brand/[0.04] p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-mono text-[8px] font-black text-brand">{match.file}</span>
                              <span className="text-[8px] text-neutral-400">{anatomySourceNodeOrigin(match.file) === 'runtime' ? 'loaded runtime' : 'generated GLB index'} · hint: {match.hint}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {match.names.map((name) => (
                                <button key={`${match.file}:${name}`} type="button" onClick={() => inspectExact(selected.structure, name)} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 font-mono text-[8px] text-neutral-600 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">{name}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <p className="text-[8.5px] leading-relaxed text-neutral-500">Exact names come from the loaded runtime bundle when available; otherwise they come from <span className="font-mono">bodyIndex.gen.ts</span>, generated from shipped GLB metadata. An indexed match proves a named source mesh exists in the bundle, not that its layer is currently loaded or that the mesh is complete, clinically validated, or patient-specific.</p>
                      </div>
                    ) : (
                      <p className="mt-2 rounded-xl border border-dashed border-neutral-200 p-2.5 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10">No direct source-node name match was found for this reviewed target. This is a naming-resolution result—not evidence that the anatomical structure is absent. No substitute geometry is highlighted.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Credited Z-Anatomy derivative bundles</div><div className="mt-1 text-sm font-black text-ink dark:text-white">GLB files explicitly named by the current anatomy attribution</div></div>
          <div className="text-[9px] font-bold text-neutral-500">No second renderer · no remote embed</div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CREDITED_Z_ANATOMY_BUNDLES.map((asset) => (
            <div key={asset.file} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="font-mono text-[9px] font-black text-brand">/anatomy/{asset.file}</div>
              <div className="mt-1 text-[10px] font-black text-ink dark:text-white">{asset.role}</div>
              <div className="mt-1 text-[9px] leading-relaxed text-neutral-500">{asset.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Attribution is preserved in <span className="font-mono">public/anatomy/CREDITS.txt</span>: Z-Anatomy source, BodyParts3D upstream lineage, and CC BY-SA 4.0 derivative licensing. Other viewer layers are not assigned new provenance here unless their attribution is explicitly documented.</p>
      </section>
    </div>
  )
}

export default ZAnatomyAtlasWorkbench
