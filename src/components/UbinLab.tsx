import { useEffect, useMemo, useState } from 'react'
import { JENIS_LAB, ambilLab, tambahLab, umurHari, type ButirLab, type JenisLab } from '../lib/lab'
import { analisisTrenLab, type StatusTren } from '../lib/labTrend'

// ─────────────────────────────────────────────────────────────────────────────
// Widget hasil laboratorium — dimasukkan sendiri, digambar perjalanannya.
//
// Hasil lab adalah satu-satunya angka di aplikasi ini yang benar-benar diukur
// di dalam darah, dan justru itu yang sebelumnya tidak punya tempat sama
// sekali. Yang dibutuhkan orang bukan satu nilai terakhir, melainkan ARAHNYA:
// ApoB 110 setelah tiga tahun di 140 adalah kabar yang sama sekali berbeda
// dari ApoB 110 setelah tiga tahun di 80.
//
// TIGA HAL YANG TIDAK DILAKUKAN, sama seperti di lab.ts:
//   · Tidak ada penilaian sehat/sakit — hanya letak terhadap rentang rujukan
//     yang disebutkan sumbernya.
//   · Tidak ada nilai yang dihitung mundur dari nilai lain.
//   · Umur hasilnya selalu ditulis. Angka setahun lalu yang ditampilkan tanpa
//     umurnya terbaca seperti keadaan hari ini.
// ─────────────────────────────────────────────────────────────────────────────

function tanggalHariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function Garis({ butir, jenis }: { butir: ButirLab[]; jenis: JenisLab }) {
  if (butir.length < 2) return null
  const nilai = butir.map((b) => b.nilai)
  const acuan = [jenis.bawah, jenis.atas].filter((x): x is number => typeof x === 'number')
  const semua = [...nilai, ...acuan]
  const min = Math.min(...semua)
  const maks = Math.max(...semua)
  const rentang = maks - min || 1
  const y = (v: number) => 36 - ((v - min) / rentang) * 32
  const titik = nilai.map((v, i) => `${(i / (nilai.length - 1)) * 100},${y(v).toFixed(2)}`).join(' ')
  return (
    <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="mt-2 h-12 w-full" role="img" aria-label={`${butir.length} hasil ${jenis.nama}`}>
      {/* Batas rujukan digambar sebagai garis putus-putus pada sumbu yang sama
          — letak terhadap batas itulah yang dicari mata, bukan bentuk garisnya
          sendiri. */}
      {acuan.map((a) => (
        <line key={a} x1="0" y1={y(a)} x2="100" y2={y(a)} stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" className="text-amber-500/70" />
      ))}
      <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="text-brand" />
    </svg>
  )
}

const LABEL_TREN: Record<StatusTren, { teks: string; kelas: string }> = {
  'belum-cukup-data': { teks: 'Building your baseline', kelas: 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300' },
  stabil: { teks: 'Stable for you', kelas: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  pantau: { teks: 'Watch', kelas: 'bg-amber-500/14 text-amber-700 dark:text-amber-300' },
  'perubahan-bermakna': { teks: 'Meaningful change', kelas: 'bg-orange-500/14 text-orange-700 dark:text-orange-300' },
  'bicarakan-dengan-dokter': { teks: 'Discuss with a doctor', kelas: 'bg-rose-500/14 text-rose-700 dark:text-rose-300' },
}

function fmt(n: number): string {
  return Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2)
}

// Satu baris: letak hasil terakhir terhadap garis dasar PRIBADI. Penjelasan
// dan angka rinci ada di balik ℹ️ supaya gulir utama tetap ringkas.
function BarisTren({ butir, jenis }: { butir: ButirLab[]; jenis: JenisLab }) {
  const t = analisisTrenLab(butir, jenis)
  if (!t) return null
  const label = LABEL_TREN[t.status]
  return (
    <details className="mt-2" data-lab-trend={t.status}>
      <summary className="flex cursor-pointer list-none items-center gap-2">
        <span className={`t-mikro rounded-full px-2 py-0.5 font-black ${label.kelas}`}>{label.teks}</span>
        {t.garisDasar !== null && (
          <span className="t-mikro tabular-nums text-neutral-500 dark:text-neutral-400">
            {t.selisih! >= 0 ? '+' : '−'}{fmt(Math.abs(t.selisih!))} vs your usual {fmt(t.garisDasar)}
          </span>
        )}
        <span className="t-mikro ml-auto text-neutral-400" aria-hidden>ℹ️</span>
      </summary>
      <div className="t-mikro mt-1.5 space-y-0.5 leading-snug text-neutral-500 dark:text-neutral-400">
        <p>{t.alasan}</p>
        {t.rentangPribadi && <p>Your usual range: {fmt(t.rentangPribadi[0])}–{fmt(t.rentangPribadi[1])} {jenis.satuan} (median ± 2 MAD of your earlier results).</p>}
        {t.lajuPerTahun !== null && <p>Rate since the previous result: {t.lajuPerTahun >= 0 ? '+' : '−'}{fmt(Math.abs(t.lajuPerTahun))} {jenis.satuan} per year.</p>}
        <p>A monitoring signal from your own history, not a diagnosis.</p>
      </div>
    </details>
  )
}

export function UbinLab() {
  const [versi, setVersi] = useState(0)
  const [buka, setBuka] = useState(false)
  const [jenisId, setJenisId] = useState(JENIS_LAB[0].id)
  const [nilai, setNilai] = useState('')
  const [tanggal, setTanggal] = useState(tanggalHariIni)
  const [pilih, setPilih] = useState<string | null>(null)

  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:lab', on)
    return () => window.removeEventListener('panacea:lab', on)
  }, [])

  const terisi = useMemo(() => {
    const s = ambilLab()
    return JENIS_LAB.filter((j) => (s[j.id] ?? []).length > 0).map((j) => ({ jenis: j, butir: s[j.id] }))
  }, [versi])

  const aktif = terisi.find((t) => t.jenis.id === pilih) ?? terisi[0]

  const simpanBaru = () => {
    const n = Number(nilai.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) return
    tambahLab(jenisId, tanggal, n)
    setNilai('')
    setPilih(jenisId)
    setBuka(false)
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Lab results</h2>
        <button onClick={() => setBuka((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          {buka ? 'Close' : '+ Add'}
        </button>
      </div>

      <div className="kaca rounded-3xl p-3">
        {buka && (
          <div className="mb-3 border-b border-neutral-100 pb-3 dark:border-white/10">
            <select
              value={jenisId}
              onChange={(e) => setJenisId(e.target.value)}
              aria-label="Test type"
              className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white"
            >
              {JENIS_LAB.map((j) => (
                <option key={j.id} value={j.id}>{j.nama} ({j.satuan})</option>
              ))}
            </select>
            <div className="mt-1.5 flex gap-1.5">
              <input
                inputMode="decimal"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Value"
                aria-label="Result value"
                className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white"
              />
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                aria-label="Collection date"
                className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 py-2 text-ink dark:border-white/12 dark:text-white"
              />
              <button onClick={simpanBaru} className="t-kecil shrink-0 rounded-xl bg-brand px-3 font-bold text-white">Save</button>
            </div>
            <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
              The date blood was TAKEN, not the date the result came out — the gap between them can be days.
            </p>
          </div>
        )}

        {!aktif ? (
          <p className="t-kecil text-neutral-500">No results yet. Press “+ Add” to enter your first lab result.</p>
        ) : (
          <>
            {terisi.length > 1 && (
              <div className="geser-aman -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {terisi.map((t) => (
                  <button
                    key={t.jenis.id}
                    onClick={() => setPilih(t.jenis.id)}
                    className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                      t.jenis.id === aktif.jenis.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
                    }`}
                  >
                    {t.jenis.nama}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const butir = aktif.butir
              const akhir = butir[butir.length - 1]
              const umur = umurHari(butir)
              const j = aktif.jenis
              const diLuar =
                (typeof j.bawah === 'number' && akhir.nilai < j.bawah) ||
                (typeof j.atas === 'number' && akhir.nilai > j.atas)
              return (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[26px] font-black leading-none tabular-nums ${diLuar ? 'text-amber-500' : 'text-ink dark:text-white'}`}>
                      {akhir.nilai}
                    </span>
                    <span className="t-mikro font-bold text-neutral-400">{j.satuan}</span>
                    <span className="t-mikro ml-auto shrink-0 text-neutral-400">
                      {umur === 0 ? 'today' : umur === 1 ? 'yesterday' : `${umur} d ago`}
                    </span>
                  </div>

                  <Garis butir={butir} jenis={j} />
                  <BarisTren butir={butir} jenis={j} />

                  <p className="t-mikro mt-1 leading-snug text-neutral-500 dark:text-neutral-400">
                    Reference: {j.sumber}
                  </p>
                  {j.catatan && <p className="t-mikro mt-0.5 leading-snug text-neutral-400">{j.catatan}</p>}
                  <p className="t-mikro mt-1 leading-snug text-neutral-400">
                    Compare against the range on your own result sheet — every laboratory has its own range, based on its equipment and population.
                  </p>
                </>
              )
            })()}
          </>
        )}
      </div>
    </section>
  )
}

export default UbinLab
