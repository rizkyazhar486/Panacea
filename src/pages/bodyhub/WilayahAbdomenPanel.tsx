import { lazy, Suspense, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { wilayahUntuk, WILAYAH_ABDOMEN } from '../../lib/anatomy/wilayahAbdomen'
import { DIGESTIVE_SEQUENCE, type DigestiveStage } from '../../lib/digestiveTransitVisual'

const WilayahAbdomen3D = lazy(() => import('./WilayahAbdomen3D').then((m) => ({ default: m.WilayahAbdomen3D })))
const DigestiveTransit3D = lazy(() => import('../../components/DigestiveTransit3D').then((m) => ({ default: m.DigestiveTransit3D })))

const DIGESTIVE_LABELS: Record<DigestiveStage, string> = {
  esophagus: 'Esophagus',
  stomach: 'Stomach',
  duodenum: 'Duodenum',
  'small-bowel': 'Jejunum / ileum',
  colon: 'Colon',
  rectum: 'Rectum',
}

export function WilayahAbdomenPanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const [digestiveFocus, setDigestiveFocus] = useState<DigestiveStage>('stomach')
  const [digestiveRunning, setDigestiveRunning] = useState(true)
  const wilayah = terpilih ? wilayahUntuk(terpilih) : undefined

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">The nine abdominal regions</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          "Right hypochondriac" is everyday clinical language, and until now this app only carried it as
          text. The regions ship as real surface geometry, so you can touch one instead of memorising a
          diagram — and see which structures lie behind the wall there.
        </Prosa>
      </div>

      <Suspense fallback={<div className="h-[300px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        <WilayahAbdomen3D terpilih={terpilih} onPilih={setTerpilih} />
      </Suspense>

      <div aria-live="polite" className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        {wilayah ? (
          <>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Behind this wall</div>
            <div className="mt-1 text-[14px] font-black text-ink dark:text-white">{wilayah.label} region</div>
            <ul className="mt-2 space-y-1">
              {wilayah.proyeksi.map((p) => (
                <li key={p} className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">• {p}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Nothing selected. Choose one of the {WILAYAH_ABDOMEN.length} regions to see what lies behind
            the abdominal wall there.
          </p>
        )}
      </div>

      <section className="space-y-3 rounded-2xl border border-amber-300/20 bg-amber-50/40 p-3 dark:bg-amber-300/[0.04]" aria-labelledby="digestive-source-render-title">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">Go deeper</div>
            <h4 id="digestive-source-render-title" className="mt-0.5 text-sm font-black text-ink dark:text-white">Digestive organ source render</h4>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Inspect the shipped visceral geometry directly. Selecting a stage emphasizes the source organ surfaces; the moving cue links resolved organ centres only for orientation.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={digestiveRunning}
            onClick={() => setDigestiveRunning((value) => !value)}
            className="min-h-10 rounded-full border border-amber-500/30 bg-white/70 px-3 text-[10px] font-black text-amber-800 dark:bg-black/20 dark:text-amber-200"
          >
            {digestiveRunning ? 'Pause orientation cue' : 'Run orientation cue'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Digestive structure focus">
          {DIGESTIVE_SEQUENCE.map((stage) => (
            <button
              key={stage}
              type="button"
              aria-pressed={digestiveFocus === stage}
              onClick={() => setDigestiveFocus(stage)}
              className={`min-h-10 rounded-full border px-3 text-[10px] font-black transition ${
                digestiveFocus === stage
                  ? 'border-amber-500 bg-amber-400 text-neutral-950'
                  : 'border-amber-500/20 bg-white/60 text-neutral-600 dark:bg-white/5 dark:text-neutral-300'
              }`}
            >
              {DIGESTIVE_LABELS[stage]}
            </button>
          ))}
        </div>

        <Suspense fallback={<div className="flex h-[350px] items-center justify-center rounded-2xl bg-neutral-950 text-xs font-semibold text-neutral-400" role="status">Loading digestive WebGL…</div>}>
          <DigestiveTransit3D focus={digestiveFocus} running={digestiveRunning} />
        </Suspense>
      </section>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          This is surface anatomy: which structures lie behind the abdominal wall in that region in an
          average adult. It is not a list of causes of pain, not a differential, and it concludes nothing
          about anyone. Pain does not obey this map — visceral pain is referred away from its organ, and
          organs move with breathing, posture and body habitus. Region boundaries are conventions drawn on
          a continuous wall, not structures in their own right.
        </p>
      </Prosa>
    </div>
  )
}
