import { useEffect, useMemo, useState } from 'react'
import { api, type LiveNewsItem } from '../lib/api'

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
  { tag: 'Genomics', title: 'CRISPR has moved from laboratory concept to approved therapy', summary: 'Gene editing is now clinically real for selected inherited blood disorders, while many broader applications remain experimental and disease-specific.', status: 'Established' },
  { tag: 'Metabolic health', title: 'GLP-1–based therapies now affect more than body weight', summary: 'Cardiovascular, kidney and sleep-apnea outcomes are increasingly part of how the drug class is evaluated, alongside adverse effects and long-term follow-up.', status: 'Emerging' },
  { tag: 'Oncology', title: 'Personalized cancer therapy increasingly starts with tumor biology', summary: 'Genomics, pathology and immune phenotype can change which treatment is relevant; the important lesson is matching mechanism to the individual tumor rather than treating “cancer” as one disease.', status: 'Established' },
  { tag: 'Regeneration', title: 'Cellular reprogramming is scientifically exciting but not a human reset button', summary: 'Partial reprogramming and regeneration research can change cellular markers in experimental systems, but whole-body age reversal is not an established clinical therapy.', status: 'Research frontier' },
  { tag: 'Wearables', title: 'Consumer sensors are becoming useful screening and behavior tools', summary: 'ECG, heart-rate trends, sleep estimates and glucose sensors can create useful longitudinal context, but measurement quality and clinical interpretation still matter.', status: 'Emerging' },
  { tag: 'Medical AI', title: 'The strongest medical AI products expose sources and uncertainty', summary: 'A useful system separates patient-derived observations, educational explanations and clinical inference instead of presenting generated text as measured fact.', status: 'Emerging' },
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
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function cacheAge(savedAt: number | null) {
  if (!savedAt) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - savedAt) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function cleanTitle(title: string, source: string) {
  return source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title
}

function LiveCard({ item }: { item: LiveNewsItem }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className="panacea-feature-card group block p-4 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.14em] text-white/45">
        <span>{item.region === 'domestic' ? 'Indonesia' : 'International'}</span>
        <span>{relativeTime(item.pubDate)}</span>
      </div>
      <h3 className="mt-3 text-sm font-black leading-snug text-white">{cleanTitle(item.title, item.source)}</h3>
      <div className="mt-3 text-[11px] font-semibold text-[#f0d68a]">{item.source}</div>
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
    <section id="news" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="panacea-kicker">Health briefing</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-white sm:text-5xl">Know what is live. Know what is evergreen.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55">PanaceaMed does not disguise editorial summaries as current news. Live headlines show their publisher and recency; if the upstream feed briefly fails, the last successful headlines remain visible and are explicitly marked as cached.</p>
        </div>
        <div className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] ${fresh ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200' : usingCached ? 'border-amber-200/20 bg-amber-200/10 text-amber-100' : 'border-white/10 bg-white/[.04] text-white/55'}`}>
          {fresh
            ? 'Live feed connected'
            : usingCached
              ? `Cached headlines${cacheSavedAt ? ` · synced ${cacheAge(cacheSavedAt)}` : ''}${failed ? ' · refresh unavailable' : ' · refreshing…'}`
              : failed
                ? 'Live feed unavailable · learning briefs shown'
                : 'Checking live sources…'}
        </div>
      </div>

      {headlines.length ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {headlines.map((item) => <LiveCard key={item.link} item={item} />)}
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[.16em] text-white/40">Evergreen editorial learning briefs · not live headlines</div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {LEARNING_BRIEFS.map((brief) => (
              <article key={brief.title} className="panacea-feature-card p-4">
                <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-[#f0d68a]">{brief.tag}</span><span className="text-[9px] font-bold text-white/35">{brief.status}</span></div>
                <h3 className="mt-3 text-sm font-black leading-snug text-white">{brief.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/52">{brief.summary}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
