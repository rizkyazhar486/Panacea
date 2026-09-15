import { useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_LESION_LOCALIZATION_BOUNDARY,
  BODY_LESION_LOCALIZATION_LEVELS,
  BODY_LESION_LOCALIZATION_REFERENCES,
  getNeuroLocalizationLevel,
  listNeuroLocalizationLevelsForAtlasSystem,
  localizationSignalDomainCount,
  type LocalizationSignalDomain,
  type NeuroLocalizationLevelId,
} from '../../lib/bodyLesionLocalization'

const DOMAIN_LABEL: Record<LocalizationSignalDomain, string> = {
  'cognition-language': 'Cognition / language',
  'cranial-nerve': 'Cranial nerve',
  motor: 'Motor',
  sensory: 'Sensory',
  'coordination-gait': 'Coordination / gait',
  'autonomic-sphincter': 'Autonomic / sphincter',
}

const DOMAIN_CLASS: Record<LocalizationSignalDomain, string> = {
  'cognition-language': 'border-fuchsia-300/15 bg-fuchsia-300/[.045] text-fuchsia-100',
  'cranial-nerve': 'border-violet-300/15 bg-violet-300/[.045] text-violet-100',
  motor: 'border-cyan-300/15 bg-cyan-300/[.045] text-cyan-100',
  sensory: 'border-sky-300/15 bg-sky-300/[.045] text-sky-100',
  'coordination-gait': 'border-emerald-300/15 bg-emerald-300/[.045] text-emerald-100',
  'autonomic-sphincter': 'border-amber-300/15 bg-amber-300/[.045] text-amber-100',
}

interface LesionLocalizationPanelProps {
  selectedAtlasSystemId?: BodySystemId
}

export default function LesionLocalizationPanel({ selectedAtlasSystemId }: LesionLocalizationPanelProps) {
  const related = useMemo(
    () => selectedAtlasSystemId ? listNeuroLocalizationLevelsForAtlasSystem(selectedAtlasSystemId) : BODY_LESION_LOCALIZATION_LEVELS,
    [selectedAtlasSystemId],
  )
  const visible = related.length > 0 ? related : BODY_LESION_LOCALIZATION_LEVELS
  const [levelId, setLevelId] = useState<NeuroLocalizationLevelId>(visible[0]?.id ?? 'cortical-network')

  useEffect(() => {
    if (!visible.some((level) => level.id === levelId)) setLevelId(visible[0].id)
  }, [visible, levelId])

  const level = getNeuroLocalizationLevel(levelId)
  const directlyRelated = !selectedAtlasSystemId || level.atlasSystemIds.includes(selectedAtlasSystemId)
  const reference = BODY_LESION_LOCALIZATION_REFERENCES[0]

  return (
    <section
      data-body-lesion-localization="v1"
      data-localization-level={level.id}
      className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(139,92,246,.05),rgba(2,6,12,.95)_42%,rgba(34,211,238,.045))] text-white shadow-[0_24px_80px_rgba(0,0,0,.27)]"
    >
      <div className="relative overflow-hidden border-b border-white/[.08] p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,.13),transparent_31%),radial-gradient(circle_at_90%_0%,rgba(34,211,238,.1),transparent_30%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-violet-200/80">Body Exposure · lesion localization lab</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Examination pattern → anatomical level → pathway logic</h3>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">
              Learn localization before etiology. Compare cortical, deep, brainstem, cerebellar, spinal and peripheral patterns while keeping side/crossing logic, anatomy anchors and imaging handoff visible in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.055] px-2.5 py-1 text-violet-100/75">6 levels</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">pathway crossing</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-2.5 py-1 text-emerald-100/75">exam-first</span>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[.05] px-2.5 py-1 text-amber-100/75">educational only</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {selectedAtlasSystemId && related.length > 0 && (
          <div className="mb-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] px-3 py-2 text-[9px] leading-relaxed text-cyan-50/55">
            The current Body Exposure system has explicit localization relevance. <span className="font-black text-cyan-100/80">{related.length} of {BODY_LESION_LOCALIZATION_LEVELS.length}</span> localization levels are mapped to this atlas context.
          </div>
        )}

        {selectedAtlasSystemId && related.length === 0 && (
          <div className="mb-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.035] px-3 py-2 text-[9px] leading-relaxed text-amber-50/55">
            This selected body system has no explicit neuro-localization mapping in the current wave. The full teaching matrix remains available without inventing a direct relationship.
          </div>
        )}

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Neuroanatomical localization levels">
          {visible.map((item) => {
            const active = item.id === level.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLevelId(item.id)}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50 ${active ? 'border-violet-300/30 bg-violet-300/[.12] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}
              >
                {item.shortLabel}
              </button>
            )
          })}
        </div>

        {!directlyRelated && selectedAtlasSystemId && (
          <div className="mt-2 text-[9px] text-amber-100/55">The selected localization level is not directly mapped to the current atlas system; it remains visible only as general teaching context.</div>
        )}

        <div className="mt-3 grid gap-3 2xl:grid-cols-[minmax(0,1.22fr)_minmax(330px,.78fr)]">
          <div className="space-y-3">
            <article className="rounded-[22px] border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Localization level</div>
                  <h4 className="mt-1 text-base font-black text-white">{level.label}</h4>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{level.levelSummary}</p>
                </div>
                <span className="rounded-full border border-white/[.08] bg-black/20 px-2.5 py-1 text-[8px] font-black text-white/40">{localizationSignalDomainCount(level.id)} exam domains</span>
              </div>

              <div className="mt-3 rounded-2xl border border-fuchsia-300/12 bg-fuchsia-300/[.035] p-3">
                <div className="text-[8px] font-black uppercase tracking-[.14em] text-fuchsia-200/60">High-specificity teaching pattern</div>
                <p className="mt-1 text-[10px] font-bold leading-relaxed text-white/70">{level.highSpecificityPattern}</p>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-200/65">Anatomy anchors</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {level.anatomyAnchors.map((anchor) => <span key={anchor} className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[8px] font-bold text-white/55">{anchor}</span>)}
                  </div>
                </div>
                <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.025] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.14em] text-violet-200/65">Pathway anchors</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {level.pathwayAnchors.map((anchor) => <span key={anchor} className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[8px] font-bold text-white/55">{anchor}</span>)}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Examination signal map</div>
                  <h4 className="mt-1 text-sm font-black text-white">Which findings move the localization?</h4>
                </div>
                <div className="text-[8px] font-bold text-white/25">Pattern teaching · not probability scoring</div>
              </div>

              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {level.signals.map((signal) => (
                  <article key={signal.id} className={`rounded-[18px] border p-3 ${DOMAIN_CLASS[signal.domain]}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[.13em] opacity-60">{DOMAIN_LABEL[signal.domain]}</div>
                        <div className="mt-1 text-[10px] font-black text-white/85">{signal.label}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-[9px] leading-relaxed text-white/45"><span className="font-black text-white/62">Localizing value · </span>{signal.localizingValue}</p>
                    <p className="mt-1.5 text-[8px] leading-relaxed text-amber-50/40"><span className="font-black text-amber-100/60">Caution · </span>{signal.caution}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-3">
            <article className="rounded-[22px] border border-sky-300/10 bg-sky-300/[.025] p-3.5">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-sky-200/65">Side & crossing logic</div>
              <div className="mt-2 space-y-2">
                {level.sideLogic.map((item, index) => (
                  <div key={`${level.id}-side-${index}`} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 rounded-2xl border border-white/[.07] bg-black/20 p-2.5">
                    <div className="grid h-6 w-6 place-items-center rounded-full border border-sky-300/15 bg-sky-300/[.055] text-[8px] font-black text-sky-100/70">{index + 1}</div>
                    <p className="text-[8px] leading-relaxed text-white/38">{item}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-emerald-300/10 bg-emerald-300/[.025] p-3.5">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Imaging / test handoff</div>
              <p className="mt-2 text-[9px] leading-relaxed text-white/42">{level.imagingHandoff}</p>
            </article>

            <article className="rounded-[22px] border border-amber-300/10 bg-amber-300/[.025] p-3.5">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Common localization pitfall</div>
              <p className="mt-2 text-[9px] leading-relaxed text-white/42">{level.commonPitfall}</p>
            </article>

            <article className="rounded-[22px] border border-violet-300/10 bg-violet-300/[.025] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Mandatory reference architecture</div>
                <span className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[7px] font-black text-white/35">pinned</span>
              </div>
              <div className="mt-2 rounded-2xl border border-white/[.07] bg-black/20 p-3">
                <div className="text-[9px] font-black text-white/70">{reference.title}</div>
                <div className="mt-1 text-[8px] text-white/35">{reference.repository}</div>
                <div className="mt-2 break-all font-mono text-[7px] leading-relaxed text-white/28">commit {reference.pinnedCommit}</div>
                <p className="mt-2 text-[8px] leading-relaxed text-white/32">{reference.note}</p>
                <div className="mt-2 text-[7px] leading-relaxed text-amber-50/38"><span className="font-black text-amber-100/55">License boundary · </span>{reference.license}</div>
                <a href={reference.repositoryUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-violet-300/15 bg-violet-300/[.055] px-3 text-[8px] font-black text-violet-100/70 hover:bg-violet-300/[.09]">Open reference atlas ↗</a>
              </div>
            </article>
          </aside>
        </div>

        <p className="mt-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45"><span className="font-black text-rose-100/65">Boundary:</span> {BODY_LESION_LOCALIZATION_BOUNDARY}</p>
      </div>
    </section>
  )
}
