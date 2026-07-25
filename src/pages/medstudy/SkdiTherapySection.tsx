import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconActivity } from '../../components/icons'
import { SKDI_ENTRIES, SKDI_SYSTEMS, EPONYM_ENTRIES, type SkdiSystem } from '../../lib/skdiTherapyReference'

type TherapyTab = 'therapy' | 'eponym'
export default function SkdiTherapySection() {
  const [tab, setTab] = useState<TherapyTab>('therapy')
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkdiSystem | null>(null)

  const filteredTherapy = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_ENTRIES.filter((e) => {
      if (system && e.system !== system) return false
      if (!q) return true
      return `${e.diagnosis} ${e.classification ?? ''} ${e.therapy} ${e.system}`.toLowerCase().includes(q)
    })
  }, [query, system])

  const groupedTherapy = useMemo(() => {
    const map = new Map<SkdiSystem, typeof SKDI_ENTRIES>()
    for (const e of filteredTherapy) {
      if (!map.has(e.system)) map.set(e.system, [])
      map.get(e.system)!.push(e)
    }
    return Array.from(map.entries())
  }, [filteredTherapy])

  const filteredEponym = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return EPONYM_ENTRIES
    return EPONYM_ENTRIES.filter((e) => `${e.diagnosis} ${e.keyword}`.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="SKDI Therapy Reference" subtitle="Tatalaksana per diagnosis, dan kata kunci/eponim klasik" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          Materi belajar untuk persiapan ujian — <b>bukan alat resep</b>. Selalu cross-check dosis
          terkini terhadap PIONAS/farmakologi, formularium institusi, dan supervisor klinis sebelum
          pemakaian klinis nyata.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setTab('therapy')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${tab === 'therapy' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Tatalaksana</button>
          <button onClick={() => setTab('eponym')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${tab === 'eponym' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Kata Kunci / Eponim</button>
        </div>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari diagnosis atau terapi…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tab === 'therapy' && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua</button>
            {SKDI_SYSTEMS.map((s) => (
              <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
            ))}
          </div>
        )}
      </Card>

      {tab === 'therapy' && groupedTherapy.map(([sys, entries]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{sys}</div>
          <div className="mt-2 space-y-2">
            {entries.map((e, i) => (
              <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[13px] font-bold text-ink dark:text-white">{e.diagnosis}{e.classification ? ` — ${e.classification}` : ''}</div>
                <p className="mt-1 text-[12px] text-neutral-500">{e.therapy}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {tab === 'therapy' && filteredTherapy.length === 0 && <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil.</p>}

      {tab === 'eponym' && (
        <Card className="!p-4">
          <div className="space-y-2">
            {filteredEponym.map((e, i) => (
              <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[13px] font-bold text-ink dark:text-white">{e.diagnosis}</div>
                <p className="mt-1 text-[12px] text-neutral-500">{e.keyword}</p>
              </div>
            ))}
            {filteredEponym.length === 0 && <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil.</p>}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Direkap dari referensi tatalaksana SKDI/UKMPPD, digunakan dengan izin pemilik konten. Bantuan
        belajar untuk ujian — bukan pengganti panduan farmakologi resmi atau penilaian klinis.
      </div>
    </div>
  )
}
