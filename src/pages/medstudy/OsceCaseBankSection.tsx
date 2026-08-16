import { useMemo, useState } from 'react'
import { catatanStasiun } from '../../lib/osceStationNoteAliases'
import { Rantai } from '../../components/Rantai'
import { Prosa } from '../../components/Prosa'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconStethoscope } from '../../components/icons'
import { OSCE_CASES, OSCE_SYSTEMS, type OsceSystem } from '../../lib/osceCaseBank'

export default function OsceCaseBankSection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<OsceSystem | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return OSCE_CASES.filter((c) => {
      if (system && c.system !== system) return false
      if (!q) return true
      return `${c.name} ${c.note ?? ''} ${c.system}`.toLowerCase().includes(q)
    })
  }, [query, system])

  const grouped = useMemo(() => {
    const map = new Map<OsceSystem, typeof OSCE_CASES>()
    for (const c of filtered) {
      if (!map.has(c.system)) map.set(c.system, [])
      map.get(c.system)!.push(c)
    }
    return Array.from(map.entries())
  }, [filtered])

  const freqTone = (f: string) => (f === 'Sangat Sering' ? 'critical' : f === 'Sering' ? 'brand' : 'neutral') as 'critical' | 'brand' | 'neutral'

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="OSCE Case Bank" subtitle="Curated high-yield case topics by system, from a decade of real OSCE UKMPPD recaps" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Frequency tags are a rough "how often a variant of this case shows up" signal for prioritizing review — not a guarantee of what's on any specific exam sitting.</Prosa>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari kasus (mis. BPPV, DM, appendisitis)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua</button>
          {OSCE_SYSTEMS.map((s) => (
            <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
          ))}
        </div>
      </Card>

      {grouped.map(([sys, cases]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{sys}</div>
          <div className="mt-2 space-y-2">
            {cases.map((c) => {
              const notes = catatanStasiun(c.name)
              const isOpen = expanded === c.name
              return (
                <div key={c.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <button
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => notes && setExpanded(isOpen ? null : c.name)}
                  >
                    <span className="text-[13px] font-bold text-ink dark:text-white">{c.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={freqTone(c.frequency)}>{c.frequency}</Badge>
                      {notes && <Badge tone="brand">{isOpen ? 'Tutup ▲' : 'Catatan ▼'}</Badge>}
                    </div>
                  </button>
                  {c.note && <p className="mt-1 text-[12px] text-neutral-500">{c.note}</p>}

                  {isOpen && notes && (
                    <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                      {notes.definisi && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Definisi</div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{notes.definisi}</p>
                        </div>
                      )}
                      {notes.etiologi && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Etiologi</div>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                            {notes.etiologi.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                      {(notes.rantai || notes.patofisiologi) && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Patofisiologi</div>
                          {/* Rantai lebih dahulu, paragraf sesudahnya. Yang datang
                              ke sini sedang menghafal untuk ujian lisan, dan urutan
                              inilah yang menempatkan bentuk yang dapat diucapkan
                              ulang di tempat pertama. */}
                          {notes.rantai && <div className="mt-1.5"><Rantai langkah={notes.rantai} /></div>}
                          {notes.patofisiologi && (
                            <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{notes.patofisiologi}</p>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Anamnesis</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {notes.anamnesis.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Fisik</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {notes.pemeriksaanFisik.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      {notes.penunjang && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Penunjang</div>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                            {notes.penunjang.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Kriteria Diagnosis</div>
                        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{notes.kriteriaDiagnosis}</p>
                      </div>
                      {notes.diagnosisBanding && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Diagnosis Banding</div>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                            {notes.diagnosisBanding.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Tatalaksana</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {notes.tatalaksana.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                      {notes.tips && (
                        <div className="rounded-lg bg-amber-50 p-2.5 text-[12px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                          💡 {notes.tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Direkap dari rekap kasus OSCE UKMPPD 2016-2026 (studyclubukmppd & kontributor lain). Bantuan
        belajar, bukan bocoran atau jaminan soal ujian — tetap pelajari materi secara menyeluruh.
      </div>
    </div>
  )
}
