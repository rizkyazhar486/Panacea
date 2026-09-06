import { useMemo, useState } from 'react'
import { KARYA, TEMA, JENIS_LABEL, type Karya } from '../lib/ringkasanKarya'
import { LIFE_LIBRARY, WEALTH_DOMAINS, type LifeReading, type WealthDomain } from '../lib/lifeWealthLibrary'
import { PemutarBaca } from '../components/PemutarBaca'

// ─────────────────────────────────────────────────────────────────────────────
// Life library + ringkasan buku dan film.
//
// UNTUK APA HALAMAN INI. Bukan pengganti bacaan, melainkan alat MEMILIH:
// membaca satu paragraf jauh lebih murah daripada memulai buku tiga ratus
// halaman yang ternyata bukan yang dibutuhkan bulan ini. Karena itu tiap
// ringkasan menjawab satu pertanyaan: apa gagasan intinya, dan untuk siapa.
//
// Panacea menambah satu rak praktis yang sengaja mengikuti tujuh bentuk
// kekayaan Life OS: waktu, kesehatan, keuangan, pengetahuan, sosial, keluarga,
// dan karir. Ringkasannya ditulis ulang secara orisinal; sumber tetap merupakan
// karya primernya dan kartu praktik Panacea tidak dipresentasikan sebagai buku.
// ─────────────────────────────────────────────────────────────────────────────

type Saring = 'semua' | 'buku' | 'film'

function Kartu({ k }: { k: Karya }) {
  return (
    <article className="kaca rounded-3xl p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="t-sedang min-w-0 font-black leading-snug text-ink dark:text-white">{k.judul}</h3>
        <span className="t-mikro shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 font-black uppercase text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
          {JENIS_LABEL[k.jenis]}
        </span>
      </div>
      <p className="t-mikro mt-0.5 truncate text-neutral-400">
        {k.oleh}{k.tahun ? ` · ${k.tahun}` : ''}
      </p>
      <p className="t-kecil mt-2 leading-relaxed text-neutral-600 dark:text-neutral-300">{k.ringkas}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PemutarBaca teks={`${k.judul}, oleh ${k.oleh}. ${k.ringkas}`} label="Listen" />
        {k.tema.map((t) => (
          <span key={t} className="t-mikro rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand-dark dark:text-brand">{t}</span>
        ))}
      </div>
    </article>
  )
}

function LifeGuideCard({ item }: { item: LifeReading }) {
  return (
    <article className="w-[286px] shrink-0 snap-start rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111315]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-fuchsia-700 dark:text-fuchsia-300">{item.domain} · {item.kind.replace('-', ' ')}</div>
          <h3 className="mt-1 text-[15px] font-black leading-tight text-neutral-950 dark:text-white">{item.title}</h3>
          <p className="mt-1 text-[10px] font-semibold text-neutral-400">{item.by}{item.year ? ` · ${item.year}` : ''}</p>
        </div>
        <span className="text-xl" aria-hidden>{item.kind === 'practice' ? '⚡' : item.kind === 'research-guide' ? '🔎' : '📖'}</span>
      </div>
      <p className="mt-3 text-[11px] font-medium leading-relaxed text-neutral-650 dark:text-neutral-300">{item.summary}</p>
      <div className="mt-3 rounded-2xl bg-fuchsia-50 p-3 dark:bg-fuchsia-400/[.08]">
        <div className="text-[9px] font-black uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">Try this</div>
        <p className="mt-1 text-[10px] font-semibold leading-relaxed text-neutral-700 dark:text-neutral-200">{item.tryThis}</p>
      </div>
      <div className="mt-3">
        <PemutarBaca teks={`${item.title}, ${item.by}. ${item.summary}. Try this: ${item.tryThis}`} label="Listen" />
      </div>
    </article>
  )
}

export function RingkasanKarya() {
  const [q, setQ] = useState('')
  const [jenis, setJenis] = useState<Saring>('semua')
  const [tema, setTema] = useState<string | null>(null)
  const [batas, setBatas] = useState(20)
  const [wealthDomain, setWealthDomain] = useState<WealthDomain>('Time')

  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return KARYA.filter((k) => {
      if (jenis !== 'semua' && k.jenis !== jenis) return false
      if (tema && !k.tema.includes(tema)) return false
      if (!kata) return true
      return (
        k.judul.toLowerCase().includes(kata) ||
        k.oleh.toLowerCase().includes(kata) ||
        k.ringkas.toLowerCase().includes(kata)
      )
    })
  }, [q, jenis, tema])

  const wealthReadings = useMemo(() => LIFE_LIBRARY.filter((item) => item.domain === wealthDomain), [wealthDomain])
  const jumlahBuku = KARYA.filter((k) => k.jenis === 'buku').length
  const jumlahFilm = KARYA.length - jumlahBuku

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <section className="p-fluid rounded-3xl bg-gradient-to-br from-brand-50 via-white to-fuchsia-50 dark:from-brand/15 dark:via-white/[.025] dark:to-fuchsia-400/[.08]">
        <div className="text-[10px] font-black uppercase tracking-[.16em] text-brand">Panacea Life Library</div>
        <h1 className="t-judul mt-1 font-black leading-tight text-ink dark:text-white">Read for the life you are building</h1>
        <p className="t-kecil mt-1 max-w-2xl leading-relaxed text-neutral-600 dark:text-neutral-300">
          {LIFE_LIBRARY.length} short guides across seven forms of wealth, plus {KARYA.length} book and film summaries. Use the page to choose what deserves deeper reading, listening or practice.
        </p>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.15em] text-fuchsia-700 dark:text-fuchsia-300">Seven forms of wealth</div>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">Time · health · money · knowledge · social · family · career</h2>
          </div>
          <span className="shrink-0 rounded-full bg-fuchsia-100 px-2.5 py-1 text-[9px] font-black text-fuchsia-800 dark:bg-fuchsia-400/15 dark:text-fuchsia-200">{LIFE_LIBRARY.length} guides</span>
        </div>
        <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">These short guides are original Panacea descriptions and exercises. They help you decide what to explore next; they do not replace the underlying books, research or professional advice.</p>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {WEALTH_DOMAINS.map((domain) => (
            <button key={domain} onClick={() => setWealthDomain(domain)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black transition ${wealthDomain === domain ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
              {domain}
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {wealthReadings.map((item) => <LifeGuideCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="kaca sticky top-2 z-10 rounded-3xl p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Books & films</div>
            <div className="text-[13px] font-black text-neutral-950 dark:text-white">Search the larger work-summary shelf</div>
          </div>
          <span className="text-[9px] font-black text-neutral-400">{KARYA.length} works</span>
        </div>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setBatas(20) }}
          placeholder="Search a title, author, or a word in the summary"
          aria-label="Search works"
          className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink outline-none placeholder:text-neutral-400 focus:border-brand dark:border-white/12 dark:text-white"
        />
        <div className="geser-aman -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {([['semua', `All ${KARYA.length}`], ['buku', `Books ${jumlahBuku}`], ['film', `Films ${jumlahFilm}`]] as [Saring, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setJenis(id); setBatas(20) }}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                jenis === id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px shrink-0 bg-neutral-200 dark:bg-white/10" />
          {TEMA.map((t) => (
            <button
              key={t}
              onClick={() => { setTema(tema === t ? null : t); setBatas(20) }}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                tema === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <p className="t-mikro px-1 text-neutral-400">{hasil.length} works</p>

      <div className="space-y-2">
        {hasil.slice(0, batas).map((k) => <Kartu key={k.id} k={k} />)}
      </div>

      {hasil.length > batas && (
        <button
          onClick={() => setBatas((b) => b + 20)}
          className="t-kecil min-h-[44px] w-full rounded-2xl border border-neutral-200 font-bold text-brand dark:border-white/12"
        >
          Show {Math.min(20, hasil.length - batas)} more
        </button>
      )}

      {hasil.length === 0 && (
        <p className="t-kecil px-1 text-center text-neutral-500">
          Nothing matched. Try another word, or clear the theme filter.
        </p>
      )}

      <p className="t-mikro px-1 leading-relaxed text-neutral-400">
        The summaries are written afresh, not copied from the books, their back covers, or anyone else's reviews. What
        makes a book work — its examples, its counter-arguments, its repetition — is exactly what disappears in a
        summary, so treat this page as a shortlist rather than as the substance.
      </p>
    </div>
  )
}

export default RingkasanKarya
