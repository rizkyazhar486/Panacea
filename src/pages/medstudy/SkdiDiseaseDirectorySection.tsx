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
import { REFERENSI_SUMBER } from '../../lib/referensiSumber'
import { levelTone, levelLabel } from './shared'
import { useTujuan, modeAwam } from '../../lib/tujuan'

/**
 * The three note datasets total well over a megabyte — far too much to ship in
 * the chunk that renders the directory list itself. They are pulled in with
 * dynamic import() after mount, so the 700+ disease list paints immediately and
 * the notes hydrate a moment later.
 *
 * Loading them on mount (rather than on first expand) is deliberate: the note
 * toggles have to know which diseases have notes, and deriving that from a
 * hand-maintained key index would silently drift every time a note is added.
 */
interface NoteData {
  notes: Record<string, SkdiDiseaseNote>
  stations: Record<string, OsceStationNote>
  aliases: Record<string, string>
}

/**
 * Loads the note corpus on demand.
 *
 * The notes are ~1 MB — far too much to fetch just so the list can decide which
 * rows get an expand toggle. `SKDI_NOTE_KEYS` (a few kB) answers that question,
 * so the corpus is only requested once `armed` flips true, i.e. the first time a
 * user actually opens a disease. Browsing, searching, and filtering the whole
 * 718-row list never touch it.
 */
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
    })
    return () => {
      alive = false
    }
  }, [armed, data])
  return data
}

/**
 * Resolves the note shown for a disease. Every SKDI disease has one of:
 *  - its own quick-reference entry in SKDI_DISEASE_NOTES, or
 *  - a curated alias to the (deeper) OSCE station note covering the same
 *    condition — anamnesis, pemeriksaan fisik, kriteria diagnosis, tatalaksana.
 * The alias table is hand-checked; no fuzzy matching is used.
 */
const ANAMNESIS_LABELS: [keyof NonNullable<SkdiDiseaseNote['anamnesis']>, string][] = [
  ['keluhanUtama', 'Keluhan Utama'],
  ['riwayatPenyakitSekarang', 'History Penyakit Sekarang (SOCRATES)'],
  ['riwayatPenyakitDahulu', 'History Penyakit Dahulu'],
  ['riwayatPenyakitKeluarga', 'History Penyakit Keluarga'],
  ['riwayatPengobatan', 'History Pengobatan'],
  ['riwayatAlergi', 'History Alergi'],
  ['riwayatKehamilanPersalinan', 'History Kehamilan & Persalinan'],
  ['riwayatTumbuhKembang', 'History Tumbuh Kembang'],
  ['riwayatNutrisi', 'History Nutrisi'],
  ['riwayatImunisasi', 'History Imunisasi'],
  ['riwayatSosialEkonomi', 'History Sosial Ekonomi & Lingkungan'],
]

function resolveNote(disease: string, data: NoteData | null) {
  if (!data) return null
  const own = data.notes[disease]
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
      /* Rantai berpanah ikut ditampilkan di sini, bukan hanya di Case Bank.
         Kalau hanya satu tempat yang merendernya, catatan yang mekanismenya
         ditulis sebagai rantai akan tampil TANPA patofisiologi sama sekali di
         tempat yang lain — dan pembacanya tidak punya cara tahu ada yang
         hilang. Di sini bloknya berupa daftar teks, jadi rantainya dirangkai
         dengan tanda panah menjadi satu baris; baris kosong pada data memisah
         menjadi butir tersendiri. */
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

/** Rantai langkah menjadi baris teks berpanah; '' memisahkan rantai. */
function rantaiKeTeks(langkah: string[]): string[] {
  const bagian: string[][] = [[]]
  for (const l of langkah) {
    if (l === '') bagian.push([])
    else bagian[bagian.length - 1].push(l)
  }
  return bagian.filter((b) => b.length).map((b) => b.join(' → '))
}

/**
 * Peta data catatan -> cabang mindmap.
 *
 * Urutan cabang SAMA untuk setiap penyakit: sebab -> tampak -> cara pastikan ->
 * obat -> bahaya. Itu alur berpikir klinis, dan karena urutannya tetap, orang
 * hafal posisinya, bukan kalimatnya.
 */
/**
 * Susun catatan menjadi satu teks yang enak didengar.
 *
 * Label cabang ikut dibacakan ("Sebab:", "Tanda:") karena tanpa penanda itu
 * pendengarnya kehilangan tempat sesudah kalimat ketiga — di layar peranannya
 * dipegang warna dan tata letak, dan telinga tidak punya keduanya.
 */
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
    /*
     * Tiga cabang berikut ditambahkan sesudah ditemukan bahwa isinya SUDAH
     * DITULIS NAMUN TIDAK PERNAH SAMPAI KE LAYAR.
     *
     * `edukasi` terlanjur dimasukkan ke daftar blok namun tidak satu pun cabang
     * mindmap memungutnya kembali; `pengkajian` dan `prognosis` bahkan tidak
     * pernah disebut di berkas ini sama sekali. Terhitung 155 entri memiliki
     * edukasi, 145 memiliki pengkajian, dan 155 memiliki prognosis — seluruhnya
     * tidak terlihat oleh pembacanya. Cacat semacam ini tidak menimbulkan galat
     * apa pun dan tidak akan pernah dilaporkan siapa pun: yang hilang bukan
     * fungsi, melainkan isi yang tidak pernah diketahui keberadaannya.
     *
     * `pengkajian` sengaja diletakkan sesudah diagnosis banding, karena ia
     * memang paragraf yang MEMBANDINGKAN — membacanya sebelum bandingnya
     * disebut membuat alurnya kehilangan lawan bicaranya.
     */
    { kunci: 'nalar', label: 'Alur Pikir', warna: WARNA.nalar, butir: d?.pengkajian ? [d.pengkajian] : [] },
    { kunci: 'ajar', label: 'Ajarkan', warna: WARNA.ajar, butir: blok('Edukasi') },
    { kunci: 'hasil', label: 'Ke Depan', warna: WARNA.hasil, butir: d?.prognosis ? [d.prognosis] : [] },
  ]
}

export default function SkdiDiseaseDirectorySection() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<SkdiDiseaseSystem | null>(null)
  const [levelFilter, setLevelFilter] = useState<'all' | '4' | '3' | '2' | '1'>('all')
  // Bahasanya mengikuti pembacanya. "SKDI" dan "level 4A" adalah bahasa yang
  // DIUJIKAN kepada mahasiswa kedokteran — bagi mereka itu bukan jargon yang
  // boleh diganti. Bagi orang yang sekadar ingin tahu penyakitnya, keduanya
  // singkatan tanpa arti yang hanya menambah beban baca.
  const awam = modeAwam(useTujuan())
  const [expanded, setExpanded] = useState<string | null>(null)
  // Fetching the note corpus starts on the first expand, not on mount.
  const [wantNotes, setWantNotes] = useState(false)
  const noteData = useNoteData(wantNotes)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_DISEASE_LIST.filter((e) => {
      if (system && e.system !== system) return false
      if (levelFilter !== 'all' && !e.level.startsWith(levelFilter)) return false
      if (!q) return true
      /*
       * Cocokkan juga lewat SINONIM. Tanpa ini, mengetik 'Stroke',
       * 'Appendisitis', 'Kusta', atau 'Migrain' tidak memberi hasil apa pun,
       * sebab daftar resmi memakai 'Infark serebral', 'Apendisitis', 'Lepra',
       * dan 'Migren'. Bagi yang mencari, gagal menemukan karena beda ejaan
       * terasa sama saja dengan penyakitnya tidak ada.
       */
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
            ? `${SKDI_DISEASE_LIST.length} penyakit — apa penyakitnya, apa sebabnya, apa obatnya`
            : `${SKDI_DISEASE_LIST.length} penyakit/kondisi resmi, per Standar Kompetensi Dokter Indonesia (Konsil Kedokteran Indonesia)`}
        />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          {awam
            ? 'Ketuk satu penyakit untuk melihat petanya: sebab, tandanya, cara memastikan, obatnya, dan bahayanya.'
            : 'Referensi cepat: nama penyakit, sistem, dan level kompetensi. Penyakit yang sudah punya catatan station lengkap (anamnesis/PF/tatalaksana) ditandai badge "Catatan OSCE" — buka di tab OSCE Case Bank.'}
        </p>
        {awam && (
          <p className="mt-2 rounded-xl bg-amber-500/10 p-2.5 text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            <b>Dosis obat di sini untuk dibaca, bukan untuk dipakai sendiri.</b> Obat yang sama bisa
            berbahaya pada dosis yang sama bila ginjal, hati, kehamilan, atau obat lain yang sedang
            diminum berbeda. Bawa ini ke dokter untuk ditanyakan, jangan dibeli sendiri.
          </p>
        )}
        {wantNotes && !noteData && (
          <p className="mt-2 text-[12px] font-semibold text-brand-dark">Memuat catatan penyakit…</p>
        )}
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari penyakit (mis. malaria, hipertensi, katarak)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {/* Penyaring level kompetensi hanya berarti bagi yang diujikan
            dengannya. Untuk pembaca awam ia deretan tombol tanpa makna. */}
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

      {grouped.map(([sys, diseases]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{sys} · {diseases.length}</div>
          <div className="mt-2 space-y-2">
            {diseases.map((e, i) => {
              // The toggle is drawn from the lightweight key index, so it is
              // present before the corpus has been fetched; `note` fills in once
              // the fetch triggered by the first expand resolves.
              const hasNote = SKDI_NOTE_KEYS.has(e.disease)
              const note = resolveNote(e.disease, noteData)
              const isOpen = expanded === e.disease
              return (
                <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  {/* Nama penyakit mendapat satu barisnya sendiri; keterangan
                      dan lencana turun ke baris berikutnya.
                      Sebelumnya semuanya berdesakan dalam satu baris, dan pada
                      layar 390 px lencana "4A — Mandiri, tuntas" menyisakan
                      kolom judul selebar kira-kira 90 px — cukup untuk memecah
                      "Endokrin dan Metabolik" menjadi "dan" dan "Metabolik"
                      pada baris terpisah. Judulnya yang dicari mata saat
                      menelusuri daftar, jadi judul yang didahulukan. */}
                  <button
                    className="w-full text-left"
                    onClick={() => {
                      if (!hasNote) return
                      setWantNotes(true)
                      setExpanded(isOpen ? null : e.disease)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink dark:text-white">{e.disease}</span>
                      {hasNote && (
                        <span className="shrink-0">
                          <Badge tone="low">{isOpen ? 'Tutup ▲' : 'Catatan ▼'}</Badge>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {!awam && <Badge tone={levelTone(e.level)}>{levelLabel(e.level)}</Badge>}
                      {!awam && note?.kind === 'osce' && <Badge tone="brand">Catatan OSCE</Badge>}
                      {e.subsection && <span className="text-[11px] text-neutral-500">{e.subsection}</span>}
                    </div>
                  </button>
                  {isOpen && !note && (
                    <p className="mt-3 border-t border-neutral-200 pt-3 text-[12px] font-semibold text-brand-dark dark:border-white/10">
                      Memuat catatan…
                    </p>
                  )}
                  {isOpen && note && (
                    <div data-catatan className="mt-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                      {/* PEMBACAAN SUARA CATATAN INI.
                          Teksnya disusun dari cabang mindmap yang sama yang
                          digambar di bawah — bukan dari elemen di layar —
                          supaya urutan yang didengar sama persis dengan yang
                          dibaca, dan tidak ikut membacakan label tombol atau
                          nomor rujukan. */}
                      <div className="mb-2">
                        <PemutarBaca teks={teksCatatan(e.disease, cabangDari(note))} label="Dengarkan catatan" />
                      </div>
                      <Mindmap pusat={e.disease} sub={e.subsection ?? undefined} cabang={cabangDari(note)} />
                      {note.kind === 'osce' && (
                        <p className="mt-2 text-[10px] italic text-neutral-500">Dari station OSCE: {note.sourceStation}</p>
                      )}
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
      {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil — coba kata kunci lain.</p>}

      <div className="space-y-2 rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        {awam ? (
          <p>
            Halaman ini bahan bacaan, bukan diagnosis. Penyakit yang berbeda bisa memberi keluhan
            yang sama persis, dan hanya pemeriksaan langsung yang bisa membedakannya. Kalau ada
            keluhan, periksakan ke dokter.
          </p>
        ) : (
          <p>
            Nama penyakit dan level kompetensi berdasarkan SKDI 2012 (Konsil Kedokteran Indonesia).
            Level 4A/4B = harus tuntas mandiri saat lulus dokter, 3A/3B = bisa dengan supervisi,
            2 = pernah melihat, 1 = tahu teori.
          </p>
        )}
        <p>
          Isi klinis tiap catatan disusun dari ajaran klinis baku dan diselaraskan dengan pedoman
          terbit yang dicantumkan pada bagian Referensi di tiap entry — bukan kutipan verbatim dari
          satu dokumen tertentu. Selalu cross-check pedoman terkini sebelum penggunaan klinis.
        </p>
      </div>
    </div>
  )
}
