import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { Prosa } from '../components/Prosa'
import {
  PARAMETER_BAKU, MM_PER_SEL, MS_PER_SATUAN, DT_BAKU, APD_MS_RISIKO_TORSADE,
  buatCincin, langkah, ablasiRadial, puncakAktivitas, kelilingCincin,
  pseudoEkg, ukurPlanar, terapkanObat, nilaiSubstrat, profilPotensialAksi,
  pasangGelombangBerputar, TANPA_OBAT,
  type Jaringan, type Obat, type UkuranJaringan,
} from '../lib/bioelectric'

// ─────────────────────────────────────────────────────────────────────────────
// LABORATORIUM ELEKTROFISIOLOGI — aritmia yang benar-benar dihitung.
//
// Setiap piksel di kanvas ini adalah satu sel grid yang persamaannya
// diintegrasikan di depan mata, bukan animasi yang dibuat menyerupai aritmia.
// Karena itu satu-satunya hal yang menentukan apakah takikardia di layar
// bertahan atau berhenti adalah fisikanya: panjang gelombang terhadap keliling
// sirkuit. Tidak ada tombol "hentikan aritmia" di berkas ini — yang ada hanya
// obat yang mengubah parameter dan garis ablasi yang mengubah topologi, lalu
// jaringan menjawab sendiri.
//
// Angka yang tampil di panel diukur dari simulasi yang sama, bukan dari tabel.
// ─────────────────────────────────────────────────────────────────────────────

interface Sirkuit {
  id: string
  label: string
  ringkas: string
  grid: number
  jariDalam: number
  jariLuar: number
}

// Ketiganya sengaja mengapit ambang. Sirkuit "normal" TIDAK bisa menopang
// reentri pada panjang gelombang sehat, dan itu bukan kekurangan demonstrasi —
// itu jawabannya: jantung normal tidak berfibrilasi karena gelombangnya terlalu
// panjang untuk lintasan yang tersedia.
const SIRKUIT: Sirkuit[] = [
  { id: 'normal', label: 'Normal atrium', ringkas: 'A circuit this short cannot hold a re-entrant wave at healthy wavelength.', grid: 96, jariDalam: 22, jariLuar: 43 },
  { id: 'dilatasi', label: 'Dilated atrium', ringkas: 'Right at the threshold — re-entry holds, and a class III drug can still break it.', grid: 112, jariDalam: 28, jariLuar: 50 },
  { id: 'remodel', label: 'Remodelled atrium', ringkas: 'Long enough that re-entry is stable; only cutting the circuit ends it.', grid: 128, jariDalam: 34, jariLuar: 58 },
]

// Kelas Tailwind ditulis lengkap satu per satu. Merangkainya dari potongan
// (`border-${warna}-200`) membuat Tailwind tidak menemukannya saat memindai
// berkas, dan kotak vonis akan tampil tanpa warna sama sekali — tanpa error.
const VONIS_TEKS: Record<ReturnType<typeof nilaiSubstrat>, { judul: string; kelas: string }> = {
  aman: {
    judul: 'Wavelength exceeds the circuit — re-entry cannot be sustained',
    kelas: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  },
  'rentan-reentri': {
    judul: 'Wavelength fits inside the circuit — re-entry is sustainable',
    kelas: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
  },
  'risiko-repolarisasi': {
    judul: 'Repolarisation prolonged into the range where QT becomes the risk',
    kelas: 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10',
  },
  blok: {
    judul: 'Conduction has failed entirely — this is class I toxicity',
    kelas: 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10',
  },
}

// Peta warna gaya peta aktivasi: istirahat gelap kebiruan, depolarisasi merah
// sampai putih. Dibangun sekali sebagai tabel 256 entri supaya menggambar satu
// bingkai tidak berarti menghitung ribuan kali interpolasi.
const PALET = (() => {
  const p = new Uint8Array(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let r: number, g: number, b: number
    if (t < 0.35) { const s = t / 0.35; r = 12 + s * 24; g = 16 + s * 20; b = 44 + s * 70 }
    else if (t < 0.7) { const s = (t - 0.35) / 0.35; r = 36 + s * 190; g = 36 + s * 40; b = 114 - s * 74 }
    else { const s = (t - 0.7) / 0.3; r = 226 + s * 29; g = 76 + s * 172; b = 40 + s * 180 }
    p[i * 3] = r; p[i * 3 + 1] = g; p[i * 3 + 2] = b
  }
  return p
})()

const LANGKAH_PER_BINGKAI = 30

export function Electrophysiology() {
  const [sirkuitId, setSirkuitId] = useState('dilatasi')
  const [obat, setObat] = useState<Obat>(TANPA_OBAT)
  const [obatTertunda, setObatTertunda] = useState<Obat>(TANPA_OBAT)
  const [berjalan, setBerjalan] = useState(false)
  const [aktivitas, setAktivitas] = useState(0)
  const [siklusMs, setSiklusMs] = useState(0)
  const [lambat, setLambat] = useState(0)
  const [sudahAblasi, setSudahAblasi] = useState(false)
  const [ekg, setEkg] = useState<number[]>([])

  const sirkuit = SIRKUIT.find((s) => s.id === sirkuitId) ?? SIRKUIT[1]

  const kanvas = useRef<HTMLCanvasElement | null>(null)
  const jaringan = useRef<Jaringan | null>(null)
  const rafRef = useRef(0)
  const jamRef = useRef({ nyata: 0, model: 0 })
  const pantauRef = useRef({ sebelum: 0, aktivasi: [] as number[] })
  const ekgRef = useRef<number[]>([])

  // Penggeser obat digerakkan terus-menerus; mengukur ulang pada setiap piksel
  // gerakan berarti membekukan antarmuka. Ditunda 300 ms, lalu diukur sekali.
  useEffect(() => {
    const id = setTimeout(() => setObat(obatTertunda), 300)
    return () => clearTimeout(id)
  }, [obatTertunda])

  const parameter = useMemo(() => terapkanObat(PARAMETER_BAKU, obat), [obat])
  const ukur: UkuranJaringan = useMemo(() => ukurPlanar(parameter), [parameter])

  const kelilingMm = kelilingCincin(sirkuit.jariDalam, sirkuit.jariLuar) * MM_PER_SEL
  const vonis = nilaiSubstrat(ukur, kelilingMm)
  const rasio = ukur.panjangGelombangMm > 0 ? kelilingMm / ukur.panjangGelombangMm : 0

  const gambar = useCallback(() => {
    const j = jaringan.current
    const c = kanvas.current
    if (!j || !c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const n = j.lebar
    const gbr = ctx.createImageData(n, n)
    const d = gbr.data
    for (let i = 0; i < n * n; i++) {
      const o = i * 4
      if (!j.eksitabel[i]) {
        // Jaringan mati digambar abu-abu hangat, bukan hitam: lesi harus
        // terbaca sebagai sesuatu yang ADA di sana, bukan sebagai lubang.
        d[o] = 90; d[o + 1] = 86; d[o + 2] = 82; d[o + 3] = 255
        continue
      }
      const u = j.u[i]
      const idx = Math.max(0, Math.min(255, Math.round(u * 255)))
      d[o] = PALET[idx * 3]; d[o + 1] = PALET[idx * 3 + 1]; d[o + 2] = PALET[idx * 3 + 2]; d[o + 3] = 255
    }
    // Grid jaringan jauh lebih kecil daripada kanvas, jadi digambar lewat satu
    // kanvas antara supaya penskalaannya dihaluskan peramban.
    const antara = document.createElement('canvas')
    antara.width = n; antara.height = n
    antara.getContext('2d')?.putImageData(gbr, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(antara, 0, 0, c.width, c.height)
  }, [])

  const siapkan = useCallback((mulai: boolean) => {
    const j = buatCincin(sirkuit.grid, sirkuit.grid, sirkuit.jariDalam, sirkuit.jariLuar, parameter)
    if (mulai) {
      const profil = profilPotensialAksi(parameter)
      pasangGelombangBerputar(j, profil, sirkuit.jariDalam, sirkuit.jariLuar)
    }
    jaringan.current = j
    jamRef.current = { nyata: 0, model: 0 }
    pantauRef.current = { sebelum: 0, aktivasi: [] }
    ekgRef.current = []
    setEkg([])
    setSiklusMs(0)
    setSudahAblasi(false)
    setAktivitas(puncakAktivitas(j))
    gambar()
  }, [parameter, sirkuit, gambar])

  useEffect(() => { setBerjalan(false); siapkan(false) }, [siapkan])

  useEffect(() => {
    if (!berjalan) return
    let batal = false
    let terakhir = performance.now()

    const bingkai = () => {
      if (batal) return
      const j = jaringan.current
      if (!j) return
      langkah(j, DT_BAKU, LANGKAH_PER_BINGKAI)

      const sekarang = performance.now()
      jamRef.current.nyata += sekarang - terakhir
      jamRef.current.model += LANGKAH_PER_BINGKAI * DT_BAKU * MS_PER_SATUAN
      terakhir = sekarang

      // Titik pantau di garis tengah cincin, sebelah kiri pusat.
      const rTengah = (j.lebar / 2) - (sirkuit.jariDalam + sirkuit.jariLuar) / 2
      const idx = Math.round(j.tinggi / 2) * j.lebar + Math.round(rTengah)
      const u = j.u[idx]
      if (pantauRef.current.sebelum < 0.5 && u >= 0.5) {
        pantauRef.current.aktivasi.push(j.t)
        if (pantauRef.current.aktivasi.length > 6) pantauRef.current.aktivasi.shift()
      }
      pantauRef.current.sebelum = u

      ekgRef.current.push(pseudoEkg(j, j.lebar / 2, -18))
      if (ekgRef.current.length > 220) ekgRef.current.shift()

      gambar()

      if (jamRef.current.nyata > 220) {
        const a = pantauRef.current.aktivasi
        if (a.length > 1) setSiklusMs(((a[a.length - 1] - a[0]) / (a.length - 1)) * MS_PER_SATUAN)
        setAktivitas(puncakAktivitas(j))
        setLambat(jamRef.current.nyata / Math.max(jamRef.current.model, 1e-6))
        setEkg([...ekgRef.current])
        jamRef.current = { nyata: 0, model: 0 }
      }
      rafRef.current = requestAnimationFrame(bingkai)
    }
    rafRef.current = requestAnimationFrame(bingkai)
    return () => { batal = true; cancelAnimationFrame(rafRef.current) }
  }, [berjalan, gambar, sirkuit])

  const mulaiReentri = () => {
    siapkan(true)
    setBerjalan(true)
  }

  const ablasi = () => {
    const j = jaringan.current
    if (!j) return
    ablasiRadial(j, Math.PI / 2, 7)
    setSudahAblasi(true)
    gambar()
  }

  const padam = berjalan && aktivitas < 0.05

  const jalurEkg = useMemo(() => {
    if (ekg.length < 2) return ''
    let maks = 1e-9
    for (const v of ekg) maks = Math.max(maks, Math.abs(v))
    return ekg.map((v, i) => `${(i / (ekg.length - 1)) * 100},${30 - (v / maks) * 24}`).join(' ')
  }, [ekg])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 sm:px-6">
      <SectionTitle
        title="Arrhythmia Mechanism Lab"
        subtitle="A sheet of excitable heart tissue, integrated live. Nothing here is animation — the wave persists or dies because of the physics."
      />

      <Card className="!p-4">
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl bg-[#0c1024]">
          <canvas ref={kanvas} width={512} height={512} className="h-full w-full" />
          <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-black/45 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white/85">
            {(sirkuit.grid * MM_PER_SEL).toFixed(0)} mm tissue · {MM_PER_SEL.toFixed(2)} mm per cell
          </div>
          {berjalan && lambat > 0 && (
            <div className="pointer-events-none absolute right-2 top-2 rounded-lg bg-black/45 px-2 py-1 text-[9px] font-bold text-white/85">
              {lambat.toFixed(0)}× slow motion
            </div>
          )}
          {padam && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-emerald-500/90 px-3 py-2 text-center text-[11px] font-black text-white">
              Activity extinguished — the circuit no longer sustains a wave
            </div>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 p-2 dark:bg-white/5">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Pseudo-ECG (dipole approximation)</div>
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="mt-1 h-14 w-full">
            <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.2" className="text-neutral-300" />
            {jalurEkg && <polyline points={jalurEkg} fill="none" stroke="#00BF63" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />}
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={mulaiReentri}
            className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-xs font-black text-white"
          >
            Start re-entry
          </button>
          <button
            type="button"
            onClick={ablasi}
            disabled={!berjalan || sudahAblasi}
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-black text-ink disabled:opacity-40 dark:border-white/15 dark:text-white"
          >
            {sudahAblasi ? 'Line placed' : 'Ablate across circuit'}
          </button>
          <button
            type="button"
            onClick={() => { setBerjalan(false); siapkan(false) }}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-500 dark:border-white/15"
          >
            Reset
          </button>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Measured from this tissue</div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Angka label="Conduction velocity" nilai={ukur.blok ? '—' : ukur.cvMmPerMs.toFixed(2)} satuan="mm/ms" />
          <Angka label="APD90" nilai={ukur.blok ? '—' : ukur.apdMs.toFixed(0)} satuan="ms" />
          <Angka label="Wavelength" nilai={ukur.blok ? '—' : ukur.panjangGelombangMm.toFixed(0)} satuan="mm" />
          <Angka label="Circuit path" nilai={kelilingMm.toFixed(0)} satuan="mm" />
        </div>

        <div className={`mt-3 rounded-2xl border p-3 ${VONIS_TEKS[vonis].kelas}`}>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Circuit ÷ wavelength = {rasio > 0 ? rasio.toFixed(2) : '—'}
          </div>
          <p className="mt-1 text-xs font-bold leading-relaxed text-ink dark:text-white">{VONIS_TEKS[vonis].judul}</p>
          {siklusMs > 0 && (
            <p className="mt-1 text-[11px] text-neutral-500">
              Measured tachycardia cycle length {siklusMs.toFixed(0)} ms — {(60000 / siklusMs).toFixed(0)} beats/min.
            </p>
          )}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Circuit</div>
        <div className="mt-2 flex gap-1 overflow-x-auto rounded-2xl bg-neutral-100 p-1 dark:bg-white/5">
          {SIRKUIT.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSirkuitId(s.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition ${sirkuitId === s.id ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{sirkuit.ringkas}</p>
      </Card>

      <Card className="!p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Antiarrhythmic drug classes</div>
        <Penggeser
          label="Class I — sodium channel block"
          catatan="Slows conduction. Wavelength shortens, so re-entry becomes easier, not harder."
          nilai={obatTertunda.natrium} maks={0.6}
          onUbah={(v) => setObatTertunda({ ...obatTertunda, natrium: v })}
        />
        <Penggeser
          label="Class III — potassium current block"
          catatan="Prolongs repolarisation. Wavelength lengthens and can outgrow the circuit."
          nilai={obatTertunda.kalium} maks={0.8}
          onUbah={(v) => setObatTertunda({ ...obatTertunda, kalium: v })}
        />
        <Penggeser
          label="Class IV — calcium channel block"
          catatan="Shortens the plateau, which shortens the wavelength too."
          nilai={obatTertunda.kalsium} maks={0.6}
          onUbah={(v) => setObatTertunda({ ...obatTertunda, kalsium: v })}
        />
        {ukur.apdMs > APD_MS_RISIKO_TORSADE && !ukur.blok && (
          <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] leading-relaxed text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
            APD is now {ukur.apdMs.toFixed(0)} ms. Past roughly {APD_MS_RISIKO_TORSADE} ms, prolonging repolarisation stops protecting
            and starts causing harm — this is the QT/torsade boundary. A two-variable model cannot produce afterdepolarisations,
            so this is a flag, not a simulation of them.
          </div>
        )}
      </Card>

      <Card className="!p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">What this is, and what it is not</div>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            The tissue solves the Aliev–Panfilov equations for cardiac excitation on a grid, one cell per millimetre.
            Conduction velocity, action potential duration and wavelength on the panel above are measured by running a
            strip of this same tissue — they are not looked up. The time scale comes from the original 1996 paper and was
            never tuned: that APD lands near 320 ms, the figure for human ventricular myocytes, is a check on the model
            rather than a setting.
          </p>
          <p>
            One law runs through everything here. A re-entrant wave survives only if the circuit is longer than the wave
            itself. That is why a healthy heart does not fibrillate despite ectopic beats every day, why dilated and
            scarred atria do, why a class III drug can end flutter by lengthening the wave past the circuit, and why a
            single ablation line works: it removes the closed path, so there is nowhere left to return to.
          </p>
          <p>
            It is also why blocking sodium channels is dangerous in a scarred heart. Conduction slows, the wavelength
            shortens, and the circuit that was previously too small becomes big enough. That is the mechanism behind CAST
            (Echt et al., N Engl J Med 1991), where flecainide and encainide suppressed ectopy after infarction and raised
            mortality. Move the class I slider and watch the wavelength fall.
          </p>
          <p>
            This is not a map of anyone's heart. There is no patient geometry, no fibre orientation, no conduction system,
            and no ion currents modelled separately. It is a teaching model of tissue physics, and an ablation line drawn
            here is an experiment on that model — never a plan for a procedure.
          </p>
        </Prosa>
      </Card>
    </div>
  )
}

function Angka({ label, nilai, satuan }: { label: string; nilai: string; satuan: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-2.5 dark:bg-white/5">
      <div className="text-[9px] font-black uppercase leading-tight tracking-wide text-neutral-400">{label}</div>
      <div className="mt-0.5 text-lg font-black leading-none text-ink dark:text-white">{nilai}</div>
      <div className="text-[9px] font-bold text-neutral-400">{satuan}</div>
    </div>
  )
}

function Penggeser({ label, catatan, nilai, maks, onUbah }: {
  label: string; catatan: string; nilai: number; maks: number; onUbah: (v: number) => void
}) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-bold text-ink dark:text-white">{label}</label>
        <span className="text-[11px] font-black text-brand">{(nilai * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range" min={0} max={maks} step={0.02} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        className="mt-1 w-full accent-brand"
      />
      <p className="text-[10px] leading-relaxed text-neutral-400">{catatan}</p>
    </div>
  )
}

export default Electrophysiology
