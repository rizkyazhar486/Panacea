import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconStethoscope } from '../../components/icons'
import { SkillDiagram } from '../../components/SkillDiagrams'
import { CLINICAL_SKILLS, SKILL_CATEGORIES, type SkillCategory } from '../../lib/clinicalSkills'
import { REFERENSI_SUMBER } from '../../lib/referensiSumber'

export default function ClinicalSkillsSection() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SkillCategory | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return CLINICAL_SKILLS.filter((s) => {
      if (category && s.category !== category) return false
      if (!q) return true
      return `${s.title} ${s.subtitle ?? ''} ${s.category}`.toLowerCase().includes(q)
    })
  }, [query, category])

  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, typeof CLINICAL_SKILLS>()
    for (const s of filtered) {
      if (!map.has(s.category)) map.set(s.category, [])
      map.get(s.category)!.push(s)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconStethoscope size={20} />}
          title="Keterampilan Klinis & Prosedur"
          subtitle={`${CLINICAL_SKILLS.length} tindakan — langkah demi langkah, alat, mnemonik, dan jebakan OSCE`}
        />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Panduan tindakan untuk station keterampilan: APN 60 langkah, ATLS, ACLS, akses vaskular,
          injeksi dan imunisasi, dan lainnya. Seluruh diagram digambar sendiri — tidak menyalin
          ilustrasi berhak cipta dari sumber lain.
        </p>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari tindakan (mis. APN, ACLS, infus, vaksin)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!category ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
          >
            Semua
          </button>
          {SKILL_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${category === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {grouped.map(([cat, skills]) => (
        <Card key={cat} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{cat}</div>
          <div className="mt-2 space-y-2">
            {skills.map((s) => {
              const isOpen = openId === s.id
              return (
                <div key={s.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <button
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink dark:text-white">{s.title}</div>
                      {s.subtitle && <div className="mt-0.5 text-[11px] text-neutral-500">{s.subtitle}</div>}
                    </div>
                    <Badge tone="low">{isOpen ? 'Tutup ▲' : 'Buka ▼'}</Badge>
                  </button>

                  {isOpen && (
                    <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                      {s.diagram && (
                        <div>
                          <div className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-brand-dark">Diagram</div>
                          <SkillDiagram kind={s.diagram} />
                        </div>
                      )}

                      {s.indikasi && (
                        <Block title="Indikasi" items={s.indikasi} />
                      )}
                      {s.kontraindikasi && (
                        <Block title="Kontraindikasi" items={s.kontraindikasi} tone="warn" />
                      )}
                      {s.alat && <Block title="Alat & Bahan" items={s.alat} />}

                      {s.fases.map((f) => (
                        <div key={f.fase}>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">{f.fase}</div>
                          <ol className="mt-1 space-y-1 pl-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                            {f.steps.map((st, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                                <span>{st}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}

                      {s.mnemonics?.map((m) => (
                        <div key={m.akronim} className="rounded-lg bg-brand-50 p-3 dark:bg-brand/10">
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">
                            Mnemonik · {m.akronim}
                          </div>
                          <ul className="mt-1 space-y-0.5 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">
                            {m.kepanjangan.map((k, i) => (
                              <li key={i}>{k}</li>
                            ))}
                          </ul>
                          {m.catatan && (
                            <p className="mt-1.5 text-[11px] italic leading-relaxed text-neutral-600 dark:text-neutral-300">
                              {m.catatan}
                            </p>
                          )}
                        </div>
                      ))}

                      {s.tips && <Block title="Tips & Jebakan OSCE" items={s.tips} tone="tip" />}
                      {s.komplikasi && <Block title="Komplikasi" items={s.komplikasi} />}

                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Referensi</div>
                        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                          {s.referensi.map((k) => (
                            <li key={k}>{REFERENSI_SUMBER[k] ?? k}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil — coba kata kunci lain.</p>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Materi latihan untuk persiapan ujian keterampilan. Seluruh tindakan harus dipelajari dan
        dikerjakan di bawah supervisi klinis langsung — panduan tertulis tidak menggantikan latihan
        terbimbing dan penilaian kompetensi.
      </div>
    </div>
  )
}

function Block({ title, items, tone }: { title: string; items: string[]; tone?: 'warn' | 'tip' }) {
  const color =
    tone === 'warn' ? 'text-rose-600 dark:text-rose-600' : tone === 'tip' ? 'text-amber-700 dark:text-amber-300' : 'text-brand-dark'
  return (
    <div>
      <div className={`text-[11px] font-black uppercase tracking-wide ${color}`}>{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  )
}
