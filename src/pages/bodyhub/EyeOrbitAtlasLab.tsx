import { useMemo, useState } from 'react'
import { EYE_ATLAS_LAYER_ORDER, EYE_ATLAS_SOURCES, type EyeAtlasLayer, type EyeGeometryStatus } from '../../lib/eyeOrbitAtlas'
import { RESOLVED_EYE_ORBIT_ATLAS, resolvedEyeAtlasByLayer, resolvedEyeAtlasCoverage } from '../../lib/eyeOrbitAtlasResolved'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
}

const LAYER_LABEL: Record<EyeAtlasLayer, string> = {
  orbit: 'Orbit', adnexa: 'Adnexa & EOM', globe: 'Globe', 'anterior-segment': 'Anterior segment', uvea: 'Uvea', lens: 'Lens', vitreous: 'Vitreous', retina: 'Retina', 'optic-pathway': 'Visual pathway', vascular: 'Vascular', innervation: 'Innervation', microanatomy: 'Microanatomy',
}

const GEOMETRY_LABEL: Record<EyeGeometryStatus, string> = {
  'native-or-source-match-required': 'Source geometry required',
  'teaching-overlay-only': 'Teaching overlay only',
  'not-represented': 'Not represented',
}

export default function EyeOrbitAtlasLab({ onHighlight, onFocusRegion }: Props) {
  const [layer, setLayer] = useState<EyeAtlasLayer>('orbit')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('orbit')
  const coverage = resolvedEyeAtlasCoverage()
  const selected = RESOLVED_EYE_ORBIT_ATLAS.find((node) => node.id === selectedId) ?? RESOLVED_EYE_ORBIT_ATLAS[0]
  const normalized = query.trim().toLowerCase()
  const visible = useMemo(() => resolvedEyeAtlasByLayer(layer).filter((node) => {
    if (!normalized) return true
    return [node.label, node.function, node.relations.join(' '), node.innervation?.join(' ') ?? '', node.bloodSupply?.join(' ') ?? '', node.nodeHints.join(' ')].join(' ').toLowerCase().includes(normalized)
  }), [layer, normalized])

  function inspect(id: string) {
    const node = RESOLVED_EYE_ORBIT_ATLAS.find((item) => item.id === id)
    if (!node) return
    setSelectedId(id)
    onHighlight?.(node.geometry === 'native-or-source-match-required' ? node.nodeHints : [])
    onFocusRegion?.(node.nodeHints)
  }

  return (
    <div className="space-y-4" data-eye-orbit-atlas="wave1">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,.18),transparent_38%),radial-gradient(circle_at_95%_20%,rgba(0,191,99,.16),transparent_42%)] p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-brand">Ophthalmology · eye & orbit deep atlas</div>
            <h4 className="mt-2 text-2xl font-black tracking-tight">Orbit → globe → retina → optic pathway. One anatomy chain, no skipped layers.</h4>
            <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-400">This module separates orbital walls and foramina, ocular coats and chambers, aqueous outflow, uvea, lens/zonules, vitreous, retinal cellular chain, extraocular muscles, lacrimal system, vessels, cranial nerves and the post-retinal visual pathway. Generic educational anatomy only.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-xl">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] text-neutral-500">Nodes</div><div className="text-xl font-black">{coverage.nodes}</div></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] text-neutral-500">Layers</div><div className="text-xl font-black">{coverage.layers}</div></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] text-neutral-500">Sources</div><div className="text-xl font-black">{EYE_ATLAS_SOURCES.length}</div></div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/30 p-4 lg:border-l lg:border-t-0">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500">Fail-closed geometry rule</div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-300">A label does not prove a mesh exists. Native/source geometry is highlighted only when a source-node match is expected; histologic and microscopic structures remain teaching overlays instead of fabricated 3D anatomy.</p>
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-[9px] leading-relaxed text-amber-100">No patient-specific diagnosis, visual-field inference, surgical clearance, retinal grading or treatment recommendation is produced from this atlas.</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Anatomical layer stack</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {EYE_ATLAS_LAYER_ORDER.map((key) => (
            <button key={key} type="button" aria-pressed={layer === key} onClick={() => setLayer(key)} className={`min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black ${layer === key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>
              {LAYER_LABEL[key]} · {resolvedEyeAtlasByLayer(key).length}
            </button>
          ))}
        </div>
        <input aria-label="Search eye anatomy" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${LAYER_LABEL[layer]} structures, relations, nerves or vessels…`} className="mt-3 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-xs text-ink outline-none focus:border-brand dark:border-white/10 dark:text-white" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {visible.map((node) => (
            <button key={node.id} type="button" onClick={() => inspect(node.id)} className={`rounded-2xl border p-3 text-left transition ${selected.id === node.id ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 hover:border-brand/40 dark:border-white/10'}`}>
              <div className="flex items-start justify-between gap-2"><span className="text-xs font-black text-ink dark:text-white">{node.label}</span><span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[8px] font-bold text-neutral-500 dark:border-white/10">{node.level}</span></div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{node.function}</p>
              <div className="mt-2 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{GEOMETRY_LABEL[node.geometry]}</div>
            </button>
          ))}
          {!visible.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-[10px] text-neutral-500 dark:border-white/10">No structure in this layer matches the search.</div>}
        </div>

        <article className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Selected structure</div>
          <h5 className="mt-1 text-xl font-black text-ink dark:text-white">{selected.label}</h5>
          <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{LAYER_LABEL[selected.layer]}</span><span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{GEOMETRY_LABEL[selected.geometry]}</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Function</div><p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.function}</p></div>
            <div><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Relations</div><p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.relations.join(' · ')}</p></div>
            {selected.bloodSupply?.length ? <div><div className="text-[9px] font-black uppercase tracking-wide text-red-500">Blood supply</div><p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.bloodSupply.join(' · ')}</p></div> : null}
            {selected.innervation?.length ? <div><div className="text-[9px] font-black uppercase tracking-wide text-amber-500">Innervation</div><p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.innervation.join(' · ')}</p></div> : null}
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">{selected.clinicalBoundary}</div>
          <button type="button" onClick={() => inspect(selected.id)} className="mt-3 min-h-11 rounded-full border border-brand px-4 text-[10px] font-black text-brand transition hover:bg-brand hover:text-white">Focus source geometry / region</button>
        </article>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Evidence & provenance</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {EYE_ATLAS_SOURCES.map((source) => <div key={source.id} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[10px] font-black text-ink dark:text-white">{source.title}</div><div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{source.kind}</div><p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{source.boundary}</p><a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[9px] font-black text-brand underline">Open source ↗</a></div>)}
        </div>
      </section>
    </div>
  )
}
