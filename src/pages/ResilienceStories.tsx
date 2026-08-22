import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Resilience Stories — a curated collection of well-documented people across
// medicine, sport, science, and invention who faced serious adversity
// (illness, injury, failure, loss, rejection) and kept going. Curated for
// factual accuracy rather than padded to an arbitrary count — each entry is a
// widely-documented, verifiable public fact pattern, not an invented bio.
// Pure static content, no external API.
// ─────────────────────────────────────────────────────────────────────────────

import { KISAH as STORIES, type Story } from '../lib/kisahKetahanan'

const CATEGORIES = ['All', ...Array.from(new Set(STORIES.map((s) => s.category)))]

export function ResilienceStories() {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return STORIES.filter((s) => (cat === 'All' || s.category === cat) && (!q || (s.name + s.field + s.hardship + s.lesson).toLowerCase().includes(q)))
  }, [cat, q])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Resilience Stories" subtitle="Real people, real hardship, real comebacks" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Kumpulan pilihan tentang dokter, ilmuwan, atlet, pembaru, pemimpin, peraih Nobel, dan tokoh rohani yang terdokumentasi baik, yang menghadapi kesulitan berat — sakit, cedera, kemiskinan, penolakan, kehilangan, penganiayaan — dan tetap berjalan. Dipilih dengan mengutamakan ketepatan di atas jumlah: tiap kisah adalah rangkaian fakta publik yang dapat diperiksa (atau, bagi tokoh keagamaan, riwayat yang masyhur dalam tradisinya masing-masing), bukan sekadar pengisi.</Prosa>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
        <input className={`${inputClass} mt-3`} placeholder="Search a name, field, or struggle…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-500">No stories match "{query}".</Card>}

      {filtered.map((s) => (
        <Card key={s.name} className="!p-5">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-ink dark:text-ink">{s.name}</span>
            <Badge tone="brand">{s.field}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500"><span className="font-bold text-neutral-600 dark:text-neutral-300">The struggle: </span>{s.hardship}</p>
          <p className="mt-2 rounded-xl bg-brand/10 px-3 py-2 text-[13px] leading-relaxed text-brand-dark">{s.lesson}</p>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Facts summarized from widely available public biographical record. Faith figures are described
        as their own tradition presents them, not as a claim between beliefs. This collection will grow
        over time — always with verifiable stories, never invented ones.
      </div>
    </div>
  )
}

export default ResilienceStories
