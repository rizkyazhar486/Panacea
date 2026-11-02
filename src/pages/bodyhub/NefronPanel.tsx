import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  tekananUltrafiltrasi, gfrDariStarling, fraksiFiltrasi, klirens,
  neracaTubulus, ekskresiFraksional, RUJUKAN,
  hitungAutoregulasiGinjal, hitungLengkungHenle, hitungAkiDifferential,
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

export const RENTANG_NEFRON_LANJUTAN = {
  map: { min: 40, maks: 220 },
  persentase: { min: 0, maks: 100 },
  natriumUrin: { min: 5, maks: 100 },
  kreatininSerum: { min: 5, maks: 60 },
  kreatininUrin: { min: 10, maks: 200 },
  bun: { min: 10, maks: 120 },
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

export interface PrometheusRenalCase {
  id: string
  title: string
  concept: string
  vignette: string
  options: {
    id: string
    label: string
    description: string
    isCorrect: boolean
    bayesianPosterior: number
    explanation: string
  }[]
}

export const PROMETHEUS_RENAL_CASES: PrometheusRenalCase[] = [
  {
    id: 'SGLT2_TGF',
    title: 'Case 3 · SGLT2 Inhibitor & Intraglomerular Pressure',
    concept: 'TUBULOGLOMERULAR_FEEDBACK_RESTORATION',
    vignette: 'A 58-year-old patient with type 2 diabetes and early diabetic nephropathy exhibits hyperfiltration (eGFR 135 mL/min). Initiation of an SGLT2 inhibitor produces an acute initial decrease in GFR by 5 mL/min followed by long-term preservation of renal function.',
    options: [
      {
        id: 'A',
        label: 'Restoration of Tubuloglomerular Feedback (TGF)',
        description: 'Reduced proximal Na+/glucose reabsorption increases NaCl delivery to the macula densa, triggering adenosine release and afferent arteriolar vasoconstriction.',
        isCorrect: true,
        bayesianPosterior: 0.95,
        explanation: 'Correct! Blocking proximal Na+/glucose cotransport restores macula densa delivery, engaging tubuloglomerular feedback (TGF) to constrict the afferent arteriole, alleviating intraglomerular hypertension.',
      },
      {
        id: 'B',
        label: 'Direct Efferent Vasodilation',
        description: 'Direct antagonism of Angiotensin II receptors at the efferent arteriole.',
        isCorrect: false,
        bayesianPosterior: 0.03,
        explanation: 'Incorrect. SGLT2 inhibitors act on proximal tubular transport; efferent vasodilation is characteristic of ACE inhibitors and ARBs.',
      },
      {
        id: 'C',
        label: 'Immune Podocyte Stabilization',
        description: 'Immunosuppressive inhibition of T-cell mediated podocyte slit diaphragm destruction.',
        isCorrect: false,
        bayesianPosterior: 0.02,
        explanation: 'Incorrect. The initial hemodynamic dip is a direct hemodynamic consequence of TGF restoration, not immunosuppression.',
      },
    ],
  },
  {
    id: 'AKI_DIFFERENTIAL',
    title: 'Case 4 · Prerenal Azotemia vs. Acute Tubular Necrosis',
    concept: 'FENA_TUBULAR_INTEGRITY_DISCRIMINATION',
    vignette: 'A 74-year-old dehydrated patient presents with acute oliguria. Laboratory workup reveals: Serum Cr 2.4 mg/dL (baseline 0.9), BUN 52 mg/dL, Urine Na 12 mEq/L, Urine Cr 95 mg/dL, Serum Na 138 mEq/L.',
    options: [
      {
        id: 'A',
        label: 'Prerenal Azotemia with Avid Tubular Reabsorption',
        description: 'FENa = 0.54% (<1.0%) and BUN/Cr ratio = 21.7 (>20:1) with intact tubular concentrating capacity.',
        isCorrect: true,
        bayesianPosterior: 0.94,
        explanation: 'Correct! FENa < 1.0% and BUN/Cr > 20:1 demonstrate that the tubular epithelial architecture is structurally intact, maximally reabsorbing sodium and water in response to renal hypoperfusion.',
      },
      {
        id: 'B',
        label: 'Ischemic Acute Tubular Necrosis (ATN)',
        description: 'Widespread loss of tubular epithelial transport and urinary sodium wasting.',
        isCorrect: false,
        bayesianPosterior: 0.04,
        explanation: 'Incorrect. In established ATN, damaged tubular cells fail to reabsorb sodium, yielding FENa > 2.0% and BUN/Cr < 15:1.',
      },
      {
        id: 'C',
        label: 'Acute Interstitial Nephritis (AIN)',
        description: 'Drug-induced allergic tubulointerstitial inflammation and sterile pyuria.',
        isCorrect: false,
        bayesianPosterior: 0.02,
        explanation: 'Incorrect. The low FENa and high BUN/Cr strongly favor hemodynamic prerenal hypoperfusion over interstitial inflammation.',
      },
    ],
  },
  {
    id: 'LOOP_DIURETIC_NKCC2',
    title: 'Case 5 · Loop Diuretic Countercurrent Washout',
    concept: 'COUNTERCURRENT_MULTIPLICATION_COLLAPSE',
    vignette: 'A patient with volume overload receives IV furosemide. Shortly thereafter, urine output surges and urine osmolality equilibrates at 320 mOsm/kg despite high circulating vasopressin (ADH).',
    options: [
      {
        id: 'A',
        label: 'Inhibition of NKCC2 & Medullary Hypertonicity Washout',
        description: 'Blockade of the thick ascending limb NKCC2 cotransporter abolishes the single effect, dissipating the corticomedullary osmotic gradient.',
        isCorrect: true,
        bayesianPosterior: 0.96,
        explanation: 'Correct! Furosemide blocks NKCC2 in the thick ascending limb. Without active solute extraction, countercurrent multiplication fails, the medullary interstitium washes out, and collecting duct water reabsorption is eliminated despite ADH.',
      },
      {
        id: 'B',
        label: 'Antagonism of V2 Vasopressin Receptors',
        description: 'Competitive displacement of ADH from the basolateral V2 receptor in the collecting duct.',
        isCorrect: false,
        bayesianPosterior: 0.02,
        explanation: 'Incorrect. Furosemide is a loop diuretic targeting NKCC2; vaptans (e.g. tolvaptan) are V2 receptor antagonists.',
      },
      {
        id: 'C',
        label: 'Direct Glomerular Ultrafiltration Stimulation',
        description: 'Massive stimulation of glomerular podocyte filtration slit aperture width.',
        isCorrect: false,
        bayesianPosterior: 0.02,
        explanation: 'Incorrect. Diuresis results from tubular transport inhibition, not enlargement of podocyte filtration slits.',
      },
    ],
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
  const [tab, setTab] = useState<'starling' | 'autoregulasi' | 'henle' | 'diferensial' | 'prometheus'>('starling')

  // Starling State
  const [pGc, setPGc] = useState(RUJUKAN.starling.hidrostatikKapiler)
  const [pBs, setPBs] = useState(RUJUKAN.starling.hidrostatikBowman)
  const [piGc, setPiGc] = useState(RUJUKAN.starling.onkotikKapiler)
  const [pelajaran, setPelajaran] = useState<string | null>(null)
  const [berjalan, setBerjalan] = useState(true)

  // Autoregulation & TGF State
  const [mapInput, setMapInput] = useState(93)
  const [sglt2Active, setSglt2Active] = useState(false)
  const [aceiActive, setAceiActive] = useState(false)
  const [nsaidActive, setNsaidActive] = useState(false)

  // Henle's Loop & Medullary Gradient State
  const [nkcc2Fraction, setNkcc2Fraction] = useState(1.0)
  const [adhLevel, setAdhLevel] = useState(0.6)

  // AKI Bedside Differential State
  const [uNa, setUNa] = useState(14)
  const [pCr, setPCr] = useState(1.8)
  const [uCr, setUCr] = useState(90)
  const [pNa, setPNa] = useState(140)
  const [bun, setBun] = useState(42)
  const [uun, setUun] = useState(280)

  // Prometheus Case State
  const [activeCaseIndex, setActiveCaseIndex] = useState(0)
  const [selectedCaseOption, setSelectedCaseOption] = useState<string | null>(null)
  const [progressSaved, setProgressSaved] = useState(false)

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

  // Autoregulation & TGF Calculation
  const autoregResult = useMemo(() => {
    return hitungAutoregulasiGinjal({
      mapMmhg: mapInput,
      sglt2InhibitorActive: sglt2Active,
      aceInhibitorActive: aceiActive,
      nsaidActive: nsaidActive,
    })
  }, [mapInput, sglt2Active, aceiActive, nsaidActive])

  // Henle's Loop Calculation
  const henleResult = useMemo(() => {
    return hitungLengkungHenle({
      nkcc2ActivityFraction: nkcc2Fraction,
      adhVasopressinLevel: adhLevel,
    })
  }, [nkcc2Fraction, adhLevel])

  // AKI Differential Calculation
  const akiResult = useMemo(() => {
    return hitungAkiDifferential({
      natriumUrinMeq: uNa,
      natriumPlasmaMeq: pNa,
      kreatininUrinMgDl: uCr,
      kreatininPlasmaMgDl: pCr,
      ureaNitrogenPlasmaMgDl: bun,
      ureaNitrogenUrinMgDl: uun,
    })
  }, [uNa, pNa, uCr, pCr, bun, uun])

  const activeVignette = PROMETHEUS_RENAL_CASES[activeCaseIndex]

  const handleSaveRenalProgress = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          'panacea_renal_golden_journey_progress',
          JSON.stringify({
            completedAt: new Date().toISOString(),
            caseId: activeVignette.id,
            concept: activeVignette.concept,
            passed: selectedCaseOption === activeVignette.options.find((o) => o.isCorrect)?.id,
          }),
        )
      }
    } catch {
      // Fallback in isolated test sandboxes
    }
    setProgressSaved(true)
    setTimeout(() => setProgressSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Renal & Nephron Mechanistic Physiology</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          From microvascular Starling ultrafiltration and tubuloglomerular autoregulation to medullary
          countercurrent multiplication and bedside AKI differentials.
        </Prosa>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200/70 pb-2 dark:border-white/10">
        {[
          { id: 'starling', label: '1. Starling Forces' },
          { id: 'autoregulasi', label: '2. Autoregulation & TGF' },
          { id: 'henle', label: '3. Henle Gradient' },
          { id: 'diferensial', label: '4. Bedside AKI' },
          { id: 'prometheus', label: '5. Prometheus Cases' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`min-h-9 rounded-xl px-3 text-[11px] font-bold transition ${
              tab === t.id
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: STARLING ULTRAFILTRATION (PRESERVED ORIGINAL WORKFLOW) */}
      {tab === 'starling' && (
        <>
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
        </>
      )}

      {/* TAB 2: AUTOREGULATION & TUBULOGLOMERULAR FEEDBACK (TGF) */}
      {tab === 'autoregulasi' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Perfusion & Autoregulation</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase"
                style={{
                  backgroundColor: autoregResult.autoregulationZone === 'AUTOREGULATORY_PLATEAU' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: autoregResult.autoregulationZone === 'AUTOREGULATORY_PLATEAU' ? '#059669' : '#DC2626',
                }}
              >
                {autoregResult.autoregulationZone.replace(/_/g, ' ')}
              </span>
            </div>

            <Geser
              label="Mean Arterial Pressure (MAP)"
              nilai={mapInput}
              min={RENTANG_NEFRON_LANJUTAN.map.min}
              maks={RENTANG_NEFRON_LANJUTAN.map.maks}
              onUbah={setMapInput}
              satuan="mmHg"
            />

            {/* Pharmacological Modulators */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2 text-[11px] font-bold dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sglt2Active}
                  onChange={(e) => setSglt2Active(e.target.checked)}
                  className="rounded"
                />
                <span>SGLT2 Inhibitor</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2 text-[11px] font-bold dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceiActive}
                  onChange={(e) => setAceiActive(e.target.checked)}
                  className="rounded"
                />
                <span>ACEi / ARB</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2 text-[11px] font-bold dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nsaidActive}
                  onChange={(e) => setNsaidActive(e.target.checked)}
                  className="rounded"
                />
                <span>NSAID (PGE2 blockade)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Angka nilai={autoregResult.pGc.toFixed(1)} satuan="mmHg" label="Capillary Pgc" />
            <Angka nilai={autoregResult.gfr.toFixed(0)} satuan="mL/min" label="Autoreg GFR" />
            <Angka nilai={autoregResult.rbf.toFixed(0)} satuan="mL/min" label="Renal Blood Flow" />
          </div>

          {autoregResult.tgfActive && (
            <div className="rounded-xl border p-2.5 text-[11px] leading-relaxed" style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', color: '#047857' }}>
              <strong>Tubuloglomerular Feedback (TGF) Activated:</strong> Increased distal NaCl delivery ({autoregResult.maculaDensaNaclDelivery.toFixed(2)}× baseline) sensed at the macula densa triggers adenosine release, inducing afferent vasoconstriction (Ra {autoregResult.effectiveRa.toFixed(2)}) and lowering glomerular hypertension.
            </div>
          )}

          {nsaidActive && aceiActive && mapInput < 80 && (
            <div className="rounded-xl border p-2.5 text-[11px] leading-relaxed" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#B91C1C' }}>
              <strong>Triple Whammy Hemodynamic Collapse:</strong> Hypotension combined with NSAID afferent vasoconstriction and ACEi efferent vasodilation eliminates the transglomerular pressure gradient, causing severe acute GFR drop.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HENLE'S LOOP COUNTERCURRENT MULTIPLICATION */}
      {tab === 'henle' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Countercurrent Multiplication Engine</span>
            <Geser
              label="NKCC2 Transporter Activity (TAL)"
              nilai={Math.round(nkcc2Fraction * 100)}
              min={RENTANG_NEFRON_LANJUTAN.persentase.min}
              maks={RENTANG_NEFRON_LANJUTAN.persentase.maks}
              onUbah={(v) => setNkcc2Fraction(v / 100)}
              satuan="%"
            />
            <Geser
              label="Vasopressin / ADH Level"
              nilai={Math.round(adhLevel * 100)}
              min={RENTANG_NEFRON_LANJUTAN.persentase.min}
              maks={RENTANG_NEFRON_LANJUTAN.persentase.maks}
              onUbah={(v) => setAdhLevel(v / 100)}
              satuan="%"
            />
          </div>

          {/* Corticomedullary Gradient Osmolality Profile */}
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500 mb-2">
              Corticomedullary Osmolality Gradient
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Angka nilai={henleResult.cortex.toString()} satuan="mOsm" label="Cortex (Isosmolar)" />
              <Angka nilai={henleResult.innerMedullaBend.toString()} satuan="mOsm" label="Hairpin Papilla" />
              <Angka nilai={henleResult.thickAscendingLimbExit.toString()} satuan="mOsm" label="TAL Diluting Exit" />
              <Angka nilai={henleResult.finalUrineOsmolality.toString()} satuan="mOsm" label="Final Urine" />
            </div>
          </div>

          {henleResult.isMedullaryWashout && (
            <div className="rounded-xl border p-2.5 text-[11px] leading-relaxed" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#B45309' }}>
              <strong>Medullary Washout Detected:</strong> NKCC2 inhibition abolishes the single effect ({henleResult.singleEffectGradient} mOsm/kg), collapsing interstitial hypertonicity ({henleResult.medullaryInterstitialMax} mOsm/kg). Urine cannot concentrate despite maximal circulating vasopressin.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BEDSIDE AKI DIFFERENTIAL */}
      {tab === 'diferensial' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Bedside Laboratory Parameters</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Geser label="Spot Urine Sodium (UNa)" nilai={uNa} min={RENTANG_NEFRON_LANJUTAN.natriumUrin.min} maks={RENTANG_NEFRON_LANJUTAN.natriumUrin.maks} onUbah={setUNa} satuan="mEq/L" />
              <Geser label="Serum Creatinine (PCr)" nilai={Math.round(pCr * 10)} min={RENTANG_NEFRON_LANJUTAN.kreatininSerum.min} maks={RENTANG_NEFRON_LANJUTAN.kreatininSerum.maks} onUbah={(v) => setPCr(v / 10)} satuan="×0.1 mg/dL" />
              <Geser label="Spot Urine Creatinine (UCr)" nilai={uCr} min={RENTANG_NEFRON_LANJUTAN.kreatininUrin.min} maks={RENTANG_NEFRON_LANJUTAN.kreatininUrin.maks} onUbah={setUCr} satuan="mg/dL" />
              <Geser label="Blood Urea Nitrogen (BUN)" nilai={bun} min={RENTANG_NEFRON_LANJUTAN.bun.min} maks={RENTANG_NEFRON_LANJUTAN.bun.maks} onUbah={setBun} satuan="mg/dL" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Angka nilai={akiResult.feNaPercent.toFixed(2)} satuan="%" label="FENa" />
            <Angka nilai={akiResult.feUreaPercent ? akiResult.feUreaPercent.toFixed(1) : '—'} satuan="%" label="FEUrea" />
            <Angka nilai={akiResult.bunCreatinineRatio ? akiResult.bunCreatinineRatio.toFixed(1) : '—'} label="BUN / PCr Ratio" />
          </div>

          <div
            className="rounded-2xl border p-3 text-[11px] leading-relaxed"
            style={{
              backgroundColor: akiResult.classification === 'PRERENAL_AZOTEMIA' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: akiResult.classification === 'PRERENAL_AZOTEMIA' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              color: akiResult.classification === 'PRERENAL_AZOTEMIA' ? '#065F46' : '#991B1B',
            }}
          >
            <div className="font-black uppercase tracking-wider text-xs mb-1">
              Diagnosis: {akiResult.classification.replace(/_/g, ' ')} ({(akiResult.confidence * 100).toFixed(0)}% Confidence)
            </div>
            {akiResult.clinicalRationale}
          </div>
        </div>
      )}

      {/* TAB 5: PROMETHEUS CLINICAL CASES & ASSESSMENT */}
      {tab === 'prometheus' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PROMETHEUS_RENAL_CASES.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCaseIndex(idx)
                  setSelectedCaseOption(null)
                }}
                className={`min-h-8 rounded-lg px-2.5 text-[10px] font-bold whitespace-nowrap transition ${
                  activeCaseIndex === idx
                    ? 'bg-brand text-white'
                    : 'bg-white/50 text-neutral-600 hover:bg-white dark:bg-white/5 dark:text-neutral-300'
                }`}
              >
                Case {idx + 3}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <div className="text-xs font-black text-ink dark:text-white">{activeVignette.title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              {activeVignette.vignette}
            </p>

            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Select the correct physiological mechanism:
              </div>
              {activeVignette.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedCaseOption(opt.id)}
                  style={{
                    backgroundColor: selectedCaseOption === opt.id
                      ? opt.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                      : undefined,
                    borderColor: selectedCaseOption === opt.id
                      ? opt.isCorrect ? '#10B981' : '#EF4444'
                      : undefined,
                  }}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${
                    selectedCaseOption === opt.id
                      ? 'text-ink dark:text-white'
                      : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-[11px]">{opt.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{opt.description}</div>
                  {selectedCaseOption === opt.id && (
                    <div
                      className="mt-2 rounded-lg p-2 text-[10px] leading-relaxed"
                      style={{
                        backgroundColor: opt.isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: opt.isCorrect ? '#047857' : '#B91C1C',
                      }}
                    >
                      {opt.explanation} (Bayesian Posterior: {(opt.bayesianPosterior * 100).toFixed(0)}%)
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={handleSaveRenalProgress}
                className="h-8 rounded-full bg-brand px-3 text-[10px] font-black text-white hover:opacity-90 transition"
              >
                {progressSaved ? 'Learning Progress Saved ✓' : 'Save Learning State'}
              </button>
              <span className="text-[10px] text-neutral-500">Prometheus EDU-4 / EDU-6 Compliant</span>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory limitations disclaimer paragraph */}
      <p className="text-[11px] leading-relaxed text-neutral-500">
        One uniform nephron is a large simplification: cortical and juxtamedullary nephrons behave
        differently, the medullary gradient is absent in single-cell models, and tubuloglomerular feedback
        interacts with sympathetic and humoral tone. The population eGFR equation answers a different
        question and lives elsewhere in the app.
      </p>
    </div>
  )
}

export default NefronPanel
