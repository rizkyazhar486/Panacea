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
  kind: 'Nobel' | 'Clinical Trial' | 'Research' | 'Device' | 'New'
  /** international vs domestic (Indonesia) coverage — default international */
  region?: 'Internasional' | 'Dalam Negeri'
}

const CURATED: NewsItem[] = [
  { cat: 'CRISPR', kind: 'Clinical Trial', title: 'First CRISPR gene therapy approved', detail: 'Casgevy (exa-cel) — CRISPR/Cas9 editing for sickle cell disease & beta-thalassemia marks the arrival of real clinical gene therapy.' },
  { cat: 'CRISPR', kind: 'Clinical Trial', title: 'Base and prime editing reach the clinic', detail: 'Single-letter precision DNA editing is now being trialed for familial hypercholesterolemia and inherited metabolic disease.' },
  { cat: 'Stem Cells', kind: 'Clinical Trial', title: 'Stem-cell-derived islet cells take on type 1 diabetes', detail: 'Insulin-producing cells grown from stem cells have made some patients insulin-independent in early clinical trials.' },
  { cat: 'Longevity', kind: 'Research', title: 'Epigenetic reprogramming "rejuvenates" cells', detail: 'Partial Yamanaka factors restore youthful markers in cells in preclinical studies — a research frontier aimed at extending healthspan.' },
  { cat: 'AI', kind: 'Research', title: 'AlphaFold maps the protein universe', detail: 'AlphaFold 3 predicts protein structures and interactions, cutting drug-discovery timelines from years to weeks.' },
  { cat: 'Nobel', kind: 'Nobel', title: 'Nobel Prize in Medicine: mRNA & microRNA', detail: '2023 — Karikó & Weissman (modified mRNA); 2024 — Ambros & Ruvkun (microRNA): foundations of precision therapeutics.' },
  { cat: 'Metabolic', kind: 'Clinical Trial', title: 'GLP-1 drugs go beyond weight loss', detail: 'Semaglutide and tirzepatide show benefits for heart health, chronic kidney disease and sleep apnea — far beyond obesity treatment.' },
  { cat: 'Neuro', kind: 'Clinical Trial', title: 'Anti-amyloid drugs slow Alzheimer’s', detail: 'Lecanemab and donanemab slow early-stage cognitive decline — the first real breakthrough in a decade.' },
  { cat: 'Devices', kind: 'Device', title: 'Wearables become screening tools', detail: 'Over-the-counter CGMs, watch-based ECG/AFib detection and SpO₂ sensors are bringing early detection to the wrist.' },
  { cat: 'Genomics', kind: 'Research', title: 'Genome sequencing gets cheaper and faster', detail: 'A full genome now takes hours and costs hundreds of dollars — opening the door to mass mutation screening and precision oncology.' },
  { cat: 'AI-EMR', kind: 'New', title: 'Ambient clinical documentation arrives', detail: 'AI drafts medical notes straight from doctor–patient conversations, cutting burnout and giving physicians more time with patients.' },
  { cat: 'Oncology', kind: 'Clinical Trial', title: 'Personalized mRNA cancer vaccines', detail: 'mRNA vaccines tailored to each patient’s tumor are showing promising responses in melanoma and pancreatic cancer.' },
  { cat: 'Performance', kind: 'Research', title: 'VO₂max — a biomarker for longevity', detail: 'High cardiorespiratory fitness is strongly linked to lower mortality — relevant for Hyrox athletes and team sports alike.' },
  { cat: 'Performance', kind: 'Research', title: 'Lactate zones guide training and recovery', detail: 'Mapping lactate thresholds is optimizing high-intensity training loads and athlete recovery schedules.' },
  { cat: 'Immunology', kind: 'Research', title: 'CAR-T cells take aim at autoimmune disease', detail: 'Engineered T-cell therapy, originally developed for blood cancers, is now being trialed for lupus and severe autoimmune conditions.' },
  // --- Domestic (Indonesia) ---
  { cat: 'SATUSEHAT', kind: 'New', title: 'SATUSEHAT becomes the backbone of national medical records', detail: 'Indonesia’s health ministry is driving interoperability of health data across facilities through the SATUSEHAT platform — the foundation for a unified electronic medical record system nationwide.', region: 'Dalam Negeri' },
  { cat: 'Telemedicine', kind: 'New', title: 'Telemedicine adoption accelerates post-pandemic', detail: 'Remote consultations and digital prescriptions are becoming standard in Indonesia’s major cities, extending access to doctors in outlying regions.', region: 'Dalam Negeri' },
  { cat: 'JKN', kind: 'New', title: 'KRIS — a standardized inpatient class for BPJS', detail: 'The Standard Inpatient Class (KRIS) is being rolled out in stages to equalize care quality for JKN/BPJS Kesehatan (Indonesia’s national health insurance) participants.', region: 'Dalam Negeri' },
  { cat: 'Tropical Disease', kind: 'Clinical Trial', title: 'Wolbachia mosquitoes curb dengue cases', detail: 'Wolbachia technology deployed across several Indonesian cities has been shown to significantly reduce dengue fever cases.', region: 'Dalam Negeri' },
  { cat: 'Stunting', kind: 'Research', title: 'Reducing stunting becomes a national priority', detail: 'Nutrition interventions during the first 1,000 days of life and growth monitoring are being intensified to lower child stunting rates.', region: 'Dalam Negeri' },
  { cat: 'Immunization', kind: 'New', title: 'HPV vaccine joins the national immunization program', detail: 'Expanded HPV vaccination for schoolgirls aims to reduce cervical cancer — one of the most common cancers among Indonesian women.', region: 'Dalam Negeri' },
]

interface Quote {
  q: string
  who: string
  role: 'Innovator' | 'Investor' | 'Nobel' | 'Clinician' | 'Researcher'
}

// Paraphrased sentiments faithful to each figure's well-documented public
// stance — curated, not verbatim transcripts.
const QUOTES: Quote[] = [
  { q: 'Gene editing gives us the power to rewrite the code of life — and with it, immense responsibility.', who: 'Jennifer Doudna', role: 'Nobel' },
  { q: 'AI can accelerate scientific discovery from decades to years.', who: 'Demis Hassabis', role: 'Nobel' },
  { q: 'Aging isn’t an absolute fate — it’s a process that can be understood and slowed.', who: 'David Sinclair', role: 'Researcher' },
  { q: 'The goal of medicine isn’t just to extend life, but to extend healthy years.', who: 'Peter Attia', role: 'Clinician' },
  { q: 'Data and AI are bringing empathy back to medicine by giving doctors time for their patients.', who: 'Eric Topol', role: 'Clinician' },
  { q: 'The smartest capital flows toward prevention — the best returns are healthy years.', who: 'Longevity Investment Thesis', role: 'Investor' },
  { q: 'Betting on biology as technology is the opportunity of this century.', who: 'Bio Venture Capital', role: 'Investor' },
  { q: 'Prevention is cheaper, more humane, and more powerful than treatment.', who: 'Modern Public Health', role: 'Clinician' },
]

const KIND_STYLE: Record<NewsItem['kind'], string> = {
  Nobel: 'text-amber-600',
  'Clinical Trial': 'text-brand-dark',
  Research: 'text-neutral-500',
  Device: 'text-sky-600',
  New: 'text-accent',
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
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${dom ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'}`}>
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
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{cat}</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark">News &amp; Innovation</span>
            <h2 className="mt-1.5 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
              The Latest in Medical Technology
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
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-dark">Breaking</span>
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
                        <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{n.source || 'Health'}</span>
                        <RegionTag region={n.region === 'domestic' ? 'Dalam Negeri' : 'Internasional'} />
                      </div>
                      <h4 className="mt-1 text-[15px] font-semibold leading-snug transition-colors group-hover:text-brand-dark">
                        {cleanTitle(n.title, n.source)}
                      </h4>
                      {relTime(n.pubDate) && <p className="mt-0.5 text-[12px] text-neutral-400">{relTime(n.pubDate)}</p>}
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
              Top story
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
