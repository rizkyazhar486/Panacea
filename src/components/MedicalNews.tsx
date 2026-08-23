import { useEffect, useMemo, useState } from 'react'
import { api, type LiveNewsItem } from '../lib/api'

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
  kind: 'Nobel' | 'Uji Klinis' | 'Penelitian' | 'Perangkat' | 'Baru'
  /** international vs domestic (Indonesia) coverage — default international */
  region?: 'Internasional' | 'Dalam Negeri'
}

const CURATED: NewsItem[] = [
  { cat: 'CRISPR', kind: 'Uji Klinis', title: 'Terapi gen CRISPR pertama disetujui', detail: 'Casgevy (exa-cel) — penyuntingan CRISPR/Cas9 untuk anemia sel sabit & talasemia beta menandai datangnya terapi gen yang benar-benar dipakai klinis.' },
  { cat: 'CRISPR', kind: 'Uji Klinis', title: 'Base editing dan prime editing sampai ke klinik', detail: 'Penyuntingan DNA setepat satu huruf kini diujikan pada hiperkolesterolemia familial dan penyakit metabolik keturunan.' },
  { cat: 'Sel Punca', kind: 'Uji Klinis', title: 'Sel islet dari sel punca menghadapi diabetes tipe 1', detail: 'Sel penghasil insulin yang ditumbuhkan dari sel punca membuat sebagian pasien lepas dari insulin pada uji klinis awal.' },
  { cat: 'Longevity', kind: 'Penelitian', title: 'Pemrograman ulang epigenetik "memudakan" sel', detail: 'Faktor Yamanaka parsial memulihkan penanda muda pada sel dalam kajian praklinis — batas terdepan penelitian untuk memperpanjang masa sehat.' },
  { cat: 'AI', kind: 'Penelitian', title: 'AlphaFold memetakan jagat protein', detail: 'AlphaFold 3 meramalkan struktur dan interaksi protein, memangkas waktu penemuan obat dari hitungan tahun menjadi pekan.' },
  { cat: 'Nobel', kind: 'Nobel', title: 'Nobel Kedokteran: mRNA & microRNA', detail: '2023 — Karikó & Weissman (mRNA termodifikasi); 2024 — Ambros & Ruvkun (microRNA): dasar bagi terapi presisi.' },
  { cat: 'Metabolik', kind: 'Uji Klinis', title: 'Obat GLP-1 tidak berhenti pada penurunan berat', detail: 'Semaglutid dan tirzepatid menunjukkan manfaat pada kesehatan jantung, penyakit ginjal menahun, dan apnea tidur — jauh melampaui pengobatan obesitas.' },
  { cat: 'Saraf', kind: 'Uji Klinis', title: 'Obat anti-amiloid memperlambat Alzheimer', detail: 'Lekanemab dan donanemab memperlambat penurunan daya pikir tahap awal — terobosan sungguhan pertama dalam sepuluh tahun.' },
  { cat: 'Perangkat', kind: 'Perangkat', title: 'Perangkat pakai menjadi alat penapisan', detail: 'Sensor gula darah bebas beli, deteksi EKG/fibrilasi atrium lewat jam tangan, dan sensor SpO₂ membawa deteksi dini ke pergelangan tangan.' },
  { cat: 'Genomika', kind: 'Penelitian', title: 'Pembacaan genom makin murah dan cepat', detail: 'Satu genom utuh kini selesai dalam hitungan jam dengan biaya ratusan dolar — membuka jalan bagi penapisan mutasi massal dan onkologi presisi.' },
  { cat: 'AI-EMR', kind: 'Baru', title: 'Pencatatan klinis otomatis mulai dipakai', detail: 'AI menyusun draf catatan medis langsung dari percakapan dokter dan pasien, mengurangi kelelahan kerja dan menambah waktu dokter bersama pasiennya.' },
  { cat: 'Onkologi', kind: 'Uji Klinis', title: 'Vaksin kanker mRNA yang dipersonalisasi', detail: 'Vaksin mRNA yang disesuaikan dengan tumor tiap pasien menunjukkan respons menjanjikan pada melanoma dan kanker pankreas.' },
  { cat: 'Penampilan', kind: 'Penelitian', title: 'VO₂maks — biomarker umur panjang', detail: 'Kebugaran kardiorespirasi yang tinggi berkaitan erat dengan angka kematian yang lebih rendah — berlaku bagi atlet Hyrox maupun olahraga beregu.' },
  { cat: 'Penampilan', kind: 'Penelitian', title: 'Zona laktat menuntun latihan dan pemulihan', detail: 'Pemetaan ambang laktat menyempurnakan takaran latihan intensitas tinggi dan jadwal pemulihan atlet.' },
  { cat: 'Imunologi', kind: 'Penelitian', title: 'Sel CAR-T diarahkan ke penyakit autoimun', detail: 'Terapi sel T rekayasa yang semula dikembangkan untuk kanker darah kini diujikan pada lupus dan penyakit autoimun berat.' },
  // --- Domestic (Indonesia) ---
  { cat: 'SATUSEHAT', kind: 'Baru', title: 'SATUSEHAT menjadi tulang punggung rekam medis nasional', detail: 'Kementerian Kesehatan mendorong pertukaran data kesehatan antarfasilitas lewat platform SATUSEHAT — fondasi rekam medis elektronik yang menyatu secara nasional.', region: 'Dalam Negeri' },
  { cat: 'Telemedisin', kind: 'Baru', title: 'Pemakaian telemedisin melaju setelah pandemi', detail: 'Konsultasi jarak jauh dan resep digital menjadi lazim di kota-kota besar Indonesia, memperluas akses ke dokter bagi daerah terpencil.', region: 'Dalam Negeri' },
  { cat: 'JKN', kind: 'Baru', title: 'KRIS — kelas rawat inap baku untuk BPJS', detail: 'Kelas Rawat Inap Standar (KRIS) diterapkan bertahap untuk menyetarakan mutu layanan bagi peserta JKN/BPJS Kesehatan.', region: 'Dalam Negeri' },
  { cat: 'Penyakit Tropis', kind: 'Uji Klinis', title: 'Nyamuk ber-Wolbachia menekan kasus demam berdarah', detail: 'Teknologi Wolbachia yang diterapkan di beberapa kota Indonesia terbukti menurunkan kasus demam berdarah secara bermakna.', region: 'Dalam Negeri' },
  { cat: 'Stunting', kind: 'Penelitian', title: 'Penurunan stunting menjadi prioritas nasional', detail: 'Intervensi gizi pada 1.000 hari pertama kehidupan dan pemantauan pertumbuhan digencarkan untuk menurunkan angka stunting anak.', region: 'Dalam Negeri' },
  { cat: 'Imunisasi', kind: 'Baru', title: 'Vaksin HPV masuk program imunisasi nasional', detail: 'Perluasan vaksinasi HPV bagi siswi bertujuan menurunkan kanker serviks — salah satu kanker tersering pada perempuan Indonesia.', region: 'Dalam Negeri' },
]

interface Quote {
  q: string
  who: string
  role: 'Inovator' | 'Investor' | 'Nobel' | 'Klinisi' | 'Peneliti'
}

// Paraphrased sentiments faithful to each figure's well-documented public
// stance — curated, not verbatim transcripts.
const QUOTES: Quote[] = [
  { q: 'Penyuntingan gen memberi kita kuasa menulis ulang sandi kehidupan — dan bersamanya, tanggung jawab yang besar.', who: 'Jennifer Doudna', role: 'Nobel' },
  { q: 'AI dapat mempercepat penemuan ilmiah dari hitungan dasawarsa menjadi hitungan tahun.', who: 'Demis Hassabis', role: 'Nobel' },
  { q: 'Penuaan bukan takdir yang mutlak — ia proses yang dapat dipahami dan diperlambat.', who: 'David Sinclair', role: 'Peneliti' },
  { q: 'Tujuan kedokteran bukan sekadar memperpanjang hidup, melainkan memperpanjang tahun-tahun yang sehat.', who: 'Peter Attia', role: 'Klinisi' },
  { q: 'Data dan AI mengembalikan empati ke dalam kedokteran dengan memberi dokter waktu untuk pasiennya.', who: 'Eric Topol', role: 'Klinisi' },
  { q: 'Modal yang paling cerdas mengalir ke pencegahan — imbal hasil terbaiknya adalah tahun-tahun yang sehat.', who: 'Tesis Investasi Umur Panjang', role: 'Investor' },
  { q: 'Bertaruh pada biologi sebagai teknologi adalah peluang abad ini.', who: 'Bio Venture Capital', role: 'Investor' },
  { q: 'Pencegahan lebih murah, lebih manusiawi, dan lebih ampuh daripada pengobatan.', who: 'Kesehatan Masyarakat Modern', role: 'Klinisi' },
]

const KIND_STYLE: Record<NewsItem['kind'], string> = {
  Nobel: 'text-amber-600',
  'Uji Klinis': 'text-brand-dark',
  Penelitian: 'text-neutral-500',
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

// Region pill — distinguishes domestic (Indonesia) from international coverage.
function RegionTag({ region }: { region?: NewsItem['region'] }) {
  const dom = region === 'Dalam Negeri'
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dom ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'}`}>
      {dom ? '🇮🇩 Domestic' : '🌍 International'}
    </span>
  )
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
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{cat}</span>
        </>
      )}
    </div>
  )
}

// Google News item titles end in " - Source"; strip it since we show the
// source separately.
function cleanTitle(t: string, source: string): string {
  return source && t.endsWith(` - ${source}`) ? t.slice(0, -(source.length + 3)) : t
}

function relTime(pubDate: string): string {
  const t = Date.parse(pubDate)
  if (Number.isNaN(t)) return ''
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function MedicalNews() {
  // Live headlines from the server-proxied Google News health feeds (free,
  // keyless, refreshed every ~10 minutes). When the backend or network is
  // unavailable, the section falls back to the curated evergreen items below
  // so it never renders empty.
  const [live, setLive] = useState<LiveNewsItem[] | null>(null)
  useEffect(() => {
    let alive = true
    api.news().then((r) => { if (alive && r.items.length > 0) setLive(r.items) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const liveMix = useMemo(() => {
    if (!live) return null
    const dom = live.filter((n) => n.region === 'domestic')
    const intl = live.filter((n) => n.region === 'international')
    const lead = intl[0] ?? dom[0]
    const rest = shuffle([...dom.slice(0, 4), ...intl.slice(1, 5)].filter((n) => n !== lead)).slice(0, 6)
    return { lead, rest }
  }, [live])

  // Fresh draw each mount → the section "keeps updating". Guarantee a mix of
  // international and domestic (Indonesia) coverage every time.
  const { lead, rest } = useMemo(() => {
    const intl = shuffle(CURATED.filter((n) => (n.region ?? 'Internasional') === 'Internasional'))
    const dom = shuffle(CURATED.filter((n) => n.region === 'Dalam Negeri'))
    const mixed = shuffle([...intl.slice(1, 5), ...dom.slice(0, 3)]).slice(0, 6)
    return { lead: intl[0], rest: mixed }
  }, [])
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])
  const updated = useMemo(
    () => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
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
              Yang Terbaru dalam Teknologi Kedokteran
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-black/10 bg-white/70 px-3 py-1.5 backdrop-blur sm:self-auto">
            <span className="vital-dot h-2 w-2 rounded-full bg-brand" />
            <span className="text-[11px] font-semibold text-neutral-500">{liveMix ? 'Live · Google News health feeds' : `Updated ${updated}`}</span>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500">
          International 🌍 &amp; domestic 🇮🇩 coverage — stem cells, CRISPR, AI-EMR, SATUSEHAT, JKN/BPJS, dengue, stunting — a fresh curation every time you visit.
        </p>

        {liveMix ? (
          <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Featured live lead */}
            <a href={liveMix.lead.link} target="_blank" rel="noreferrer" className="group relative flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-dark">Terkini</span>
                <RegionTag region={liveMix.lead.region === 'domestic' ? 'Dalam Negeri' : 'Internasional'} />
              </div>
              <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">
                {cleanTitle(liveMix.lead.title, liveMix.lead.source)}
              </h3>
              <p className="mt-3 text-[13px] font-semibold text-neutral-500">
                {liveMix.lead.source}{relTime(liveMix.lead.pubDate) && ` · ${relTime(liveMix.lead.pubDate)}`}
              </p>
              <div className="mt-5 h-px w-16 bg-brand/40 transition-all duration-300 group-hover:w-28" />
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                Read the full story
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </a>

            {/* Live index */}
            <ol className="flex flex-col divide-y divide-black/[0.07]">
              {liveMix.rest.map((n, i) => (
                <li key={n.link}>
                  <a href={n.link} target="_blank" rel="noreferrer" className="group flex gap-4 py-3.5 first:pt-0">
                    <span className="mt-0.5 w-6 shrink-0 font-mono text-xs font-bold tabular-nums text-neutral-300 transition-colors group-hover:text-brand">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{n.source || 'Health'}</span>
                        <RegionTag region={n.region === 'domestic' ? 'Dalam Negeri' : 'Internasional'} />
                      </div>
                      <h4 className="mt-1 text-[15px] font-semibold leading-snug transition-colors group-hover:text-brand-dark">
                        {cleanTitle(n.title, n.source)}
                      </h4>
                      {relTime(n.pubDate) && <p className="mt-0.5 text-[12px] text-neutral-500">{relTime(n.pubDate)}</p>}
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ) : (
        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Featured lead */}
          <article className="group relative flex flex-col">
            <div className="flex items-center gap-2">
              <Kicker kind={lead.kind} cat={lead.cat} />
              <RegionTag region={lead.region} />
            </div>
            <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">
              {lead.title}
            </h3>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">{lead.detail}</p>
            <div className="mt-5 h-px w-16 bg-brand/40 transition-all duration-300 group-hover:w-28" />
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark">
              Berita utama
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
                  <div className="flex items-center gap-2">
                    <Kicker kind={n.kind} cat={n.cat} />
                    <RegionTag region={n.region} />
                  </div>
                  <h4 className="mt-1 text-[15px] font-semibold leading-snug transition-colors group-hover:text-brand-dark">
                    {n.title}
                  </h4>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{n.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        )}

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
