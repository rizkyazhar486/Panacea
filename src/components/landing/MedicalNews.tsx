import { useEffect, useMemo, useState } from 'react'
import { api, type LiveNewsItem } from '../../lib/api'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

interface Brief {
  tag: string
  title: string
  summary: string
  status: 'Established' | 'Emerging' | 'Research frontier'
}

interface NewsCache {
  items: LiveNewsItem[]
  savedAt: number
}

const NEWS_CACHE_KEY = 'pmd_medical_news_last_good_v1'
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000

const LEARNING_BRIEFS: Brief[] = [
  { tag: 'Genomika', title: 'CRISPR beranjak dari konsep laboratorium menuju terapi medis resmi', summary: 'Penyuntingan gen kini menjadi kenyataan klinis untuk kelainan darah bawaan tertentu, sementara aplikasi luas lainnya masih dalam tahap eksperimental spesifik penyakit.', status: 'Established' },
  { tag: 'Kesehatan Metabolik', title: 'Terapi berbasis GLP-1 berdampak lebih dari sekadar berat badan', summary: 'Keluaran kardiovaskular, ginjal, dan apnea tidur kini menjadi bagian dari evaluasi kelas obat ini, bersama dengan pemantauan efek samping jangka panjang.', status: 'Emerging' },
  { tag: 'Onkologi', title: 'Terapi kanker presisi kini dipandu biologi spesifik tumor', summary: 'Genomika, patologi, dan fenotipe imun menentukan terapi yang relevan; kuncinya adalah mencocokkan mekanisme terapi dengan tumor individual, bukan memperlakukan kanker sebagai satu penyakit tunggal.', status: 'Established' },
  { tag: 'Regenerasi Sel', title: 'Pemrograman ulang seluler menjanjikan secara ilmiah, bukan tombol reset instan', summary: 'Riset regenerasi dan pemrograman ulang parsial dapat memperbarui penanda seluler pada sistem eksperimental, namun pembalikan usia menyeluruh belum menjadi terapi klinis resmi.', status: 'Research frontier' },
  { tag: 'Perangkat Medis Pintar', title: 'Sensor konsumen menjadi instrumen skrining dan perilaku yang berharga', summary: 'Tren EKG, variabilitas detak jantung, pola tidur, dan sensor glukosa menyediakan data longitudinal yang berharga, dengan catatan kualitas pengukuran dan interpretasi klinis tetap utama.', status: 'Emerging' },
  { tag: 'AI Medis', title: 'Sistem AI medis terbaik selalu menyajikan sumber data dan tingkat kepastian', summary: 'Sistem yang handal memisahkan observasi dari pasien, penjelasan edukatif, dan inferensi klinis dokter, tanpa menampilkan teks sintetis AI sebagai fakta terukur.', status: 'Emerging' },
]

function readCache(): NewsCache | null {
  try {
    const raw = localStorage.getItem(NEWS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NewsCache
    if (!Array.isArray(parsed.items) || !parsed.items.length || !Number.isFinite(parsed.savedAt)) return null
    if (Date.now() - parsed.savedAt > MAX_CACHE_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(items: LiveNewsItem[]) {
  try {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ items, savedAt: Date.now() } satisfies NewsCache))
  } catch { /* private mode / storage full */ }
}

function relativeTime(pubDate: string) {
  const t = Date.parse(pubDate)
  if (Number.isNaN(t)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - t) / 60000))
  if (minutes < 60) return `${minutes}m lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}j lalu`
  return `${Math.floor(hours / 24)}h lalu`
}

function cacheAge(savedAt: number | null) {
  if (!savedAt) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - savedAt) / 60000))
  if (minutes < 60) return `${minutes}m lalu`
  const hours = Math.floor(minutes / 60)
  return `${hours}j lalu`
}

function cleanTitle(title: string, source: string) {
  return source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title
}

const cardClass = 'group block rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#07130c]/85 dark:hover:border-emerald-400/40 dark:hover:bg-[#0b1c11]'

function LiveCard({ item }: { item: LiveNewsItem }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className={cardClass}>
      <div className="flex items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {item.region === 'domestic' ? 'Indonesia' : 'Internasional'}
        </span>
        <span className="tabular-nums">{relativeTime(item.pubDate)}</span>
      </div>
      <h3 className="mt-3 text-sm font-extrabold leading-snug text-neutral-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
        {cleanTitle(item.title, item.source)}
      </h3>
      <div className="mt-3.5 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800/80">
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          {item.source}
        </span>
        <span className="text-[11px] font-semibold text-neutral-500 group-hover:text-emerald-600 dark:text-neutral-400">
          Baca Sumber ↗
        </span>
      </div>
    </a>
  )
}

export function MedicalNews() {
  const cached = useMemo(() => readCache(), [])
  const [live, setLive] = useState<LiveNewsItem[] | null>(cached?.items ?? null)
  const [cacheSavedAt, setCacheSavedAt] = useState<number | null>(cached?.savedAt ?? null)
  const [failed, setFailed] = useState(false)
  const [fresh, setFresh] = useState(false)

  useEffect(() => {
    let alive = true
    api.news()
      .then((response) => {
        if (!alive) return
        if (response.items?.length) {
          setLive(response.items)
          setFresh(true)
          setFailed(false)
          setCacheSavedAt(Date.now())
          writeCache(response.items)
        } else {
          setFailed(true)
        }
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  const headlines = useMemo(() => live?.slice(0, 6) ?? [], [live])
  const usingCached = Boolean(live?.length) && !fresh

  return (
    <section
      id="news"
      className="mx-auto my-10 max-w-6xl overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-b from-white via-[#f7faf8] to-white p-7 shadow-sm dark:border-emerald-500/20 dark:from-[#06140d] dark:via-[#020704] dark:to-[#06140d] sm:p-10"
    >
      {/* Legacy rich-welcome film uses the same Higgsfield asset as the hero.
          Keep its caption readable on real video frames without changing the
          hero or relying on the active light/dark theme. */}
      <style>{`
        video[src*="hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"] ~ div.absolute.bottom-0 { color: #fff !important; }
        video[src*="hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"] ~ div.absolute.bottom-0 p { color: rgba(255,255,255,.82) !important; }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300">
            Intelijen &amp; Wawasan Terkini
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
            Briefing Kesehatan: Ketahui Fakta Terkini. <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Pahami Bukti Klinis Teruji.</span>
          </h2>
          <BatasKlaimKesehatan permukaan="clinical.medical-news" />
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            Panaceamed menyajikan berita medis terverifikasi secara transparan tanpa menyamarkan ringkasan editorial sebagai berita langsung. Setiap sumber dan waktu pembaruan ditampilkan jelas; jika koneksi feed terganggu, arsip berita terverifikasi terakhir tetap dapat dibaca.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold shadow-sm ${
          fresh
            ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : usingCached
              ? 'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
        }`}>
          <span className={`h-2 w-2 rounded-full ${fresh ? 'bg-emerald-500 animate-pulse' : usingCached ? 'bg-amber-500' : 'bg-neutral-400'}`} />
          <span>
            {fresh
              ? 'Koneksi feed berita aktif'
              : usingCached
                ? `Berita tersimpan${cacheSavedAt ? ` · tersinkron ${cacheAge(cacheSavedAt)}` : ''}${failed ? ' · pembaruan belum tersedia' : ' · memperbarui…'}`
                : failed
                  ? 'Feed berita belum tersedia · ringkasan edukasi ditampilkan'
                  : 'Memeriksa sumber berita langsung…'}
          </span>
        </div>
      </div>

      {headlines.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {headlines.map((item) => <LiveCard key={item.link} item={item} />)}
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            Ringkasan pembelajaran editorial klinis · bukan berita siaran langsung
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LEARNING_BRIEFS.map((brief) => (
              <article key={brief.title} className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {brief.tag}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {brief.status}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-extrabold leading-snug text-neutral-900 dark:text-white">
                  {brief.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {brief.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
