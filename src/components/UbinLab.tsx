import { useEffect, useMemo, useState } from 'react'
import { JENIS_LAB, ambilLab, tambahLab, umurHari, type ButirLab, type JenisLab } from '../lib/lab'

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

                  <p className="t-mikro mt-1 leading-snug text-neutral-500 dark:text-neutral-400">
                    Rujukan: {j.sumber}
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
