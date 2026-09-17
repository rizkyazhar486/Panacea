import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Permukaan yang selesai dibangun tetapi tidak bisa dibuka siapa pun.
//
// Berkas ini lahir dari satu temuan: EMPAT permukaan bedah ada di repositori
// ini, lengkap dengan data dan penampilnya, dan TIDAK SATU PUN diimpor oleh
// apa pun. Nothing imports SurgicalProcedureTimeline, SurgicalOperationAtlasV2
// atau SurgicalHraWorkbench; SurgicalOperationAtlas hanya dirujuk oleh V2, yang
// sendirinya tidak terpasang. Memperbaiki keempatnya -- yang memang saya
// lakukan -- tidak mengubah apa pun bagi pengguna.
//
// Setelah dihitung menyeluruh, jumlahnya JAUH lebih besar: 45 dari 536
// komponen. Satu di antaranya, AtomicSystemsLab, digabungkan ke main pada hari
// yang sama dan sudah tidak terjangkau sejak menit pertama.
//
// Berkas ini TIDAK menuntut semuanya segera disambungkan. Menyambungkan sebuah
// permukaan adalah keputusan produk, bukan keputusan gerbang, dan beberapa di
// antaranya mungkin memang sengaja disimpan. Yang dijaga di sini adalah hal
// yang lebih sederhana dan lebih penting:
//
//   1. DAFTARNYA TIDAK BOLEH TUMBUH DIAM-DIAM. Menambah permukaan baru yang
//      tidak terjangkau harus menjadi keputusan yang tertulis, bukan kelalaian.
//   2. DAFTARNYA TIDAK BOLEH MEMBUSUK. Komponen yang akhirnya disambungkan
//      harus dikeluarkan dari daftar, kalau tidak daftar ini perlahan berhenti
//      menggambarkan keadaan yang sebenarnya -- persis cara setiap daftar
//      "diketahui rusak" kehilangan artinya.

const AKAR = 'src'

function telusuri(dir: string): string[] {
  const keluar: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) keluar.push(...telusuri(p))
    else if (/\.tsx?$/.test(e.name)) keluar.push(p)
  }
  return keluar
}

const semua = telusuri(AKAR)
assert.ok(semua.length > 300, `hanya ${semua.length} berkas terbaca; penelusurannya mungkin rusak`)

const isi = new Map(semua.map((p) => [p, readFileSync(p, 'utf8')]))
const komponen = semua.filter((p) => /\/(components|pages)\/.*\.tsx$/.test(p))
assert.ok(komponen.length > 200, `hanya ${komponen.length} komponen terbaca`)

/**
 * Apakah ada berkas LAIN yang menyebut nama berkas ini?
 *
 * Sengaja longgar: impor dinamis lewat jalur (`import('./x/Foo')`) juga memuat
 * nama dasarnya, jadi pemeriksaan ini tidak akan salah menuduh komponen yang
 * dimuat malas. Kalau hasilnya nol, ia benar-benar tidak disebut di mana pun.
 */
function dirujuk(path: string): boolean {
  const dasar = path.split('/').pop()!.replace(/\.tsx$/, '')
  const pola = new RegExp(`\\b${dasar}\\b`)
  for (const [q, s] of isi) {
    if (q === path) continue
    if (pola.test(s)) return true
  }
  return false
}

const takTerjangkau = komponen.filter((p) => !dirujuk(p)).map((p) => p.replace(`${AKAR}/`, '')).sort()

/**
 * Permukaan yang saat ini diketahui tidak terjangkau.
 *
 * Ini CATATAN, bukan restu. Setiap barisnya adalah pekerjaan yang sudah selesai
 * dan tidak dilihat siapa pun.
 *
 * HomeNowWidget adalah wearable dashboard v43 yang dipertahankan sebagai
 * bahan migrasi setelah Home authoritative bergerak ke presentation v48.
 * PremiumMotionRuntime juga dipertahankan tetapi belum dipasang global sampai
 * pointer-light runtime melewati keputusan integrasi/reduced-motion. Keduanya
 * tidak boleh dihidupkan ulang diam-diam atau dihapus hanya untuk membuat gate
 * hijau; keputusan migrasinya harus eksplisit.
 */
const DIKETAHUI: readonly string[] = [
  'components/HomeNowWidget.tsx',
  'components/KartuPratinjau.tsx',
  'components/PremiumMotionRuntime.tsx',
  'components/RelatedFeaturesRail.tsx',
  'components/dashboard/ActivityAchievementWidget.tsx',
  'components/dashboard/LibraryDiscoveryWidget.tsx',
  'components/dashboard/LifeOSWidgets.tsx',
  'components/dashboard/PanaceaUtilityShelf.tsx',
  'components/dashboard/SignatureExperiencesWidget.tsx',
  'components/digital-twin/AdvancedPhysiologySystems.tsx',
  'components/digital-twin/BodyEvidenceDock.tsx',
  'components/digital-twin/BodyParts3DDeepAtlas.tsx',
  'components/digital-twin/BodyToCellCinematic.tsx',
  'components/digital-twin/CellGenomeEvidenceLab.tsx',
  'components/digital-twin/CellGenomeExplorer.tsx',
  'components/digital-twin/CinematicSurgicalRehearsal.tsx',
  'components/digital-twin/ClinicalPhysiologyMechanisms.tsx',
  'components/digital-twin/CounterfactualBiologyLab.tsx',
  'components/digital-twin/CounterfactualHraWorkbench.tsx',
  'components/digital-twin/HeadToToeAnatomyWorkbench.tsx',
  'components/digital-twin/HighDefinitionCellAtlas.tsx',
  'components/digital-twin/HraClinicalAtlas.tsx',
  'components/digital-twin/HraSourceSearch.tsx',
  'components/digital-twin/HumanAnatomyLayerNavigator.tsx',
  'components/digital-twin/HumanAnatomyMasterAtlas.tsx',
  'components/digital-twin/MicroPathologyComparator.tsx',
  'components/digital-twin/MicroPhysiologyExplorer.tsx',
  'components/digital-twin/OcularAnatomyAtlas.tsx',
  'components/digital-twin/PhysiologyBodyLab.tsx',
  'components/digital-twin/PhysiologyHraWorkbench.tsx',
  'components/digital-twin/RealisticAnatomyAtlas.tsx',
  'components/digital-twin/RegenerationHraWorkbench.tsx',
  'components/digital-twin/RegenerationResearchSandbox.tsx',
  'components/digital-twin/SequenceEvidenceWorkbench.tsx',
  'components/digital-twin/StableBodyParts3DDeepAtlas.tsx',
  'components/digital-twin/SurgicalHraWorkbench.tsx',
  'components/digital-twin/SurgicalOperationAtlas.tsx',
  'components/digital-twin/SurgicalOperationAtlasV2.tsx',
  'components/digital-twin/SurgicalProcedureTimeline.tsx',
  'components/digital-twin/Workout4DLab.tsx',
  'components/digital-twin/WorkoutHraWorkbench.tsx',
  'components/digital-twin/WorkoutSignalReplay.tsx',
  'components/growth/ClinicalDuel.tsx',
  'components/growth/HumanPassportWidget.tsx',
  'pages/MacroLab.tsx',
]

// ── 1. Tidak boleh ada permukaan tak terjangkau yang BARU ────────────────
{
  const baru = takTerjangkau.filter((p) => !DIKETAHUI.includes(p))
  assert.deepEqual(
    baru, [],
    `these surfaces are complete but nothing imports them, so no user can reach them:\n  ${baru.join('\n  ')}\n` +
    'Wire them into a route or a panel, or add them to DIKETAHUI with the decision recorded. ' +
    'Building a surface nobody can open must be a choice, not an oversight.',
  )
}

// ── 2. Daftarnya tidak boleh membusuk ───────────────────────────────────
//
// Tanpa ini, sebuah komponen yang akhirnya disambungkan akan tetap tercatat
// "tidak terjangkau" selamanya, dan daftar ini berhenti berarti apa-apa.
{
  const hidup = DIKETAHUI.filter((p) => !takTerjangkau.includes(p))
  assert.deepEqual(
    hidup, [],
    `these are listed as unreachable but something now imports them: ${hidup.join(', ')}. ` +
    'Remove them from DIKETAHUI -- the list must keep describing what is actually true.',
  )
}

// ── 3. Kontrol positif: pendeteksinya benar-benar mendeteksi ────────────
//
// Sebuah daftar kosong akan lolos kedua uji di atas tanpa memeriksa apa pun.
{
  assert.ok(takTerjangkau.length > 0, 'the detector found nothing at all; it is probably broken')
  assert.ok(
    dirujuk('src/pages/BodyExplorer.tsx'),
    'a surface known to be routed reads as unreferenced; the detector is broken',
  )
}

console.log(
  `OK permukaan-tak-terjangkau: ${takTerjangkau.length} dari ${komponen.length} komponen tidak diimpor ` +
  'oleh apa pun dan karena itu tidak dapat dibuka pengguna mana pun. Semuanya tercatat; ' +
  'daftar ini gagal kalau bertambah diam-diam, dan gagal juga kalau ada yang disambungkan ' +
  'tetapi lupa dikeluarkan.',
)
