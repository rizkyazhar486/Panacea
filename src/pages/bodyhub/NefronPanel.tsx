import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  tekananUltrafiltrasi, gfrDariStarling, fraksiFiltrasi, klirens,
  neracaTubulus, ekskresiFraksional, RUJUKAN,
} from '../../lib/nefron'

// Panel nefron untuk Body Exposure.
//
// Halaman fisiologi sudah menampilkan rumus klirens dan fraksi filtrasi
// sebagai teks. Rumus yang hanya ditulis tidak bisa dibantah: tidak ada yang
// bisa dimasukkan dan tidak ada yang bisa keluar salah. Di sini gaya Starling
// benar-benar digerakkan, dan GFR-nya ikut.

/** Batas penggeser, satu sumber untuk panel dan untuk ujinya. */
export const RENTANG_NEFRON = {
  hidrostatikKapiler: { min: 20, maks: 80 },
  hidrostatikBowman: { min: 5, maks: 45 },
  onkotikKapiler: { min: 10, maks: 55 },
} as const

/** Masukan sebuah kasus terpandu: persis ketiga penggeser, tidak lebih. */
export interface MasukanNefron {
  hidrostatikKapiler: number
  hidrostatikBowman: number
  onkotikKapiler: number
}

export interface KasusNefron {
  judul: string
  ajakan: string
  masukan: MasukanNefron
  pelajaran: string
}

// Kasus memuat MASUKAN saja. Tekanan neto, GFR dan fraksi filtrasi tetap
// dihitung mesin dari gaya Starling. Menyimpan jawabannya di sini akan membuat
// tutorialnya tetap tampak benar sesudah mesinnya rusak -- kebalikan mengajar.
export const KASUS_NEFRON: KasusNefron[] = [
  {
    judul: 'Case 1 \u00b7 Hypotension at the glomerulus',
    ajakan: 'Capillary hydrostatic pressure falls to 40 mmHg; the other two forces are unchanged.',
    masukan: { hidrostatikKapiler: 40, hidrostatikBowman: 18, onkotikKapiler: 32 },
    pelajaran: 'Only the driving force moved, and it moved by a third — yet filtration falls much '
      + 'further than a third, because what is left over is a small difference between large numbers. '
      + 'That sensitivity is the whole reason the kidney autoregulates, and this model has no '
      + 'autoregulation to hide it.',
  },
  {
    judul: 'Case 2 \u00b7 Obstructed outflow',
    ajakan: "Bowman's space pressure rises to 32 mmHg behind a blocked ureter; nothing upstream changes.",
    masukan: { hidrostatikKapiler: 60, hidrostatikBowman: 32, onkotikKapiler: 32 },
    pelajaran: 'Nothing about the blood supply changed here. Pressure built up downstream instead, and '
      + 'it opposes filtration exactly as oncotic pressure does — which is why an obstruction below the '
      + 'kidney lowers the filtration rate above it. Push it further and the flow stops on screen.',
  },
]

function Angka({ nilai, satuan, label, nada }: { nilai: string; satuan?: string; label: string; nada?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight" style={{ color: nada }}>
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

function Geser({ label, nilai, min, maks, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={1} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}


/**
 * Glomerulus sebagai tiga gaya yang saling melawan, dengan filtrat yang
 * benar-benar mengalir.
 *
 * Versi pertama panel ini hanya deretan angka dan penggeser. Angka tidak
 * memperlihatkan bahwa filtrasi adalah SISA dari tarik-menarik: satu tekanan
 * mendorong keluar, dua menahan masuk, dan yang tersisa itulah yang menjadi
 * urin. Panjang panah di bawah sebanding dengan besarnya masing-masing, dan
 * laju tetesnya sebanding dengan GFR yang benar-benar dihitung -- jadi ketika
 * tekanan neto mencapai nol, aliran itu berhenti di layar, bukan sekadar
 * berubah menjadi angka nol di suatu tempat.
 */
function GlomerulusSvg({ starling, gfr, berjalan }: {
  starling: { hidrostatikKapiler: number; hidrostatikBowman: number; onkotikKapiler: number }
  gfr: number
  berjalan: boolean
}) {
  const [fase, setFase] = useState(0)
  const rafRef = useRef(0)
  const jamRef = useRef(0)

  useEffect(() => {
    if (!berjalan || gfr <= 0) return
    let batal = false
    const jalan = (t: number) => {
      if (batal) return
      const lalu = jamRef.current || t
      jamRef.current = t
      const dt = Math.min(0.1, (t - lalu) / 1000)
      // Laju tetes sebanding dengan GFR: 125 mL/menit menjadi satu putaran
      // penuh kira-kira tiap 1,6 detik.
      setFase((f) => (f + dt * (gfr / 200)) % 1)
      rafRef.current = requestAnimationFrame(jalan)
    }
    rafRef.current = requestAnimationFrame(jalan)
    return () => { batal = true; cancelAnimationFrame(rafRef.current); jamRef.current = 0 }
  }, [berjalan, gfr])

  const L = 320, H = 190
  const cx = 108, cy = 78, r = 40
  const skala = 1.05  // piksel per mmHg

  // Tiga panah dari dinding kapiler. Keluar ke kanan, masuk dari kanan.
  const panah = (y: number, panjang: number, keluar: boolean, warna: string, label: string) => {
    const x0 = cx + r + 6
    const x1 = x0 + Math.max(6, panjang)
    const dari = keluar ? x0 : x1
    const ke = keluar ? x1 : x0
    return (
      <g key={label}>
        <line x1={dari} y1={y} x2={ke} y2={y} stroke={warna} strokeWidth="3" strokeLinecap="round" />
        <polygon points={`${ke},${y} ${ke + (keluar ? -6 : 6)},${y - 4} ${ke + (keluar ? -6 : 6)},${y + 4}`} fill={warna} />
        <text x={x1 + 8} y={y + 3.5} className="fill-current text-[8.5px] font-bold" opacity="0.8">{label}</text>
      </g>
    )
  }

  const berhenti = gfr <= 0
  // Tetes filtrat menyusuri kapsul lalu masuk tubulus.
  const tetes = [0, 0.25, 0.5, 0.75].map((offset) => {
    const f = (fase + offset) % 1
    const x = cx + r + 10 + f * 150
    const y = cy + 34 + Math.sin(f * Math.PI * 2) * 3
    return { x, y, key: offset }
  })

  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Glomerulus with three opposing Starling pressures. Filtration rate ${gfr.toFixed(0)} millilitres per minute.`}>
      {/* Kapsul Bowman */}
      <circle cx={cx} cy={cy} r={r + 13} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
      {/* Rumbai kapiler */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,90,31,0.14)" stroke="#FF5A1F" strokeWidth="2" />
      <text x={cx} y={cy + 3} textAnchor="middle" className="fill-current text-[9px] font-black" opacity="0.75">capillary</text>

      {panah(cy - 16, starling.hidrostatikKapiler * skala * 0.5, true, '#00BF63', `P${'\u0067'}c ${starling.hidrostatikKapiler}`)}
      {panah(cy + 2, starling.onkotikKapiler * skala * 0.5, false, '#FF3131', `${'\u03C0'} ${starling.onkotikKapiler}`)}
      {panah(cy + 20, starling.hidrostatikBowman * skala * 0.5, false, '#b45309', `Pbs ${starling.hidrostatikBowman}`)}

      {/* Tubulus proksimal */}
      <path d={`M${cx + r + 8} ${cy + 40} L${L - 34} ${cy + 40} Q${L - 14} ${cy + 40} ${L - 14} ${cy + 60} L${L - 14} ${H - 14}`}
        fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="9" strokeLinecap="round" />
      <text x={L - 30} y={H - 4} textAnchor="end" className="fill-current text-[8.5px] font-bold" opacity="0.7">tubule</text>

      {!berhenti && tetes.map((t) => (
        <circle key={t.key} cx={t.x} cy={t.y} r="3.4" fill="#00BF63" opacity="0.9" />
      ))}
      {berhenti && (
        <text x={cx + r + 20} y={cy + 44} className="fill-current text-[9.5px] font-black" style={{ fill: '#FF3131' }}>
          filtration stopped
        </text>
      )}
    </svg>
  )
}

export function NefronPanel() {
  const [pGc, setPGc] = useState(RUJUKAN.starling.hidrostatikKapiler)
  const [pBs, setPBs] = useState(RUJUKAN.starling.hidrostatikBowman)
  const [piGc, setPiGc] = useState(RUJUKAN.starling.onkotikKapiler)
  const [pelajaran, setPelajaran] = useState<string | null>(null)

  // Kasus hanya MENGISI ketiga penggeser; tidak ada hasil yang ikut dipasang.
  function jalankanKasus(k: KasusNefron) {
    setPGc(k.masukan.hidrostatikKapiler)
    setPBs(k.masukan.hidrostatikBowman)
    setPiGc(k.masukan.onkotikKapiler)
    setPelajaran(k.pelajaran)
  }

  const starling = useMemo(() => ({
    hidrostatikKapiler: pGc, hidrostatikBowman: pBs, onkotikKapiler: piGc,
  }), [pGc, pBs, piGc])

  const pUf = tekananUltrafiltrasi(starling)
  const gfr = gfrDariStarling(starling, RUJUKAN.kf)
  const ff = fraksiFiltrasi(gfr, RUJUKAN.alirPlasmaGinjal)

  // Natrium sebagai contoh penanganan tubulus, dengan angka plasma/urin tetap.
  const natrium = useMemo(() => {
    const plasma = 140, urin = 70, alirUrin = 1
    const n = neracaTubulus(gfr, plasma, urin, alirUrin)
    const fe = ekskresiFraksional(klirens(urin, alirUrin, plasma), gfr)
    return { ...n, fe }
  }, [gfr])

  const berhenti = gfr === 0
  const [berjalan, setBerjalan] = useState(true)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Glomerular filtration, from the forces</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          GFR is not a property the kidney has; it is what three pressures leave over. Move any of them
          and watch filtration follow. Nothing here is measured from a person, and this does not estimate
          anyone&apos;s kidney function.
        </Prosa>
      </div>

      {/* Tutorial: kasus yang benar-benar menjalankan alatnya. */}
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Learn by running one</p>
        <div className="mt-2 grid gap-1.5">
          {KASUS_NEFRON.map((k) => (
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
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Three forces, one remainder</p>
          <button type="button" onClick={() => setBerjalan((x) => !x)}
            className="min-h-[30px] rounded-full border border-neutral-200 px-3 text-[11px] font-black text-ink dark:border-white/10 dark:text-white">
            {berjalan ? 'Pause' : 'Run'}
          </button>
        </div>
        <GlomerulusSvg starling={starling} gfr={gfr} berjalan={berjalan} />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Arrow length is each pressure to scale; the drops move at a rate set by the filtration this
          balance actually leaves over. Push the opposing pair past the driving one and the flow stops on
          screen rather than turning into a zero somewhere.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Angka nilai={pUf.toFixed(0)} satuan="mmHg" label="Net pressure" nada={pUf <= 0 ? '#FF3131' : undefined} />
        <Angka nilai={gfr.toFixed(0)} satuan="mL/min" label="GFR" />
        <Angka nilai={(ff * 100).toFixed(1)} satuan="%" label="Filtration fraction" />
      </div>

      {berhenti && (
        <p className="rounded-2xl border border-[#FF3131]/40 bg-[#FF3131]/[0.08] p-3 text-[12px] leading-relaxed text-[#b21c1c] dark:text-[#ff9b9b]">
          Net pressure has reached zero, so filtration stops. It does not reverse — plasma does not flow
          back out of Bowman&apos;s space, and the model returns zero rather than a negative flow.
        </p>
      )}

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Geser label="Glomerular capillary hydrostatic" nilai={pGc} min={RENTANG_NEFRON.hidrostatikKapiler.min} maks={RENTANG_NEFRON.hidrostatikKapiler.maks} onUbah={setPGc} satuan="mmHg" />
        <Geser label="Bowman's space hydrostatic" nilai={pBs} min={RENTANG_NEFRON.hidrostatikBowman.min} maks={RENTANG_NEFRON.hidrostatikBowman.maks} onUbah={setPBs} satuan="mmHg" />
        <Geser label="Capillary oncotic" nilai={piGc} min={RENTANG_NEFRON.onkotikKapiler.min} maks={RENTANG_NEFRON.onkotikKapiler.maks} onUbah={setPiGc} satuan="mmHg" />
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Raising Bowman&apos;s pressure is what an obstructed outflow does. Raising capillary oncotic
          pressure is what happens along the length of the capillary as protein-free filtrate leaves —
          which is why filtration slows before the end of the glomerulus is reached.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Sodium handling at this GFR</p>
        {berhenti ? (
          /* Tanpa filtrasi tidak ada beban tersaring untuk ditangani. Versi
             pertama tetap memakai konsentrasi urin tetap dan menampilkan
             "-70 direabsorpsi" dan "NaN%" -- dua angka yang tidak berarti apa
             pun, dan NaN tidak boleh pernah sampai ke layar. */
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            With filtration stopped there is no filtered load to handle, so none of these quantities has
            a value. A fixed urine sodium alongside zero filtration would describe a nephron that excretes
            what it never received.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Angka nilai={natrium.tersaring.toFixed(0)} label="Filtered" />
            <Angka nilai={natrium.reabsorpsiNeto.toFixed(0)} label="Reabsorbed" />
            <Angka nilai={Number.isFinite(natrium.fe) ? (natrium.fe * 100).toFixed(2) : '—'} satuan="%" label="Excreted fraction" />
          </div>
        )}
        {!berhenti && natrium.reabsorpsiNeto < 0 && (
          <p className="mt-2 text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-200">
            Net reabsorption has gone negative, which means this urine sodium implies net secretion. Real
            tubules do not secrete sodium; the combination shown is arithmetically consistent and
            physiologically impossible, which is worth seeing rather than hiding.
          </p>
        )}
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Filtered minus reabsorbed equals excreted, exactly — the tubule cannot create or destroy
          sodium. Under 2% leaving is normal, and that number is the whole reason a kidney can filter
          the plasma volume many times a day without emptying the body of salt.
        </Prosa>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        One uniform nephron is a large simplification: cortical and juxtamedullary nephrons behave
        differently, the medullary gradient is absent here, and there is no tubuloglomerular feedback.
        The population eGFR equation answers a different question and lives elsewhere in the app.
      </p>
    </div>
  )
}

export default NefronPanel
