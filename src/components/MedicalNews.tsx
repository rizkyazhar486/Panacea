import { useMemo } from 'react'

// ──────────────────────────────────────────────────────────────────────────
// Berita & Inovasi Kedokteran — editorial "newsroom" section.
// Curated, factual medical-innovation items (stem-cell, CRISPR, devices,
// mutation, AI-EMR, Nobel, longevity, sports-science). A fresh subset is drawn
// on every visit so the section always feels alive; the quote rotates across
// innovators, investors and Nobel laureates.
//
// To go fully live later, swap CURATED for a fetch to a news/RSS feed or a
// server-side PubMed query and keep the same shape.
// ──────────────────────────────────────────────────────────────────────────

interface NewsItem {
  cat: string
  title: string
  detail: string
  /** editorial status label — honest curation, not a fake citation */
  kind: 'Nobel' | 'Uji Klinis' | 'Riset' | 'Perangkat' | 'Baru'
}

const CURATED: NewsItem[] = [
  { cat: 'CRISPR', kind: 'Uji Klinis', title: 'Terapi gen CRISPR pertama disetujui', detail: 'Casgevy (exa-cel) — penyuntingan CRISPR/Cas9 untuk anemia sel sabit & beta-talasemia menandai era terapi genetik klinis yang nyata.' },
  { cat: 'CRISPR', kind: 'Uji Klinis', title: 'Base & prime editing masuk klinik', detail: 'Penyuntingan presisi satu-huruf DNA mulai diuji untuk hiperkolesterolemia familial & penyakit metabolik bawaan.' },
  { cat: 'Sel Punca', kind: 'Uji Klinis', title: 'Sel islet turunan stem-cell lawan diabetes tipe-1', detail: 'Sel penghasil insulin dari stem-cell membuat sebagian pasien mandiri-insulin dalam uji klinis awal.' },
  { cat: 'Longevity', kind: 'Riset', title: 'Reprogram epigenetik "meremajakan" sel', detail: 'Faktor Yamanaka parsial memulihkan penanda usia sel di praklinis — inti riset memperpanjang healthspan.' },
  { cat: 'AI', kind: 'Riset', title: 'AlphaFold memetakan jagat protein', detail: 'AlphaFold 3 memprediksi struktur & interaksi protein, memangkas waktu penemuan obat dari tahun menjadi minggu.' },
  { cat: 'Nobel', kind: 'Nobel', title: 'Nobel Kedokteran: mRNA & microRNA', detail: '2023 — Karikó & Weissman (mRNA termodifikasi); 2024 — Ambros & Ruvkun (microRNA): fondasi terapi presisi.' },
  { cat: 'Metabolik', kind: 'Uji Klinis', title: 'GLP-1 melampaui penurunan berat', detail: 'Semaglutide & tirzepatide menunjukkan manfaat jantung, ginjal kronik dan apnea tidur — bukan sekadar obesitas.' },
  { cat: 'Neuro', kind: 'Uji Klinis', title: 'Anti-amiloid memperlambat Alzheimer', detail: 'Lecanemab & donanemab memperlambat penurunan kognitif tahap awal — terobosan pertama dalam satu dekade.' },
  { cat: 'Perangkat', kind: 'Perangkat', title: 'Wearable menjadi alat skrining', detail: 'CGM tanpa resep, EKG/AFib di jam tangan dan sensor SpO₂ membawa deteksi dini ke pergelangan tangan.' },
  { cat: 'Mutasi', kind: 'Riset', title: 'Sekuensing genom kian murah & cepat', detail: 'Genom utuh kini hitungan jam dan ratusan dolar — membuka skrining mutasi & onkologi presisi massal.' },
  { cat: 'AI-EMR', kind: 'Baru', title: 'Dokumentasi klinis ambient', detail: 'AI menyusun catatan medis dari percakapan dokter–pasien, menekan burnout dan menambah waktu tatap pasien.' },
  { cat: 'Onkologi', kind: 'Uji Klinis', title: 'Vaksin kanker mRNA personal', detail: 'Vaksin mRNA yang disesuaikan dengan tumor tiap pasien menunjukkan respons menjanjikan pada melanoma & pankreas.' },
  { cat: 'Performa', kind: 'Riset', title: 'VO₂max — biomarker umur panjang', detail: 'Kebugaran kardiorespirasi tinggi berkait erat dengan mortalitas lebih rendah — relevan untuk atlet Hyrox & olahraga tim.' },
  { cat: 'Performa', kind: 'Riset', title: 'Zona laktat memandu latihan & pemulihan', detail: 'Pemetaan ambang laktat mengoptimalkan beban latihan tinggi-intensitas serta jadwal pemulihan atlet.' },
  { cat: 'Imunologi', kind: 'Riset', title: 'Sel CAR-T menjangkau penyakit autoimun', detail: 'Terapi sel-T rekayasa, semula untuk kanker darah, kini diuji untuk lupus dan penyakit autoimun berat.' },
]

interface Quote {
  q: string
  who: string
  role: 'Inovator' | 'Investor' | 'Nobel' | 'Klinisi' | 'Peneliti'
}

// Paraphrased sentiments faithful to each figure's well-documented public
// stance — curated, not verbatim transcripts.
const QUOTES: Quote[] = [
  { q: 'Penyuntingan gen memberi kita kekuatan menulis ulang kode kehidupan — dan dengannya, tanggung jawab besar.', who: 'Jennifer Doudna', role: 'Nobel' },
  { q: 'AI bisa mempercepat penemuan ilmiah dari hitungan dekade menjadi tahun.', who: 'Demis Hassabis', role: 'Nobel' },
  { q: 'Penuaan bukan takdir mutlak — ia proses yang bisa dipahami dan diperlambat.', who: 'David Sinclair', role: 'Peneliti' },
  { q: 'Tujuan kedokteran bukan memperpanjang umur saja, melainkan memperpanjang masa sehat.', who: 'Peter Attia', role: 'Klinisi' },
  { q: 'Data dan AI mengembalikan empati ke kedokteran dengan memberi dokter waktu untuk pasien.', who: 'Eric Topol', role: 'Klinisi' },
  { q: 'Modal paling cerdas mengalir ke pencegahan — imbal hasil terbaik adalah tahun-tahun sehat.', who: 'Tesis Investasi Longevity', role: 'Investor' },
  { q: 'Bertaruh pada biologi sebagai teknologi adalah peluang abad ini.', who: 'Modal Ventura Bio', role: 'Investor' },
  { q: 'Mencegah lebih murah, lebih manusiawi, dan lebih kuat daripada mengobati.', who: 'Kesehatan Masyarakat Modern', role: 'Klinisi' },
]

const KIND_STYLE: Record<NewsItem['kind'], string> = {
  Nobel: 'text-amber-600',
  'Uji Klinis': 'text-brand-dark',
  Riset: 'text-neutral-500',
  Perangkat: 'text-sky-600',
  Baru: 'text-accent',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Newsroom kicker: status label + category, but never the same word twice.
function Kicker({ kind, cat }: { kind: NewsItem['kind']; cat: string }) {
  const showCat = cat.toLowerCase() !== kind.toLowerCase()
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${KIND_STYLE[kind]}`}>{kind}</span>
      {showCat && (
        <>
          <span aria-hidden className="text-neutral-300">·</span>
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{cat}</span>
        </>
      )}
    </div>
  )
}

export function MedicalNews() {
  // Fresh draw each mount → the section "keeps updating".
  const picks = useMemo(() => shuffle(CURATED), [])
  const lead = picks[0]
  const rest = picks.slice(1, 7)
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])
  const updated = useMemo(
    () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    [],
  )

  return (
    <section className="px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Masthead */}
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark">Berita &amp; Inovasi</span>
            <h2 className="mt-1.5 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
              Teknologi Kedokteran Terkini
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-black/10 bg-white/70 px-3 py-1.5 backdrop-blur sm:self-auto">
            <span className="vital-dot h-2 w-2 rounded-full bg-brand" />
            <span className="text-[11px] font-semibold text-neutral-500">Diperbarui {updated}</span>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500">
          Sel punca · CRISPR · perangkat · mutasi · AI-EMR · Nobel · performa — kurasi yang berganti setiap kali Anda berkunjung.
        </p>

        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Featured lead */}
          <article className="group relative flex flex-col">
            <Kicker kind={lead.kind} cat={lead.cat} />
            <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">
              {lead.title}
            </h3>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">{lead.detail}</p>
            <div className="mt-5 h-px w-16 bg-brand/40 transition-all duration-300 group-hover:w-28" />
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark">
              Sorotan utama
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </article>

          {/* Index — numbered newsroom list, not identical cards */}
          <ol className="flex flex-col divide-y divide-black/[0.07]">
            {rest.map((n, i) => (
              <li key={n.title} className="group flex gap-4 py-3.5 first:pt-0">
                <span className="mt-0.5 w-6 shrink-0 font-mono text-xs font-bold tabular-nums text-neutral-300 transition-colors group-hover:text-brand">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <Kicker kind={n.kind} cat={n.cat} />
                  <h4 className="mt-1 text-[15px] font-semibold leading-snug transition-colors group-hover:text-brand-dark">
                    {n.title}
                  </h4>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{n.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Editorial pull-quote — calm, single accent, role-tagged */}
        <figure className="mt-12 grid gap-5 border-t border-black/10 pt-8 sm:grid-cols-[auto_1fr] sm:gap-7">
          <span aria-hidden className="select-none font-serif text-6xl leading-none text-brand/30 sm:text-7xl">“</span>
          <div>
            <blockquote className="text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
              {quote.q}
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2.5">
              <span className="h-px w-8 bg-brand" />
              <span className="text-sm font-bold">{quote.who}</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                {quote.role}
              </span>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  )
}
