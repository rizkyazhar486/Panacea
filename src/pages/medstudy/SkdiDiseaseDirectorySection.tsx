import { useEffect, useMemo, useState } from 'react'
import { sinonimUntuk } from '../../lib/sinonimPenyakit'
import { PemutarBaca } from '../../components/PemutarBaca'
import { Mindmap, WARNA, type Cabang } from './Mindmap'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconBook } from '../../components/icons'
import type { OsceStationNote } from '../../lib/osceStationNotes'
import { SKDI_DISEASE_LIST, SKDI_DISEASE_SYSTEMS, type SkdiDiseaseSystem } from '../../lib/skdiDiseaseList'
import { SKDI_NOTE_KEYS } from '../../lib/skdiDiseaseNoteIndex'
import type { SkdiDiseaseNote } from '../../lib/skdiDiseaseNotes'
import {
  SKDI_DISEASE_NOTES_SUPPLEMENT,
  SKDI_DISEASE_SUPPLEMENT_KEYS,
} from '../../lib/skdiDiseaseNotesSupplement'
import { REFERENSI_SUMBER } from '../../lib/referensiSumber'
import { api, backendEnabled, type IcdEntry } from '../../lib/api'
import { levelTone, levelLabel } from './shared'
import { useTujuan, modeAwam } from '../../lib/tujuan'

interface NoteData {
  notes: Record<string, SkdiDiseaseNote>
  stations: Record<string, OsceStationNote>
  aliases: Record<string, string>
}

function useNoteData(armed: boolean) {
  const [data, setData] = useState<NoteData | null>(null)
  useEffect(() => {
    if (!armed || data) return
    let alive = true
    Promise.all([
      import('../../lib/skdiDiseaseNotes'),
      import('../../lib/osceStationNotes'),
      import('../../lib/skdiDiseaseNoteAliases'),
    ]).then(([n, o, a]) => {
      if (!alive) return
      setData({
        notes: n.SKDI_DISEASE_NOTES,
        stations: o.OSCE_STATION_NOTES,
        aliases: a.SKDI_DISEASE_NOTE_ALIASES,
      })
    }).catch(() => {
      // Supplement tetap dapat dibuka walaupun bundle besar gagal dimuat.
      // Empty/fetch failure tidak boleh menghapus catatan kecil yang sudah ada.
    })
    return () => { alive = false }
  }, [armed, data])
  return data
}

function ownNoteView(own: SkdiDiseaseNote) {
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

function resolveNote(disease: string, data: NoteData | null) {
  // Supplement kecil disimpan terpisah supaya 16 gap lama langsung tersedia,
  // bahkan sebelum corpus ~MB selesai diunduh.
  const supplement = SKDI_DISEASE_NOTES_SUPPLEMENT[disease]
  if (supplement) return ownNoteView(supplement)
  if (!data) return null

  const own = data.notes[disease]
  if (own) return ownNoteView(own)

  const aliasKey = data.aliases[disease]
  const station = aliasKey ? data.stations[aliasKey] : undefined
  if (!station) return null
  return {
    kind: 'osce' as const,
    sourceStation: aliasKey,
    definisi: station.definisi as string | undefined,
    deep: undefined,
    blocks: [
      ...(station.etiologi ? [{ title: 'Etiologi', items: station.etiologi }] : []),
      ...(station.rantai || station.patofisiologi
        ? [{
            title: 'Patofisiologi',
            items: [
              ...(station.rantai ? rantaiKeTeks(station.rantai) : []),
              ...(station.patofisiologi ? [station.patofisiologi] : []),
            ],
          }]
        : []),
      { title: 'Anamnesis', items: station.anamnesis },
      { title: 'Pemeriksaan Fisik', items: station.pemeriksaanFisik },
      ...(station.penunjang ? [{ title: 'Pemeriksaan Penunjang', items: station.penunjang }] : []),
      { title: 'Kriteria Diagnosis', items: [station.kriteriaDiagnosis] },
      ...(station.diagnosisBanding ? [{ title: 'Diagnosis Banding', items: station.diagnosisBanding }] : []),
      { title: 'Tatalaksana', items: station.tatalaksana },
    ],
    referensi: [] as string[],
    tips: station.tips,
  }
}

function rantaiKeTeks(langkah: string[]): string[] {
  const bagian: string[][] = [[]]
  for (const l of langkah) {
    if (l === '') bagian.push([])
    else bagian[bagian.length - 1].push(l)
  }
  return bagian.filter((b) => b.length).map((b) => b.join(' → '))
}

function teksCatatan(nama: string, cabang: Cabang[]): string {
  const bagian = cabang
    .filter((c) => c.butir.length)
    .map((c) => `${c.label}. ${c.butir.join('. ')}`)
  return [nama, ...bagian].join('. ')
}

function cabangDari(note: {
  definisi?: string
  deep?: SkdiDiseaseNote
  blocks: { title: string; items: string[] }[]
}): Cabang[] {
  const blok = (j: string) => note.blocks.find((b) => b.title === j)?.items ?? []
  const d = note.deep
  const gejala = [
    ...(d?.anamnesis?.keluhanUtama ? [d.anamnesis.keluhanUtama] : []),
    ...blok('Pemeriksaan Fisik'),
    ...blok('Anamnesis'),
  ]
  const sebab = [
    ...(d?.etiologi ? [d.etiologi] : []),
    ...(d?.rantai ? rantaiKeTeks(d.rantai) : []),
    ...(d?.patofisiologi ? [d.patofisiologi] : []),
    ...blok('Faktor Risiko'),
  ]
  return [
    { kunci: 'apa', label: 'Apa', warna: 'bg-neutral-700', butir: note.definisi ? [note.definisi] : [] },
    { kunci: 'etio', label: 'Sebab', warna: WARNA.etio, butir: sebab },
    { kunci: 'klinis', label: 'Tampak', warna: WARNA.klinis, butir: gejala },
    { kunci: 'dx', label: 'Pastikan', warna: WARNA.dx,
      butir: [...(d?.goldStandard ? [d.goldStandard] : []), ...blok('Diagnosis'), ...blok('Kriteria Diagnosis')] },
    { kunci: 'px', label: 'Periksa', warna: WARNA.px, butir: blok('Pemeriksaan Penunjang & Interpretasi') },
    { kunci: 'tx', label: 'Obat', warna: WARNA.tx, butir: [...blok('Tatalaksana'), ...blok('Terapi Suportif')] },
    { kunci: 'dd', label: 'Beda Dgn', warna: WARNA.dd, butir: blok('Diagnosis Banding') },
    { kunci: 'awas', label: 'Bahaya', warna: WARNA.awas, butir: blok('Komplikasi') },
    { kunci: 'nalar', label: 'Alur Pikir', warna: WARNA.nalar, butir: d?.pengkajian ? [d.pengkajian] : [] },
    { kunci: 'ajar', label: 'Ajarkan', warna: WARNA.ajar, butir: blok('Edukasi') },
    { kunci: 'hasil', label: 'Ke Depan', warna: WARNA.hasil, butir: d?.prognosis ? [d.prognosis] : [] },
  ]
}

function Icd11ExtendedCatalog({ seed }: { seed: string }) {
  const [q, setQ] = useState(seed)
  const [results, setResults] = useState<IcdEntry[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (seed && !q) setQ(seed)
  }, [seed, q])

  async function search() {
    const term = q.trim()
    if (!term || !backendEnabled) return
    setState('loading')
    setError('')
    try {
      const r = await api.icdSearch(term)
      setResults(r.results)
      setState('done')
    } catch (e) {
      setResults([])
      setError(e instanceof Error ? e.message : 'ICD lookup gagal')
      setState('error')
    }
  }

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-brand">WHO ICD-11 extended catalog</div>
          <h3 className="mt-1 text-lg font-black text-ink dark:text-white">Cari di luar daftar SKDI</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
            Hasil ICD-11 berasal dari WHO ICD API, bukan kode yang ditulis manual. Baris SKDI yang merupakan kelompok
            beberapa penyakit sengaja tidak diberi satu kode palsu; cari diagnosis spesifik di sini untuk mendapatkan
            code dan entity resminya. Bila WHO credential belum aktif, fallback ICD-10-CM ditandai jelas dan tidak pernah disebut ICD-11.
          </p>
        </div>
        <Badge tone="brand">ICD-11 MMS</Badge>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void search() }}
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Contoh: acute myeloid leukemia, thalassemia, congenital heart disease…"
        />
        <button
          onClick={() => void search()}
          disabled={!backendEnabled || state === 'loading' || !q.trim()}
          className="rounded-xl bg-brand px-4 py-2.5 text-[12px] font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === 'loading' ? 'Mencari WHO…' : 'Cari ICD'}
        </button>
      </div>

      {!backendEnabled && (
        <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
          Backend belum terhubung pada build ini. Catatan SKDI lokal tetap tersedia, tetapi pencarian WHO membutuhkan PanaceaMed backend.
        </p>
      )}
      {state === 'error' && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
      {state === 'done' && results.length === 0 && (
        <p className="mt-3 text-[12px] text-neutral-500">Tidak ada hasil. Coba nama diagnosis yang lebih spesifik atau istilah Inggris.</p>
      )}
      {results.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {results.map((r, i) => (
            <article key={`${r.sumber}-${r.code}-${r.uri ?? i}`} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-ink px-2 py-1 font-mono text-[11px] font-black text-white">{r.code}</span>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${r.sumber === 'icd11' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>
                  {r.sumber === 'icd11' ? 'WHO ICD-11' : 'Fallback ICD-10-CM'}
                </span>
              </div>
              <h4 className="mt-2 text-[13px] font-black text-ink dark:text-white">{r.title}</h4>
              {r.chapter && <p className="mt-1 text-[10px] text-neutral-500">{r.chapter}</p>}
              {r.definition && <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{r.definition}</p>}
              {r.uri && r.sumber === 'icd11' && (
                <a href={r.uri} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] font-bold text-brand-dark underline">
                  Buka entity WHO ↗
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function SkdiDiseaseDirectorySection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkdiDiseaseSystem | null>(null)
  const [levelFilter, setLevelFilter] = useState<'all' | '4' | '3' | '2' | '1'>('all')
  const awam = modeAwam(useTujuan())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [wantNotes, setWantNotes] = useState(false)
  const noteData = useNoteData(wantNotes)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_DISEASE_LIST.filter((e) => {
      if (system && e.system !== system) return false
      if (levelFilter !== 'all' && !e.level.startsWith(levelFilter)) return false
      if (!q) return true
      const baris = `${e.disease} ${e.subsection ?? ''} ${e.system}`.toLowerCase()
      if (baris.includes(q)) return true
      return sinonimUntuk(q).some((p) => baris.includes(p))
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
        <SectionTitle
          icon={<IconBook size={20} />}
          title={awam ? 'Ensiklopedia Penyakit' : 'Daftar Penyakit SKDI'}
          subtitle={awam
            ? `${SKDI_DISEASE_LIST.length} penyakit/kondisi dengan catatan klinis + katalog ICD-11 WHO`
            : `${SKDI_DISEASE_LIST.length} baris SKDI; seluruh baris kini mempunyai catatan, ditambah pencarian ICD-11 resmi WHO`}
        />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          {awam
            ? 'Ketuk penyakit untuk peta sebab, tanda, pemeriksaan, tatalaksana dan bahaya. Gunakan katalog ICD-11 di bawah untuk diagnosis di luar daftar SKDI.'
            : 'Catatan lokal adalah ringkasan edukasi berbasis pedoman. Kode ICD-11 tidak ditebak dari judul SKDI: kode dan entity resmi ditarik dari WHO API untuk diagnosis spesifik.'}
        </p>
        {awam && (
          <p className="mt-2 rounded-xl bg-amber-500/10 p-2.5 text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            <b>Catatan ini untuk edukasi, bukan resep atau diagnosis pribadi.</b> Tatalaksana berubah menurut usia,
            kehamilan, fungsi ginjal/hati, alergi, interaksi obat, berat penyakit, dan temuan pemeriksaan.
          </p>
        )}
        {wantNotes && !noteData && (
          <p className="mt-2 text-[12px] font-semibold text-brand-dark">Memuat corpus catatan utama… catatan supplement tetap dapat dibuka.</p>
        )}
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari penyakit (mis. malaria, hipertensi, katarak)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!awam && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setLevelFilter('all')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${levelFilter === 'all' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua level</button>
            {(['4', '3', '2', '1'] as const).map((lv) => (
              <button key={lv} onClick={() => setLevelFilter(lv)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${levelFilter === lv ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Level {lv}</button>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua sistem</button>
          {SKDI_DISEASE_SYSTEMS.map((s) => (
            <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
          ))}
        </div>
      </Card>

      <Icd11ExtendedCatalog seed={query.trim()} />

      {grouped.map(([sys, diseases]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{sys} · {diseases.length}</div>
          <div className="mt-2 space-y-2">
            {diseases.map((e, i) => {
              const hasNote = SKDI_NOTE_KEYS.has(e.disease) || SKDI_DISEASE_SUPPLEMENT_KEYS.has(e.disease)
              const note = resolveNote(e.disease, noteData)
              const isOpen = expanded === e.disease
              return (
                <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <button
                    className="w-full text-left"
                    onClick={() => {
                      if (!hasNote) return
                      if (!SKDI_DISEASE_SUPPLEMENT_KEYS.has(e.disease)) setWantNotes(true)
                      setExpanded(isOpen ? null : e.disease)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink dark:text-white">{e.disease}</span>
                      {hasNote && <span className="shrink-0"><Badge tone="low">{isOpen ? 'Tutup ▲' : 'Catatan ▼'}</Badge></span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {!awam && <Badge tone={levelTone(e.level)}>{levelLabel(e.level)}</Badge>}
                      {!awam && note?.kind === 'osce' && <Badge tone="brand">Catatan OSCE</Badge>}
                      {SKDI_DISEASE_SUPPLEMENT_KEYS.has(e.disease) && <Badge tone="brand">Catatan baru</Badge>}
                      {e.subsection && <span className="text-[11px] text-neutral-500">{e.subsection}</span>}
                    </div>
                  </button>
                  {isOpen && !note && (
                    <p className="mt-3 border-t border-neutral-200 pt-3 text-[12px] font-semibold text-brand-dark dark:border-white/10">Memuat catatan…</p>
                  )}
                  {isOpen && note && (
                    <div data-catatan className="mt-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                      <div className="mb-2"><PemutarBaca teks={teksCatatan(e.disease, cabangDari(note))} label="Dengarkan catatan" /></div>
                      <Mindmap pusat={e.disease} sub={e.subsection ?? undefined} cabang={cabangDari(note)} />
                      {note.kind === 'osce' && <p className="mt-2 text-[10px] italic text-neutral-500">Dari station OSCE: {note.sourceStation}</p>}
                      {note.referensi.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide text-neutral-400">Referensi ({note.referensi.length})</summary>
                          <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] leading-snug text-neutral-500">
                            {note.referensi.map((k) => <li key={k}>{REFERENSI_SUMBER[k] ?? k}</li>)}
                          </ol>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil di daftar SKDI — coba katalog ICD-11 WHO di atas.</p>}

      <div className="space-y-2 rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        <p>
          Nama penyakit dan level kompetensi lokal berasal dari SKDI. Isi catatan klinis disusun dari sumber yang tercantum pada tiap entry.
          ICD-11 adalah lapisan klasifikasi terpisah: hasil berlabel WHO ICD-11 berasal dari API WHO, sedangkan fallback ICD-10-CM selalu dilabeli sebagai fallback.
        </p>
        <p>Selalu cross-check guideline terkini dan konteks pasien sebelum penggunaan klinis.</p>
      </div>
    </div>
  )
}
