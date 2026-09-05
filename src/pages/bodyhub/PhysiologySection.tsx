import { useState } from 'react'
import { SISTEM_FISIOLOGI, type SistemFisiologi } from '../../lib/physiology'
import type { AnatomyLayer } from '../../components/Body3D'

// Fisiologi — apa yang tubuh KERJAKAN. Tiap sistem membawa nilai istirahat DAN
// nilai saat olahraga bersebelahan, karena di situlah halaman ini bertemu
// halaman Workout: beban yang dicatat di sana punya penjelasan faal di sini.

interface Props {
  onPickSystem: (layer: AnatomyLayer['key'] | undefined, searchTerms: string[], label: string) => void
}

function Baris({ n }: { n: SistemFisiologi['angka'][number] }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-neutral-100 py-1 last:border-0 dark:border-white/5">
      <span className="min-w-0 flex-1 text-[11px] text-neutral-500">{n.label}</span>
      <span className="shrink-0 text-[11px] font-bold text-ink dark:text-white">{n.rest}</span>
      {n.exercise && <span className="shrink-0 text-[11px] font-bold text-brand">{n.exercise}</span>}
    </div>
  )
}

export function PhysiologySection({ onPickSystem }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-neutral-400">
        Anatomy is what the body is made of; physiology is what it does. Each system below shows its resting values
        and — in green — what changes under exercise, which is the same load the Workout tab measures.
      </p>
      {SISTEM_FISIOLOGI.map((s) => {
        const terbuka = open === s.key
        return (
          <div key={s.key} className="rounded-xl border border-neutral-200 dark:border-white/10">
            <button
              onClick={() => {
                setOpen(terbuka ? null : s.key)
                if (!terbuka) onPickSystem(s.layer3d, s.searchTerms, s.label)
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink dark:text-white">{s.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{s.fungsi}</span>
              </span>
              <span className={`shrink-0 text-neutral-400 transition-transform ${terbuka ? 'rotate-90' : ''}`}>›</span>
            </button>
            {terbuka && (
              <div className="space-y-3 border-t border-neutral-100 p-3 dark:border-white/5">
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
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Rest</span>
                    <span className="t-mikro font-bold uppercase tracking-wide text-brand">Exercise</span>
                  </div>
                  <div className="mt-0.5">
                    {s.angka.map((n) => <Baris key={n.label} n={n} />)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand/5 p-2.5 dark:bg-brand/10">
                  <div className="t-mikro font-bold uppercase tracking-wide text-brand">Under exercise</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink dark:text-white">{s.saatOlahraga}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        Reference ranges are standard adult values from general physiology teaching, not diagnostic thresholds and
        not targets for any individual.
      </p>
    </div>
  )
}

export default PhysiologySection
