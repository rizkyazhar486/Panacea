import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconSearch, IconStethoscope } from '../components/icons'
import { api, type OntologyTerm, type DrugLabelInfo, type AnatomyImage, type ImageKind } from '../lib/api'
import { explainBodyRegion, explainDrug } from '../lib/ai'
import { useStore } from '../lib/store'
import { Body3D, ANATOMY_LAYERS, RENDER_MODES, CT_WINDOWS, MOTION_OFF, MOTION_REST, MOTION_EXERCISE, type AnatomyLayer, type RenderMode, type SlicePlane, type MotionState } from '../components/Body3D'
import { WORKOUT_MUSCLE_GROUPS } from '../lib/workoutMuscles'
import { TISSUE_TYPES, TISSUE_SUBTYPES, ORGAN_SYSTEMS, BODY_REGIONS, IMAGE_ONLY_STRUCTURES, type AnatomyEntry } from '../lib/anatomyHierarchy'
import { ORGAN_FOCUS } from '../lib/organFocus'
import { penjelasanTertulis } from '../lib/explainFallback'
import { IconChevronRight } from '../components/icons'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

// Bagian berat dimuat saat dibuka saja — pengguna yang cuma memutar model 3D
// tidak perlu ikut mengunduh tabel fisiologi dan pencarian obat.
const PhysiologySection = lazy(() => import('./bodyhub/PhysiologySection'))
const DrugSection = lazy(() => import('./bodyhub/DrugSection'))
const DiseaseSection = lazy(() => import('./bodyhub/DiseaseSection'))
const OrganDossier = lazy(() => import('./bodyhub/OrganDossier'))
const SimulatorSection = lazy(() => import('./bodyhub/SimulatorSection'))
// Ruang kardiovaskular: figur pembuluh tersendiri dengan aliran dan lesi, jadi
// dimuat hanya ketika tabnya dibuka — GLB-nya 3,6 MB.
const CardioLab = lazy(() => import('./bodyhub/CardioLab'))
// Ruang spesialisasi: dua belas modul anatomi bernama, dimuat per modul.
const SpecialtyLab = lazy(() => import('./bodyhub/SpecialtyLab'))
// Ruang molekul: geometri 3D obat, dibangkitkan RDKit dan diperiksa rumusnya.
const MolecularLab = lazy(() => import('./bodyhub/MolecularLab'))
const WorkoutSimSection = lazy(() => import('./bodyhub/WorkoutSimSection'))

// ─────────────────────────────────────────────────────────────────────────────
// Body Explorer — model 3D anatomi NYATA (lihat Body3D.tsx untuk sumber data
// dan lisensinya). Tap satu struktur (tulang/otot/pembuluh/saraf/organ) atau
// pilih target latihan otot untuk mendapat istilah NYATA dari dua ontologi
// kedokteran gratis (Human Disease Ontology + Human Phenotype Ontology, lewat
// EBI OLS4 di server) beserta penjelasan bahasa awam yang WAJIB mengutip
// istilah itu (lihat groundingBlock di lib/ai.ts). Tidak ada lagi tampilan
// siluet 2D — itu gambar skematik, bukan anatomi nyata.
// ─────────────────────────────────────────────────────────────────────────────

/** "Rectus femoris muscle.l" -> "rectus femoris muscle" (buang penanda sisi
 *  kiri/kanan supaya query ke ontologi tidak kebanyakan kata). */
function toSearchTerm(rawName: string): string {
  return rawName.replace(/\.[lr]$/, '').replace(/^\(|\)$/g, '').toLowerCase()
}

// Satu "pil" pilihan. Semua tombol pilihan di halaman ini bentuknya sama —
// dulu tiap deret menulis ulang kelasnya sendiri, dan itu yang membuat
// halaman terasa ramai: bentuk yang sama tampil sedikit berbeda-beda.
function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[34px] rounded-full border px-3 text-xs font-bold transition ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

// Empat deret pilihan (lapisan, otot, organ, referensi) dulu ditumpuk semua
// sekaligus, jadi viewer terdorong jauh ke atas layar dan halaman terasa
// panjang tanpa ujung. Sekarang keempatnya berbagi satu panel bertab: isinya
// tetap lengkap, yang terlihat sekaligus hanya satu.
// Satu model 3D, banyak cara memakainya. Semua tab di bawah berbagi viewer
// yang SAMA di atas layar: memilih otot latihan, organ, sistem faal, atau obat
// sama-sama menyorot struktur pada figur yang itu-itu juga. Itulah maksud
// "satu simulasi tubuh yang utuh" — bukan enam halaman yang saling menyebut,
// melainkan satu tubuh yang ditanyai dari enam sudut.
type PanelTab = 'layers' | 'muscles' | 'workout-sim' | 'organs' | 'physiology' | 'simulator' | 'cardio' | 'spesialisasi' | 'molekul' | 'drugs' | 'diseases' | 'reference'

const PANEL_TABS: Array<{ key: PanelTab; label: string }> = [
  { key: 'layers', label: 'Layers' },
  { key: 'muscles', label: 'Muscles' },
  { key: 'workout-sim', label: 'Workout' },
  { key: 'organs', label: 'Organs' },
  { key: 'physiology', label: 'Physiology' },
  { key: 'simulator', label: 'Simulator' },
  { key: 'cardio', label: 'Cardio lab' },
  { key: 'spesialisasi', label: 'Specialty labs' },
  { key: 'molekul', label: 'Molecules' },
  { key: 'drugs', label: 'Drugs' },
  { key: 'diseases', label: 'Diseases' },
  { key: 'reference', label: 'Study' },
]

const IMAGE_KINDS: Array<{ key: ImageKind; label: string }> = [
  { key: 'anatomy', label: 'Anatomy' },
  { key: 'xray', label: 'X-ray' },
  { key: 'ct', label: 'CT' },
  { key: 'mri', label: 'MRI' },
  { key: 'histology', label: 'Histology' },
  { key: 'pathology', label: 'Pathology' },
]

/** T1 dan T2 sama-sama mengambil citra MRI nyata — pembobotannya membedakan
 *  tampilan, bukan ada tidaknya arsipnya. */
function imageKindForMode(mode: RenderMode): ImageKind {
  if (mode === 'anatomy') return 'anatomy'
  if (mode === 'mriT1' || mode === 'mriT2') return 'mri'
  return mode
}

/**
 * Menampilkan penjelasan yang memakai penanda **tebal**.
 *
 * Sebelumnya teksnya dicetak mentah di satu <p>, sehingga "**What they do.**"
 * tampil apa adanya dengan bintangnya — penanda yang seharusnya menjadi
 * struktur justru menjadi sampah di layar. Penjelasan tertulis maupun balasan
 * model sama-sama memakai penanda ini, jadi keduanya perlu dirender.
 */
function Penjelasan({ teks }: { teks: string }) {
  return (
    <>
      {teks.split(/\n{2,}/).map((paragraf, i) => (
        <p key={i} className="text-sm leading-relaxed text-ink dark:text-white">
          {paragraf.split(/(\*\*[^*]+\*\*)/g).map((bagian, j) =>
            bagian.startsWith('**') && bagian.endsWith('**') ? (
              <strong key={j} className="font-bold">{bagian.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{bagian}</span>
            ),
          )}
        </p>
      ))}
    </>
  )
}

function TermList({ title, terms }: { title: string; terms: OntologyTerm[] }) {
  if (!terms.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{title}</div>
      <ul className="mt-1.5 space-y-1.5">
        {terms.map((t) => (
          <li key={t.id} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-ink dark:text-white">{t.label}</span>
              <span className="t-mikro shrink-0 font-mono text-neutral-400">{t.id}</span>
            </div>
            {t.description && <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{t.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Satu kelompok hierarki anatomi (jaringan / sistem organ / region tubuh)
// sebagai <details> yang bisa dibuka-tutup -- native, tanpa JS tambahan untuk
// animasi buka-tutupnya, konsisten dengan gaya ringan aplikasi ini.
function HierarchyGroup({
  title, entries, onPick, onView3d,
}: {
  title: string
  entries: AnatomyEntry[]
  onPick: (entry: AnatomyEntry) => void
  onView3d: (layer: AnatomyLayer['key']) => void
}) {
  return (
    <details className="group rounded-xl border border-neutral-200 dark:border-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-bold text-ink dark:text-white">
        {title}
        <IconChevronRight size={16} className="text-neutral-400 transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-1.5 border-t border-neutral-100 p-2.5 dark:border-white/5">
        {entries.map((e) => (
          <div key={e.key} className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/5">
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => onPick(e)} className="min-w-0 flex-1 text-left">
                <div className="text-sm font-bold text-ink dark:text-white">{e.label}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{e.description}</p>
              </button>
              {e.layer3d && (
                <button
                  onClick={() => onView3d(e.layer3d!)}
                  className="shrink-0 rounded-full border border-brand px-2.5 py-1 text-[10px] font-bold text-brand"
                >
                  View in 3D
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

export function BodyExplorer() {
  const { state } = useStore()
  const [loading, setLoading] = useState(false)
  const [diseases, setDiseases] = useState<OntologyTerm[]>([])
  const [phenotypes, setPhenotypes] = useState<OntologyTerm[]>([])
  const [explanation, setExplanation] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)

  const [layers, setLayers] = useState<Set<AnatomyLayer['key']>>(
    () => new Set(ANATOMY_LAYERS.filter((l) => l.defaultOn).map((l) => l.key)),
  )
  function toggleLayer(key: AnatomyLayer['key']) {
    setLayers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [activeWorkout, setActiveWorkout] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string[]>([])
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null)
  const [focusKeywords, setFocusKeywords] = useState<string[] | null>(null)
  const [images, setImages] = useState<AnatomyImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imageKind, setImageKind] = useState<ImageKind>('anatomy')

  // Modalitas pencitraan untuk model 3D. Mengubahnya juga mengganti citra
  // NYATA yang ditampilkan di bawah kalau ada struktur yang sedang dipilih —
  // memilih "CT" lalu masih melihat foto anatomi berwarna akan membingungkan.
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomy')
  const [panelTab, setPanelTab] = useState<PanelTab>('layers')
  // Hasil pencarian atlas bisa menunjuk ke ruang lain. Kedua nilai ini membawa
  // pilihannya menyeberang tab, supaya menekan hasil pencarian benar-benar
  // membuka apa yang ditunjuk dan bukan sekadar berpindah tab kosong.
  const [cardioAwal, setCardioAwal] = useState<string | null>(null)
  const [molekulAwal, setMolekulAwal] = useState<string | null>(null)
  // Kendali radiologi. Window CT dan bidang potong adalah dua hal yang
  // benar-benar diputar radiolog di stasiun kerja — bukan hiasan.
  const [ctWindowKey, setCtWindowKey] = useState(CT_WINDOWS[0].key)
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('none')
  const [slicePos, setSlicePos] = useState(0.5)

  // Gerak fisiologis. Tiga keadaan, bukan sakelar hidup/mati: perbedaan
  // antara istirahat dan latihan JUSTRU yang mengajarkan faalnya — denyut
  // dan napas yang sama-sama naik, dan otot yang mulai berkontraksi.
  const [motionMode, setMotionMode] = useState<'off' | 'rest' | 'exercise'>('off')
  // Laju dari simulator, kalau sedang dipakai. Ini yang membuat figurnya
  // benar-benar berdetak pada keadaan yang sedang dihitung — syok berdetak
  // cepat dan dangkal, bukan sekadar angka yang berubah di sebelahnya.
  const [simVitals, setSimVitals] = useState<{ hr: number; rr: number } | null>(null)
  // Tempo kontraksi dari simulator latihan, repetisi per menit.
  const [repTempo, setRepTempo] = useState(0)
  const dasarMotion: MotionState = simVitals
    ? { heartRate: simVitals.hr, respRate: simVitals.rr, contractionRate: 0 }
    : motionMode === 'rest' ? MOTION_REST
    : motionMode === 'exercise' ? MOTION_EXERCISE
    : MOTION_OFF
  // Simulator latihan menyetir tempo kontraksi otot yang sedang disorot,
  // tanpa mengganggu denyut & napas yang mungkin sedang disetir simulator faal.
  const motion: MotionState = repTempo > 0 ? { ...dasarMotion, contractionRate: repTempo } : dasarMotion
  // Lapisan yang perlu menyala agar gerak yang dipilih benar-benar KELIHATAN.
  // Menganimasikan struktur yang lapisannya mati sama saja dengan tidak
  // menganimasikan apa pun, dan orang akan menyimpulkan fiturnya rusak.
  const lapisanGerak: Array<AnatomyLayer['key']> = ['cardiovascular', 'visceral']
  // Organ yang isi klinisnya sedang terbuka. Diisi oleh KETUKAN pada figur 3D
  // maupun oleh tombol organ — keduanya masuk lewat pintu yang sama supaya
  // hasilnya identik, tidak peduli dari mana orang datang.
  const [clinicalOrgan, setClinicalOrgan] = useState<{ key: string; label: string } | null>(null)

  function pickRenderMode(mode: RenderMode) {
    setRenderMode(mode)
    if (!selectedLabel) return
    const kind = imageKindForMode(mode)
    if (kind !== imageKind) loadImages(selectedLabel, kind)
  }

  async function lookup(label: string, searchTerms: string[], kind?: ImageKind, rawNameUntukPenjelasan?: string) {
    // Kalau pemanggilnya tidak memaksa ragam citra tertentu (entri histologi
    // memaksa 'histology'), ikuti modalitas yang sedang aktif di model 3D —
    // menekan sebuah tulang saat mode CT menyala semestinya memunculkan
    // potongan CT, bukan ilustrasi berwarna.
    const effectiveKind: ImageKind = kind ?? imageKindForMode(renderMode)
    setSelectedLabel(label)
    setQuestion('')
    setLoading(true)
    // Penjelasan tertulis dipasang SEKARANG, bukan sesudah menunggu jaringan.
    // Halaman ini dulu menampilkan "No explanation was generated" begitu model
    // bahasa mati — pesan yang tidak memberi tahu apa pun dan tidak bisa
    // diperbaiki pembacanya. Sekarang isinya sudah ada sebelum AI dipanggil.
    setExplanation(penjelasanTertulis(label, rawNameUntukPenjelasan))
    setDiseases([])
    setPhenotypes([])
    setImages([])
    setImageKind(effectiveKind)
    // Gambar diambil paralel dan TIDAK ikut menggagalkan lookup kalau
    // sumbernya sedang tidak bisa dijangkau — istilah ontologinya tetap muncul.
    loadImages(label, effectiveKind)
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology(searchTerms)
      setDiseases(d)
      setPhenotypes(p)
      const text = await explainBodyRegion(state.settings, label, d, p)
      // Teks AI hanya dipakai kalau ia benar-benar menambah sesuatu. Balasan
      // kosong maupun pesan kegagalannya sendiri TIDAK boleh menghapus
      // penjelasan tertulis yang sudah terpasang.
      if (text && !/No explanation was generated|isn't available right now|Too many requests/i.test(text)) {
        setExplanation(text)
      }
    } catch {
      // Ontologi gagal tidak berarti halamannya kosong — penjelasan tertulis
      // tetap berdiri sendiri.
    } finally {
      setLoading(false)
    }
  }

  async function loadImages(term: string, kind: ImageKind) {
    setImagesLoading(true)
    setImageKind(kind)
    try {
      const { images: imgs } = await api.anatomyImages(term, kind)
      setImages(imgs)
    } catch {
      setImages([])
    } finally {
      setImagesLoading(false)
    }
  }

  // Tap langsung pada satu struktur di model 3D (tulang/otot/pembuluh/
  // saraf/organ spesifik, bukan hanya sistemnya). Layer-nya sudah pasti
  // menyala (raycast cuma mengenai apa yang sedang terlihat), jadi tidak
  // perlu memaksa lapisan tertentu di sini.
  function onPickStructure(rawName: string, label: string) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted([rawName])
    // Struktur yang disentuh dicocokkan balik ke katalog organ lewat kata
    // kuncinya, supaya mengetuk "Inferior lobe of left lung" langsung membuka
    // penyakit dan obat PARU — bukan menyuruh orang mengetik "lung" dulu.
    const n = rawName.toLowerCase()
    const cocok = ORGAN_FOCUS.find((o) => o.keywords.some((k) => n.includes(k.trim().toLowerCase())))
    setClinicalOrgan(cocok ? { key: cocok.key, label: cocok.label } : null)
    lookup(label, [toSearchTerm(rawName)], undefined, rawName)
  }

  function onPickWorkoutMuscle(groupKey: string) {
    const group = WORKOUT_MUSCLE_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    setActiveWorkout(groupKey)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted(group.nodeNames)
    if (!layers.has('muscular')) toggleLayer('muscular')
    lookup(`${group.label} muscles`, group.searchTerms)
  }

  // Satu organ utama dipilih -- menyalakan lapisan 3D yang relevan, menyorot
  // & memperbesar (zoom) ke organ itu lewat kecocokan kata kunci nama nyata
  // (lihat organFocus.ts untuk kenapa substring, bukan nama persis).
  function onPickOrgan(organKey: string) {
    const organ = ORGAN_FOCUS.find((o) => o.key === organKey)
    if (!organ) return
    setActiveWorkout(null)
    setHighlighted([])
    setActiveOrgan(organKey)
    setFocusKeywords(organ.keywords)
    if (!layers.has(organ.layer)) toggleLayer(organ.layer)
    setClinicalOrgan({ key: organ.key, label: organ.label })
    lookup(organ.label, organ.searchTerms)
  }

  // Satu entri hierarki anatomi (jaringan/sistem organ/region tubuh) diklik —
  // tidak menyorot satu struktur 3D spesifik (levelnya lebih umum dari itu),
  // tapi tetap mengambil istilah ontologi nyata untuk level tersebut.
  function onPickHierarchyEntry(entry: AnatomyEntry) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted([])
    lookup(entry.label, entry.searchTerms, entry.imageKind ?? 'anatomy')
  }

  function onViewLayer3d(layer: AnatomyLayer['key']) {
    if (!layers.has(layer)) toggleLayer(layer)
  }

  // Obat memilih struktur lewat KATA KUNCI (tempat kerjanya bisa tersebar di
  // beberapa organ sekaligus), dan lapisan yang memuatnya dinyalakan dulu —
  // menyorot ginjal saat lapisan Organs mati berarti tidak menyorot apa pun.
  function onHighlightSites(keywords: string[], perluLayer: Array<AnatomyLayer['key']>) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setHighlighted([])
    setFocusKeywords(keywords.length ? keywords : null)
    if (perluLayer.length) {
      setLayers((prev) => {
        const next = new Set(prev)
        for (const l of perluLayer) next.add(l)
        return next
      })
    }
  }

  // Satu sistem faal dibuka — lapisannya dinyalakan dan istilah/gambarnya
  // diambil, sama seperti entri anatomi mana pun.
  function onPickSystem(layer: AnatomyLayer['key'] | undefined, searchTerms: string[], label: string) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setHighlighted([])
    setFocusKeywords(null)
    if (layer && !layers.has(layer)) toggleLayer(layer)
    lookup(label, searchTerms)
  }

  // "Ask" — pencarian bebas (bahasa natural atau gejala/fungsi). Kalau
  // pertanyaannya cocok dengan salah satu target latihan otot, otot itu ikut
  // disorot di model 3D.
  async function ask() {
    const q = question.trim()
    if (!q) return
    setAsking(true)
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted([])
    setSelectedLabel(q)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology([q])
      setDiseases(d)
      setPhenotypes(p)
      const matchedGroup = WORKOUT_MUSCLE_GROUPS.find((g) =>
        q.toLowerCase().includes(g.label.toLowerCase()) || g.searchTerms.some((t) => q.toLowerCase().includes(t)),
      )
      const matchedOrgan = ORGAN_FOCUS.find((o) => q.toLowerCase().includes(o.label.toLowerCase()))
      if (matchedGroup) {
        setActiveWorkout(matchedGroup.key)
        setHighlighted(matchedGroup.nodeNames)
        if (!layers.has('muscular')) toggleLayer('muscular')
      } else if (matchedOrgan) {
        setActiveOrgan(matchedOrgan.key)
        setFocusKeywords(matchedOrgan.keywords)
        if (!layers.has(matchedOrgan.layer)) toggleLayer(matchedOrgan.layer)
      }
      const text = await explainBodyRegion(state.settings, q, d, p)
      setExplanation(text)
    } catch {
      setExplanation('Could not reach the ontology service right now. Please try again in a moment.')
    } finally {
      setAsking(false)
    }
  }

  const [drugQuery, setDrugQuery] = useState('')
  const [drugLoading, setDrugLoading] = useState(false)
  const [drugInfo, setDrugInfoState] = useState<DrugLabelInfo | null>(null)
  const [drugExplanation, setDrugExplanation] = useState('')
  const [drugError, setDrugError] = useState('')

  async function lookupDrug() {
    const name = drugQuery.trim()
    if (!name) return
    setDrugLoading(true)
    setDrugError('')
    setDrugInfoState(null)
    setDrugExplanation('')
    try {
      const info = await api.drugInfo(name)
      setDrugInfoState(info)
      const text = await explainDrug(state.settings, info)
      setDrugExplanation(text)
    } catch {
      setDrugError(`No FDA label found for "${name}" — try the generic or brand name spelled exactly (e.g. "ibuprofen", "metformin").`)
    } finally {
      setDrugLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Body Explorer"
        subtitle="A real 3D anatomy model — tap any bone, muscle, vessel, nerve, or organ"
      />
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about anatomy, a symptom, or a disease…"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="liquid-glass-btn liquid-glass-btn--primary flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {asking ? 'Asking…' : 'Ask'}
          </button>
        </form>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
          Ask in your own words — e.g. "where is the median nerve", "symptoms of liver disease", "what does the
          pancreas do". Real anatomical structures light up in green on the model when a match is found.
        </p>

        <Body3D
          layers={layers}
          highlighted={highlighted}
          focusKeywords={focusKeywords}
          renderMode={renderMode}
          ctWindow={CT_WINDOWS.find((w) => w.key === ctWindowKey) ?? CT_WINDOWS[0]}
          slicePlane={slicePlane}
          slicePos={slicePos}
          motion={motion}
          onPick={onPickStructure}
        />

        {/* Modalitas pencitraan — deret tunggal tepat di bawah viewer, karena
            inilah yang paling sering diganti saat mengamati satu struktur. */}
        <div className="mt-2.5 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
          {RENDER_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => pickRenderMode(m.key)}
              className={`min-h-[34px] flex-1 rounded-lg text-xs font-bold transition ${
                renderMode === m.key
                  ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-neutral-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[10.5px] leading-relaxed text-neutral-400">
          {RENDER_MODES.find((m) => m.key === renderMode)?.hint}
        </p>

        {/* Gerak fisiologis — irama nyata pada figur yang sama. */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {([
              { key: 'off', label: 'Still' },
              { key: 'rest', label: 'Resting' },
              { key: 'exercise', label: 'Exercising' },
            ] as Array<{ key: 'off' | 'rest' | 'exercise'; label: string }>).map((m) => (
              <button
                key={m.key}
                onClick={() => { setSimVitals(null); setMotionMode(m.key) }}
                className={`min-h-[30px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                  motionMode === m.key
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {simVitals && (
            <p className="mt-1 text-center text-[10px] leading-relaxed text-brand">
              Driven by the simulator — the figure is beating at {simVitals.hr}/min and breathing at {simVitals.rr}/min.
            </p>
          )}
          {motionMode !== 'off' && !layers.has('cardiovascular') && !layers.has('visceral') && (
            <button
              onClick={() => setLayers((prev) => { const n = new Set(prev); for (const l of lapisanGerak) n.add(l); return n })}
              className="mt-1 w-full rounded-full border border-brand px-2.5 py-1 text-[11px] font-bold text-brand"
            >
              Turn on Vessels &amp; Organs to see it move →
            </button>
          )}
          {motionMode !== 'off' && (layers.has('cardiovascular') || layers.has('visceral')) && (
            <p className="mt-1 text-center text-[10px] leading-relaxed text-neutral-400">
              The arteries pulse a fraction of a second AFTER the heart — the pulse wave travels at about 5 m/s, so
              the ankle beats later than the chest. The gut squeezes as a travelling wave, not all at once.
            </p>
          )}
          {!simVitals && motionMode !== 'off' && (
            <p className="mt-1 text-center text-[10px] leading-relaxed text-neutral-400">
              Heart {motion.heartRate}/min · breathing {motion.respRate}/min
              {motion.contractionRate > 0 && ` · highlighted muscle contracting ${motion.contractionRate}/min`}
              {(motion.peristalsisRate ?? 0) > 0 && ` · gut peristalsis ${motion.peristalsisRate}/min`}
            </p>
          )}
        </div>

        {/* Window CT: mengubahnya mengubah apa yang KELIHATAN dari data yang
            sama, persis seperti di konsol. Itu keterampilan yang dilatih. */}
        {renderMode === 'ct' && (
          <div className="mt-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {CT_WINDOWS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setCtWindowKey(w.key)}
                  className={`min-h-[30px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                    ctWindowKey === w.key
                      ? 'border-brand bg-brand text-white'
                      : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-center text-[10px] text-neutral-400">
              W{CT_WINDOWS.find((w) => w.key === ctWindowKey)?.width} /
              L{CT_WINDOWS.find((w) => w.key === ctWindowKey)?.level} HU — window width and level, as on a CT console
            </p>
          </div>
        )}

        {/* Bidang potong. CT dan MRI dibaca sebagai irisan, bukan sebagai
            permukaan 3D — tanpa ini modenya cuma pewarnaan. */}
        {(renderMode === 'ct' || renderMode === 'mriT1' || renderMode === 'mriT2') && (
          <div className="mt-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {([
                { key: 'none', label: 'Whole body' },
                { key: 'axial', label: 'Axial' },
                { key: 'coronal', label: 'Coronal' },
                { key: 'sagittal', label: 'Sagittal' },
              ] as Array<{ key: SlicePlane; label: string }>).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSlicePlane(p.key)}
                  className={`min-h-[30px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                    slicePlane === p.key
                      ? 'border-brand bg-brand text-white'
                      : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {slicePlane !== 'none' && (
              <div className="mt-1.5 px-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={slicePos}
                  onChange={(e) => setSlicePos(Number(e.target.value))}
                  aria-label="Slice level"
                  className="w-full accent-[var(--brand,#00bf63)]"
                />
                <p className="text-center text-[10px] text-neutral-400">
                  Slice level — drag to move through the body, the way a scan is scrolled
                </p>
              </div>
            )}
          </div>
        )}

        <p className="mt-1.5 text-center text-[10px] leading-relaxed text-neutral-400">
          {renderMode !== 'anatomy' &&
            'Greyscale is computed from standard tissue values (Hounsfield units for CT, relative T1/T2 signal for MRI) — a rendering of real geometry, not a scan of a patient. Real radiographs and scan slices are in the image tabs.'}
        </p>
        <p className="mt-1 text-center text-[10px] text-neutral-400">
          Drag to rotate · scroll or pinch to zoom · tap any structure to identify it
        </p>

        {/* Hasil ketukan organ muncul TEPAT DI SINI — di bawah figur, di atas
            deret tab. Kalau ia diletakkan setelah tab, orang harus menggulir
            melewati seluruh panel kendali untuk melihat akibat ketukannya
            sendiri, dan itu terbaca seolah ketukannya tidak melakukan apa-apa. */}
        {clinicalOrgan && (
          <div className="mt-3 rounded-2xl border border-brand/30 bg-brand/[0.03] p-3 dark:bg-brand/[0.07]">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="t-mikro font-bold uppercase tracking-wide text-brand">Full dossier</div>
                <h3 className="text-base font-black text-ink dark:text-white">{clinicalOrgan.label}</h3>
              </div>
              <button
                onClick={() => setClinicalOrgan(null)}
                className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-500 dark:border-white/10"
              >
                Close
              </button>
            </div>
            <Suspense fallback={<p className="text-sm text-neutral-500">Opening clinical notes…</p>}>
              <OrganDossier
                organKey={clinicalOrgan.key}
                organLabel={clinicalOrgan.label}
                onLocate={(keywords, layer) => onHighlightSites(keywords, [layer])}
              />
            </Suspense>
          </div>
        )}

        {/* Satu panel bertab menggantikan empat deret pilihan yang dulu
            ditumpuk sekaligus. Isinya sama persis, cuma tidak semuanya
            berteriak bersamaan. */}
        <div className="mt-4">
          {/* Tujuh tab tidak muat dibagi rata di layar 390px — dipaksa
              flex-1 membuat halamannya menggulir ke samping, dan itu terukur:
              scrollWidth 427 pada clientWidth 390. Jadi barisnya digulirkan
              sendiri secara mendatar dan tiap tab memakai lebar teksnya. */}
          <div className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
            {PANEL_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setPanelTab(t.key)}
                className={`min-h-[34px] shrink-0 rounded-lg px-3 text-xs font-bold transition ${
                  panelTab === t.key
                    ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white'
                    : 'text-neutral-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {panelTab === 'layers' && (
              <>
                <p className="mb-1.5 text-[11px] text-neutral-400">
                  Turn body systems on or off. Only what you can see can be tapped.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ANATOMY_LAYERS.map((l) => (
                    <Chip key={l.key} active={layers.has(l.key)} onClick={() => toggleLayer(l.key)}>
                      {l.label}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {panelTab === 'muscles' && (
              <>
                <p className="mb-1.5 text-[11px] text-neutral-400">
                  Pick the muscle group a workout targets — every muscle in it lights up on the model.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {WORKOUT_MUSCLE_GROUPS.map((g) => (
                    <Chip key={g.key} active={activeWorkout === g.key} onClick={() => onPickWorkoutMuscle(g.key)}>
                      {g.label}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {panelTab === 'workout-sim' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading workout simulator…</p>}>
                <WorkoutSimSection
                  onHighlight={(nodes) => {
                    setActiveWorkout(null)
                    setActiveOrgan(null)
                    setFocusKeywords(null)
                    setHighlighted(nodes)
                    if (nodes.length && !layers.has('muscular')) toggleLayer('muscular')
                  }}
                  onTempo={setRepTempo}
                />
              </Suspense>
            )}

            {panelTab === 'organs' && (
              <>
                <p className="mb-1.5 text-[11px] text-neutral-400">
                  Zooms in on that organ specifically and highlights every part of it.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ORGAN_FOCUS.map((o) => (
                    <Chip key={o.key} active={activeOrgan === o.key} onClick={() => onPickOrgan(o.key)}>
                      {o.label}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {panelTab === 'physiology' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading physiology…</p>}>
                <PhysiologySection onPickSystem={onPickSystem} />
              </Suspense>
            )}

            {panelTab === 'simulator' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading simulator…</p>}>
                <SimulatorSection
                  onVitals={(hr, rr) => {
                    setSimVitals({ hr, rr })
                    // Lapisan jantung & paru dinyalakan, kalau tidak simulasinya
                    // menggerakkan struktur yang tidak terlihat.
                    setLayers((prev) => new Set(prev).add('cardiovascular').add('visceral'))
                  }}
                />
              </Suspense>
            )}

            {panelTab === 'cardio' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading the cardiovascular lab…</p>}>
                <CardioLab onBukaOrgan={onPickOrgan} awal={cardioAwal} key={cardioAwal ?? 'cardio'} />
              </Suspense>
            )}

            {panelTab === 'spesialisasi' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading the specialty atlas…</p>}>
                <SpecialtyLab
                  onBukaOrgan={onPickOrgan}
                  onBukaCardio={(id) => { setCardioAwal(id || null); setPanelTab('cardio') }}
                  onBukaObat={(id) => { setMolekulAwal(id); setPanelTab('molekul') }}
                />
              </Suspense>
            )}

            {panelTab === 'molekul' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading the molecular lab…</p>}>
                <MolecularLab onBukaOrgan={onPickOrgan} awal={molekulAwal} key={molekulAwal ?? 'molekul'} />
              </Suspense>
            )}

            {panelTab === 'drugs' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading drug bank…</p>}>
                <DrugSection onHighlightSites={onHighlightSites} />
              </Suspense>
            )}

            {panelTab === 'diseases' && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Loading diagnosis search…</p>}>
                <DiseaseSection onPickDiagnosis={(title) => lookup(title, [title])} />
              </Suspense>
            )}

            {panelTab === 'reference' && (
              <div className="space-y-2">
                <HierarchyGroup title="Tissue types (4)" entries={TISSUE_TYPES} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
                <HierarchyGroup title="Tissues under the microscope (23)" entries={TISSUE_SUBTYPES} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
                <HierarchyGroup title="Organ systems (11)" entries={ORGAN_SYSTEMS} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
                <HierarchyGroup title="Body regions (8)" entries={BODY_REGIONS} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
                <HierarchyGroup
                  title="Female reproductive & skin"
                  entries={IMAGE_ONLY_STRUCTURES}
                  onPick={onPickHierarchyEntry}
                  onView3d={onViewLayer3d}
                />
                {/* Catatan & kurikulum kedokteran tetap tinggal di Med Study
                    Hub — isinya ratusan kilobyte dan tidak pantas ikut termuat
                    tiap kali orang memutar model 3D. Yang digabung di sini
                    adalah PINTUNYA, tepat di sebelah anatominya. */}
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-2.5 dark:bg-brand/10">
                  <div className="text-sm font-bold text-ink dark:text-white">Notes &amp; curriculum</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                    Disease notes, therapy reference, OSCE stations and the preclinical curriculum, opened straight
                    at the section you need.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[
                      { to: '/med-study?bagian=diseases', label: 'Disease notes' },
                      { to: '/med-study?bagian=therapy', label: 'Therapy reference' },
                      { to: '/med-study?bagian=usmle', label: 'Preclinical curriculum' },
                      { to: '/med-study?bagian=osce', label: 'OSCE' },
                      { to: '/med-study?bagian=practice', label: 'Question bank' },
                    ].map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        className="rounded-full border border-brand px-2.5 py-1 text-[11px] font-bold text-brand"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <p className="px-1 text-[10.5px] leading-relaxed text-neutral-400">
                  These structures have no geometry in the 3D dataset — female reproductive anatomy is absent from
                  BodyParts3D entirely, and skin is deliberately stripped so the anatomy beneath it is visible. They
                  are covered here with real anatomical terms (UBERON/FMA) and freely-licensed images instead.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          {!selectedLabel && (
            <p className="text-sm leading-relaxed text-neutral-500">
              Tap a structure on the model, pick a workout target, browse the anatomy reference above, or ask a
              question — and get a plain-language explanation grounded in real ontology terms, not a diagnosis for
              you personally.
            </p>
          )}
          {selectedLabel && (
            <div className="space-y-3">
              <h3 className="text-base font-black capitalize text-ink dark:text-white">{selectedLabel}</h3>
              {(loading || asking) && <p className="text-sm text-neutral-500">Looking up ontology terms…</p>}
              {!loading && !asking && explanation && (
                <div className="space-y-1.5 rounded-xl bg-brand/5 p-3 dark:bg-brand/10">
                  <Penjelasan teks={explanation} />
                </div>
              )}
              {!loading && !asking && (
                <>
                  <TermList title="Related diseases (DOID)" terms={diseases} />
                  <TermList title="Related symptoms (HPO)" terms={phenotypes} />
                  {!diseases.length && !phenotypes.length && (
                    <p className="text-sm text-neutral-500">No ontology terms were found for this.</p>
                  )}
                </>
              )}

              <div>
                <div className="t-mikro mb-1 font-bold uppercase tracking-wide text-neutral-500">Real images</div>
                {/* Enam ragam citra NYATA untuk struktur yang sedang dipilih.
                    Tiga di antaranya radiologi — inilah pasangan dari mode
                    radiologi pada model 3D: bentuknya dipelajari di model,
                    tampilan asli modalitasnya dipelajari di sini. */}
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {IMAGE_KINDS.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => loadImages(selectedLabel, k.key)}
                      className={`min-h-[30px] shrink-0 rounded-full border px-2.5 text-[11px] font-bold transition ${
                        imageKind === k.key
                          ? 'border-brand bg-brand text-white'
                          : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                {imagesLoading && <p className="mt-1.5 text-sm text-neutral-500">Loading images…</p>}
                {!imagesLoading && images.length === 0 && (
                  <p className="mt-1.5 text-sm text-neutral-500">No freely-licensed images found for this.</p>
                )}
                {!imagesLoading && images.length > 0 && (
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {images.map((img) => (
                      <figure key={img.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
                        <img src={img.url} alt={img.title} loading="lazy" className="h-32 w-full bg-white object-contain" />
                        {/* Lisensi & pembuat WAJIB tampil — syarat CC, bukan hiasan. */}
                        <figcaption className="p-1.5">
                          <div className="line-clamp-2 text-[11px] font-semibold text-ink dark:text-white">{img.title}</div>
                          <a
                            href={img.sourcePage}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-[10px] text-neutral-400 underline"
                          >
                            {img.artist} · {img.license}
                          </a>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Empat paragraf sumber & sangkalan dulu tergelar penuh di kaki
            halaman dan itu bagian paling berisik dari layar ini. Atribusi CC
            tetap WAJIB ada, tapi tidak wajib selalu terbuka — di sini masih
            satu ketukan dari tempat gambarnya muncul, dan lisensi tiap berkas
            tetap tercetak pada gambarnya masing-masing. */}
        <details className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-bold text-neutral-500">
            Sources, licences &amp; medical disclaimer
          </summary>
          <div className="space-y-1.5 border-t border-neutral-100 p-3 dark:border-white/5">
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Disease and symptom terms are retrieved live from the Human Disease Ontology and Human Phenotype
              Ontology via EBI's public Ontology Lookup Service (OLS4) — general medical reference data, not a
              diagnosis. Always consult a licensed clinician about your own symptoms.
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              3D anatomy model: <a href={`${import.meta.env.BASE_URL}anatomy/CREDITS.txt`} target="_blank" rel="noreferrer" className="underline">Z-Anatomy</a>,
              based on BodyParts3D — licensed under CC BY-SA 4.0.
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              The X-ray, CT and MRI options recolour that same 3D model to match how each modality sees tissue. They
              are renderings, not scans: the shapes are real, the greyscale is an approximation. The X-ray, CT and
              MRI image tabs below a selected structure show genuine radiographs and scan slices.
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Anatomy, radiology, histology and pathology images come from <a href="https://commons.wikimedia.org" target="_blank" rel="noreferrer" className="underline">Wikimedia Commons</a> —
              public-domain or Creative Commons files, each shown with its own author and licence. They are teaching
              images from a public archive, not photographs of you or of any patient of this clinic.
            </p>
          </div>
        </details>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconStethoscope />}
          title="Medicine Lookup"
          subtitle="How a medicine works, which organ it acts on, and its side effects — from the official FDA label"
        />
        <form
          onSubmit={(e) => { e.preventDefault(); lookupDrug() }}
          className="mt-3 flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={drugQuery}
              onChange={(e) => setDrugQuery(e.target.value)}
              placeholder="e.g. ibuprofen, metformin, amlodipine…"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={drugLoading || !drugQuery.trim()}
            className="liquid-glass-btn liquid-glass-btn--primary flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {drugLoading ? 'Looking up…' : 'Search'}
          </button>
        </form>

        {drugError && <p className="mt-3 text-sm text-neutral-500">{drugError}</p>}

        {drugInfo && (
          <div className="mt-4 space-y-3">
            <h3 className="text-base font-black text-ink dark:text-white">
              {drugInfo.brandName}
              {drugInfo.genericName && drugInfo.genericName.toLowerCase() !== drugInfo.brandName.toLowerCase() && (
                <span className="ml-1.5 text-sm font-semibold text-neutral-500">({drugInfo.genericName})</span>
              )}
            </h3>
            {drugExplanation && (
              <p className="rounded-xl bg-brand/5 p-3 text-sm leading-relaxed text-ink dark:bg-brand/10 dark:text-white">
                {drugExplanation}
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {drugInfo.purpose && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Purpose</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.purpose}</p>
                </div>
              )}
              {drugInfo.mechanismOfAction && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Mechanism of action</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.mechanismOfAction}</p>
                </div>
              )}
              {drugInfo.adverseReactions && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Adverse reactions</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.adverseReactions}</p>
                </div>
              )}
              {drugInfo.warnings && (
                <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-500/10">
                  <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Warnings</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{drugInfo.warnings}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          Drug information is retrieved live from the official FDA drug label via openFDA — general reference
          information, not medical advice. Always follow your prescriber's instructions and the physical package
          insert; ask a doctor or pharmacist about your own medications and doses.
        </p>
      </Card>
    </div>
  )
}

export default BodyExplorer
