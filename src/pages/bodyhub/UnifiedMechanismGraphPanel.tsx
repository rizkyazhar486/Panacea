import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_UNIFIED_MECHANISM_GRAPH,
  BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY,
  atlasSystemGraphNodeId,
  getUnifiedMechanismNeighborhood,
  getUnifiedMechanismNode,
  listUnifiedMechanismNodesByKind,
  traceUnifiedMechanismRoute,
  type UnifiedMechanismEdgeKind,
  type UnifiedMechanismNodeKind,
} from '../../lib/bodyUnifiedMechanismGraph'

const NODE_LABELS: Record<UnifiedMechanismNodeKind, string> = {
  'atlas-system': 'Anatomy',
  'physiology-system': 'Physiology',
  'pathophysiology-scenario': 'Disease network',
  'pathophysiology-step': 'Disease step',
  'pharmacology-class': 'Drug class',
  'pharmacology-step': 'Drug mechanism',
}

const NODE_CLASS: Record<UnifiedMechanismNodeKind, string> = {
  'atlas-system': 'border-cyan-300/20 bg-cyan-300/[.055] text-cyan-100',
  'physiology-system': 'border-emerald-300/20 bg-emerald-300/[.05] text-emerald-100',
  'pathophysiology-scenario': 'border-rose-300/20 bg-rose-300/[.05] text-rose-100',
  'pathophysiology-step': 'border-orange-200/15 bg-orange-200/[.045] text-orange-50',
  'pharmacology-class': 'border-violet-300/20 bg-violet-300/[.05] text-violet-100',
  'pharmacology-step': 'border-fuchsia-300/15 bg-fuchsia-300/[.045] text-fuchsia-100',
}

const EDGE_LABELS: Record<UnifiedMechanismEdgeKind, string> = {
  'maps-to': 'maps to',
  'couples-to': 'couples to',
  'participates-in': 'participates in',
  contains: 'contains',
  'progresses-to': 'progresses to',
  'acts-through': 'acts through',
  'mechanistically-intersects': 'intersects',
}

interface UnifiedMechanismGraphPanelProps {
  selectedAtlasSystemId: BodySystemId
}

export function UnifiedMechanismGraphPanel({ selectedAtlasSystemId }: UnifiedMechanismGraphPanelProps) {
  const seedId = atlasSystemGraphNodeId(selectedAtlasSystemId)
  const [depth, setDepth] = useState(2)
  const [targetId, setTargetId] = useState('pathophysiology:atherosclerosis')

  const neighborhood = useMemo(() => getUnifiedMechanismNeighborhood(seedId, depth), [seedId, depth])
  const route = useMemo(() => traceUnifiedMechanismRoute(seedId, targetId), [seedId, targetId])
  const target = getUnifiedMechanismNode(targetId)

  const destinations = useMemo(
    () => [
      ...listUnifiedMechanismNodesByKind('pathophysiology-scenario'),
      ...listUnifiedMechanismNodesByKind('pharmacology-class'),
    ],
    [],
  )

  const routeNodes = route?.nodeIds.map((id) => getUnifiedMechanismNode(id)) ?? []
  const routeEdges = route?.edgeIds
    .map((id) => BODY_UNIFIED_MECHANISM_GRAPH.edges.find((edge) => edge.id === id))
    .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge)) ?? []

  const nodeCounts = useMemo(() => {
    const counts = new Map<UnifiedMechanismNodeKind, number>()
    for (const node of BODY_UNIFIED_MECHANISM_GRAPH.nodes) counts.set(node.kind, (counts.get(node.kind) ?? 0) + 1)
    return counts
  }, [])

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-black/60 p-3 shadow-[0_28px_100px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-4 lg:p-5"
      aria-labelledby="unified-mechanism-graph-title"
    >
      <div className="pointer-events-none absolute -left-16 top-1/4 h-44 w-44 rounded-full bg-cyan-500/[.045] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[3%] top-0 h-48 w-48 rounded-full bg-violet-500/[.045] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[45%] h-36 w-36 rounded-full bg-fuchsia-500/[.035] blur-3xl" aria-hidden />

      <header className="relative grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)] xl:items-end">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-100/80">Unified Mechanism Graph</span>
            <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-white/45">anatomy → systems → disease → drug biology</span>
            <span className="rounded-full border border-amber-200/10 bg-amber-200/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-amber-50/55">graph ≠ clinical score</span>
          </div>
          <h3 id="unified-mechanism-graph-title" className="mt-2 text-xl font-black tracking-[-.03em] text-white sm:text-2xl lg:text-3xl">
            Navigate the body as one connected knowledge graph.
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/52">
            The graph is compiled only from the atlas, physiology bridge, pathophysiology cascades, pharmacology mechanisms and curated causal intersections already present in Body Exposure. No new clinical relationship is invented by the graph runtime.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-3">
          {(['atlas-system', 'physiology-system', 'pathophysiology-scenario', 'pathophysiology-step', 'pharmacology-class', 'pharmacology-step'] as UnifiedMechanismNodeKind[]).map((kind) => (
            <div key={kind} className="rounded-2xl border border-white/[.065] bg-white/[.022] px-2.5 py-2.5 text-center">
              <div className="text-base font-black text-white/85">{nodeCounts.get(kind) ?? 0}</div>
              <div className="mt-0.5 text-[8px] font-black uppercase tracking-[.09em] text-white/30">{NODE_LABELS[kind]}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
        <aside className="rounded-[24px] border border-white/[.07] bg-white/[.022] p-3.5">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Exploration controls</div>

          <div className="mt-3 rounded-[18px] border border-cyan-300/10 bg-cyan-300/[.025] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.13em] text-cyan-100/55">Live atlas seed</div>
            <div className="mt-1 text-sm font-black text-white/82">{neighborhood.seed.label}</div>
            <div className="mt-1 text-[10px] font-medium leading-relaxed text-white/38">{neighborhood.seed.subtitle}</div>
          </div>

          <label className="mt-3 block">
            <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/35">Neighborhood depth</span>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={depth === value}
                  onClick={() => setDepth(value)}
                  className={`min-h-[40px] rounded-xl border text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${depth === value ? 'border-cyan-300/20 bg-cyan-300/[.08] text-cyan-50' : 'border-white/[.06] bg-black/25 text-white/40 hover:bg-white/[.04] hover:text-white/70'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </label>

          <label className="mt-3 block">
            <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/35">Trace destination</span>
            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/[.08] bg-black/60 px-3 text-xs font-bold text-white/75 outline-none transition focus:border-cyan-300/25 focus:ring-2 focus:ring-cyan-300/20"
            >
              <optgroup label="Pathophysiology networks">
                {destinations.filter((node) => node.kind === 'pathophysiology-scenario').map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </optgroup>
              <optgroup label="Pharmacology mechanisms">
                {destinations.filter((node) => node.kind === 'pharmacology-class').map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/[.06] bg-black/25 p-2">
              <div className="text-sm font-black text-white/80">{neighborhood.nodes.length}</div>
              <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">nearby nodes</div>
            </div>
            <div className="rounded-xl border border-white/[.06] bg-black/25 p-2">
              <div className="text-sm font-black text-white/80">{neighborhood.edges.length}</div>
              <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">local edges</div>
            </div>
            <div className="rounded-xl border border-white/[.06] bg-black/25 p-2">
              <div className="text-sm font-black text-white/80">{route ? route.edgeIds.length : '—'}</div>
              <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">route hops</div>
            </div>
          </div>
        </aside>

        <div className="grid gap-3">
          <article className="rounded-[24px] border border-white/[.07] bg-black/30 p-3.5 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.15em] text-fuchsia-100/55">Shortest navigational route</div>
                <div className="mt-1 text-sm font-black text-white/82">{neighborhood.seed.label} → {target.label}</div>
              </div>
              <div className="rounded-full border border-white/[.07] bg-white/[.025] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] text-white/38">
                undirected exploration
              </div>
            </div>

            {route ? (
              <div className="mt-3 overflow-x-auto pb-1">
                <div className="flex min-w-max items-stretch gap-1.5">
                  {routeNodes.map((node, index) => (
                    <div key={`${node.id}-${index}`} className="flex items-center gap-1.5">
                      <div className={`w-44 rounded-[18px] border p-2.5 ${NODE_CLASS[node.kind]}`}>
                        <div className="text-[8px] font-black uppercase tracking-[.1em] opacity-60">{NODE_LABELS[node.kind]}</div>
                        <div className="mt-1 text-[10px] font-black leading-snug">{node.label}</div>
                        <div className="mt-1 line-clamp-2 text-[8px] font-medium leading-relaxed opacity-50">{node.subtitle}</div>
                      </div>
                      {index < routeEdges.length && (
                        <div className="w-24 shrink-0 text-center">
                          <div className="text-[8px] font-black uppercase tracking-[.08em] text-white/28">{EDGE_LABELS[routeEdges[index].kind]}</div>
                          <div className="mt-1 flex items-center" aria-hidden>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/[.06] to-white/20" />
                            <span className="text-[10px] text-white/25">◇</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-white/[.06]" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-white/[.06] bg-white/[.02] p-3 text-xs font-semibold text-white/35">
                No curated route exists between these nodes in the current graph wave. The explorer leaves the route absent rather than inventing a connection.
              </div>
            )}

            {route && routeEdges.length > 0 && (
              <details className="mt-3 rounded-2xl border border-white/[.06] bg-white/[.018] p-3">
                <summary className="cursor-pointer text-[9px] font-black uppercase tracking-[.13em] text-white/40">Why these edges exist</summary>
                <div className="mt-2 grid gap-2">
                  {routeEdges.map((edge, index) => (
                    <div key={edge.id} className="rounded-xl border border-white/[.05] bg-black/20 p-2.5">
                      <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/28">Hop {index + 1} · {EDGE_LABELS[edge.kind]}</div>
                      <div className="mt-0.5 text-[10px] font-bold text-white/58">{edge.label}</div>
                      <p className="mt-1 text-[9px] font-medium leading-relaxed text-white/30">{edge.note}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </article>

          <article className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-100/55">Local neighborhood</div>
                <div className="mt-1 text-xs font-black text-white/72">Depth {depth} around {neighborhood.seed.label}</div>
              </div>
              <span className="text-[9px] font-bold text-white/28">tap-free overview</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {neighborhood.nodes.map((node) => (
                <div key={node.id} className={`rounded-[18px] border p-2.5 ${NODE_CLASS[node.kind]}`}>
                  <div className="text-[8px] font-black uppercase tracking-[.1em] opacity-55">{NODE_LABELS[node.kind]}</div>
                  <div className="mt-1 text-[10px] font-black leading-snug">{node.label}</div>
                  <div className="mt-1 line-clamp-2 text-[8px] font-medium leading-relaxed opacity-45">{node.subtitle}</div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-white/[.065] bg-white/[.02] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">Graph cardinality</div>
          <div className="mt-1 text-sm font-black text-white/75">{BODY_UNIFIED_MECHANISM_GRAPH.nodes.length} nodes · {BODY_UNIFIED_MECHANISM_GRAPH.edges.length} edges</div>
        </div>
        <div className="rounded-[18px] border border-white/[.065] bg-white/[.02] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">Route algorithm</div>
          <div className="mt-1 font-mono text-[10px] font-black text-cyan-100/65">BFS shortest hops</div>
          <div className="mt-1 text-[8px] font-medium text-white/28">navigation distance only</div>
        </div>
        <div className="rounded-[18px] border border-white/[.065] bg-white/[.02] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">Depth bound</div>
          <div className="mt-1 font-mono text-[10px] font-black text-violet-100/65">d = clamp(⌊d⌋, 0, 3)</div>
          <div className="mt-1 text-[8px] font-medium text-white/28">UI traversal limit, not biology</div>
        </div>
      </div>

      <p className="relative mt-3 rounded-[20px] border border-amber-200/10 bg-amber-200/[.03] px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-amber-50/45">
        {BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY}
      </p>
    </section>
  )
}

export default UnifiedMechanismGraphPanel
