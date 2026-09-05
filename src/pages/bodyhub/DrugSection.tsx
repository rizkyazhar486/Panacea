import { useEffect, useState } from 'react'
import { api, type PharmProfile, type DrugLabelInfo, type DrugClass } from '../../lib/api'
import { sitesForDrug, keywordsOf, layersOf, type DrugSite } from '../../lib/drugAnatomy'
import type { AnatomyLayer } from '../../components/Body3D'

// ─────────────────────────────────────────────────────────────────────────────
// Obat — bekerja di mana, lewat apa, efek sampingnya di mana, dosisnya berapa.
//
// Empat sumber dipakai bersamaan, dan pembagiannya disengaja:
//   - RxNorm (NLM)  : daftar zat aktifnya. Belasan ribu, bukan tulisan tangan.
//   - RxClass (NLM) : mekanisme kerja, efek fisiologis, kelas FDA, ATC.
//   - drugAnatomy   : menerjemahkan kelas itu jadi STRUKTUR 3D yang disorot.
//   - openFDA       : teks label resmi — dosis, cara pakai, peringatan.
//
// Dosis TIDAK PERNAH ditulis di kode. Ia hanya ditampilkan kalau label resmi
// memuatnya, dan ditampilkan sebagai kutipan label, bukan sebagai anjuran.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onHighlightSites: (keywords: string[], layers: Array<AnatomyLayer['key']>) => void
}

function ClassList({ title, items, note }: { title: string; items: DrugClass[]; note?: string }) {
  if (!items.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{title}</div>
      {note && <p className="mt-0.5 text-[11px] text-neutral-400">{note}</p>}
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((c) => (
          <span key={c.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            {c.nama}
          </span>
        ))}
      </div>
    </div>
  )
}

function SiteList({ title, sites, tone }: { title: string; sites: DrugSite[]; tone: 'action' | 'adverse' }) {
  if (!sites.length) return null
  return (
    <div>
      <div className={`t-mikro font-bold uppercase tracking-wide ${tone === 'action' ? 'text-brand' : 'text-amber-600'}`}>{title}</div>
      <ul className="mt-1 space-y-1">
        {sites.map((s) => (
          <li key={s.key} className={`rounded-lg p-2 ${tone === 'action' ? 'bg-brand/5 dark:bg-brand/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
            <div className="text-xs font-bold text-ink dark:text-white">{s.label}</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{s.why}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DrugSection({ onHighlightSites }: Props) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ rxcui: string; nama: string }>>([])
  const [total, setTotal] = useState<number | null>(null)
  const [profile, setProfile] = useState<PharmProfile | null>(null)
  const [label, setLabel] = useState<DrugLabelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Jumlah total zat aktif diambil sekali supaya layar bisa menyebut angka
  // yang SEBENARNYA ada di RxNorm, bukan angka yang dijanjikan.
  useEffect(() => {
    api.drugIngredients('').then((r) => setTotal(r.total)).catch(() => setTotal(null))
  }, [])

  // Saran nama diambil dari daftar RxNorm sambil mengetik.
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setSuggestions([]); return }
    const id = setTimeout(() => {
      api.drugIngredients(term).then((r) => setSuggestions(r.results.slice(0, 8))).catch(() => setSuggestions([]))
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  async function pilih(name: string) {
    setQ(name)
    setSuggestions([])
    setLoading(true)
    setError('')
    setProfile(null)
    setLabel(null)
    // Profil kelas dan teks label diambil bersamaan: keduanya berdiri sendiri,
    // dan obat yang punya kelas tapi tanpa label AS (atau sebaliknya) tetap
    // harus menampilkan bagian yang ada.
    const [p, l] = await Promise.all([
      api.drugPharmacology(name).catch(() => null),
      api.drugInfo(name).catch(() => null),
    ])
    setProfile(p)
    setLabel(l)
    if (!p && !l) setError(`Nothing found for "${name}". Try the international generic name (e.g. "metoprolol", not a local brand).`)
    setLoading(false)
  }

  const kelasSemua: DrugClass[] = profile
    ? [...profile.mekanisme, ...profile.efekFisiologis, ...profile.kelasFarmakologi]
    : []
  const atcCodes = profile ? profile.atc.map((a) => a.id) : []
  const { action, adverse, coarse } = sitesForDrug(
    kelasSemua.map((k) => ({ nama: k.nama, jenis: k.jenis })),
    atcCodes,
  )

  // Setiap kali situsnya berubah, model 3D diminta menyorot dan menyalakan
  // lapisan yang perlu — inilah "tunjukkan di mana obat ini bekerja".
  useEffect(() => {
    const semua = [...action, ...adverse]
    if (!semua.length) return
    onHighlightSites(keywordsOf(semua), layersOf(semua))
    // onHighlightSites stabil dari induknya; kata kunci saja yang menentukan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  return (
    <div className="space-y-3">
      <div>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) pilih(q.trim()) }}
            placeholder="Search a drug, vaccine or serum…"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
              {suggestions.map((s) => (
                <li key={s.rxcui}>
                  <button onClick={() => pilih(s.nama)} className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-neutral-50 dark:text-white dark:hover:bg-white/5">
                    {s.nama}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          {total === null
            ? 'Searching the full RxNorm active-ingredient list.'
            : `Searching all ${total.toLocaleString('en-US')} active ingredients in RxNorm (NLM) — the complete public list, not a hand-written selection.`}
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-500">Looking up pharmacology and the official label…</p>}
      {error && <p className="text-sm text-neutral-500">{error}</p>}

      {(action.length > 0 || adverse.length > 0) && (
        <div className="space-y-2">
          <SiteList title="Where it acts" sites={action} tone="action" />
          <SiteList title="Where side effects show" sites={adverse} tone="adverse" />
          <p className="text-[10.5px] leading-relaxed text-neutral-400">
            {coarse
              ? 'Mapped from the ATC anatomical main group only — this is the organ system, not a precise site of action.'
              : 'Mapped from this drug’s mechanism of action and pharmacologic class (RxClass/MED-RT). Highlighted in green on the model above.'}
          </p>
        </div>
      )}
      {profile && action.length === 0 && adverse.length === 0 && (
        <p className="rounded-lg bg-neutral-50 p-2.5 text-xs leading-relaxed text-neutral-500 dark:bg-white/5">
          The site of action for this drug could not be mapped to a structure in the 3D model. Its pharmacologic
          classes are shown below — nothing is highlighted rather than highlighting the wrong organ.
        </p>
      )}

      {profile && (
        <div className="space-y-2.5">
          <ClassList title="How it works" items={profile.mekanisme} note="Mechanism of action — MED-RT" />
          <ClassList title="What it does to the body" items={profile.efekFisiologis} note="Physiologic effect — MED-RT" />
          <ClassList title="Pharmacologic class" items={profile.kelasFarmakologi} note="Established class — FDA/DailyMed" />
          <ClassList title="ATC group" items={profile.atc} note="WHO — the first letter is the anatomical main group" />
          <ClassList title="Commonly used for" items={profile.indikasi} note="may_treat — MED-RT" />
        </div>
      )}

      {label && (
        <div className="space-y-2">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">From the official FDA label</div>
          {/* Dosis, cara pakai dan waktu pakai HANYA dari label. Tidak ada
              satu angka pun di sini yang berasal dari kode aplikasi. */}
          {label.dosage && (
            <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Dose &amp; how to use</div>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{label.dosage}</p>
            </div>
          )}
          {label.indications && (
            <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">When to use it</div>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{label.indications}</p>
            </div>
          )}
          {label.adverseReactions && (
            <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Adverse reactions</div>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{label.adverseReactions}</p>
            </div>
          )}
          {label.warnings && (
            <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-500/10">
              <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Warnings</div>
              <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{label.warnings}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        Ingredient list and drug classes: RxNorm and RxClass (US National Library of Medicine, public domain).
        Dose and label text: openFDA. DrugBank is deliberately not used — its full database is a paid commercial
        licence and its free Open Data is CC BY-NC, which this app cannot use. Dose text is quoted from the official
        label; it is not a prescription, and it is not adjusted for you.
      </p>
    </div>
  )
}

export default DrugSection
