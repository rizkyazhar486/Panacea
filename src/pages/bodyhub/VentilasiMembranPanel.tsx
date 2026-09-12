import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  ventilasiMenit, ventilasiAlveolar, fraksiRuangRugi, deretNapasCepatDangkal,
  potensialNernst, gayaDorong, arusMembran, deretArus, ION_RUJUKAN, RENTANG_VM,
} from '../../lib/ventilasiMembran'

// Panel ventilasi + membran tereksitasi untuk Body Exposure.
//
// Dua gambar, dua tanda. Yang pertama menahan ventilasi menit tetap dan
// membiarkan ventilasi alveolar runtuh -- kontras yang tidak bisa dibacakan,
// hanya bisa dilihat. Yang kedua menggambar arus terhadap tegangan supaya
// pembalikan tandanya di potensial balik terlihat sebagai perpotongan, bukan
// sebagai kalimat.
//
// Setiap kurva ditarik oleh fungsi yang sama yang mencetak angkanya.

const W = 320
const H = 190
const KIRI = 36
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

/** Gambar pertama: V̇E ditahan, V̇A runtuh. */
function GrafikNapas({ ve, vd, rr }: { ve: number; vd: number; rr: number }) {
  const deret = useMemo(() => deretNapasCepatDangkal(ve, vd, RENTANG_VM.rr.min, RENTANG_VM.rr.maks),
    [ve, vd])
  const yMaks = Math.max(ve * 1.15, 1)
  const x = (r: number) => KIRI + ((r - RENTANG_VM.rr.min) / (RENTANG_VM.rr.maks - RENTANG_VM.rr.min)) * (W - KIRI - KANAN)
  const y = (v: number) => H - BAWAH - (Math.max(0, v) / yMaks) * (H - BAWAH - ATAS)

  const jalurA = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.rr).toFixed(1)} ${y(t.alveolar).toFixed(1)}`).join(' ')
  const jalurE = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.rr).toFixed(1)} ${y(t.menit).toFixed(1)}`).join(' ')
  const kini = deret.reduce((a, b) => (Math.abs(b.rr - rr) < Math.abs(a.rr - rr) ? b : a), deret[0])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Alveolar ventilation falling as breathing becomes rapid and shallow at constant minute ventilation">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(yMaks * f).toFixed(1)}</text>
      ))}
      <path d={jalurE} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" />
      <path d={jalurA} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(kini.rr)} cy={y(kini.alveolar)} r={4} fill="#00BF63" />
      <circle cx={x(kini.rr)} cy={y(kini.menit)} r={3} fill="#94a3b8" />
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">L/min</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Breaths per minute
      </text>
      <text x={x(kini.rr) + 6} y={y(kini.menit) - 5} className="fill-current text-[8.5px] font-bold opacity-70">
        minute
      </text>
      <text x={x(kini.rr) + 6} y={y(kini.alveolar) - 5} className="text-[8.5px] font-bold" fill="#00BF63">
        alveolar
      </text>
    </svg>
  )
}

/** Gambar kedua: arus terhadap tegangan, dengan perpotongan nol di Erev. */
function GrafikArus({ g, erev, v }: { g: number; erev: number; v: number }) {
  const deret = useMemo(() => deretArus(g, erev, RENTANG_VM.v.min, RENTANG_VM.v.maks),
    [g, erev])
  // Skala TETAP terhadap konduktansi maksimum, bukan terhadap arus terbesar
  // yang sedang tampil. Menormalkan ke puncaknya sendiri akan membuat kurva
  // terlihat sama untuk setiap konduktansi -- justru menyembunyikan bahwa
  // konduktansilah yang menentukan kemiringannya.
  const rentang = Number.isFinite(erev)
    ? Math.max(Math.abs(RENTANG_VM.v.min - erev), Math.abs(RENTANG_VM.v.maks - erev))
    : RENTANG_VM.v.maks - RENTANG_VM.v.min
  const besar = Math.max(RENTANG_VM.g.maks * rentang, 1)
  const x = (mv: number) => KIRI + ((mv - RENTANG_VM.v.min) / (RENTANG_VM.v.maks - RENTANG_VM.v.min)) * (W - KIRI - KANAN)
  const y = (i: number) => (ATAS + H - BAWAH) / 2 - (i / besar) * ((H - BAWAH - ATAS) / 2)
  const jalur = deret.map((t, k) => `${k ? 'L' : 'M'}${x(t.v).toFixed(1)} ${y(t.i).toFixed(1)}`).join(' ')
  const iKini = arusMembran({ g, v, erev })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Membrane current against voltage, crossing zero at the reversal potential">
      <line x1={KIRI} y1={y(0)} x2={W - KANAN} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {Number.isFinite(erev) && (
        <>
          <line x1={x(erev)} y1={ATAS} x2={x(erev)} y2={H - BAWAH} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={x(erev) + 4} y={ATAS + 9} className="text-[8.5px] font-bold" fill="#f59e0b">E_rev</text>
        </>
      )}
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      {Number.isFinite(iKini) && <circle cx={x(v)} cy={y(iKini)} r={4} fill="#00BF63" />}
      <text x={KIRI + 4} y={y(0) - 4} className="fill-current text-[8.5px] font-bold opacity-60">outward +</text>
      <text x={KIRI + 4} y={y(0) + 11} className="fill-current text-[8.5px] font-bold opacity-60">inward −</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Membrane voltage (mV)
      </text>
    </svg>
  )
}

export function VentilasiMembranPanel() {
  const [rr, setRr] = useState<number>(12)
  const [vt, setVt] = useState<number>(500)
  const [vd, setVd] = useState<number>(150)
  const [ve, setVe] = useState<number>(6)

  const [ionId, setIonId] = useState<string>('k')
  const [suhuC, setSuhuC] = useState<number>(37)
  const [g, setG] = useState<number>(10)
  const [v, setV] = useState<number>(-70)

  const menit = ventilasiMenit(rr, vt)
  const alveolar = ventilasiAlveolar({ rr, vt, vd })
  const fraksi = fraksiRuangRugi(vt, vd)

  const ion = ION_RUJUKAN.find((i) => i.id === ionId) ?? ION_RUJUKAN[0]
  const erev = potensialNernst({ luar: ion.luar, dalam: ion.dalam, z: ion.z, suhuC })
  const dorong = gayaDorong(v, erev)
  const arus = arusMembran({ g, v, erev })

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Ventilation and the excitable membrane</h3>
        <p className="text-[12px] leading-relaxed">
          Two mechanisms that a printed formula cannot teach, because in both of them the
          answer hides in a subtraction. Dead space is subtracted from every breath, so
          breathing faster and shallower can leave minute ventilation untouched while
          alveolar ventilation collapses. Current is driven by a difference, so it reverses
          direction as voltage crosses the equilibrium potential. Both curves below are
          drawn by the same functions that print the numbers.
        </p>
      </Prosa>

      {/* ── Ventilasi ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Minute versus alveolar ventilation
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={menit.toFixed(2)} satuan="L/min" label="Minute V̇E" />
          <Angka nilai={alveolar.toFixed(2)} satuan="L/min" label="Alveolar V̇A" />
          <Angka nilai={Number.isFinite(fraksi) ? fraksi.toFixed(2) : '—'} label="VD/VT" />
        </div>

        <Geser label="Respiratory rate" nilai={rr} min={RENTANG_VM.rr.min} maks={RENTANG_VM.rr.maks} onUbah={setRr} satuan="/min" />
        <Geser label="Tidal volume" nilai={vt} min={RENTANG_VM.vt.min} maks={RENTANG_VM.vt.maks} langkah={10} onUbah={setVt} satuan="mL" />
        <Geser label="Anatomical dead space" nilai={vd} min={RENTANG_VM.vd.min} maks={RENTANG_VM.vd.maks} langkah={10} onUbah={setVd} satuan="mL" />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {vt <= vd
            ? `A breath of ${vt} mL never reaches past ${vd} mL of dead space, so alveolar ventilation is zero — not negative. Minute ventilation still reads ${menit.toFixed(2)} L/min, which is exactly why the gross figure is not the mechanism.`
            : `Of every ${vt} mL breath, ${vd} mL only refills conducting airway; ${vt - vd} mL reaches gas-exchanging lung. Dead space is subtracted once per breath, so its cost rises with rate, not with volume.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Held at constant minute ventilation
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Along this curve tidal volume is forced to follow rate so their product never
          changes. The dashed line is minute ventilation and it does not move. The solid
          line is alveolar ventilation.
        </p>
        <GrafikNapas ve={ve} vd={vd} rr={rr} />
        <Geser label="Minute ventilation held at" nilai={ve} min={RENTANG_VM.ve.min} maks={RENTANG_VM.ve.maks} onUbah={setVe} satuan="L/min" />
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          At {rr}/min the implied tidal volume is {((ve * 1000) / rr).toFixed(0)} mL and
          alveolar ventilation is {deretNapasCepatDangkal(ve, vd, rr, rr, 1)[0].alveolar.toFixed(2)} L/min,
          against {ve.toFixed(1)} L/min of minute ventilation.
        </p>
      </div>

      {/* ── Membran ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Equilibrium potential and driving force
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {ION_RUJUKAN.map((i) => (
            <button key={i.id} type="button" onClick={() => setIonId(i.id)}
              className={`rounded-xl px-2.5 py-1.5 text-[11px] font-black transition ${
                i.id === ionId
                  ? 'bg-brand text-white'
                  : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.05))] text-ink dark:text-white'}`}>
              {i.nama}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={Number.isFinite(erev) ? erev.toFixed(1) : '—'} satuan="mV" label="Nernst E" />
          <Angka nilai={Number.isFinite(dorong) ? dorong.toFixed(1) : '—'} satuan="mV" label="V − E" />
          <Angka nilai={Number.isFinite(arus) ? arus.toFixed(0) : '—'} satuan="pA" label="Current" />
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {ion.nama} sits at {ion.luar} mmol/L outside and {ion.dalam} mmol/L inside with a
          valence of {ion.z}. Nothing here is stored as an answer: the potential is computed
          from that gradient, the temperature and the valence, which is why halving the
          valence doubles it and why cooling shrinks it.
        </p>

        <Geser label="Temperature" nilai={suhuC} min={RENTANG_VM.suhuC.min} maks={RENTANG_VM.suhuC.maks} onUbah={setSuhuC} satuan="°C" />
        <Geser label="Conductance" nilai={g} min={RENTANG_VM.g.min} maks={RENTANG_VM.g.maks} onUbah={setG} satuan="nS" />
        <Geser label="Membrane voltage" nilai={v} min={RENTANG_VM.v.min} maks={RENTANG_VM.v.maks} onUbah={setV} satuan="mV" />

        <GrafikArus g={g} erev={erev} v={v} />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {!Number.isFinite(erev)
            ? 'With no usable gradient there is no equilibrium potential, so no current is defined.'
            : Math.abs(dorong) < 1e-9
              ? 'At the reversal potential the driving force is zero, so the current is exactly zero — the ion still crosses, but equally in both directions.'
              : dorong > 0
                ? `Voltage sits ${dorong.toFixed(1)} mV above the equilibrium potential, so the flux carries positive charge outward. Conductance sets the slope of the line, never where it crosses zero.`
                : `Voltage sits ${Math.abs(dorong).toFixed(1)} mV below the equilibrium potential, so the current runs inward. Cross the crossing point and the sign flips; the magnitude alone would have told you nothing.`}
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Mechanism only. Computes from values you supply — not a measurement, not a
          diagnosis, and it describes no one's lungs or nerves. Simplifications are
          deliberate and material: a single well-mixed compartment, a fixed anatomical dead
          space taken as an input rather than measured, no coupling to gas exchange or
          carbon dioxide, and no airway mechanics. The Nernst potential describes one ion
          at equilibrium; it is not a membrane potential, which depends on several
          conductances at once. The current relation is ohmic by assumption, so real
          rectification is absent.
        </p>
      </Prosa>
    </div>
  )
}
