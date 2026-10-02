import { useState } from 'react'
import {
  PHYSIOLOGY_EVIDENCE_BOUNDARY,
  PHYSIOLOGY_REFERENCE_SOURCES,
  SISTEM_FISIOLOGI,
  type SistemFisiologi,
} from '../../lib/physiology'
import type { AnatomyLayer } from '../../components/Body3D'
import { PhysiologyDeepDivePanel } from './PhysiologyDeepDivePanel'

// Fisiologi — mekanisme dan reference envelopes. Angka di sini tidak menjadi
// personal physiology hanya karena ditampilkan berdampingan dengan Workout.

interface Props {
  onPickSystem: (layer: AnatomyLayer['key'] | undefined, searchTerms: string[], label: string) => void
}

function Baris({ n }: { n: SistemFisiologi['angka'][number] }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(90px,auto)] gap-x-2 gap-y-0.5 border-b border-neutral-100 py-1.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(110px,auto)_minmax(130px,auto)] dark:border-white/5">
      <span className="min-w-0 text-[11px] text-neutral-500">{n.label}</span>
      <span className="text-right text-[11px] font-bold text-ink dark:text-white">{n.rest}</span>
      {n.exercise && <span className="col-span-2 text-[10px] font-semibold leading-relaxed text-brand sm:col-span-1 sm:text-right">{n.exercise}</span>}
    </div>
  )
}

export function PhysiologySection({ onPickSystem }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-brand/20 bg-brand/[0.04] p-3 dark:bg-brand/[0.08]">
        <div className="text-[10px] font-black uppercase tracking-wide text-brand">Reference physiology · not a live body measurement</div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{PHYSIOLOGY_EVIDENCE_BOUNDARY}</p>
      </div>

      {SISTEM_FISIOLOGI.map((s) => {
        const terbuka = open === s.key
        const triggerId = `physiology-trigger-${s.key}`
        const panelId = `physiology-panel-${s.key}`
        return (
          <div key={s.key} className="rounded-xl border border-neutral-200 dark:border-white/10">
            <button
              id={triggerId}
              type="button"
              aria-expanded={terbuka}
              aria-controls={terbuka ? panelId : undefined}
              onClick={() => {
                setOpen(terbuka ? null : s.key)
                if (!terbuka) onPickSystem(s.layer3d, s.searchTerms, s.label)
              }}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink dark:text-white">{s.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{s.fungsi}</span>
              </span>
              <span aria-hidden="true" className={`shrink-0 text-neutral-400 transition-transform ${terbuka ? 'rotate-90' : ''}`}>›</span>
            </button>
            {terbuka && (
              <div id={panelId} role="region" aria-labelledby={triggerId} className="space-y-3 border-t border-neutral-100 p-3 dark:border-white/5">
                <div>
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">How it works</div>
                  <ol className="mt-1 space-y-1">
                    {s.proses.map((p, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                        <span className="shrink-0 font-bold text-brand">{i + 1}</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">What controls it</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{s.regulasi}</p>
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wide text-neutral-500 sm:grid-cols-[minmax(0,1fr)_minmax(110px,auto)_minmax(130px,auto)]">
                    <span>Variable</span>
                    <span className="text-right">Reference rest</span>
                    <span className="col-span-2 text-right text-brand sm:col-span-1">Typical exercise response</span>
                  </div>
                  <div className="mt-0.5">{s.angka.map((n) => <Baris key={n.label} n={n} />)}</div>
                </div>
                <div className="rounded-lg bg-brand/5 p-2.5 dark:bg-brand/10">
                  <div className="t-mikro font-bold uppercase tracking-wide text-brand">Under exercise</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink dark:text-white">{s.saatOlahraga}</p>
                </div>
                {s.evidenceNote && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-[10px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <span className="font-black">Interpretation boundary. </span>{s.evidenceNote}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <PhysiologyDeepDivePanel onFocus={(topic) => onPickSystem(topic.layer3d, topic.searchTerms, topic.label)} />

      <details className="rounded-xl border border-neutral-200 dark:border-white/10">
        <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-bold text-neutral-500">Physiology reference basis</summary>
        <div className="border-t border-neutral-100 p-3 text-[10px] leading-relaxed text-neutral-500 dark:border-white/5">
          <p>Educational synthesis cross-checked against standard human and exercise physiology references:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {PHYSIOLOGY_REFERENCE_SOURCES.map((source) => <li key={source}>{source}</li>)}
          </ul>
          <p className="mt-2">Reference envelopes are intentionally approximate. Individual interpretation requires measured data, measurement method, population context and—when clinically relevant—professional assessment.</p>
        </div>
      </details>
    </div>
  )
}

export default PhysiologySection
