import { SKDI_DISEASE_LIST, type SkdiDiseaseSystem } from './skdiDiseaseList'
import { SKDI_DISEASE_NOTES, type SkdiDiseaseNote } from './skdiDiseaseNotes'
import { semuaObat, dosisSkdi } from './obatKatalog'

// ─────────────────────────────────────────────────────────────────────────────
// Ketuk satu organ pada figur 3D -> penyakitnya dan obatnya langsung terbuka.
//
// INI BUKAN KOTAK PENCARIAN. Tidak ada yang perlu diketik: struktur yang
// disentuh sudah menentukan apa yang ditampilkan. Kotak cari menuntut orang
// SUDAH tahu nama apa yang dicari — padahal yang sedang dipelajari justru
// nama-nama itu.
//
// SUMBER ISINYA ADALAH CATATAN YANG SUDAH ADA DI REPO INI, bukan korpus baru:
//   - skdiDiseaseList.ts  : daftar resmi SKDI 2012 + level kompetensinya.
//   - skdiDiseaseNotes.ts : ~26.000 baris catatan klinis yang sudah ditulis
//                           (definisi, patofisiologi, gold standard, dst).
//   - obatKatalog.ts      : zat aktif + golongan + indikasinya.
// Yang baru di berkas ini HANYA PEMETAANNYA: organ mana memuat penyakit yang
// mana. Menulis ulang isinya berarti membuat korpus kedua yang akan
// bercabang diam-diam dari yang pertama.
//
// CARA PEMETAANNYA, dan kenapa dua lapis. Sistem SKDI terlalu kasar sendirian:
// "Gastrointestinal & Hepatobilier" memuat penyakit hati, lambung, usus, dan
// empedu sekaligus, sedangkan yang diketuk orang adalah SATU organ. Jadi tiap
// organ membawa (1) sistem SKDI-nya sebagai penyaring kasar, lalu (2) kata
// kunci nama penyakit sebagai penyaring halus. Penyakit yang tidak lolos
// keduanya tidak ditampilkan — lebih baik daftarnya pendek dan benar.
// ─────────────────────────────────────────────────────────────────────────────

/** Tingkat kedalaman pembaca. Menentukan BERAPA BANYAK yang ditampilkan dari
 *  catatan yang sama — bukan menampilkan isi yang berbeda-beda. */
export type Audience = 'awam' | 'student' | 'professional' | 'specialist'

export const AUDIENCES: Array<{ key: Audience; label: string; hint: string }> = [
  { key: 'awam', label: 'Public', hint: 'Plain language — what it is and what to do' },
  { key: 'student', label: 'Student', hint: 'Definition, diagnosis, management — exam level' },
  { key: 'professional', label: 'Professional', hint: 'Mechanism, gold standard, differentials, prognosis, sources' },
  { key: 'specialist', label: 'Specialist', hint: 'Full workup, supportive care, complications, live literature' },
]

export interface OrganPenyakit {
  nama: string
  system: SkdiDiseaseSystem
  /** Level kompetensi SKDI (1, 2, 3A, 3B, 4A) — 4A = harus tuntas ditangani. */
  level: string
  subsection: string | null
  /** Catatan klinisnya kalau sudah ditulis. Tidak semua nama punya catatan. */
  note?: SkdiDiseaseNote
}

export interface OrganObat {
  nama: string
  kelas: string
  untuk: string
  eml?: boolean
  catatan?: string
  /** Kelompok ATC-nya menurut katalog — huruf pertamanya kelompok anatomi. */
  golongan: string
  /** Dosis dari korpus SKDI kalau ada. Kosong berarti memang tidak ada, dan
   *  dikosongkan; tidak pernah ditebak. */
  dosis: Array<{ keluhan: string; golongan: string; dosis: string }>
}

interface PetaOrgan {
  /** Sistem SKDI yang memuat organ ini. */
  systems: SkdiDiseaseSystem[]
  /** Penyaring halus: nama penyakit HARUS memuat salah satu kata ini. Kalau
   *  kosong, seluruh isi sistemnya dipakai (benar untuk organ yang memang
   *  identik dengan sistemnya, mis. jantung terhadap Kardiovaskular). */
  kata?: string[]
  /** Kata kunci untuk memilih obat dari katalog — dicocokkan ke kelas & indikasi. */
  obat: string[]
}

const PETA: Record<string, PetaOrgan> = {
  heart: { systems: ['Kardiovaskular'], obat: ['jantung', 'antihipertensi', 'antiaritmia', 'gagal jantung', 'angina', 'beta', 'ace', 'diuretik'] },
  lungs: { systems: ['Respirasi'], obat: ['asma', 'ppok', 'bronko', 'paru', 'batuk', 'tuberkulosis'] },
  liver: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['hepat', 'hati', 'sirosis', 'ikterus', 'kolestasis', 'abses hati'], obat: ['hepatitis', 'sirosis', 'ensefalopati hepatik', 'hepatoprotektor'] },
  stomach: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['gaster', 'lambung', 'gastritis', 'ulkus', 'dispepsia', 'refluks', 'gerd', 'esofag'], obat: ['lambung', 'asam lambung', 'antasida', 'ulkus'] },
  'small-intestine': { systems: ['Gastrointestinal & Hepatobilier'], kata: ['duoden', 'usus halus', 'malabsorpsi', 'celiac', 'cacing', 'ileus', 'intoleransi'], obat: ['cacing', 'diare'] },
  'large-intestine': { systems: ['Gastrointestinal & Hepatobilier'], kata: ['kolon', 'usus besar', 'kolitis', 'disentri', 'diare', 'konstipasi', 'hemoroid', 'apendis', 'rektum', 'irritable'], obat: ['diare', 'konstipasi', 'laksatif'] },
  pancreas: { systems: ['Gastrointestinal & Hepatobilier', 'Endokrin & Metabolik'], kata: ['pankrea', 'diabetes'], obat: ['diabetes', 'insulin', 'glikemik'] },
  gallbladder: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['kolesist', 'empedu', 'kolelitiasis', 'koledok', 'kolangitis'], obat: ['empedu'] },
  kidneys: { systems: ['Ginjal & Saluran Kemih'], kata: ['ginjal', 'nefr', 'glomerul', 'renal', 'pielonefritis', 'batu'], obat: ['ginjal', 'diuretik'] },
  bladder: { systems: ['Ginjal & Saluran Kemih'], kata: ['kandung kemih', 'sistitis', 'uretr', 'inkontinensia', 'kemih'], obat: ['saluran kemih', 'infeksi kemih'] },
  prostate: { systems: ['Ginjal & Saluran Kemih', 'Reproduksi & Obstetri'], kata: ['prostat'], obat: ['prostat'] },
  testis: { systems: ['Reproduksi & Obstetri'], kata: ['testis', 'skrotum', 'varikokel', 'hidrokel', 'epididim', 'torsio'], obat: [] },
  spleen: { systems: ['Hematologi & Imunologi'], kata: ['limpa', 'splen', 'anemia', 'talasemia', 'hemolitik'], obat: ['anemia', 'besi'] },
  'lymph-nodes': { systems: ['Hematologi & Imunologi'], obat: ['imun', 'alergi', 'kortikosteroid'] },
  thyroid: { systems: ['Endokrin & Metabolik'], kata: ['tiroid', 'gondok', 'struma', 'hipertiroid', 'hipotiroid'], obat: ['tiroid'] },
  adrenal: { systems: ['Endokrin & Metabolik'], kata: ['adrenal', 'cushing', 'addison', 'kortisol'], obat: ['kortikosteroid'] },
  pituitary: { systems: ['Endokrin & Metabolik'], kata: ['hipofisis', 'pituitari', 'akromegali', 'prolaktin', 'diabetes insipidus'], obat: [] },
  brain: { systems: ['Saraf (Neurologi)', 'Psikiatri'], obat: ['epilepsi', 'kejang', 'nyeri kepala', 'depresi', 'ansietas', 'psikosis', 'antipsikotik', 'antidepresan'] },
  'spinal-cord': { systems: ['Saraf (Neurologi)'], kata: ['medula spinalis', 'mielitis', 'spina', 'radikulopati', 'hernia nukleus', 'saraf tepi', 'neuropati'], obat: ['nyeri neuropatik'] },
  eye: { systems: ['Indera'], kata: ['mata', 'konjungtiv', 'katarak', 'glaukoma', 'retina', 'kornea', 'uveitis', 'hordeolum', 'refraksi', 'miopia', 'buta'], obat: ['mata'] },
  ear: { systems: ['Indera'], kata: ['telinga', 'otitis', 'tuli', 'serumen', 'vertigo', 'tinitus', 'mastoid'], obat: ['telinga'] },
  'external-ear': { systems: ['Indera'], kata: ['telinga', 'otitis eksterna', 'serumen'], obat: [] },
  'external-nose': { systems: ['Indera', 'Respirasi'], kata: ['hidung', 'rinitis', 'sinusitis', 'epistaksis', 'polip'], obat: ['hidung', 'alergi'] },
  larynx: { systems: ['Respirasi', 'Indera'], kata: ['laring', 'faring', 'tonsil', 'suara', 'epiglot', 'trakea'], obat: ['batuk'] },
}

/** Level SKDI 4A lebih dulu — itu yang wajib dituntaskan sendiri oleh dokter
 *  umum, jadi paling sering dipakai; sisanya menyusul menurun. */
const URUTAN_LEVEL: Record<string, number> = { '4A': 0, '4': 0, '3B': 1, '3A': 2, '2': 3, '1': 4 }

export interface OrganClinical {
  penyakit: OrganPenyakit[]
  obat: OrganObat[]
  /** true kalau organ ini memang belum punya pemetaan sama sekali. */
  belumDipetakan: boolean
}

export function clinicalForOrgan(organKey: string): OrganClinical {
  const peta = PETA[organKey]
  if (!peta) return { penyakit: [], obat: [], belumDipetakan: true }

  const kata = peta.kata?.map((k) => k.toLowerCase())
  const penyakit: OrganPenyakit[] = []
  for (const e of SKDI_DISEASE_LIST) {
    if (!peta.systems.includes(e.system)) continue
    if (kata && !kata.some((k) => e.disease.toLowerCase().includes(k))) continue
    penyakit.push({
      nama: e.disease,
      system: e.system,
      level: e.level,
      subsection: e.subsection,
      note: SKDI_DISEASE_NOTES[e.disease],
    })
  }
  penyakit.sort((a, b) => {
    // Yang sudah punya catatan klinis didahulukan: entri tanpa catatan hanya
    // menyumbang nama, dan nama saja tidak mengajarkan apa pun.
    const ca = a.note ? 0 : 1
    const cb = b.note ? 0 : 1
    if (ca !== cb) return ca - cb
    const la = URUTAN_LEVEL[a.level] ?? 9
    const lb = URUTAN_LEVEL[b.level] ?? 9
    if (la !== lb) return la - lb
    return a.nama.localeCompare(b.nama)
  })

  const kataObat = peta.obat.map((k) => k.toLowerCase())
  const obat: OrganObat[] = []
  if (kataObat.length) {
    for (const o of semuaObat()) {
      // Sengaja HANYA kelas & indikasi. Menyertakan teks golongan/kelompok ATC
      // membuat satu penyebutan organ di judul kelompok menyeret seluruh isi
      // kelompok itu — yang memunculkan atracurium dan dietilkarbamazin di
      // bawah "hati" hanya karena keterangannya menyinggung gagal hati.
      const teks = `${o.kelas} ${o.untuk}`.toLowerCase()
      if (!kataObat.some((k) => teks.includes(k))) continue
      obat.push({
        nama: o.nama, kelas: o.kelas, untuk: o.untuk, eml: o.eml, catatan: o.catatan,
        golongan: o.golongan,
        dosis: dosisSkdi(o.nama),
      })
    }
    // Obat esensial WHO lebih dulu — itu daftar yang paling mungkin benar-benar
    // dipakai, dan paling layak dihafal.
    obat.sort((a, b) => (a.eml === b.eml ? a.nama.localeCompare(b.nama) : a.eml ? -1 : 1))
  }

  return { penyakit, obat, belumDipetakan: false }
}

/** Organ yang sudah punya pemetaan — dipakai layar untuk menandai mana yang
 *  akan langsung membuka isi klinis saat diketuk. */
export function organsWithClinical(): string[] {
  return Object.keys(PETA)
}
