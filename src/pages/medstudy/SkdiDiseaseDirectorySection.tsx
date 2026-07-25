import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconBook } from '../../components/icons'
import { OSCE_STATION_NOTES } from '../../lib/osceStationNotes'
import { SKDI_DISEASE_LIST, SKDI_DISEASE_SYSTEMS, type SkdiDiseaseSystem } from '../../lib/skdiDiseaseList'
import { SKDI_DISEASE_NOTES } from '../../lib/skdiDiseaseNotes'
import { REFERENSI_SUMBER } from '../../lib/referensiSumber'
import { SKDI_DISEASE_NOTE_ALIASES } from '../../lib/skdiDiseaseNoteAliases'
import { levelTone, levelLabel } from './shared'

/**
 * Resolves the note shown for a disease. Every SKDI disease has one of:
 *  - its own quick-reference entry in SKDI_DISEASE_NOTES, or
 *  - a curated alias to the (deeper) OSCE station note covering the same
 *    condition — anamnesis, pemeriksaan fisik, kriteria diagnosis, tatalaksana.
 * The alias table is hand-checked; no fuzzy matching is used.
 */
const ANAMNESIS_LABELS: [keyof NonNullable<(typeof SKDI_DISEASE_NOTES)[string]['anamnesis']>, string][] = [
  ['keluhanUtama', 'Keluhan Utama'],
  ['riwayatPenyakitSekarang', 'Riwayat Penyakit Sekarang (SOCRATES)'],
  ['riwayatPenyakitDahulu', 'Riwayat Penyakit Dahulu'],
  ['riwayatPenyakitKeluarga', 'Riwayat Penyakit Keluarga'],
  ['riwayatPengobatan', 'Riwayat Pengobatan'],
  ['riwayatAlergi', 'Riwayat Alergi'],
  ['riwayatKehamilanPersalinan', 'Riwayat Kehamilan & Persalinan'],
  ['riwayatTumbuhKembang', 'Riwayat Tumbuh Kembang'],
  ['riwayatNutrisi', 'Riwayat Nutrisi'],
  ['riwayatImunisasi', 'Riwayat Imunisasi'],
  ['riwayatSosialEkonomi', 'Riwayat Sosial Ekonomi & Lingkungan'],
]

function resolveNote(disease: string) {
  const own = SKDI_DISEASE_NOTES[disease]
  if (own) {
    const blocks: { title: string; items: string[] }[] = []
    if (own.pemeriksaanFisik) blocks.push({ title: 'Pemeriksaan Fisik', items: own.pemeriksaanFisik })
    if (own.penunjang) blocks.push({ title: 'Pemeriksaan Penunjang & Interpretasi', items: own.penunjang })
    if (own.faktorRisiko) blocks.push({ title: 'Faktor Risiko', items: own.faktorRisiko })
    if (own.diagnosis) blocks.push({ title: 'Diagnosis', items: own.diagnosis })
    if (own.diagnosisBanding) blocks.push({ title: 'Diagnosis Banding', items: own.diagnosisBanding })
    if (own.terapiSuportif) blocks.push({ title: 'Terapi Suportif', items: own.terapiSuportif })
    blocks.push({ title: 'Tatalaksana', items: own.tatalaksana })
    if (own.edukasi) blocks.push({ title: 'Edukasi', items: own.edukasi })
    if (own.komplikasi) blocks.push({ title: 'Komplikasi', items: own.komplikasi })
    return {
      kind: 'ringkas' as const,
      sourceStation: undefined as string | undefined,
      definisi: own.definisi,
      deep: own,
      blocks,
      referensi: own.referensi,
      tips: undefined as string | undefined,
    }
  }
  const aliasKey = SKDI_DISEASE_NOTE_ALIASES[disease]
  const station = aliasKey ? OSCE_STATION_NOTES[aliasKey] : undefined
  if (!station) return null
  return {
    kind: 'osce' as const,
    sourceStation: aliasKey,
    definisi: undefined as string | undefined,
    deep: undefined,
    blocks: [
      { title: 'Anamnesis', items: station.anamnesis },
      { title: 'Pemeriksaan Fisik', items: station.pemeriksaanFisik },
      { title: 'Kriteria Diagnosis', items: [station.kriteriaDiagnosis] },
      { title: 'Tatalaksana', items: station.tatalaksana },
    ],
    referensi: [] as string[],
    tips: station.tips,
  }
}

export default function SkdiDiseaseDirectorySection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkdiDiseaseSystem | null>(null)
  const [levelFilter, setLevelFilter] = useState<'all' | '4' | '3' | '2' | '1'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

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
            {diseases.map((e, i) => {
              const note = resolveNote(e.disease)
              const isOpen = expanded === e.disease
              return (
                <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <button
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => note && setExpanded(isOpen ? null : e.disease)}
                  >
                    <div>
                      <span className="text-[13px] font-semibold text-ink dark:text-white">{e.disease}</span>
                      {e.subsection && <span className="ml-2 text-[11px] text-neutral-400">{e.subsection}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {note?.kind === 'osce' && <Badge tone="brand">Catatan OSCE</Badge>}
                      <Badge tone={levelTone(e.level)}>{levelLabel(e.level)}</Badge>
                      {note && <Badge tone="low">{isOpen ? 'Tutup ▲' : 'Catatan ▼'}</Badge>}
                    </div>
                  </button>
                  {isOpen && note && (
                    <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-white/10">
                      {note.definisi && (
                        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.definisi}</p>
                      )}
                      {note.kind === 'osce' && (
                        <p className="text-[11px] italic text-neutral-400">
                          Dari catatan station OSCE: {note.sourceStation}
                        </p>
                      )}

                      {note.deep?.anamnesis && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Anamnesis</div>
                          <div className="mt-1 space-y-1.5">
                            {ANAMNESIS_LABELS.map(([key, label]) => {
                              const v = note.deep!.anamnesis![key]
                              if (!v) return null
                              return (
                                <div key={key}>
                                  <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-300">{label}</div>
                                  <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{v}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {note.deep?.antropometri && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Interpretasi Antropometri</div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.deep.antropometri}</p>
                        </div>
                      )}

                      {(note.deep?.etiologi || note.deep?.patofisiologi) && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Etiologi & Patofisiologi</div>
                          {note.deep.etiologi && (
                            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.deep.etiologi}</p>
                          )}
                          {note.deep.patofisiologi && (
                            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.deep.patofisiologi}</p>
                          )}
                        </div>
                      )}

                      {note.blocks.map((b) => (
                        <div key={b.title}>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">{b.title}</div>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                            {b.items.map((t, j) => <li key={j}>{t}</li>)}
                          </ul>
                        </div>
                      ))}
                      {note.deep?.goldStandard && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Baku Emas Diagnosis</div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.deep.goldStandard}</p>
                        </div>
                      )}

                      {note.deep?.pengkajian && (
                        <div className="rounded-lg bg-neutral-100 p-3 dark:bg-white/10">
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pengkajian Masalah</div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{note.deep.pengkajian}</p>
                        </div>
                      )}

                      {note.deep?.prognosis && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Prognosis</div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{note.deep.prognosis}</p>
                        </div>
                      )}

                      {note.tips && (
                        <div className="rounded-lg bg-brand-50 p-2.5 text-[12px] leading-relaxed text-brand-dark dark:bg-brand/10">
                          <span className="font-black">Tips: </span>{note.tips}
                        </div>
                      )}
                      {note.referensi.length > 0 && (
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Referensi</div>
                          <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {note.referensi.map((key) => (
                              <li key={key}>{REFERENSI_SUMBER[key] ?? key}</li>
                            ))}
                          </ol>
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

      <div className="space-y-2 rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <p>
          Nama penyakit dan level kompetensi berdasarkan SKDI 2012 (Konsil Kedokteran Indonesia).
          Level 4A/4B = harus tuntas mandiri saat lulus dokter, 3A/3B = bisa dengan supervisi,
          2 = pernah melihat, 1 = tahu teori.
        </p>
        <p>
          Isi klinis tiap catatan disusun dari ajaran klinis baku dan diselaraskan dengan pedoman
          terbit yang dicantumkan pada bagian Referensi di tiap entry — bukan kutipan verbatim dari
          satu dokumen tertentu. Selalu cross-check pedoman terkini sebelum penggunaan klinis.
        </p>
      </div>
    </div>
  )
}
