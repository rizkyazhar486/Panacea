import { useMemo, useState } from 'react'
import {
  SUMBER, ML_PER_MET, nilaiKebugaran, titikTengahVo2, vo2DariDenyut,
  denyutMaksPerkiraan, hrGenggam, bacaLangkah, bacaSebaran,
} from '../lib/bugarIlmiah'

// ─────────────────────────────────────────────────────────────────────────────
// Panel kebugaran yang setiap angkanya dapat dilacak ke sumbernya.
//
// MENGAPA PANEL INI ADA. Halaman Longevity menampilkan satu skor komposit dari
// delapan hal dengan bobot yang dikarang (0,22 untuk VO2max, 0,13 untuk grip).
// Skor seperti itu terbaca meyakinkan justru karena menyembunyikan asal-usul
// angkanya: pemakai tidak dapat membedakan bagian yang berasal dari kohort
// 122.007 orang dari bagian yang berasal dari tebakan penulis kode.
//
// Panel ini melakukan yang sebaliknya. Ia TIDAK membuat skor baru. Ia
// menampilkan sedikit besaran yang benar-benar dilaporkan penelitian, masing-
// masing dengan sumbernya, dan menolak menampilkan yang tidak ada sumbernya.
//
// TIGA ATURAN TAMPILAN YANG DIPEGANG:
//
//   1. TIDAK ADA ANGKA TANPA SUMBER. Setiap rasio bahaya membawa nama
//      penelitiannya, dan sumbernya dapat dibuka di tempat.
//
//   2. KETIDAKPASTIAN DITAMPILKAN, BUKAN DISEMBUNYIKAN. VO2max yang
//      diperkirakan dari denyut ditandai sebagai PERKIRAAN dengan besaran
//      kesalahannya, bukan disamakan dengan hasil uji.
//
//   3. TIDAK ADA RAMALAN PERORANGAN. Rasio bahaya berlaku bagi kelompok.
//      Menerjemahkannya menjadi "Anda akan hidup sekian tahun lagi" adalah
//      kekeliruan penafsiran yang paling sering pada data seperti ini, dan
//      panel ini menyebutnya secara terbuka alih-alih diam.
// ─────────────────────────────────────────────────────────────────────────────

export interface BahanPanel {
  usia: number
  jk: 'L' | 'P'
  /** VO2max terukur bila ada. Bila kosong, dicoba diperkirakan dari denyut. */
  vo2?: number
  denyutIstirahat?: number
  denyutMaksTerukur?: number
  genggamKg?: number
  langkahHarian?: number
  /** Menit per zona 1-5 dalam kurun terakhir. */
  menitZona?: number[]
}

function warnaPita(selisihMet: number): string {
  if (selisihMet <= -2) return '#dc2626'
  if (selisihMet <= -0.75) return '#f59e0b'
  if (selisihMet < 0.75) return '#64748b'
  if (selisihMet < 2) return '#16a34a'
  return '#0d9488'
}

/** Skala VO2max dengan titik tengah usia sebagai jangkar, bukan sebagai nilai baik. */
function SkalaVo2({ vo2, titik, jk, usia }: { vo2: number; titik: number; jk: 'L' | 'P'; usia: number }) {
  // Rentang skala dibuat simetris terhadap titik tengah supaya tidak memberi
  // kesan bahwa "penuh ke kanan" berarti sehat.
  const lebar = Math.max(14, titik * 0.6)
  const min = Math.max(0, titik - lebar)
  const max = titik + lebar
  const posisi = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100
  const met = vo2 / ML_PER_MET
  const metTitik = titik / ML_PER_MET
  const warna = warnaPita(met - metTitik)
  return (
    <div className="mt-2">
      <div className="relative h-9">
        {/* Batang skala */}
        <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-gradient-to-r from-red-500/25 via-neutral-400/25 to-teal-500/25" />
        {/* Jangkar titik tengah */}
        <div className="absolute top-1.5 h-5 w-[2px] bg-neutral-500" style={{ left: `${posisi(titik)}%` }} />
        {/* Posisi pemakai */}
        <div
          className="absolute top-0.5 h-8 w-[3px] rounded-full"
          style={{ left: `${posisi(vo2)}%`, background: warna }}
          aria-label={`VO2max Anda ${vo2.toFixed(1)}`}
        />
      </div>
      <div className="flex justify-between text-[9.5px] text-neutral-500">
        <span>{min.toFixed(0)}</span>
        <span>titik tengah {jk === 'L' ? 'laki-laki' : 'perempuan'} {usia} th: {titik.toFixed(1)}</span>
        <span>{max.toFixed(0)}</span>
      </div>
    </div>
  )
}

function KartuSumber({ kunci }: { kunci: string }) {
  const s = SUMBER[kunci]
  const [buka, setBuka] = useState(false)
  if (!s) return null
  return (
    <div className="mt-1">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="text-[10px] font-bold text-brand underline decoration-dotted underline-offset-2"
      >
        sumber {buka ? '▲' : '▼'}
      </button>
      {buka && (
        <div className="mt-1 rounded-lg bg-black/[0.04] p-2 text-[10.5px] leading-snug text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
          <div className="font-bold">{s.kutipan}</div>
          {s.n && <div className="mt-0.5 opacity-80">{s.n}</div>}
          {s.catatan && <div className="mt-1">{s.catatan}</div>}
        </div>
      )}
    </div>
  )
}

function Baris({ judul, isi, sumber }: { judul: string; isi: React.ReactNode; sumber?: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/5">
      <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{judul}</div>
      <div className="mt-1 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">{isi}</div>
      {sumber && <KartuSumber kunci={sumber} />}
    </div>
  )
}

export function PanelKebugaranIlmiah(b: BahanPanel) {
  const hrMaks = useMemo(() => {
    if (b.denyutMaksTerukur && b.denyutMaksTerukur > 0) return { nilai: b.denyutMaksTerukur, terukur: true, ketidakpastian: '' }
    const p = denyutMaksPerkiraan(b.usia)
    return p ? { nilai: p.nilai, terukur: false, ketidakpastian: p.ketidakpastian } : null
  }, [b.denyutMaksTerukur, b.usia])

  const perkiraan = useMemo(
    () => (b.vo2 && b.vo2 > 0 ? null : hrMaks && b.denyutIstirahat ? vo2DariDenyut(hrMaks.nilai, b.denyutIstirahat) : null),
    [b.vo2, hrMaks, b.denyutIstirahat],
  )
  const vo2 = b.vo2 && b.vo2 > 0 ? b.vo2 : perkiraan?.nilai
  const hasil = useMemo(() => (vo2 ? nilaiKebugaran(vo2, b.usia, b.jk) : null), [vo2, b.usia, b.jk])

  const genggam = useMemo(
    () => (b.genggamKg ? hrGenggam(b.genggamKg, b.jk === 'L' ? 40 : 25) : null),
    [b.genggamKg, b.jk],
  )
  const langkah = useMemo(() => (b.langkahHarian != null ? bacaLangkah(b.langkahHarian, b.usia) : null), [b.langkahHarian, b.usia])
  const sebaran = useMemo(() => (b.menitZona ? bacaSebaran(b.menitZona) : null), [b.menitZona])

  const adaIsi = hasil || genggam || langkah || sebaran
  if (!adaIsi) {
    return (
      <div className="rounded-xl bg-black/[0.03] p-3 text-[11.5px] leading-snug text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
        Not enough numbers to show anything yet. At least one of these is needed: a measured VO₂max, a resting heart rate
        (for an estimate), grip strength, or a daily step count.
        <div className="mt-1.5 opacity-80">
          This section is deliberately empty rather than showing default numbers — a default cannot be told apart from a measurement.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">How to read this section</div>
        <p className="mt-1 text-[11px] leading-snug text-neutral-700 dark:text-neutral-200">
          The figures below are <b>hazard ratios for GROUPS</b>, not predictions for an individual. A ratio of 0.70 means the
          group with that characteristic had 30% fewer deaths over the observation period — it does <b>not</b> mean you will
          live 30% longer. All of it is <b>association</b>, and most of it comes from observational cohorts, not randomised
          trials.
        </p>
      </div>

      {hasil && (
        <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/5">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Aerobic capacity</div>
            <div className="text-[10px] font-bold text-neutral-500">{hasil.met.toFixed(1)} MET</div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[22px] font-black leading-none text-ink dark:text-white">{hasil.vo2.toFixed(1)}</span>
            <span className="text-[11px] text-neutral-500">mL/kg/menit</span>
            {perkiraan && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-400">
                perkiraan
              </span>
            )}
          </div>

          <SkalaVo2 vo2={hasil.vo2} titik={hasil.titikTengah} jk={b.jk} usia={b.usia} />

          <p className="mt-1.5 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            <b>{hasil.pita}</b> the median for your age and sex, a difference of{' '}
            <b>{hasil.selisihMet >= 0 ? '+' : ''}{hasil.selisihMet.toFixed(1)} MET</b>.
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            Each 1 MET higher is associated with <b>13% lower</b> all-cause mortality (HR 0.87; 95% CI
            0.84–0.90). For your difference, the hazard ratio against the median comes to{' '}
            <b style={{ color: warnaPita(hasil.selisihMet) }}>{hasil.hrTerhadapTitikTengah.toFixed(2)}</b>.
          </p>
          <KartuSumber kunci="kodama" />

          {perkiraan && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-2">
              <div className="text-[10px] font-black text-amber-700 dark:text-amber-400">This is an estimate, not a measurement</div>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-700 dark:text-neutral-200">
                {perkiraan.cara}. {perkiraan.ketidakpastian}
                {hrMaks && !hrMaks.terukur && ` The maximum heart rate is itself an estimate: ${hrMaks.ketidakpastian}`}
              </p>
              <KartuSumber kunci="uth" />
            </div>
          )}

          <div className="mt-2 text-[10.5px] leading-snug text-neutral-500">
            The reference medians apply to a <b>treadmill</b> test; a cycle test yields values 10–15% lower, and comparing
            those against this table will look worse than the truth.
            <KartuSumber kunci="friend" />
          </div>
        </div>
      )}

      {genggam && b.genggamKg && (
        <Baris
          judul="Grip strength"
          sumber="leong"
          isi={
            <>
              <b>{b.genggamKg} kg</b>. The PURE study reported that each <b>5 kg lower</b> was associated with <b>16% higher</b>
              all-cause mortality (HR 1.16). Against a reference of {b.jk === 'L' ? '40' : '25'} kg, the hazard ratio is{' '}
              <b>{genggam.toFixed(2)}</b>.
              <div className="mt-1 text-[10.5px] text-neutral-500">
                That reference was chosen as a comparison point, <b>not</b> a normal threshold — PURE reported an effect per
                5 kg difference and did not define a normal value.
              </div>
            </>
          }
        />
      )}

      {langkah && (
        <Baris
          judul="Daily steps"
          sumber="paluch"
          isi={
            <>
              <b>{langkah.langkah.toLocaleString('en-GB')}</b> steps. {langkah.keterangan}
              <div className="mt-1 text-[10.5px] text-neutral-500">
                The widely quoted 10,000 comes from the name of a 1960s Japanese pedometer, not from research.
              </div>
            </>
          }
        />
      )}

      {sebaran && (
        <Baris
          judul="Intensity distribution"
          sumber="seiler"
          isi={
            <>
              <b>{sebaran.persenRendah.toFixed(0)}%</b> low intensity, <b>{sebaran.persenTinggi.toFixed(0)}%</b> high.{' '}
              {sebaran.keterangan}
              <div className="mt-1 text-[10.5px] text-neutral-500">
                The 80/20 pattern is something <b>observed</b> in high-performing endurance athletes, not a tested
                prescription for non-athletes.
              </div>
            </>
          }
        />
      )}

      <div className="rounded-xl bg-black/[0.03] p-3 text-[10.5px] leading-snug text-neutral-500 dark:bg-white/5">
        <b>Deliberately not shown here:</b> biological age and remaining-life predictions. There is no agreed equation for
        computing biological age from field measurements, and group hazard ratios cannot be turned into a prediction for one
        person. Showing either to a decimal place would claim a precision the data does not have.
      </div>
    </div>
  )
}

export default PanelKebugaranIlmiah
