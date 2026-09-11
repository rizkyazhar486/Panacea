import { useState, useSyncExternalStore } from 'react'
import { URUTAN, WILAYAH, KEDALAMAN, type UrutanLapisan } from '../../lib/dissection'
import { consumeAnatomyContextHandoff } from '../../lib/anatomyContextHandoff'
import {
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import {
  exactSurgicalLayerRiskNodes,
  resolveSurgicalLayerRiskCoverage,
} from '../../lib/surgicalLayerRiskGeometry'
import {
  SURGICAL_SPATIAL_SCENARIOS,
  type SurgicalSpatialCheckpoint,
  type SurgicalSpatialRegion,
} from '../../lib/surgicalSpatialTeaching'
import type { AtlasLayerKey, AtlasRegionKey } from '../../lib/wholeBodyAtlasBlueprint'

export interface SurgicalLabProps {
  onKedalaman?: (kedalaman: number) => void
  onSorot?: (nama: string[]) => void
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

const ATLAS_REGION_BY_SURGICAL_REGION: Record<SurgicalSpatialRegion, AtlasRegionKey> = {
  cardiac: 'thorax',
  abdomen: 'abdomen',
  hand: 'upper-limb',
  knee: 'lower-limb',
}

export function kedalamanUntukLangkah(langkah: number, total: number): number {
  if (total <= 1) return 0
  const bagian = langkah / (total - 1)
  return Math.round(bagian * KEDALAMAN.visceral)
}

export function SurgicalLab({ onKedalaman, onSorot }: SurgicalLabProps) {
  const [incomingHandoff] = useState(() => consumeAnatomyContextHandoff('surgery'))
  const initialSpatial = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === incomingHandoff?.surgicalScenarioId) ?? SURGICAL_SPATIAL_SCENARIOS[0]
  const [kunci, setKunci] = useState<string | null>(null)
  const [langkah, setLangkah] = useState(0)
  const [spatialId, setSpatialId] = useState(initialSpatial.id)
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )
  const dipilih: UrutanLapisan | undefined = URUTAN.find((u) => u.kunci === kunci)
  const lapis = dipilih?.lapis[Math.min(langkah, dipilih.lapis.length - 1)]
  const spatial = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === spatialId) ?? SURGICAL_SPATIAL_SCENARIOS[0]
  const incomingExactNames = incomingHandoff ? [...incomingHandoff.resolvedNodeNames] : []
  const layerRiskCoverage = resolveSurgicalLayerRiskCoverage(
    lapis?.bahaya ?? [],
    dipilih?.wilayah,
    sourceBundles,
  )
  const exactLayerRiskNames = exactSurgicalLayerRiskNodes(
    lapis?.bahaya ?? [],
    dipilih?.wilayah,
    sourceBundles,
  )

  function exactCheckpointNames(region: SurgicalSpatialRegion, checkpoint: SurgicalSpatialCheckpoint) {
    const allowedFiles = new Set(checkpoint.layerHints.map((layer) => SOURCE_FILE_BY_LAYER[layer]))
    const layerBundles = sourceBundles.filter((bundle) => allowedFiles.has(bundle.file))
    const regionalBundles = filterAnatomySourceBundlesForAtlasRegion(
      layerBundles,
      ATLAS_REGION_BY_SURGICAL_REGION[region],
    )
    return [...new Set(
      resolveAllAnatomySourceNodes(checkpoint.nodeHints, regionalBundles)
        .flatMap((match) => match.names),
    )]
  }

  function pilih(u: UrutanLapisan) {
    setKunci(u.kunci)
    setLangkah(0)
    onKedalaman?.(0)
    onSorot?.([])
  }

  function tutupPendekatan() {
    setKunci(null)
    setLangkah(0)
    onKedalaman?.(0)
    onSorot?.([])
  }

  function keLangkah(n: number) {
    if (!dipilih) return
    setLangkah(n)
    onKedalaman?.(kedalamanUntukLangkah(n, dipilih.lapis.length))
    onSorot?.([])
  }

  function highlightIncomingContext() {
    onSorot?.(incomingExactNames)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 text-white dark:border-white/10">
        <div className="border-b border-white/10 bg-gradient-to-br from-brand/15 via-transparent to-blue-500/10 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Spatial surgical anatomy</div>
          <h4 className="mt-1 text-lg font-black">Landmark → neighbor → structure at risk</h4>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">
            Procedure-specific spatial relationships grounded to named anatomy. Existing source meshes are highlighted; missing anatomy stays text-only instead of being fabricated.
          </p>
          {incomingHandoff?.surgicalScenarioId && (
            <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-red-300">From Z-Anatomy · curated surgical route</div>
              <div className="mt-1 text-xs font-black text-white">{incomingHandoff.structureLabel} → {initialSpatial.label}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-400">This one-shot context opens a repository-curated teaching scenario. It does not infer a procedure from mesh names, establish qualified human review, or define a patient-specific safe corridor.</p>
              <button type="button" disabled={!incomingExactNames.length} onClick={highlightIncomingContext} className="mt-2 min-h-10 rounded-full border border-red-300 px-3 text-[9px] font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{incomingExactNames.length ? `Highlight ${incomingExactNames.length} exact source nodes →` : 'No exact source-node match to highlight'}</button>
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {SURGICAL_SPATIAL_SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={spatial.id === item.id}
                onClick={() => { setSpatialId(item.id); onSorot?.([]) }}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${spatial.id === item.id ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-400'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-brand">Orientation</div>
            <div className="mt-1 text-sm font-black">{spatial.label}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{spatial.orientation}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{spatial.purpose}</p>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {spatial.checkpoints.map((checkpoint) => {
              const exactNames = exactCheckpointNames(spatial.region, checkpoint)
              return (
                <button
                  key={checkpoint.id}
                  type="button"
                  onClick={() => onSorot?.(exactNames)}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-black text-white">{checkpoint.label}</div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black ${exactNames.length ? 'border-brand/30 bg-brand/10 text-brand' : 'border-amber-400/20 bg-amber-400/[0.05] text-amber-200'}`}>{exactNames.length ? `${exactNames.length} exact nodes` : 'text-only gap'}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{checkpoint.anatomy}</p>
                  <div className="mt-2 text-[9px] font-black uppercase tracking-wide text-blue-300">Relationships</div>
                  <ul className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-neutral-400">
                    {checkpoint.relationships.map((relationship) => <li key={relationship}>• {relationship}</li>)}
                  </ul>
                  {checkpoint.structuresAtRisk.length > 0 && (
                    <div className="mt-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] p-2">
                      <div className="text-[9px] font-black uppercase tracking-wide text-red-300">Adjacent / at-risk structures</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-neutral-300">{checkpoint.structuresAtRisk.join(' · ')}</div>
                    </div>
                  )}
                  <div className={`mt-2 text-[9px] font-bold ${exactNames.length ? 'text-brand' : 'text-amber-300'}`}>{exactNames.length ? 'Highlight exact represented anatomy in 3D →' : 'No exact regional source mesh · keep this checkpoint text-only'}</div>
                </button>
              )
            })}
          </div>

          <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-[9px] leading-relaxed text-neutral-400">
            <span className="font-black text-amber-300">Geometry boundary. </span>{spatial.geometryBoundary}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Source: {spatial.sourceLabel}</p>
          {spatial.referencePrototype && <p className="mt-1 text-[9px] leading-relaxed text-neutral-600">Reference prototype: {spatial.referencePrototype}</p>}
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-3 dark:border-white/10">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">Layer sequence</div>
        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
          Layer-by-layer approaches in the order a scalpel meets them. Stepping through moves the shared dissection depth; it does not simulate a real operation.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {URUTAN.map((u) => (
          <button
            key={u.kunci}
            type="button"
            onClick={() => (kunci === u.kunci ? tutupPendekatan() : pilih(u))}
            className={`min-h-11 rounded-full px-3 py-1.5 text-[11px] font-bold active:scale-95 ${kunci === u.kunci ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-400'}`}
          >
            {u.judul.split(/[—(:]/)[0].trim()}
          </button>
        ))}
      </div>

      {dipilih && lapis && (
        <>
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="text-sm font-black text-ink dark:text-white">{dipilih.judul}</div>
            <div className="text-[11px] text-neutral-500">{WILAYAH.find((w) => w.kunci === dipilih.wilayah)?.label ?? dipilih.wilayah}</div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400"><b>Landmark.</b> {dipilih.patokan}</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => keLangkah(Math.max(0, langkah - 1))} disabled={langkah === 0} className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95">← Back</button>
            <div className="flex-1 text-center text-[11px] font-bold text-neutral-500">Layer {langkah + 1} of {dipilih.lapis.length}</div>
            <button type="button" onClick={() => keLangkah(Math.min(dipilih.lapis.length - 1, langkah + 1))} disabled={langkah === dipilih.lapis.length - 1} className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95">Deeper →</button>
          </div>

          <ol className="space-y-1">
            {dipilih.lapis.map((l, i) => (
              <li key={`${l.nama}-${i}`}>
                <button type="button" aria-current={i === langkah ? 'step' : undefined} onClick={() => keLangkah(i)} className={`min-h-11 w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold active:scale-[0.99] ${i === langkah ? 'bg-brand text-white' : i < langkah ? 'bg-neutral-100 text-neutral-400 dark:bg-white/5' : 'bg-neutral-100/60 text-neutral-600 dark:bg-white/5 dark:text-neutral-400'}`}>
                  {i + 1}. {l.nama}
                </button>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Now at</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">{lapis.nama}</div>
            <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{lapis.catatan}</p>
            {layerRiskCoverage.length > 0 && (
              <div className="mt-2 rounded-lg bg-rose-500/10 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">At risk in this layer · geometry coverage</div>
                <ul className="mt-1 space-y-1">
                  {layerRiskCoverage.map((risk) => (
                    <li key={risk.label} className="flex items-start justify-between gap-2 rounded-lg border border-rose-200/60 bg-white/60 px-2 py-1.5 dark:border-rose-500/20 dark:bg-black/10">
                      <span className="min-w-0 text-[11px] font-semibold leading-snug text-rose-700 dark:text-rose-300">{risk.label}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${risk.names.length ? 'border-brand/30 bg-brand/10 text-brand' : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                        {risk.names.length ? `${risk.names.length} exact source node${risk.names.length === 1 ? '' : 's'}` : 'reference only'}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!exactLayerRiskNames.length}
                  onClick={() => onSorot?.(exactLayerRiskNames)}
                  className="mt-2 min-h-11 rounded-full border border-rose-300 px-3 py-1 text-[10px] font-bold text-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/40 dark:text-rose-300"
                >
                  {exactLayerRiskNames.length
                    ? `Highlight ${exactLayerRiskNames.length} exact source node${exactLayerRiskNames.length === 1 ? '' : 's'} →`
                    : 'No exact regional source node to highlight'}
                </button>
                <p className="mt-1 text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80">
                  Layer-risk highlighting requires an exact anatomy base-name match in this body region and the shipped source-node catalogue. Missing or differently named structures stay reference-only; no similar mesh is substituted.
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] leading-snug text-neutral-500">Source: {dipilih.sumber}</p>
        </>
      )}

      {!dipilih && (
        <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
          Pick an approach. These are teaching sequences from standard surgical anatomy texts — not operative instructions or a competency credential.
        </p>
      )}
    </div>
  )
}

export default SurgicalLab
