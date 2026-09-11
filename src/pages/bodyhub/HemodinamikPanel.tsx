import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  kandunganOksigen, isiSekuncup, curahJantung, fraksiEjeksi,
  hantaranOksigen, konsumsiOksigenFick, rasioEkstraksiOksigen,
  RUJUKAN_HEMODINAMIK as R,
} from '../../lib/hemodinamik'

// Panel hemodinamika: dari volume bilik sampai oksigen yang benar-benar
// sampai ke jaringan.
//
// Rantainya yang menjadi pelajaran, bukan tiap rumusnya sendiri-sendiri.
// Anemia dan curah jantung rendah tiba di kekurangan yang sama lewat jalan
// yang sama sekali berbeda, dan itu hanya terlihat kalau keduanya dihitung
// pada rantai yang sama.

function Baris({ label, nilai, satuan, tebal }: { label: string; nilai: string; satuan: string; tebal?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${tebal ? 'border-t border-neutral-200 pt-1.5 dark:border-white/10' : ''}`}>
      <span className={`text-[11.5px] ${tebal ? 'font-black text-ink dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{label}</span>
      <span className={`font-[var(--font-angka)] text-[12.5px] ${tebal ? 'font-black text-ink dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
        {nilai}<span className="ml-1 text-[9.5px] opacity-60">{satuan}</span>
      </span>
    </div>
  )
}

function Geser({ label, nilai, min, maks, step = 1, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; step?: number; onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={step} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))} aria-label={label}
        className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

export function HemodinamikPanel() {
  const [hr, setHr] = useState<number>(R.denyutPerMenit)
  const [edv, setEdv] = useState<number>(R.volumeAkhirDiastol)
  const [esv, setEsv] = useState<number>(R.volumeAkhirSistol)
  const [hb, setHb] = useState<number>(R.hemoglobin)
  const [sao2, setSao2] = useState<number>(Math.round(R.saturasiArteri * 100))

  const h = useMemo(() => {
    const sv = Math.max(0, isiSekuncup(edv, esv))
    const co = curahJantung(hr, sv)
    const caO2 = kandunganOksigen(hb, sao2 / 100, R.tekananParsialArteri)
    const cvO2 = kandunganOksigen(hb, R.saturasiVena, R.tekananParsialVena)
    const do2 = hantaranOksigen(co, caO2)
    const vo2 = konsumsiOksigenFick(co, caO2, cvO2)
    return { sv, co, ef: fraksiEjeksi(sv, edv), caO2, do2, vo2, o2er: rasioEkstraksiOksigen(vo2, do2) }
  }, [hr, edv, esv, hb, sao2])

  // Ambang ini adalah penanda PENGAJARAN, bukan ambang klinis: ia menandai
  // titik ketika hantaran turun jauh di bawah rujukan dewasa istirahat, bukan
  // titik ketika seseorang perlu ditangani.
  const rendah = h.do2 < 600

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">From chamber volumes to oxygen delivered</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Seven steps, each one computed from the one before. The point is the chain: anaemia and a weak
          pump arrive at the same shortfall by completely different routes, and that only shows when both
          run through the same arithmetic. Nothing here is measured from a person.
        </Prosa>
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Geser label="Heart rate" nilai={hr} min={35} maks={180} onUbah={setHr} satuan="/min" />
        <Geser label="End-diastolic volume" nilai={edv} min={60} maks={220} onUbah={setEdv} satuan="mL" />
        <Geser label="End-systolic volume" nilai={esv} min={20} maks={200} onUbah={setEsv} satuan="mL" />
        <Geser label="Haemoglobin" nilai={hb} min={4} maks={20} step={0.5} onUbah={setHb} satuan="g/dL" />
        <Geser label="Arterial saturation" nilai={sao2} min={60} maks={100} onUbah={setSao2} satuan="%" />
      </div>

      <div className="space-y-1.5 rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Baris label="Stroke volume = EDV − ESV" nilai={h.sv.toFixed(0)} satuan="mL" />
        <Baris label="Ejection fraction = SV / EDV" nilai={(h.ef * 100).toFixed(0)} satuan="%" />
        <Baris label="Cardiac output = HR × SV" nilai={h.co.toFixed(2)} satuan="L/min" />
        <Baris label="Arterial content = 1.34·Hb·SaO₂ + 0.003·PaO₂" nilai={h.caO2.toFixed(1)} satuan="mL/dL" />
        <Baris label="Oxygen delivery = CO × CaO₂ × 10" nilai={h.do2.toFixed(0)} satuan="mL/min" tebal />
        <Baris label="Consumption (Fick)" nilai={h.vo2.toFixed(0)} satuan="mL/min" />
        <Baris label="Extraction ratio" nilai={(h.o2er * 100).toFixed(0)} satuan="%" />
      </div>

      {rendah && (
        <p className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-3 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
          Delivery is now well below the resting adult reference. Notice it can be reached by dropping
          haemoglobin, saturation, or the pump — the body cares about the product, not which term fell.
          This marks a teaching threshold, not a clinical one, and implies nothing about treatment.
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-neutral-500">
        Venous saturation is held at the reference value, so consumption here follows delivery rather
        than being set independently; a real circulation adjusts extraction to defend it. There is no
        autoregulation, no regional distribution, and no oxyhaemoglobin dissociation curve in this model.
      </p>
    </div>
  )
}

export default HemodinamikPanel
