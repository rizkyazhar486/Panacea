import { lazy, Suspense, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { wilayahUntuk, WILAYAH_ABDOMEN } from '../../lib/anatomy/wilayahAbdomen'

const WilayahAbdomen3D = lazy(() => import('./WilayahAbdomen3D').then((m) => ({ default: m.WilayahAbdomen3D })))

export function WilayahAbdomenPanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
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
