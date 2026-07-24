import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconBook, IconStethoscope, IconSparkle, IconActivity } from '../components/icons'
import { STUDY_TECHNIQUES, OSCE_TECHNIQUE, MOTIVATION, EXAM_TIMELINE } from '../lib/studyContent'
import { EXAM_INFO, EXAM_ORDER, questionsForExam, type ExamTrack } from '../lib/examBank'
import { OSCE_CASES, OSCE_SYSTEMS, type OsceSystem } from '../lib/osceCaseBank'
import { OSCE_STATION_NOTES } from '../lib/osceStationNotes'
import { OSCE_STATION_RUBRICS } from '../lib/osceStationRubrics'
import { SKDI_ENTRIES, SKDI_SYSTEMS, EPONYM_ENTRIES, type SkdiSystem } from '../lib/skdiTherapyReference'
import { SKDI_SKILLS, SKILL_SYSTEMS, type SkillSystem } from '../lib/skdiSkillsChecklist'
import { SKDI_DISEASE_LIST, SKDI_DISEASE_SYSTEMS, type SkdiDiseaseSystem } from '../lib/skdiDiseaseList'

type Section = 'practice' | 'osce' | 'case-bank' | 'station-sim' | 'skills' | 'therapy' | 'diseases' | 'techniques' | 'timeline'

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'practice', label: 'Question Bank', emoji: '❓' },
  { id: 'osce', label: 'OSCE Technique', emoji: '🩺' },
  { id: 'case-bank', label: 'OSCE Case Bank', emoji: '📋' },
  { id: 'station-sim', label: 'Station Simulator', emoji: '🎭' },
  { id: 'skills', label: 'SKDI Skills Checklist', emoji: '✅' },
  { id: 'therapy', label: 'SKDI Therapy Reference', emoji: '💊' },
  { id: 'diseases', label: 'Daftar Penyakit SKDI', emoji: '📖' },
  { id: 'techniques', label: 'How to Study', emoji: '🧠' },
  { id: 'timeline', label: 'Exam Plan', emoji: '📅' },
]

function levelTone(level: string): 'critical' | 'brand' | 'low' | 'neutral' {
  if (level.startsWith('4')) return 'critical'
  if (level.startsWith('3')) return 'brand'
  if (level.startsWith('2')) return 'low'
  return 'neutral'
}
function levelLabel(level: string): string {
  if (level === '4' || level === '4A') return '4A — Mandiri, tuntas'
  if (level === '3B') return '3B — Supervisi, gawat darurat'
  if (level === '3' || level === '3A') return '3A — Supervisi, bukan gawat darurat'
  if (level === '2') return '2 — Pernah melihat'
  return '1 — Tahu teori'
}

function SkdiSkillsSection() {
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
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{sys}</div>
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
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Berdasarkan Standar Kompetensi Dokter Indonesia (SKDI), Konsil Kedokteran Indonesia 2019.
        Gunakan untuk memetakan kesenjangan skill sebelum OSCE — bukan pengganti supervisi klinis langsung.
      </div>
    </div>
  )
}

type TherapyTab = 'therapy' | 'eponym'
function SkdiTherapySection() {
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

const OSCE_NOTE_KEYS = Object.keys(OSCE_STATION_NOTES)
function hasOsceNote(diseaseName: string): boolean {
  const d = diseaseName.toLowerCase()
  return OSCE_NOTE_KEYS.some((k) => {
    const kl = k.toLowerCase()
    return kl.includes(d) || d.includes(kl.split(' (')[0].split(' —')[0])
  })
}

function SkdiDiseaseDirectorySection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkdiDiseaseSystem | null>(null)
  const [levelFilter, setLevelFilter] = useState<'all' | '4' | '3' | '2' | '1'>('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_DISEASE_LIST.filter((e) => {
      if (system && e.system !== system) return false
      if (levelFilter !== 'all' && !e.level.startsWith(levelFilter)) return false
      if (!q) return true
      return `${e.disease} ${e.subsection ?? ''} ${e.system}`.toLowerCase().includes(q)
    })
  }, [query, system, levelFilter])

  const grouped = useMemo(() => {
    const map = new Map<SkdiDiseaseSystem, typeof SKDI_DISEASE_LIST>()
    for (const e of filtered) {
      if (!map.has(e.system)) map.set(e.system, [])
      map.get(e.system)!.push(e)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconBook size={20} />} title="Daftar Penyakit SKDI" subtitle={`${SKDI_DISEASE_LIST.length} penyakit/kondisi resmi, per Standar Kompetensi Dokter Indonesia (Konsil Kedokteran Indonesia)`} />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Referensi cepat: nama penyakit, sistem, dan level kompetensi. Penyakit yang sudah punya
          catatan station lengkap (anamnesis/PF/tatalaksana) ditandai badge "Catatan OSCE" — buka di
          tab OSCE Case Bank.
        </p>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari penyakit (mis. malaria, hipertensi, katarak)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setLevelFilter('all')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${levelFilter === 'all' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua level</button>
          {(['4', '3', '2', '1'] as const).map((lv) => (
            <button key={lv} onClick={() => setLevelFilter(lv)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${levelFilter === lv ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Level {lv}</button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua sistem</button>
          {SKDI_DISEASE_SYSTEMS.map((s) => (
            <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
          ))}
        </div>
      </Card>

      {grouped.map(([sys, diseases]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{sys} · {diseases.length}</div>
          <div className="mt-2 space-y-2">
            {diseases.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div>
                  <span className="text-[13px] font-semibold text-ink dark:text-white">{e.disease}</span>
                  {e.subsection && <span className="ml-2 text-[11px] text-neutral-400">{e.subsection}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  {hasOsceNote(e.disease) && <Badge tone="brand">Catatan OSCE</Badge>}
                  <Badge tone={levelTone(e.level)}>{levelLabel(e.level)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Berdasarkan SKDI 2012 (Konsil Kedokteran Indonesia). Level 4A/4B = harus tuntas mandiri saat
        lulus dokter, 3A/3B = bisa dengan supervisi, 2 = pernah melihat, 1 = tahu teori.
      </div>
    </div>
  )
}

function OsceCaseBankSection() {
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
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Frequency tags are a rough "how often a variant of this case shows up" signal for prioritizing
          review — not a guarantee of what's on any specific exam sitting.
        </p>
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
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{sys}</div>
          <div className="mt-2 space-y-2">
            {cases.map((c) => {
              const notes = OSCE_STATION_NOTES[c.name]
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
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Kriteria Diagnosis</div>
                        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{notes.kriteriaDiagnosis}</p>
                      </div>
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
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-400">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Direkap dari rekap kasus OSCE UKMPPD 2016-2026 (studyclubukmppd & kontributor lain). Bantuan
        belajar, bukan bocoran atau jaminan soal ujian — tetap pelajari materi secara menyeluruh.
      </div>
    </div>
  )
}

function StationSimulatorSection() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const station = OSCE_STATION_RUBRICS[idx % OSCE_STATION_RUBRICS.length]

  const next = () => { setIdx((i) => (i + 1) % OSCE_STATION_RUBRICS.length); setRevealed(false) }
  const prev = () => { setIdx((i) => (i - 1 + OSCE_STATION_RUBRICS.length) % OSCE_STATION_RUBRICS.length); setRevealed(false) }

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Station Simulator" subtitle="Official UKMPPD OSCE station templates — scenario, task, and the full examiner scoring rubric" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Read the scenario, mentally (or out loud) run through the tasks like a real OSCE station,
          then tap "Reveal examiner findings" to check your anamnesis, exam findings, diagnosis, and
          treatment against the official rubric.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between gap-2">
          <button onClick={prev} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">← Prev</button>
          <span className="text-[11px] font-bold text-neutral-400">Station {idx + 1} / {OSCE_STATION_RUBRICS.length}</span>
          <button onClick={next} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">Next →</button>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{station.system}</div>
            <div className="text-[16px] font-black text-ink dark:text-white">{station.title}</div>
          </div>
          <Badge tone="brand">{station.allocatedMinutes} menit</Badge>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-neutral-400">SKDI: {station.skdiLevel}</p>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Skenario Klinik</div>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{station.scenario}</p>
        </div>

        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Tugas</div>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            {station.tasks.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>

        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">
            Reveal examiner findings
          </button>
        ) : (
          <div className="mt-4 space-y-3 border-t border-neutral-200 pt-3 dark:border-white/10">
            {station.examinerFindings.anamnesis && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Anamnesis (jawaban PS)</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.anamnesis}</p>
              </div>
            )}
            {station.examinerFindings.physicalExam && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Fisik</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.physicalExam}</p>
              </div>
            )}
            {station.examinerFindings.supportingExam && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Penunjang</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.supportingExam}</p>
              </div>
            )}
            {station.examinerFindings.diagnosis && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Diagnosis</div>
                <p className="mt-1 text-[13px] font-bold text-ink dark:text-white">{station.examinerFindings.diagnosis}</p>
                {station.examinerFindings.differentials && station.examinerFindings.differentials.length > 0 && (
                  <p className="mt-0.5 text-[12px] text-neutral-500">DD: {station.examinerFindings.differentials.join(', ')}</p>
                )}
              </div>
            )}
            {station.examinerFindings.treatment && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Tatalaksana</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.treatment}</p>
              </div>
            )}
            {station.standardPatient && (
              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Naskah Pasien Standar</div>
                <p className="mt-1 text-[12px] text-neutral-500">
                  {station.standardPatient.nama} · {station.standardPatient.usia} · {station.standardPatient.jenisKelamin} · {station.standardPatient.pekerjaan}
                </p>
                {station.standardPatient.keluhanUtama && <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300"><b>Keluhan utama:</b> {station.standardPatient.keluhanUtama}</p>}
                {station.standardPatient.riwayatPenyakitSekarang && <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.standardPatient.riwayatPenyakitSekarang}</p>}
                {station.standardPatient.pertanyaanWajib && <p className="mt-1 text-[12px] italic text-neutral-500">"{station.standardPatient.pertanyaanWajib}"</p>}
                {station.standardPatient.peranWajib && <p className="mt-1 text-[12px] text-neutral-400">Peran: {station.standardPatient.peranWajib}</p>}
              </div>
            )}
            {station.author && <p className="text-[10px] text-neutral-400">Penulis: {station.author}{station.reference ? ` · Referensi: ${station.reference}` : ''}</p>}
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Diadaptasi dari template station OSCE UKMPPD resmi lintas fakultas kedokteran. Gunakan sebagai
        simulasi latihan — kompetensi & pemahaman klinis tetap yang utama, bukan hafalan kasus ini saja.
      </div>
    </div>
  )
}

const SCORE_KEY = 'pmd_medstudy_scores'
interface Scores { [track: string]: { correct: number; total: number } }
function loadScores(): Scores { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') } catch { return {} } }
function saveScores(s: Scores) { try { localStorage.setItem(SCORE_KEY, JSON.stringify(s)) } catch { /* ignore */ } }

export function MedStudyHub() {
  const [section, setSection] = useState<Section>('practice')
  const [motiveIdx, setMotiveIdx] = useState(() => Math.floor(Math.random() * MOTIVATION.length))
  const motive = MOTIVATION[motiveIdx]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Med Study Hub"
          subtitle="For OSCE · UKMPPD · koas · PPDS — practice, technique & staying sane"
        />
        {/* Motivation — honest encouragement for the grind */}
        <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/40 p-4">
          <div className="text-2xl">💚</div>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">“{motive.quote}”</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">{motive.context}</span>
            <button
              onClick={() => setMotiveIdx((i) => (i + 1) % MOTIVATION.length)}
              className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-brand-dark transition active:scale-95"
            >
              Another →
            </button>
          </div>
        </div>
      </Card>

      {/* Section switcher */}
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${section === s.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {section === 'practice' && <PracticeBank />}
      {section === 'osce' && <OsceSection />}
      {section === 'case-bank' && <OsceCaseBankSection />}
      {section === 'station-sim' && <StationSimulatorSection />}
      {section === 'skills' && <SkdiSkillsSection />}
      {section === 'therapy' && <SkdiTherapySection />}
      {section === 'diseases' && <SkdiDiseaseDirectorySection />}
      {section === 'techniques' && <TechniquesSection />}
      {section === 'timeline' && <TimelineSection />}
    </div>
  )
}

function PracticeBank() {
  const [track, setTrack] = useState<ExamTrack>('usmle')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [scores, setScores] = useState<Scores>(loadScores)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  // Shuffle the deck per track/seed so repeat sessions aren't identical.
  const questions = useMemo(() => {
    const q = [...questionsForExam(track)]
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(((Math.sin(shuffleSeed + i) + 1) / 2) * (i + 1))
      ;[q[i], q[j]] = [q[j], q[i]]
    }
    return q
  }, [track, shuffleSeed])

  const q = questions[qIdx % Math.max(questions.length, 1)]
  const info = EXAM_INFO[track]
  const score = scores[track] ?? { correct: 0, total: 0 }

  function pick(track: ExamTrack) { setTrack(track); setQIdx(0); setSelected(null); setShuffleSeed((s) => s + 1) }
  function answer(i: number) {
    if (selected !== null || !q) return
    setSelected(i)
    const correct = i === q.answer
    const next = { ...scores, [track]: { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 } }
    setScores(next); saveScores(next)
  }
  function next() { setQIdx((i) => i + 1); setSelected(null) }

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-ink">❓ Practice Questions</div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-500">Score: {score.correct}/{score.total}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAM_ORDER.map((t) => (
          <button key={t} onClick={() => pick(t)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${track === t ? 'bg-ink text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            {EXAM_INFO[t].flag} {EXAM_INFO[t].examName.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-500">
        <span className="font-bold text-neutral-700">{info.examName}</span> · {info.body}
        <div className="mt-0.5">{info.format}</div>
      </div>

      {q && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{q.vignette}</p>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer
              const isChosen = i === selected
              const show = selected !== null
              return (
                <button key={i} onClick={() => answer(i)} disabled={show}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                    show && isAnswer ? 'border-brand bg-brand-50 font-semibold text-brand-dark'
                    : show && isChosen ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-neutral-200 hover:bg-neutral-50'
                  }`}>
                  <span className="mr-1.5 font-bold">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <div className="mt-3 rounded-xl bg-neutral-50 p-3">
              <div className="mb-1 text-xs font-black text-ink">{selected === q.answer ? '✓ Correct' : '✗ Not quite'}</div>
              <p className="text-[13px] leading-relaxed text-neutral-600">{q.explanation}</p>
              <button onClick={next} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition active:scale-95">Next question →</button>
            </div>
          )}
        </>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-400">
        These are original practice questions written to match each exam's format and blueprint — not real/leaked past papers, which are copyrighted by their boards. UKMPPD candidates: the USMLE and PLAB banks track the same clinical-reasoning skills and blueprint the UKMPPD draws from.
      </p>
    </Card>
  )
}

function OsceSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconStethoscope size={20} />} title="OSCE Station Technique" subtitle="Marks are for observable behaviours — technique is as scoreable as knowledge" />
      </Card>
      {OSCE_TECHNIQUE.map((tip) => (
        <Card key={tip.station} className="!p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">{tip.emoji}</span>
            <span className="text-sm font-black text-ink">{tip.station}</span>
          </div>
          <ul className="space-y-2">
            {tip.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function TechniquesSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconSparkle size={20} />} title="How to Study" subtitle="Evidence-based methods, ordered by effect size in the learning-science literature" />
      </Card>
      {STUDY_TECHNIQUES.map((t) => (
        <Card key={t.title} className="!p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xl">{t.emoji}</span>
            <span className="text-sm font-black text-ink">{t.title}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-700"><b className="text-neutral-500">How:</b> {t.how}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600"><b className="text-neutral-500">Why it works:</b> {t.why}</p>
        </Card>
      ))}
    </div>
  )
}

function TimelineSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconActivity size={20} />} title="Countdown Plan" subtitle="An operational plan for the weeks before OSCE / UKMPPD" />
      </Card>
      {EXAM_TIMELINE.map((item, i) => (
        <Card key={item.title} className="!p-4">
          <div className="flex items-center gap-2">
            <Badge tone={i >= EXAM_TIMELINE.length - 2 ? 'critical' : 'brand'}>{item.title}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{item.body}</p>
        </Card>
      ))}
    </div>
  )
}

export default MedStudyHub
