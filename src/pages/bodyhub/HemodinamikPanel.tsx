import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  kandunganOksigen, isiSekuncup, curahJantung, fraksiEjeksi,
  hantaranOksigen, konsumsiOksigenFick, rasioEkstraksiOksigen,
  RUJUKAN_HEMODINAMIK as R,
  BILIK_RUJUKAN, volumeAkhirSistolik, lingkarTekananVolume, kerjaSekuncup, tekananPasif,
  tekananAkhirSistolik, type ParameterBilik,
} from '../../lib/hemodinamik'

// Panel hemodinamika: dari volume bilik sampai oksigen yang benar-benar
// sampai ke jaringan.
//
// Rantainya yang menjadi pelajaran, bukan tiap rumusnya sendiri-sendiri.
// Anemia dan curah jantung rendah tiba di kekurangan yang sama lewat jalan
// yang sama sekali berbeda, dan itu hanya terlihat kalau keduanya dihitung
// pada rantai yang sama.

/** Batas penggeser, satu sumber untuk panel dan untuk ujinya. */
export const RENTANG_HEMODINAMIK = {
  denyut: { min: 35, maks: 180 },
  volumeAkhirDiastol: { min: 60, maks: 220 },
  volumeAkhirSistol: { min: 20, maks: 200 },
  hemoglobin: { min: 4, maks: 20 },
  saturasiArteri: { min: 60, maks: 100 },
  afterload: { min: 40, maks: 200 },
  ees: { min: 0.6, maks: 6 },
} as const

/** Masukan sebuah kasus terpandu: persis ketujuh penggeser, tidak lebih. */
export interface MasukanHemodinamik {
  denyut: number
  volumeAkhirDiastol: number
  volumeAkhirSistol: number
  hemoglobin: number
  saturasiArteri: number
  afterload: number
  ees: number
}

export interface KasusHemodinamik {
  judul: string
  ajakan: string
  masukan: MasukanHemodinamik
  pelajaran: string
}

// Kasus memuat MASUKAN saja. Isi sekuncup, curah jantung, kandungan oksigen,
// hantaran, konsumsi dan rasio ekstraksi tetap dihitung mesin sepanjang rantai
// yang sama. Menyimpan jawabannya di sini akan membuat tutorialnya tetap tampak
// benar sesudah rantainya rusak -- kebalikan dari mengajar.
export const KASUS_HEMODINAMIK: KasusHemodinamik[] = [
  {
    judul: 'Case 1 \u00b7 Anaemia with a normal pump',
    ajakan: 'Haemoglobin 6 g/dL; rate, volumes and saturation all left at their reference values.',
    masukan: {
      denyut: 70, volumeAkhirDiastol: 120, volumeAkhirSistol: 50,
      hemoglobin: 6, saturasiArteri: 98, afterload: 90, ees: 2.3,
    },
    pelajaran: 'Cardiac output, ejection fraction and saturation are all untouched and all normal — and '
      + 'delivery has still collapsed, because delivery is a product and one term fell. Reading the pump '
      + 'numbers alone would have called this circulation fine.',
  },
  {
    judul: 'Case 2 \u00b7 Afterload raised against the same heart',
    ajakan: 'Aortic pressure 170 mmHg with contractility unchanged — watch the loop, not just the numbers.',
    masukan: {
      denyut: 70, volumeAkhirDiastol: 120, volumeAkhirSistol: 50,
      hemoglobin: 15, saturasiArteri: 98, afterload: 170, ees: 2.3,
    },
    pelajaran: 'The ventricle now closes higher up the same ESPVR line, so it ejects less from the same '
      + 'filling: the loop grows taller and narrower and stroke work rises for less output. Raise '
      + 'contractility instead and the line itself rotates, which is a different change altogether.',
  },
]

function Angka2({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/60 px-2.5 py-1.5 dark:bg-white/[0.05]">
      <div className="font-[var(--font-angka)] text-[14px] font-black leading-none text-ink dark:text-white">
        {nilai}{satuan && <span className="ml-0.5 text-[9px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-neutral-500">{label}</div>
    </div>
  )
}

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


/**
 * Lingkar tekanan-volume yang berjalan.
 *
 * Penanda bergerak mengelilingi lintasan dalam waktu nyata, jadi keempat fase
 * siklus terlihat sebagai gerakan, bukan sebagai daftar. Garis ESPVR dan
 * EDPVR ikut digambar karena di situlah letak pelajarannya: menaikkan
 * kontraktilitas memutar ESPVR, menaikkan afterload menggeser titik potongnya
 * di sepanjang garis yang sama, dan menaikkan preload hanya melebarkan
 * lingkarnya ke kanan tanpa menyentuh ESPVR sama sekali.
 */
function LingkarPV({ bilik, berjalan }: { bilik: ParameterBilik; berjalan: boolean }) {
  const [fase, setFase] = useState(0)
  const rafRef = useRef(0)
  const jamRef = useRef(0)

  const lingkar = useMemo(() => lingkarTekananVolume(bilik), [bilik])
  const esv = volumeAkhirSistolik(bilik)

  useEffect(() => {
    if (!berjalan) return
    let batal = false
    const jalan = (t: number) => {
      if (batal) return
      const lalu = jamRef.current || t
      jamRef.current = t
      // Satu siklus penuh kira-kira 0,9 detik, seperti denyut istirahat.
      setFase((f) => (f + Math.min(0.1, (t - lalu) / 1000) / 0.9) % 1)
      rafRef.current = requestAnimationFrame(jalan)
    }
    rafRef.current = requestAnimationFrame(jalan)
    return () => { batal = true; cancelAnimationFrame(rafRef.current); jamRef.current = 0 }
  }, [berjalan])

  const L = 320, H = 210
  const vMaks = Math.max(200, bilik.volumeAkhirDiastol + 30)
  const pMaks = Math.max(180, bilik.afterload + 50)
  const x = (v: number) => 34 + (v / vMaks) * (L - 46)
  const y = (p: number) => H - 26 - (p / pMaks) * (H - 42)

  const d = lingkar.map((t, i) => `${i === 0 ? 'M' : 'L'}${x(t.volume).toFixed(1)} ${y(t.tekanan).toFixed(1)}`).join(' ') + ' Z'
  const kini = lingkar[Math.min(lingkar.length - 1, Math.floor(fase * lingkar.length))]

  // ESPVR: garis lurus dari V0, dipotong di afterload.
  const vEspvr = bilik.v0 + pMaks / bilik.ees
  // EDPVR: kurva pengisian pasif.
  const edpvr: string[] = []
  for (let i = 0; i <= 40; i++) {
    const v = bilik.v0 + ((vMaks - bilik.v0) * i) / 40
    edpvr.push(`${i === 0 ? 'M' : 'L'}${x(v).toFixed(1)} ${y(Math.min(pMaks, tekananPasif(v, bilik))).toFixed(1)}`)
  }

  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Pressure-volume loop. End-systolic volume ${esv.toFixed(0)} millilitres, stroke volume ${(bilik.volumeAkhirDiastol - esv).toFixed(0)} millilitres.`}>
      <line x1="34" y1={H - 26} x2={L - 12} y2={H - 26} stroke="currentColor" strokeOpacity="0.25" />
      <line x1="34" y1="16" x2="34" y2={H - 26} stroke="currentColor" strokeOpacity="0.25" />
      <path d={edpvr.join(' ')} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.4" strokeDasharray="4 3" />
      <line x1={x(bilik.v0)} y1={y(0)} x2={x(Math.min(vMaks, vEspvr))} y2={y(pMaks)}
        stroke="#FF5A1F" strokeWidth="1.6" strokeDasharray="5 3" opacity="0.9" />
      <text x={L - 12} y="24" textAnchor="end" className="fill-current text-[8.5px] font-bold" opacity="0.8" style={{ fill: '#FF5A1F' }}>ESPVR</text>
      <path d={d} fill="rgba(0,191,99,0.12)" stroke="#00BF63" strokeWidth="2.4" strokeLinejoin="round" />
      {kini && <circle cx={x(kini.volume)} cy={y(kini.tekanan)} r="5" fill="#00BF63" stroke="#fff" strokeWidth="1.5" />}
      <text x="4" y="20" className="fill-current text-[8.5px]" opacity="0.65">{pMaks.toFixed(0)}</text>
      <text x="8" y={H - 28} className="fill-current text-[8.5px]" opacity="0.65">0</text>
      <text x={L - 12} y={H - 12} textAnchor="end" className="fill-current text-[8.5px]" opacity="0.65">volume (mL)</text>
      <text x="4" y="12" className="fill-current text-[8.5px]" opacity="0.65">mmHg</text>
    </svg>
  )
}

export function HemodinamikPanel() {
  const [hr, setHr] = useState<number>(R.denyutPerMenit)
  const [edv, setEdv] = useState<number>(R.volumeAkhirDiastol)
  const [esv, setEsv] = useState<number>(R.volumeAkhirSistol)
  const [hb, setHb] = useState<number>(R.hemoglobin)
  const [sao2, setSao2] = useState<number>(Math.round(R.saturasiArteri * 100))
  const [afterload, setAfterload] = useState<number>(BILIK_RUJUKAN.afterload)
  const [ees, setEes] = useState<number>(BILIK_RUJUKAN.ees)
  const [berjalan, setBerjalan] = useState(true)
  const [pelajaran, setPelajaran] = useState<string | null>(null)

  // Kasus hanya MENGISI penggeser; tidak ada hasil rantai yang ikut dipasang.
  function jalankanKasus(k: KasusHemodinamik) {
    setHr(k.masukan.denyut)
    setEdv(k.masukan.volumeAkhirDiastol)
    setEsv(k.masukan.volumeAkhirSistol)
    setHb(k.masukan.hemoglobin)
    setSao2(k.masukan.saturasiArteri)
    setAfterload(k.masukan.afterload)
    setEes(k.masukan.ees)
    setPelajaran(k.pelajaran)
  }

  // Bilik memakai EDV yang sama dengan penggeser di atas, sehingga lingkarnya
  // dan angka-angkanya tidak bisa menceritakan dua hal yang berbeda.
  const bilik = useMemo(() => ({ ...BILIK_RUJUKAN, afterload, ees, volumeAkhirDiastol: edv }), [afterload, ees, edv])
  const esvLingkar = volumeAkhirSistolik(bilik)
  const kerja = useMemo(() => kerjaSekuncup(lingkarTekananVolume(bilik)), [bilik])

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

      {/* Tutorial: kasus yang benar-benar menjalankan alatnya. */}
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Learn by running one</p>
        <div className="mt-2 grid gap-1.5">
          {KASUS_HEMODINAMIK.map((k) => (
            <button key={k.judul} type="button" onClick={() => jalankanKasus(k)}
              className="rounded-xl bg-white/75 p-2.5 text-left transition hover:bg-white dark:bg-white/[.055] dark:hover:bg-white/[.09]">
              <div className="text-[11.5px] font-black text-ink dark:text-white">{k.judul}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{k.ajakan}</div>
            </button>
          ))}
        </div>
        {pelajaran && (
          <p className="mt-2 rounded-xl bg-white/80 p-2.5 text-[11.5px] leading-relaxed text-neutral-700 dark:bg-white/[.06] dark:text-neutral-200">
            {pelajaran}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Geser label="Heart rate" nilai={hr} min={RENTANG_HEMODINAMIK.denyut.min} maks={RENTANG_HEMODINAMIK.denyut.maks} onUbah={setHr} satuan="/min" />
        <Geser label="End-diastolic volume" nilai={edv} min={RENTANG_HEMODINAMIK.volumeAkhirDiastol.min} maks={RENTANG_HEMODINAMIK.volumeAkhirDiastol.maks} onUbah={setEdv} satuan="mL" />
        <Geser label="End-systolic volume" nilai={esv} min={RENTANG_HEMODINAMIK.volumeAkhirSistol.min} maks={RENTANG_HEMODINAMIK.volumeAkhirSistol.maks} onUbah={setEsv} satuan="mL" />
        <Geser label="Haemoglobin" nilai={hb} min={RENTANG_HEMODINAMIK.hemoglobin.min} maks={RENTANG_HEMODINAMIK.hemoglobin.maks} step={0.5} onUbah={setHb} satuan="g/dL" />
        <Geser label="Arterial saturation" nilai={sao2} min={RENTANG_HEMODINAMIK.saturasiArteri.min} maks={RENTANG_HEMODINAMIK.saturasiArteri.maks} onUbah={setSao2} satuan="%" />
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Pressure–volume loop</p>
          <button type="button" onClick={() => setBerjalan((x) => !x)}
            className="min-h-[30px] rounded-full border border-neutral-200 px-3 text-[11px] font-black text-ink dark:border-white/10 dark:text-white">
            {berjalan ? 'Pause' : 'Run'}
          </button>
        </div>
        <LingkarPV bilik={bilik} berjalan={berjalan} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka2 nilai={esvLingkar.toFixed(0)} satuan="mL" label="End-systolic" />
          <Angka2 nilai={(edv - esvLingkar).toFixed(0)} satuan="mL" label="Loop width = SV" />
          <Angka2 nilai={(kerja / 1000).toFixed(1)} satuan="J·10⁻³" label="Stroke work" />
        </div>
        <Geser label="Afterload (aortic pressure)" nilai={afterload} min={RENTANG_HEMODINAMIK.afterload.min} maks={RENTANG_HEMODINAMIK.afterload.maks} onUbah={setAfterload} satuan="mmHg" />
        <Geser label="Contractility (Ees)" nilai={ees} min={RENTANG_HEMODINAMIK.ees.min} maks={RENTANG_HEMODINAMIK.ees.maks} step={0.1} onUbah={setEes} satuan="mmHg/mL" />
        <Prosa kelas="mt-2 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Three levers, three different deformations. Afterload slides the closing point up the orange
          ESPVR line, so the loop gets taller and narrower. Contractility rotates that line, so the same
          afterload now closes at a smaller volume. Preload widens the loop to the right and leaves the
          line untouched — that last one is Frank–Starling, and it falls out of the geometry rather than
          being added on top.
        </Prosa>
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
