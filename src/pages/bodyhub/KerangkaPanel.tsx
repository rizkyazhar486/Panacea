import { lazy, Suspense, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  KELOMPOK_TULANG, TIDAK_DIBAWA, WILAYAH_RANGKA, kelompokUntuk,
} from '../../lib/anatomy/rangkaKerangka'

const Kerangka3D = lazy(() => import('./Kerangka3D').then((m) => ({ default: m.Kerangka3D })))

export function KerangkaPanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const kelompok = terpilih ? kelompokUntuk(terpilih) : undefined

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Find a bone on the skeleton</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The skeleton ships as real geometry, one mesh per bone. Pick a bone group and it lights up on
          the model, with the region it belongs to and the joints it forms named beside it.
        </Prosa>
      </div>

      <Suspense fallback={<div className="h-[340px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        <Kerangka3D terpilih={terpilih} onPilih={setTerpilih} />
      </Suspense>

      {/* Daftar ini jalur yang SETARA, bukan pelengkap: 3D tidak bisa dipakai
          dengan papan tombol, dan kelompok yang hanya bisa dipilih dengan
          menunjuk berarti kelompok yang tidak bisa dipilih sebagian orang. */}
      {WILAYAH_RANGKA.map((wilayah) => (
        <div key={wilayah}>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">{wilayah}</div>
          <div role="group" aria-label={wilayah} className="mt-1.5 grid grid-cols-2 gap-1.5">
            {KELOMPOK_TULANG.filter((k) => k.wilayah === wilayah).map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={terpilih === k.id}
                onClick={() => setTerpilih(terpilih === k.id ? null : k.id)}
                className={`min-w-0 rounded-xl px-2 py-2 text-left text-[10.5px] font-bold leading-tight transition ${
                  terpilih === k.id
                    ? 'bg-[#00BF63] text-white'
                    : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
                }`}>
                <span className="block break-words">{k.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div aria-live="polite" className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        {kelompok ? (
          <>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              {kelompok.wilayah}
            </div>
            <div className="mt-1 text-[14px] font-black text-ink dark:text-white">{kelompok.label}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {kelompok.ringkas}
            </p>
            <div className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Articulations
            </div>
            <ul className="mt-1 space-y-1">
              {kelompok.artikulasi.map((a) => (
                <li key={a} className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">• {a}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              {kelompok.mesh.length} named bone{kelompok.mesh.length === 1 ? '' : 's'} highlighted
              {kelompok.berpasangan ? ', left and right' : ', midline and unpaired'}.
            </p>
          </>
        ) : (
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Nothing selected. Choose one of the {KELOMPOK_TULANG.length} bone groups to highlight it on the
            skeleton and read the joints it forms.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Not carried by this model
        </div>
        <ul className="mt-1 space-y-1">
          {TIDAK_DIBAWA.map((t) => (
            <li key={t.label} className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              • <strong className="font-black">{t.label}</strong> — {t.catatan}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          When a structure is absent it is said so here. Nothing is mirrored to fill a gap, and no nearby
          bone is highlighted in place of the one you asked for.
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          This is reference anatomy on a generic adult skeleton. It is not imaging, not anyone's own
          skeleton, and it is not a diagnosis. It says nothing about fractures, bone density, implants or
          how any injury should be managed. Real skeletons vary — extra or absent ribs, sesamoids and
          fusion patterns are common — and a named group here is a teaching grouping, not a boundary drawn
          on any particular person.
        </p>
      </Prosa>
    </div>
  )
}
