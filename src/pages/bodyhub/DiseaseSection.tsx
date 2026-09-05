import { useState } from 'react'
import { api, type IcdEntry } from '../../lib/api'

// Diagnosis menurut klasifikasi resmi. Penanda sumbernya SELALU tampil: hasil
// dari jalur cadangan adalah ICD-10-CM, dan menyebutnya ICD-11 akan membuat
// kode yang dicatat orang salah rujukan. Lihat server/src/icd11.ts.

interface Props {
  onPickDiagnosis: (title: string) => void
}

export function DiseaseSection({ onPickDiagnosis }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<IcdEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [sudahCari, setSudahCari] = useState(false)
  const [icd11, setIcd11] = useState(false)

  async function cari() {
    const term = q.trim()
    if (!term) return
    setLoading(true)
    setSudahCari(true)
    try {
      const r = await api.icdSearch(term)
      setResults(r.results)
      setIcd11(r.icd11)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <form onSubmit={(e) => { e.preventDefault(); cari() }} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a diagnosis or code…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="liquid-glass-btn liquid-glass-btn--primary flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {sudahCari && !loading && results.length === 0 && (
        <p className="text-sm text-neutral-500">No matching diagnosis found.</p>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              icd11 ? 'bg-brand/10 text-brand' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
            }`}>
              {icd11 ? 'WHO ICD-11' : 'ICD-10-CM (fallback)'}
            </span>
            {!icd11 && (
              <span className="text-[10.5px] text-neutral-400">
                WHO credentials not configured on this server — showing ICD-10-CM instead.
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {results.map((r) => (
              <li key={`${r.sumber}-${r.code}-${r.title}`}>
                <button
                  onClick={() => onPickDiagnosis(r.title)}
                  className="w-full rounded-xl bg-neutral-50 p-2.5 text-left dark:bg-white/5"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 rounded bg-white px-1.5 font-mono text-[11px] font-bold text-brand dark:bg-white/10">{r.code}</span>
                    <span className="min-w-0 text-sm font-bold text-ink dark:text-white">{r.title}</span>
                  </div>
                  {r.chapter && <p className="mt-0.5 text-[11px] text-neutral-400">{r.chapter}</p>}
                  {r.definition && <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{r.definition}</p>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        ICD-11 comes from the WHO ICD API. It is free but needs a one-time client registration at icd.who.int/icdapi;
        without those credentials this falls back to ICD-10-CM via the US National Library of Medicine, and the badge
        above says which one you are actually looking at. Classification codes are reference data, not a diagnosis.
      </p>
    </div>
  )
}

export default DiseaseSection
