import assert from 'node:assert/strict'
import { LATIHAN, nodesForExercise, groupsForExercise } from '../../src/lib/exerciseMuscles.ts'
import { WORKOUT_MUSCLE_GROUPS } from '../../src/lib/workoutMuscles.ts'

// Apakah setiap latihan benar-benar menyalakan otot yang diklaimnya?
//
// `nodesForExercise` menyelesaikan kunci kelompok dengan `find`, lalu
// `if (!g) continue`. Artinya satu huruf yang salah pada kunci kelompok tidak
// menghasilkan galat apa pun: latihan itu hanya menyalakan lebih sedikit otot
// daripada yang tertulis di layarnya, selamanya, tanpa gejala.
//
// Ini lapisan di atas `otot-latihan-mesh.mts`. Yang itu memeriksa nama mesh
// benar-benar ada di berkas GLB; yang ini memeriksa latihan benar-benar sampai
// ke kelompoknya.

const kunciSah = new Set(WORKOUT_MUSCLE_GROUPS.map((g) => g.key))

// ── 1. Setiap kunci kelompok yang dirujuk harus ada ──────────────────────
{
  const salah: string[] = []
  for (const ex of LATIHAN) {
    for (const o of ex.otot) {
      if (!kunciSah.has(o.grup)) salah.push(`${ex.id} -> "${o.grup}"`)
    }
  }
  assert.deepEqual(salah, [], `Latihan merujuk kelompok otot yang tidak ada:\n  ${salah.join('\n  ')}`)
}

// ── 2. Setiap latihan harus punya penggerak utama yang benar-benar menyala ─
//
// Latihan tanpa otot utama yang terselesaikan akan tampil sebagai model yang
// tidak berubah sama sekali saat dipilih.
for (const ex of LATIHAN) {
  const utama = ex.otot.filter((o) => o.peran === 'utama')
  assert.ok(utama.length > 0, `Latihan "${ex.id}" tidak punya penggerak utama`)
  const simpul = nodesForExercise(ex)
  assert.ok(simpul.utama.length > 0, `Latihan "${ex.id}" tidak menyalakan satu pun otot utama`)
}

// ── 3. Jumlah label harus SAMA dengan jumlah kelompok yang terselesaikan ──
//
// Layar menampilkan label dari `groupsForExercise` dan mewarnai model dari
// `nodesForExercise`. Kalau satu kelompok gagal diselesaikan, yang satu diam
// dan yang lain tetap menyebut namanya -- daftar yang menjanjikan otot yang
// tidak pernah menyala.
for (const ex of LATIHAN) {
  const label = groupsForExercise(ex)
  for (const peran of ['utama', 'sinergis', 'stabilisator'] as const) {
    const diminta = ex.otot.filter((o) => o.peran === peran).length
    assert.equal(label[peran].length, diminta,
      `"${ex.id}" menyebut ${diminta} kelompok ${peran} tetapi hanya ${label[peran].length} terselesaikan`)
  }
}

// ── 4. Tidak ada kelompok yang dirujuk dua peran dalam satu latihan ───────
//
// Otot yang sekaligus "utama" dan "stabilisator" akan diwarnai dua kali dengan
// arti yang berbeda, dan warna yang menang bergantung pada urutan.
for (const ex of LATIHAN) {
  const terlihat = new Map<string, string>()
  for (const o of ex.otot) {
    const ada = terlihat.get(o.grup)
    assert.equal(ada, undefined, `"${ex.id}" menyebut "${o.grup}" sebagai ${ada} dan ${o.peran}`)
    terlihat.set(o.grup, o.peran)
  }
}

// ── 5. Setiap kelompok otot harus dipakai oleh setidaknya satu latihan ────
//
// Kelompok yang tidak pernah dirujuk adalah kelompok yang tidak bisa dicapai
// lewat latihan mana pun -- bukan galat, tetapi layak diketahui alih-alih
// ditemukan lagi setahun kemudian.
{
  const dipakai = new Set(LATIHAN.flatMap((ex) => ex.otot.map((o) => o.grup)))
  const menganggur = [...kunciSah].filter((k) => !dipakai.has(k))
  assert.deepEqual(menganggur, [], `Kelompok otot tanpa satu pun latihan: ${menganggur.join(', ')}`)
}

console.log(
  `Latihan-otot: ${LATIHAN.length} latihan menyelesaikan seluruh kunci kelompoknya, setiap latihan ` +
  'menyalakan penggerak utamanya, label dan pewarnaan sepakat jumlahnya, dan seluruh kelompok otot ' +
  'terjangkau oleh setidaknya satu latihan.',
)
