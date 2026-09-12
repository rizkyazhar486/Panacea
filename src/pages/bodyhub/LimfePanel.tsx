import { lazy, Suspense, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  STASIUN_LIMFE, WILAYAH_LIMFE, stasiunDiWilayah, stasiunUntuk, semuaMeshTerikat,
  type WilayahLimfe,
} from '../../lib/anatomy/stasiunLimfe'

const Limfe3D = lazy(() => import('./Limfe3D').then((m) => ({ default: m.Limfe3D })))

// Panel limfe: model DAN daftar, keduanya setara.
//
// 3D tidak bisa dipakai dengan papan tombol, dan tidak semua orang bisa
// menunjuk benda sekecil satu nodus. Daftar di bawah karena itu bukan
// pelengkap: setiap stasiun bisa dipilih dari sana, dan pilihan dari mana pun
// menyalakan stasiun yang sama.

export function LimfePanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const [wilayah, setWilayah] = useState<WilayahLimfe>('head-neck')
  const stasiun = terpilih ? stasiunUntuk(terpilih) : undefined
  const daftar = useMemo(() => stasiunDiWilayah(wilayah), [wilayah])

  const pilih = (id: string) => {
    setTerpilih((lama) => (lama === id ? null : id))
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Lymph node stations and lymphoid organs</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          "Coeliac nodes", "ileocolic nodes", "central axillary group" are everyday anatomical language,
          and until now this app carried them only as words. The atlas ships {STASIUN_LIMFE.length} named
          stations as real geometry, so you can pick one, see where it sits in the body, and read which
          region drains to it.
        </Prosa>
      </div>

      <Suspense fallback={<div className="h-[340px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        <Limfe3D terpilih={terpilih} onPilih={(id) => setTerpilih(id)} />
      </Suspense>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        Tap a station on the model, or use the list below. The view moves in close when you choose one —
        a single node is a few millimetres across on a whole body, and would otherwise be invisible.
      </p>

      {/* Pemilih wilayah, lalu daftar. Setiap stasiun bisa dicapai tanpa
          menyentuh model sama sekali. */}
      <div role="group" aria-label="Body regions" className="flex flex-wrap gap-1.5">
        {WILAYAH_LIMFE.map((w) => (
          <button key={w.id} type="button" aria-pressed={wilayah === w.id}
            onClick={() => setWilayah(w.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              wilayah === w.id
                ? 'bg-[#00BF63] text-white'
                : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
            }`}>
            {w.label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Lymph node stations" className="grid gap-1.5">
        {daftar.map((s) => (
          <button key={s.id} type="button" aria-pressed={terpilih === s.id}
            onClick={() => pilih(s.id)}
            className={`rounded-xl px-3 py-2 text-left text-[12px] font-bold leading-tight transition ${
              terpilih === s.id
                ? 'bg-[#00BF63] text-white'
                : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        {stasiun ? (
          <>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Drains from</div>
            <div className="mt-1 break-words text-[14px] font-black text-ink dark:text-white">{stasiun.label}</div>
            <ul className="mt-2 space-y-1">
              {stasiun.drainase.map((d) => (
                <li key={d} className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">• {d}</li>
              ))}
            </ul>
            {stasiun.catatan && (
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{stasiun.catatan}</p>
            )}
          </>
        ) : (
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Nothing selected. Choose one of the {STASIUN_LIMFE.length} stations — they bind{' '}
            {semuaMeshTerikat().length} separate pieces of geometry in the atlas — to see where it lies and
            which region drains to it.
          </p>
        )}
      </div>

      {/* Prosa hanya melipat anak berupa string, jadi tiap paragraf dikirim
          utuh sebagai string -- juga supaya tidak ada <p> di dalam <p>. */}
      <Prosa kelas="text-[11px] leading-relaxed text-neutral-500" baris={2}>
        {'What this atlas does not carry: there are no lymphatic vessels in this model — no thoracic duct, no cisterna chyli, no lymph trunks. Only the nodes and the lymphoid organs were modelled. Nothing here has been mirrored, substituted or drawn in to cover that gap: the connections between stations exist in the text, not in the geometry. Two labelled stations in the source file, "Cubital nodes" and "Inferior deep lateral cervical nodes", carry no geometry of their own, so they are shown through the named nodes that sit inside them.'}
      </Prosa>

      <Prosa kelas="text-[11px] leading-relaxed text-neutral-500" baris={2}>
        {'Limits: these are standard gross-anatomy drainage relationships for orientation — which region of the body drains to which group of nodes in an adult. This is not staging, says nothing about the spread of disease or about prognosis, and concludes nothing about any individual. Lymphatic drainage varies between people and has many alternative routes, and node groups are conventional names for clusters that are inconstant in number and position.'}
      </Prosa>

    </div>
  )
}
