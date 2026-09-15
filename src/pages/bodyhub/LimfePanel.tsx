import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  STASIUN_LIMFE, WILAYAH_LIMFE, stasiunDiWilayah, stasiunUntuk, semuaMeshTerikat,
  type WilayahLimfe,
} from '../../lib/anatomy/stasiunLimfe'

const Limfe3D = lazy(() => import('./Limfe3D').then((m) => ({ default: m.Limfe3D })))

export function LimfePanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const [wilayah, setWilayah] = useState<WilayahLimfe>('head-neck')
  const [turBerjalan, setTurBerjalan] = useState(false)
  const stasiun = terpilih ? stasiunUntuk(terpilih) : undefined
  const daftar = useMemo(() => stasiunDiWilayah(wilayah), [wilayah])
  const indeksAktif = daftar.findIndex((s) => s.id === terpilih)

  const pilih = (id: string) => {
    setTerpilih((lama) => (lama === id ? null : id))
  }

  const pindahTur = (arah: -1 | 1) => {
    if (!daftar.length) return
    const asal = indeksAktif < 0 ? (arah > 0 ? -1 : 0) : indeksAktif
    const berikut = (asal + arah + daftar.length) % daftar.length
    setTerpilih(daftar[berikut].id)
  }

  useEffect(() => {
    if (!turBerjalan || daftar.length === 0) return
    if (indeksAktif < 0) setTerpilih(daftar[0].id)
    const timer = window.setInterval(() => {
      setTerpilih((aktif) => {
        const i = daftar.findIndex((s) => s.id === aktif)
        return daftar[(i + 1 + daftar.length) % daftar.length].id
      })
    }, 3200)
    return () => window.clearInterval(timer)
  }, [turBerjalan, daftar, indeksAktif])

  const pilihWilayah = (id: WilayahLimfe) => {
    setTurBerjalan(false)
    setWilayah(id)
    const awal = stasiunDiWilayah(id)[0]
    setTerpilih(awal?.id ?? null)
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

      <Suspense fallback={<div role="status" aria-label="Loading lymphatic anatomy" className="h-[340px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        <Limfe3D terpilih={terpilih} onPilih={(id) => { setTurBerjalan(false); setTerpilih(id) }} />
      </Suspense>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">Guided 3D tour</div>
            <div className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">
              {indeksAktif >= 0 ? `${indeksAktif + 1} / ${daftar.length} · ${daftar[indeksAktif].label}` : `${daftar.length} stations in this region`}
            </div>
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Lymphatic guided tour controls">
            <button type="button" onClick={() => { setTurBerjalan(false); pindahTur(-1) }} aria-label="Previous lymph node station"
              className="min-h-11 min-w-11 rounded-xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] px-3 text-sm font-black text-ink dark:text-white">‹</button>
            <button type="button" onClick={() => setTurBerjalan((v) => !v)} aria-pressed={turBerjalan}
              className={`min-h-11 rounded-xl px-4 text-[11px] font-black ${turBerjalan ? 'bg-[#00BF63] text-white' : 'border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] text-ink dark:text-white'}`}>
              {turBerjalan ? 'Pause' : 'Auto tour'}
            </button>
            <button type="button" onClick={() => { setTurBerjalan(false); pindahTur(1) }} aria-label="Next lymph node station"
              className="min-h-11 min-w-11 rounded-xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] px-3 text-sm font-black text-ink dark:text-white">›</button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-[#00BF63] transition-[width] duration-300"
            style={{ width: `${daftar.length && indeksAktif >= 0 ? ((indeksAktif + 1) / daftar.length) * 100 : 0}%` }} />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        Tap a station on the model, use the list, or start the guided tour. The camera moves to each source-backed
        node group in turn; this is an anatomical orientation tour, not a simulation of lymph transport.
      </p>

      <div role="group" aria-label="Body regions" className="flex flex-wrap gap-1.5">
        {WILAYAH_LIMFE.map((w) => (
          <button key={w.id} type="button" aria-pressed={wilayah === w.id}
            onClick={() => pilihWilayah(w.id)}
            className={`min-h-11 rounded-full px-3 py-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BF63] focus-visible:ring-offset-2 ${
              wilayah === w.id
                ? 'bg-[#00BF63] text-white'
                : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
            }`}>
            {w.label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Lymph node stations" className="grid gap-1.5 sm:grid-cols-2">
        {daftar.map((s) => (
          <button key={s.id} type="button" aria-pressed={terpilih === s.id}
            onClick={() => { setTurBerjalan(false); pilih(s.id) }}
            className={`min-h-11 rounded-xl px-3 py-2 text-left text-[12px] font-bold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BF63] focus-visible:ring-offset-2 ${
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

      <Prosa kelas="text-[11px] leading-relaxed text-neutral-500" baris={2}>
        {'What this atlas does not carry: there are no lymphatic vessels in this model — no thoracic duct, no cisterna chyli, no lymph trunks. Only the nodes and the lymphoid organs were modelled. Nothing here has been mirrored, substituted or drawn in to cover that gap: the connections between stations exist in the text, not in the geometry. Two labelled stations in the source file, "Cubital nodes" and "Inferior deep lateral cervical nodes", carry no geometry of their own, so they are shown through the named nodes that sit inside them.'}
      </Prosa>

      <Prosa kelas="text-[11px] leading-relaxed text-neutral-500" baris={2}>
        {'Limits: these are standard gross-anatomy drainage relationships for orientation — which region of the body drains to which group of nodes in an adult. This is not staging, says nothing about the spread of disease or about prognosis, and concludes nothing about any individual. Lymphatic drainage varies between people and has many alternative routes, and node groups are conventional names for clusters that are inconstant in number and position.'}
      </Prosa>
    </div>
  )
}
