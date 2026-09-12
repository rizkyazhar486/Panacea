import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  TETAPAN_GAS, RENTANG_GAS, tekananBarometrik, tekananInspirasi, tekananAlveolar,
  selisihAa, selisihAaLazimUsia, deretTerhadapPaco2, deretTerhadapKetinggian,
} from '../../lib/gasAlveolar'

// Panel persamaan gas alveolar untuk Body Exposure.
//
// Dua gambar, satu pelajaran yang sama dari dua arah: apa yang MENURUNKAN
// oksigen belum tentu MERUSAK pertukarannya. Kurva pertama menggeser PaCO2 dan
// menunjukkan dua garis sejajar pada FiO2 berbeda; kurva kedua menaikkan
// ketinggian. Pada keduanya selisih A-a tidak bergerak sama sekali.
//
// Itu kalimat yang mudah dihafal dan mudah salah dipakai. Sebagai gambar, ia
// terbaca sendiri: garisnya turun, jaraknya tetap.
//
// Setiap kurva ditarik oleh fungsi yang sama yang mencetak angkanya.

const W = 320
const H = 190
const KIRI = 36
const BAWAH = 26
const ATAS = 10
const KANAN = 8

function Geser({ label, nilai, min, maks, langkah = 1, onUbah, satuan, tampil }: {
  label: string; nilai: number; min: number; maks: number; langkah?: number
  onUbah: (n: number) => void; satuan: string; tampil?: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{tampil ?? nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={langkah} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

function Angka({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight">
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

/** Gambar pertama: PAO2 terhadap PaCO2, dua FiO2, dengan PaO2 arteri sebagai
 *  garis ketiga supaya jarak A-a terlihat sebagai JARAK, bukan sebagai angka. */
function GrafikPaco2({ fio2, paco2, pao2Arteri }: { fio2: number; paco2: number; pao2Arteri: number }) {
  const deret = useMemo(() => deretTerhadapPaco2(fio2, RENTANG_GAS.paco2.min, RENTANG_GAS.paco2.maks),
    [fio2])
  const udaraRuang = useMemo(() => deretTerhadapPaco2(0.21, RENTANG_GAS.paco2.min, RENTANG_GAS.paco2.maks), [])
  // Skala TETAP terhadap PIO2 pada FiO2 yang sedang dipilih, bukan terhadap
  // puncak kurva yang sedang tampil. Menormalkan ke puncaknya sendiri akan
  // membuat setiap FiO2 terlihat identik -- justru menghapus hal yang
  // ditunjukkan gambar ini.
  const yMaks = Math.max(tekananInspirasi(fio2, TETAPAN_GAS.PATM_LAUT) * 1.05, 120)
  const x = (p: number) => KIRI + ((p - RENTANG_GAS.paco2.min) / (RENTANG_GAS.paco2.maks - RENTANG_GAS.paco2.min)) * (W - KIRI - KANAN)
  const y = (v: number) => H - BAWAH - (Math.max(0, v) / yMaks) * (H - BAWAH - ATAS)

  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.pao2).toFixed(1)}`).join(' ')
  const jalurUdara = udaraRuang.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.pao2).toFixed(1)}`).join(' ')
  const pao2 = tekananAlveolar({ fio2, paco2 })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Alveolar oxygen tension falling as arterial carbon dioxide rises, with the alveolar-arterial difference unchanged">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(yMaks * f).toFixed(0)}</text>
      ))}
      {fio2 > 0.215 && <path d={jalurUdara} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" />}
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      {pao2Arteri <= pao2 && (
        <line x1={x(paco2)} y1={y(pao2)} x2={x(paco2)} y2={y(pao2Arteri)}
          stroke="#f59e0b" strokeWidth={3} />
      )}
      <circle cx={x(paco2)} cy={y(pao2)} r={4} fill="#00BF63" />
      <circle cx={x(paco2)} cy={y(pao2Arteri)} r={3.5} fill="#f59e0b" />
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">mmHg</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Arterial PaCO₂ (mmHg)
      </text>
      {fio2 > 0.215 && (
        <text x={x(RENTANG_GAS.paco2.min) + 4} y={y(udaraRuang[0].pao2) - 5}
          className="fill-current text-[8.5px] font-bold opacity-60">room air</text>
      )}
    </svg>
  )
}

/** Gambar kedua: PAO2 terhadap ketinggian. Fraksi oksigen tidak berubah;
 *  hanya tekanan totalnya. */
function GrafikKetinggian({ fio2, paco2, meter }: { fio2: number; paco2: number; meter: number }) {
  const deret = useMemo(() => deretTerhadapKetinggian(fio2, paco2, RENTANG_GAS.ketinggian.maks, 100),
    [fio2, paco2])
  const yMaks = Math.max(tekananInspirasi(fio2, TETAPAN_GAS.PATM_LAUT) * 1.05, 120)
  const x = (m: number) => KIRI + (m / RENTANG_GAS.ketinggian.maks) * (W - KIRI - KANAN)
  const y = (v: number) => H - BAWAH - (Math.max(0, v) / yMaks) * (H - BAWAH - ATAS)
  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.pao2).toFixed(1)}`).join(' ')
  const jalurPio = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.x).toFixed(1)} ${y(t.pio2).toFixed(1)}`).join(' ')
  const patm = tekananBarometrik(meter)
  const kini = tekananAlveolar({ fio2, paco2, patm })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Alveolar and inspired oxygen tension falling with altitude at unchanged inspired oxygen fraction">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(yMaks * f).toFixed(0)}</text>
      ))}
      <path d={jalurPio} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" />
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(meter)} cy={y(kini)} r={4} fill="#00BF63" />
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">mmHg</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Altitude (m)
      </text>
      <text x={x(meter) + 6} y={y(kini) - 5} className="text-[8.5px] font-bold" fill="#00BF63">P<tspan dy="2">A</tspan><tspan dy="-2">O₂</tspan></text>
    </svg>
  )
}

export function GasAlveolarPanel() {
  const [fio2Persen, setFio2Persen] = useState<number>(21)
  const [paco2, setPaco2] = useState<number>(40)
  const [pao2Arteri, setPao2Arteri] = useState<number>(90)
  const [meter, setMeter] = useState<number>(0)
  const [usia, setUsia] = useState<number>(40)

  const fio2 = fio2Persen / 100
  const patm = tekananBarometrik(meter)
  const pio2 = tekananInspirasi(fio2, TETAPAN_GAS.PATM_LAUT)
  const pao2 = tekananAlveolar({ fio2, paco2 })
  const aa = selisihAa(pao2, pao2Arteri)
  const lazim = selisihAaLazimUsia(usia)

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">The alveolar gas equation</h3>
        <p className="text-[12px] leading-relaxed">
          Oxygen arriving at the alveolus is what is left after water vapour has saturated
          the inspired gas and carbon dioxide has taken up its share of the space. That
          makes low oxygen and failing gas exchange two separate things — and the difference
          between them is visible only as a shape. Both curves below are drawn by the same
          functions that print the numbers.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Alveolar oxygen and the A–a difference
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={pio2.toFixed(0)} satuan="mmHg" label="Inspired PIO₂" />
          <Angka nilai={pao2.toFixed(0)} satuan="mmHg" label="Alveolar PAO₂" />
          <Angka nilai={Number.isFinite(aa) ? aa.toFixed(0) : '—'} satuan="mmHg" label="A–a difference" />
        </div>

        <Geser label="Inspired oxygen fraction" nilai={fio2Persen} min={21} maks={100}
          onUbah={setFio2Persen} satuan="%" />
        <Geser label="Arterial PaCO₂" nilai={paco2} min={RENTANG_GAS.paco2.min} maks={RENTANG_GAS.paco2.maks}
          onUbah={setPaco2} satuan="mmHg" />
        <Geser label="Measured arterial PaO₂" nilai={pao2Arteri} min={RENTANG_GAS.pao2Arteri.min}
          maks={RENTANG_GAS.pao2Arteri.maks} onUbah={setPao2Arteri} satuan="mmHg" />

        <GrafikPaco2 fio2={fio2} paco2={paco2} pao2Arteri={pao2Arteri} />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {!Number.isFinite(aa)
            ? `An arterial PaO₂ of ${pao2Arteri} mmHg is above the computed alveolar tension of ${pao2.toFixed(0)} mmHg. On this single-compartment model that cannot happen, so no difference is printed rather than a negative one.`
            : `The slope of this line is exactly −1/R and does not depend on inspired oxygen at all: raising FiO₂ lifts the whole curve without tilting it. The orange bar is the A–a difference, and sliding PaCO₂ alone moves both ends of it together — its length never changes. That is the point. Hypoventilation lowers oxygen without damaging gas exchange, so a normal A–a difference in a hypoxaemic person points away from the lung, not at it.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Reference expectation with age
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={lazim.toFixed(1)} satuan="mmHg" label="Usual at this age" />
          <Angka nilai={Number.isFinite(aa) ? aa.toFixed(0) : '—'} satuan="mmHg" label="Computed here" />
        </div>
        <Geser label="Age" nilai={usia} min={RENTANG_GAS.usia.min} maks={RENTANG_GAS.usia.maks} onUbah={setUsia} satuan="years" />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The usual difference widens with age because ventilation–perfusion matching
          loosens, not because the lung is failing. This is a teaching reference drawn from
          population data on room air — it is not a normal range for any individual, not a
          threshold, and comparing a computed number against it decides nothing.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Altitude
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={patm.toFixed(0)} satuan="mmHg" label="Barometric" />
          <Angka nilai={tekananInspirasi(fio2, patm).toFixed(0)} satuan="mmHg" label="Inspired PIO₂" />
          <Angka nilai={tekananAlveolar({ fio2, paco2, patm }).toFixed(0)} satuan="mmHg" label="Alveolar PAO₂" />
        </div>
        <Geser label="Altitude" nilai={meter} min={RENTANG_GAS.ketinggian.min} maks={RENTANG_GAS.ketinggian.maks}
          langkah={100} onUbah={setMeter} satuan="m" />
        <GrafikKetinggian fio2={fio2} paco2={paco2} meter={meter} />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The fraction of oxygen in air does not change with altitude — twenty-one per cent
          all the way up. What falls is the total pressure it is a fraction of, and the
          fixed 47 mmHg of water vapour takes a larger share of what remains. At {meter} m
          the barometric pressure is {patm.toFixed(0)} mmHg against {TETAPAN_GAS.PATM_LAUT} at
          sea level, and the A–a difference is untouched by any of it.
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Mechanism only. Every figure is computed from values you supply — nothing is
          measured, nothing describes anyone's lungs, and no result here is a diagnosis, a
          severity grade, or a reason to give or withhold oxygen. The simplifications are
          deliberate and material: one well-mixed alveolar compartment, a respiratory
          quotient assumed at {TETAPAN_GAS.R_LAZIM} rather than measured, inspired gas taken
          as fully saturated at body temperature, and no shunt, diffusion or
          ventilation–perfusion model behind the A–a difference — it is a number the model
          cannot explain, only display.
        </p>
      </Prosa>
    </div>
  )
}
