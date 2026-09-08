import { useState } from 'react'
import { URUTAN, WILAYAH, KEDALAMAN, type UrutanLapisan } from '../../lib/dissection'
import { resolveSurgicalRisks, wholeBodyRiskNodes, type SurgicalRiskCoverage } from '../../lib/surgicalGeometry'
import { SURGICAL_SPATIAL_SCENARIOS } from '../../lib/surgicalSpatialTeaching'

// Surgical teaching in this panel stays inside an evidence boundary: the text
// may describe named relationships, but only exact names that exist in the
// generated whole-body index are ever forwarded to the shared 3D highlighter.
// Specialty-atlas references remain in their own reference frame; missing
// geometry remains text-only rather than being substituted with a similar mesh.

export interface SurgicalLabProps {
  onKedalaman?: (kedalaman: number) => void
  onSorot?: (nama: string[]) => void
}

/**
 * Approximate correspondence between a named teaching step and the renderer's
 * coarse system-layer depth. This is not an operative plane, patient-specific
 * trajectory, instrument path, or reconstruction of surgical depth.
 */
export function kedalamanUntukLangkah(langkah: number, total: number): number {
  if (total <= 1) return 0
  const bagian = langkah / (total - 1)
  return Math.round(bagian * KEDALAMAN.visceral)
}

const STATUS_LABEL: Record<SurgicalRiskCoverage['status'], string> = {
  'whole-body': 'Whole-body mesh',
  'specialty-atlas': 'Specialty atlas',
  'reference-only': 'Reference only',
}

function RiskRow({ risk }: { risk: SurgicalRiskCoverage }) {
  const cls = risk.status === 'whole-body'
    ? 'border-brand/30 bg-brand/10 text-brand'
    : risk.status === 'specialty-atlas'
      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'

  return (
    <li className="rounded-lg border border-rose-200/60 bg-white/60 p-2 dark:border-rose-500/20 dark:bg-black/10">
      <div className="flex flex-wrap items-start justify-between gap-1.5">
        <span className="text-[11px] font-semibold leading-snug text-rose-700 dark:text-rose-300">{risk.label}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${cls}`}>{STATUS_LABEL[risk.status]}</span>
      </div>
      {risk.status === 'specialty-atlas' && (
        <p className="mt-1 text-[9px] leading-snug text-neutral-500">
          Exact-name reference: {[...new Set(risk.specialtyMatches.map((match) => match.moduleLabel))].join(' · ')}. Kept in its own validated reference frame; not overlaid by a guessed transform.
        </p>
      )}
      {risk.status === 'reference-only' && (
        <p className="mt-1 text-[9px] leading-snug text-neutral-500">No exact geometry-name match in the current whole-body or specialty indexes.</p>
      )}
    </li>
  )
}

export function SurgicalLab({ onKedalaman, onSorot }: SurgicalLabProps) {
  const [kunci, setKunci] = useState<string | null>(null)
  const [langkah, setLangkah] = useState(0)
  const [spatialId, setSpatialId] = useState(SURGICAL_SPATIAL_SCENARIOS[0].id)
  const dipilih: UrutanLapisan | undefined = URUTAN.find((u) => u.kunci === kunci)
  const lapis = dipilih?.lapis[Math.min(langkah, dipilih.lapis.length - 1)]
  const spatial = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === spatialId) ?? SURGICAL_SPATIAL_SCENARIOS[0]
  const risiko = resolveSurgicalRisks(lapis?.bahaya ?? [])
  const nodeWholeBody = wholeBodyRiskNodes(lapis?.bahaya ?? [])

  function pilih(u: UrutanLapisan) {
    setKunci(u.kunci)
    setLangkah(0)
    onKedalaman?.(0)
    onSorot?.([])
  }

  function keLangkah(n: number) {
    if (!dipilih) return
    setLangkah(n)
    onKedalaman?.(kedalamanUntukLangkah(n, dipilih.lapis.length))
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 text-white dark:border-white/10">
        <div className="border-b border-white/10 bg-gradient-to-br from-brand/15 via-transparent to-blue-500/10 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Spatial surgical anatomy</div>
          <h4 className="mt-1 text-lg font-black">Landmark → neighbor → structure at risk</h4>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">
            Procedure-specific spatial relationships grounded to named anatomy. Only exact whole-body mesh names can be highlighted; missing or specialty-only anatomy stays text/reference-only instead of being fabricated.
          </p>
        </div>

        <div className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {SURGICAL_SPATIAL_SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={spatial.id === item.id}
                onClick={() => { setSpatialId(item.id); onSorot?.([]) }}
                className={`min-h-11 rounded-full border px-3 py-1.5 text-[10px] font-bold ${spatial.id === item.id ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-400'}`}
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
              const labels = [...checkpoint.nodeHints, ...checkpoint.structuresAtRisk]
              const coverage = resolveSurgicalRisks(labels)
              const verifiedNodes = wholeBodyRiskNodes(labels)
              const specialtyCount = coverage.filter((item) => item.status === 'specialty-atlas').length
              const referenceOnlyCount = coverage.filter((item) => item.status === 'reference-only').length

              return (
                <div key={checkpoint.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                  <div className="text-xs font-black text-white">{checkpoint.label}</div>
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
                  <div className="mt-2 text-[9px] leading-relaxed text-neutral-500">
                    Geometry coverage: {verifiedNodes.length} verified whole-body node{verifiedNodes.length === 1 ? '' : 's'} · {specialtyCount} specialty-only · {referenceOnlyCount} reference-only.
                  </div>
                  {verifiedNodes.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSorot?.(verifiedNodes)}
                      className="mt-2 min-h-11 rounded-full border border-brand/40 px-3 py-1.5 text-[9px] font-bold text-brand active:scale-95"
                    >
                      Highlight {verifiedNodes.length} verified whole-body mesh{verifiedNodes.length === 1 ? '' : 'es'} →
                    </button>
                  ) : (
                    <div className="mt-2 text-[9px] font-bold text-amber-300">No exact whole-body mesh is available for this checkpoint.</div>
                  )}
                </div>
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
          Layer-by-layer approaches in the order tissues are encountered in the teaching reference. Moving through them changes the shared system-layer depth only; it does not simulate a real operation or patient-specific plane.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Educational surgical anatomy</div>
        <p className="mt-1 text-[11px] leading-snug text-amber-900/80 dark:text-amber-100/80">
          Structures-at-risk are orientation material. The viewer does not reconstruct operative planes, instrument trajectories, patient anatomy, or competence to perform a procedure.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {URUTAN.map((u) => (
          <button
            key={u.kunci}
            type="button"
            onClick={() => (kunci === u.kunci ? setKunci(null) : pilih(u))}
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
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400"><b>Anatomical landmark reference.</b> {dipilih.patokan}</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => keLangkah(Math.max(0, langkah - 1))} disabled={langkah === 0} className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95">← Back</button>
            <div className="flex-1 text-center text-[11px] font-bold text-neutral-500">Layer {langkah + 1} of {dipilih.lapis.length}</div>
            <button type="button" onClick={() => keLangkah(Math.min(dipilih.lapis.length - 1, langkah + 1))} disabled={langkah === dipilih.lapis.length - 1} className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95">Deeper →</button>
          </div>

          <ol className="space-y-1">
            {dipilih.lapis.map((l, i) => (
              <li key={`${l.nama}-${i}`}>
                <button
                  type="button"
                  onClick={() => keLangkah(i)}
                  aria-current={i === langkah ? 'step' : undefined}
                  className={`min-h-11 w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold active:scale-[0.99] ${i === langkah ? 'bg-brand text-white' : i < langkah ? 'bg-neutral-100 text-neutral-400 dark:bg-white/5' : 'bg-neutral-100/60 text-neutral-600 dark:bg-white/5 dark:text-neutral-400'}`}
                >
                  {i + 1}. {l.nama}
                </button>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Current anatomical layer</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">{lapis.nama}</div>
            <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{lapis.catatan}</p>
            {risiko.length > 0 && (
              <div className="mt-2 rounded-lg bg-rose-500/10 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">Structures at risk · geometry coverage</div>
                <ul className="mt-1 space-y-1">{risiko.map((risk) => <RiskRow key={risk.label} risk={risk} />)}</ul>
                {nodeWholeBody.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSorot?.(nodeWholeBody)}
                    className="mt-2 min-h-11 rounded-full border border-rose-300 px-3 py-1 text-[10px] font-bold text-rose-700 active:scale-95 dark:border-rose-500/40 dark:text-rose-300"
                  >
                    Highlight {nodeWholeBody.length} verified whole-body mesh{nodeWholeBody.length === 1 ? '' : 'es'} →
                  </button>
                )}
                <p className="mt-1 text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80">
                  Highlighting is exact-name only. Specialty/reference-only structures are never substituted with a similar whole-body mesh.
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] leading-snug text-neutral-500">Reference: {dipilih.sumber}</p>
        </>
      )}

      {!dipilih && (
        <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
          Pick an approach to study its anatomical layer sequence. This is educational orientation material, not operative instruction or a substitute for supervised surgical training.
        </p>
      )}
    </div>
  )
}

export default SurgicalLab
