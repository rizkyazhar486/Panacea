import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  SEGMEN_VENTILASI, mulaiVentilasi, langkahVentilasi,
  resistensi, tetapanWaktu, jariJariTersumbat,
  type KeadaanVentilasi,
} from '../../lib/ventilasiSegmental'

// Panel ventilasi segmental — berjalan dalam waktu nyata.
//
// "Waktu nyata" di sini berarti keadaan fisiologis yang benar-benar melangkah
// tiap frame, BUKAN anatomi yang digerakkan. Geometri atlas tetap diam: tidak
// ada yang mengembang atau mengempis untuk meniru napas. Yang berubah adalah
// pengisian tiap segmen, digambar di atas anatomi yang stabil.
//
// Itu batas yang sudah dipegang Body Exposure sejak awal, dan melanggarnya
// akan menukar sesuatu yang benar dengan sesuatu yang tampak hidup.

function warnaIsi(isi: number): string {
  // Hijau merek untuk terisi, meredup ke arah nol. Bukan skala diagnostik.
  const a = 0.12 + 0.78 * Math.min(1, Math.max(0, isi))
  return `rgba(0, 191, 99, ${a.toFixed(3)})`
}

export function VentilasiSegmenPanel() {
  const [berjalan, setBerjalan] = useState(true)
  const [pecahan, setPecahan] = useState(0.5)
  const [idTersumbat, setIdTersumbat] = useState('resp:segment:r-s6')
  const [keadaan, setKeadaan] = useState<KeadaanVentilasi>(() => mulaiVentilasi(SEGMEN_VENTILASI))
  const rafRef = useRef(0)
  const terakhirRef = useRef(0)

  const penyempitan = useMemo(() => ({ [idTersumbat]: pecahan }), [idTersumbat, pecahan])

  useEffect(() => {
    if (!berjalan) return
    let batal = false
    const jalan = (t: number) => {
      if (batal) return
      const sebelum = terakhirRef.current || t
      // Langkah waktu dibatasi supaya tab yang ditinggalkan lalu dibuka lagi
      // tidak melompat jauh dalam satu frame.
      const dt = Math.min(0.12, (t - sebelum) / 1000)
      terakhirRef.current = t
      setKeadaan((k) => (k.waktu > 12 ? mulaiVentilasi(SEGMEN_VENTILASI) : langkahVentilasi(k, SEGMEN_VENTILASI, dt, penyempitan)))
      rafRef.current = requestAnimationFrame(jalan)
    }
    rafRef.current = requestAnimationFrame(jalan)
    return () => { batal = true; cancelAnimationFrame(rafRef.current); terakhirRef.current = 0 }
  }, [berjalan, penyempitan])

  const jariJariSumbat = jariJariTersumbat(1, pecahan)
  const rasioR = resistensi(jariJariSumbat) / resistensi(1)
  const tau = tetapanWaktu(jariJariSumbat, 1)
  const kanan = SEGMEN_VENTILASI.filter((s) => s.sisi === 'kanan')
  const kiri = SEGMEN_VENTILASI.filter((s) => s.sisi === 'kiri')

  const petak = (s: typeof SEGMEN_VENTILASI[number]) => {
    const isi = keadaan.isi[s.id] ?? 0
    const ini = s.id === idTersumbat
    return (
      <button key={s.id} type="button" onClick={() => setIdTersumbat(s.id)}
        aria-pressed={ini}
        className={`rounded-xl border px-2 py-1.5 text-left transition ${ini ? 'border-[#FF5A1F]' : 'border-transparent'}`}
        style={{ background: warnaIsi(isi) }}>
        <span className="block text-[10px] font-black text-ink dark:text-white">{s.label.replace(/^(Right|Left) /, '')}</span>
        <span className="block font-[var(--font-angka)] text-[10px] text-ink/70 dark:text-white/70">{(isi * 100).toFixed(0)}%</span>
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Segmental ventilation, running</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Each of the eighteen bronchopulmonary segments fills through its own airway. Narrow one and
          watch it fall behind the rest. The anatomy does not move — nothing here inflates or deflates to
          imitate breathing; only the physiological state advances.
        </Prosa>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
          <div className="font-[var(--font-angka)] text-[17px] font-black leading-none text-ink dark:text-white">{rasioR.toFixed(1)}×</div>
          <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">Resistance</div>
        </div>
        <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
          <div className="font-[var(--font-angka)] text-[17px] font-black leading-none text-ink dark:text-white">{tau.toFixed(1)}</div>
          <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">Time constant</div>
        </div>
        <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
          <div className="font-[var(--font-angka)] text-[17px] font-black leading-none text-ink dark:text-white">{keadaan.waktu.toFixed(1)}s</div>
          <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">Elapsed</div>
        </div>
      </div>

      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500" htmlFor="sempit">
        Radius lost in the selected segment
      </label>
      <input id="sempit" type="range" min={0} max={0.8} step={0.05} value={pecahan}
        onChange={(e) => setPecahan(Number(e.target.value))} className="w-full accent-[#FF5A1F]" />
      <p className="text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {(pecahan * 100).toFixed(0)}% of the radius gone multiplies resistance by {rasioR.toFixed(1)}×.
        Resistance follows the fourth power of radius, which is why a narrowing that sounds mild is not.
      </p>

      <button type="button" onClick={() => setBerjalan((x) => !x)}
        className="min-h-[38px] w-full rounded-full border border-neutral-200 text-[12px] font-black text-ink transition dark:border-white/10 dark:text-white">
        {berjalan ? 'Pause' : 'Run'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Right · 10</p>
          <div className="grid gap-1">{kanan.map(petak)}</div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Left · 8</p>
          <div className="grid gap-1">{kiri.map(petak)}</div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        Tap a segment to move the narrowing there. One compartment per segment is a large simplification:
        a real lung has tissue interdependence, collateral ventilation through the pores of Kohn, and a
        gravitational gradient, none of which are modelled. Nothing here is measured from a person.
      </p>
    </div>
  )
}

export default VentilasiSegmenPanel
