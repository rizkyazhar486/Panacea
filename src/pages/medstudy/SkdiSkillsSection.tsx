import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconActivity } from '../../components/icons'
import { SKDI_SKILLS, SKILL_SYSTEMS, type SkillSystem } from '../../lib/skdiSkillsChecklist'
import { levelTone, levelLabel } from './shared'

export default function SkdiSkillsSection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkillSystem | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_SKILLS.filter((s) => {
      if (system && s.system !== system) return false
      if (!q) return true
      return `${s.skill} ${s.system}`.toLowerCase().includes(q)
    })
  }, [query, system])

  const grouped = useMemo(() => {
    const map = new Map<SkillSystem, typeof SKDI_SKILLS>()
    for (const s of filtered) {
      if (!map.has(s.system)) map.set(s.system, [])
      map.get(s.system)!.push(s)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="SKDI Skills Checklist" subtitle="Official competency level (1-4) for every clinical skill, per Konsil Kedokteran Indonesia 2019" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          4A/4 = must be able to do it independently by graduation. 3A/3B = under supervision
          (3B = emergency setting). 2 = only need to have observed it. 1 = theory only.
        </p>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari skill (mis. Leopold, kaku kuduk, Phalen)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua</button>
          {SKILL_SYSTEMS.map((s) => (
            <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
          ))}
        </div>
      </Card>

      {grouped.map(([sys, skills]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{sys}</div>
          <div className="mt-2 space-y-2">
            {skills.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <span className="text-[13px] font-semibold text-ink dark:text-white">{s.skill}</span>
                <Badge tone={levelTone(s.level)}>{levelLabel(s.level)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Berdasarkan Standar Kompetensi Dokter Indonesia (SKDI), Konsil Kedokteran Indonesia 2019.
        Gunakan untuk memetakan kesenjangan skill sebelum OSCE — bukan pengganti supervisi klinis langsung.
      </div>
    </div>
  )
}
