import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Cari pangan kemasan dan catat langsung — dari Open Food Facts.
//
// MENGAPA INI, DAN BUKAN DAFTAR MAKANAN BUATAN SENDIRI. Katalog gizi bawaan
// aplikasi ini berisi makanan Indonesia yang umum, dan itu memang yang paling
// sering dicatat orang. Yang tidak tertangani adalah MAKANAN KEMASAN: satu
// merek roti berbeda gizinya dari merek lain, dan menebaknya dari "roti tawar"
// berarti mencatat angka yang salah setiap hari.
//
// TAKARANNYA DIISI SENDIRI, TIDAK DITEBAK. Sumbernya memberi angka per 100
// gram; berapa gram yang benar-benar dimakan hanya diketahui pemakainya.
// Aplikasi ini tidak mengarang "satu porsi" — takaran porsi di kemasan sering
// berbeda dari isi bungkusnya, dan tebakan itu akan tercatat sebagai fakta.
//
// DATANYA DIISI SUKARELAWAN, dan itu ditulis apa adanya di widgetnya: ada
// bungkus yang salah atau kosong. Karena itu mereknya ikut ditampilkan, dan
// angka yang dipakai tetap dapat diubah tangan sebelum disimpan.
// ─────────────────────────────────────────────────────────────────────────────

interface Pangan {
  kode?: string
  nama: string
  merek?: string
  kkal100?: number
  karbo100?: number
  protein100?: number
  lemak100?: number
  serat100?: number
  garam100?: number
  sumber: string
}

function tanggalHariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function UbinPangan() {
  const { addFood } = useStore()
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState<Pangan[] | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [pilih, setPilih] = useState<Pangan | null>(null)
  const [gram, setGram] = useState('100')
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    const t = q.trim()
    if (!backendEnabled || t.length < 3) { setHasil(null); return }
    // Ditunda 500 ms: mengetik "roti gandum" jangan menjadi sebelas permintaan.
    const id = setTimeout(() => {
      setSibuk(true)
      const angkaSaja = /^\d{8,14}$/.test(t)
      void api.cariPangan(angkaSaja ? '' : t, angkaSaja ? t : undefined)
        .then((r) => setHasil(r as Pangan[]))
        .catch(() => setHasil([]))
        .finally(() => setSibuk(false))
    }, 500)
    return () => clearTimeout(id)
  }, [q])

  if (!backendEnabled) return null

  const g = Math.max(1, Math.min(2000, Number(gram.replace(',', '.')) || 0))
  const skala = g / 100

  const simpan = () => {
    if (!pilih) return
    addFood({
      id: `off-${Date.now()}`,
      date: tanggalHariIni(),
      name: `${pilih.nama}${pilih.merek ? ` (${pilih.merek})` : ''}`.slice(0, 60),
      grams: g,
      kcal: Math.round((pilih.kkal100 ?? 0) * skala),
      carbs: Math.round((pilih.karbo100 ?? 0) * skala),
      protein: Math.round((pilih.protein100 ?? 0) * skala),
      fat: Math.round((pilih.lemak100 ?? 0) * skala),
    })
    setPesan(`${pilih.nama} ${g} g logged`)
    setPilih(null)
    setQ('')
    setHasil(null)
    setTimeout(() => setPesan(''), 4000)
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Search packaged food</h2>
        <span className="t-mikro text-neutral-400">Open Food Facts</span>
      </div>

      <div className="kaca rounded-3xl p-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPilih(null) }}
          placeholder="Product name or barcode number"
          aria-label="Search packaged food"
          className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink outline-none placeholder:text-neutral-400 focus:border-brand dark:border-white/12 dark:text-white"
        />

        {pesan && <p className="t-kecil mt-2 font-bold text-brand">{pesan}</p>}

        {pilih ? (
          <div className="mt-2">
            <span className="t-kecil block truncate font-black text-ink dark:text-white">{pilih.nama}</span>
            {pilih.merek && <span className="t-mikro block truncate text-neutral-400">{pilih.merek}</span>}

            <div className="mt-2 flex items-center gap-1.5">
              <input
                inputMode="decimal"
                value={gram}
                onChange={(e) => setGram(e.target.value)}
                aria-label="How many grams"
                className="t-kecil w-20 shrink-0 rounded-xl border border-neutral-200 bg-transparent px-2 py-2 tabular-nums text-ink dark:border-white/12 dark:text-white"
              />
              <span className="t-mikro shrink-0 text-neutral-400">gram</span>
              <button onClick={simpan} className="t-kecil ml-auto min-h-[40px] shrink-0 rounded-xl bg-brand px-3 font-bold text-white">
                Log
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              {[
                { l: 'kkal', v: Math.round((pilih.kkal100 ?? 0) * skala) },
                { l: 'karbo', v: Math.round((pilih.karbo100 ?? 0) * skala) },
                { l: 'protein', v: Math.round((pilih.protein100 ?? 0) * skala) },
                { l: 'lemak', v: Math.round((pilih.lemak100 ?? 0) * skala) },
              ].map((x) => (
                <span key={x.l} className="min-w-0">
                  <span className="t-kecil block font-black tabular-nums text-ink dark:text-white">{x.v}</span>
                  <span className="t-mikro block truncate text-neutral-400">{x.l}</span>
                </span>
              ))}
            </div>
            <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
              Calculated from the source's per-100-g figures, multiplied by the grams you entered — this app never guesses a serving size.
            </p>
          </div>
        ) : hasil === null ? (
          <p className="t-mikro mt-2 leading-snug text-neutral-400">
            {sibuk ? 'Searching…' : 'Type the packaged product name or its barcode number. An open, volunteer-maintained database — check the brand before logging.'}
          </p>
        ) : hasil.length === 0 ? (
          <p className="t-kecil mt-2 text-neutral-500">Not found. Try the brand name, or log it manually on the Nutrition page.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {hasil.map((p, i) => (
              <button
                key={`${p.kode ?? i}`}
                onClick={() => { setPilih(p); setGram('100') }}
                className="flex min-h-[40px] items-center gap-2 rounded-xl px-1 text-left transition active:bg-neutral-100 dark:active:bg-white/10"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-kecil block truncate font-bold text-ink dark:text-white">{p.nama}</span>
                  {p.merek && <span className="t-mikro block truncate text-neutral-400">{p.merek}</span>}
                </span>
                <span className="t-mikro shrink-0 tabular-nums text-neutral-500">{Math.round(p.kkal100 ?? 0)} kkal/100 g</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UbinPangan
