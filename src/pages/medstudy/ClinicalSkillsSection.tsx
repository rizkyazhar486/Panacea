import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconStethoscope } from '../../components/icons'
import { SkillDiagram } from '../../components/SkillDiagrams'
import { CLINICAL_SKILLS, SKILL_CATEGORIES, type SkillCategory } from '../../lib/clinicalSkills'
import { REFERENSI_SUMBER } from '../../lib/referensiSumber'
import { Mindmap, WARNA, type Cabang } from './Mindmap'
import type { ClinicalSkill } from '../../lib/clinicalSkills'

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
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Panduan tindakan untuk station keterampilan: APN 60 langkah, ATLS, ACLS, akses vaskular, injeksi dan imunisasi, dan lainnya. Seluruh diagram digambar sendiri — tidak menyalin ilustrasi berhak cipta dari sumber lain.</Prosa>
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
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{cat}</div>
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
                    <div data-tindakan className="mt-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                      <Mindmap pusat={s.title} sub={s.subtitle ?? undefined} cabang={cabangTindakan(s)} />
                      {s.diagram && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide text-neutral-400">Diagram</summary>
                          <div className="mt-1"><SkillDiagram kind={s.diagram} /></div>
                        </details>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide text-neutral-400">Referensi ({s.referensi.length})</summary>
                        <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] leading-snug text-neutral-500">
                          {s.referensi.map((k) => <li key={k}>{REFERENSI_SUMBER[k] ?? k}</li>)}
                        </ol>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil — coba kata kunci lain.</p>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Materi latihan untuk persiapan ujian keterampilan. Seluruh tindakan harus dipelajari dan
        dikerjakan di bawah supervisi klinis langsung — panduan tertulis tidak menggantikan latihan
        terbimbing dan penilaian kompetensi.
      </div>
    </div>
  )
}

/**
 * Peta tindakan -> cabang mindmap.
 *
 * Untuk prosedur, tiap FASE jadi satu cabangnya sendiri. Yang harus melekat
 * adalah urutan fase; nomor langkah resmi (APN 1-60) tetap ada di dalamnya.
 */
function cabangTindakan(s: ClinicalSkill): Cabang[] {
  const fase: Cabang[] = s.fases.map((f, i) => ({
    kunci: 'f' + i,
    label: String(i + 1),
    warna: WARNA.tx,
    butir: [f.fase, ...f.steps],
    pratinjau: 1,
  }))
  return [
    { kunci: 'untuk', label: 'Untuk', warna: WARNA.klinis, butir: s.indikasi ?? [] },
    { kunci: 'jangan', label: 'Jangan', warna: WARNA.awas, butir: s.kontraindikasi ?? [] },
    { kunci: 'alat', label: 'Alat', warna: WARNA.px, butir: s.alat ?? [] },
    ...fase,
    { kunci: 'ingat', label: 'Ingat', warna: WARNA.dx,
      butir: (s.mnemonics ?? []).flatMap((m) => [m.akronim + ' — ' + m.kepanjangan.join('; ')]) },
    { kunci: 'jebakan', label: 'Jebakan', warna: WARNA.etio, butir: s.tips ?? [] },
    { kunci: 'awas', label: 'Bahaya', warna: WARNA.awas, butir: s.komplikasi ?? [] },
  ]
}
