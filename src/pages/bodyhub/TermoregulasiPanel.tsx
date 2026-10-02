import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  TETAPAN_TERMO, RENTANG_TERMO, neracaPanas, lajuSuhuInti,
  deretKelembapan, deretSuhuUdara, kelembapanKritis, kapasitasPenguapan,
} from '../../lib/termoregulasi'

// Panel neraca panas untuk Body Exposure.
//
// Dua gambar, satu pelajaran yang tidak bisa ditabelkan: pada suhu udara dan
// beban kerja yang SAMA, kelembapan sendirian memindahkan tubuh dari keadaan
// tunak ke keadaan yang tidak punya keadaan tunak. Bukan "lebih tidak nyaman"
// -- melainkan tidak ada lagi jalan keluar bagi panasnya, sehingga suhu inti
// naik terus. Digambar, perpindahan itu terbaca sebagai kurva yang menyentuh
// nol dan tidak kembali.
//
// Setiap kurva ditarik oleh fungsi yang sama yang mencetak angkanya.

const W = 320
const H = 190
const KIRI = 40
const BAWAH = 26
const ATAS = 10
const KANAN = 8

function Geser({ label, nilai, min, maks, langkah = 1, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; langkah?: number
  onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={langkah} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

function Angka({ nilai, satuan, label, nyala }: { nilai: string; satuan?: string; label: string; nyala?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2 ${nyala ? 'bg-amber-500/15' : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]'}`}>
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight">
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

/** Gambar pertama: kapasitas penguapan runtuh saat kelembapan naik. */
function GrafikKelembapan({ suhuUdara, metabolik, kerja, kelembapan }: {
  suhuUdara: number; metabolik: number; kerja: number; kelembapan: number
}) {
  const deret = useMemo(() => deretKelembapan(suhuUdara, metabolik, kerja), [suhuUdara, metabolik, kerja])
  // Dibaca dari neraca yang sama, TIDAK dihitung ulang di sini. Versi pertama
  // menyusun ulang pertukaran keringnya inline, yang berarti garis putus-putus
  // ini digambar oleh salinan kedua fisikanya dan bisa diam-diam tidak sepakat
  // dengan angka di sebelahnya.
  const perlu = neracaPanas({ suhuUdara, kelembapan: 0, metabolik, kerja }).perluDiuapkan
  // Skala TETAP terhadap kapasitas pada udara kering, bukan terhadap puncak
  // yang sedang tampil: menormalkan ke puncaknya sendiri membuat setiap suhu
  // terlihat identik dan menghapus persis yang ditunjukkan gambar ini.
  const yMaks = Math.max(kapasitasPenguapan(suhuUdara, 0), perlu, 50) * 1.1
  const x = (rh: number) => KIRI + (rh / 100) * (W - KIRI - KANAN)
  const y = (v: number) => H - BAWAH - (Math.max(0, v) / yMaks) * (H - BAWAH - ATAS)
  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.penguapanMaks).toFixed(1)}`).join(' ')
  const kritis = kelembapanKritis(suhuUdara, metabolik, kerja)
  const kini = neracaPanas({ suhuUdara, kelembapan, metabolik, kerja })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Maximum evaporative capacity collapsing as humidity rises, crossing the heat that must be removed">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(yMaks * f).toFixed(0)}</text>
      ))}
      {/* Panas yang HARUS dibuang: garis mendatar. Perpotongannya dengan kurva
          kapasitas adalah titik di mana keadaan tunak berhenti ada. */}
      <line x1={KIRI} y1={y(perlu)} x2={W - KANAN} y2={y(perlu)} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />
      <text x={KIRI + 4} y={y(perlu) - 4} className="text-[8.5px] font-bold" fill="#f59e0b">heat to remove</text>
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      {kritis !== null && (
        <line x1={x(kritis)} y1={ATAS} x2={x(kritis)} y2={H - BAWAH} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" />
      )}
      <circle cx={x(kelembapan)} cy={y(kini.penguapanMaks)} r={4} fill={kini.tunak ? '#00BF63' : '#ef4444'} />
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">W</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Relative humidity (%)
      </text>
    </svg>
  )
}

/** Gambar kedua: simpanan panas terhadap suhu udara. */
function GrafikSuhu({ kelembapan, metabolik, kerja, suhuUdara }: {
  kelembapan: number; metabolik: number; kerja: number; suhuUdara: number
}) {
  const deret = useMemo(() => deretSuhuUdara(kelembapan, metabolik, kerja), [kelembapan, metabolik, kerja])
  const besar = Math.max(...deret.map((t) => Math.abs(t.simpanan)), 50) * 1.1
  const x = (t: number) => KIRI + ((t - RENTANG_TERMO.suhuUdara.min) / (RENTANG_TERMO.suhuUdara.maks - RENTANG_TERMO.suhuUdara.min)) * (W - KIRI - KANAN)
  const y = (v: number) => (ATAS + H - BAWAH) / 2 - (v / besar) * ((H - BAWAH - ATAS) / 2)
  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.simpanan).toFixed(1)}`).join(' ')
  const kini = neracaPanas({ suhuUdara, kelembapan, metabolik, kerja })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Stored heat against air temperature, crossing zero where the balance stops being steady">
      <line x1={KIRI} y1={y(0)} x2={W - KANAN} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(suhuUdara)} cy={y(kini.simpanan)} r={4} fill={kini.tunak ? '#00BF63' : '#ef4444'} />
      <text x={KIRI + 4} y={y(0) - 4} className="fill-current text-[8.5px] font-bold opacity-60">storing +</text>
      <text x={KIRI + 4} y={y(0) + 11} className="fill-current text-[8.5px] font-bold opacity-60">losing −</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Air temperature (°C)
      </text>
    </svg>
  )
}

export function TermoregulasiPanel() {
  const [suhuUdara, setSuhuUdara] = useState<number>(34)
  const [kelembapan, setKelembapan] = useState<number>(40)
  const [metabolik, setMetabolik] = useState<number>(400)
  const [kerja, setKerja] = useState<number>(0)
  const [massa, setMassa] = useState<number>(70)

  const n = neracaPanas({ suhuUdara, kelembapan, metabolik, kerja })
  const laju = lajuSuhuInti(n.simpanan, massa)
  const kritis = kelembapanKritis(suhuUdara, metabolik, kerja)

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Heat balance</h3>
        <p className="text-[12px] leading-relaxed">
          Sweat does not cool you. <em>Evaporating</em> sweat cools you — and how much can
          evaporate is set by the vapour-pressure difference between skin and air, not by
          how much sweat arrives. When the air is nearly saturated, sweat runs off instead
          of evaporating and carries no heat with it. Both curves below are drawn by the
          same functions that print the numbers.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Where the heat goes
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={n.produksi.toFixed(0)} satuan="W" label="To remove" />
          <Angka nilai={n.kering.toFixed(0)} satuan="W" label="Radiation + convection" />
          <Angka nilai={n.penguapanMaks.toFixed(0)} satuan="W" label="Evaporative ceiling" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={n.simpanan.toFixed(0)} satuan="W" label="Stored" nyala={!n.tunak} />
          <Angka nilai={Number.isFinite(laju) ? laju.toFixed(2) : '—'} satuan="°C/h" label="Core rate" nyala={!n.tunak} />
        </div>

        <Geser label="Air temperature" nilai={suhuUdara} min={RENTANG_TERMO.suhuUdara.min} maks={RENTANG_TERMO.suhuUdara.maks} onUbah={setSuhuUdara} satuan="°C" />
        <Geser label="Relative humidity" nilai={kelembapan} min={RENTANG_TERMO.kelembapan.min} maks={RENTANG_TERMO.kelembapan.maks} onUbah={setKelembapan} satuan="%" />
        <Geser label="Metabolic heat production" nilai={metabolik} min={RENTANG_TERMO.metabolik.min} maks={RENTANG_TERMO.metabolik.maks} langkah={10} onUbah={setMetabolik} satuan="W" />
        <Geser label="External work" nilai={kerja} min={0} maks={Math.min(200, metabolik)} langkah={10} onUbah={setKerja} satuan="W" />
        <Geser label="Body mass" nilai={massa} min={RENTANG_TERMO.massa.min} maks={RENTANG_TERMO.massa.maks} onUbah={setMassa} satuan="kg" />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {suhuUdara > TETAPAN_TERMO.SUHU_KULIT
            ? `At ${suhuUdara} °C the air is warmer than skin, so radiation and convection have reversed: they now deliver ${Math.abs(n.kering).toFixed(0)} W INTO the body instead of carrying heat away. Evaporation is the only remaining exit.`
            : `At ${suhuUdara} °C radiation and convection carry ${n.kering.toFixed(0)} W away, leaving ${Math.max(0, n.produksi - n.kering).toFixed(0)} W that only evaporation can remove.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Humidity alone decides it
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Along this curve the air temperature and the workload never change. Only the
          humidity does. The dashed line is the heat that must leave; where the green
          curve falls below it, there is no longer any way to balance the books.
        </p>
        <GrafikKelembapan suhuUdara={suhuUdara} metabolik={metabolik} kerja={kerja} kelembapan={kelembapan} />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {kritis === null
            ? `At ${suhuUdara} °C and ${metabolik - kerja} W, this balance stays steady at every humidity — the evaporative ceiling never falls below what has to leave.`
            : `At ${suhuUdara} °C and ${metabolik - kerja} W the balance stops being steady at about ${kritis} % humidity. Below that the body settles; above it, ${n.tunak ? 'it would store' : `it stores ${n.simpanan.toFixed(0)} W and the core climbs ${laju.toFixed(2)} °C every hour`} — and nothing in this model brings it back down.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Stored heat against air temperature
        </div>
        <GrafikSuhu kelembapan={kelembapan} metabolik={metabolik} kerja={kerja} suhuUdara={suhuUdara} />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Below the crossing the body loses heat faster than it makes it. Above it, storage
          is positive and there is no temperature at which the curve turns back — which is
          why the quantity that matters is the <em>slope</em> of core temperature, not a
          single reading of it.
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Mechanism only. Every figure is computed from values you supply — nothing is
          measured, nothing describes anyone's body, and no number here is a safety limit,
          a work–rest rule, a hydration plan, or a prediction of what would happen to a
          person. The simplifications are deliberate and material: one well-mixed
          compartment with no core-to-skin gradient, skin held at a fixed
          {' '}{TETAPAN_TERMO.SUHU_KULIT} °C rather than regulated, a reference body surface
          area of {TETAPAN_TERMO.LUAS_RUJUKAN} m², still air with fixed exchange
          coefficients, no clothing, no radiant sun load, no wind, and sweat assumed
          available without limit so the ceiling shown is environmental rather than
          physiological. Real tolerance also depends on acclimatisation, cardiovascular
          capacity, age, medication and illness, none of which appear here.
        </p>
      </Prosa>
    </div>
  )
}
