import assert from 'node:assert/strict'
import { LATIHAN, nodesForExercise, groupsForExercise } from '../../src/lib/exerciseMuscles.ts'
import { WORKOUT_MUSCLE_GROUPS } from '../../src/lib/workoutMuscles.ts'

const kunciSah = new Set(WORKOUT_MUSCLE_GROUPS.map((g) => g.key))

{
  const salah: string[] = []
  for (const ex of LATIHAN) {
    for (const o of ex.otot) {
      if (!kunciSah.has(o.grup)) salah.push(`${ex.id} -> "${o.grup}"`)
    }
  }
  assert.deepEqual(salah, [], `Latihan merujuk kelompok otot yang tidak ada:\n  ${salah.join('\n  ')}`)
}

for (const ex of LATIHAN) {
  const utama = ex.otot.filter((o) => o.peran === 'utama')
  assert.ok(utama.length > 0, `Latihan "${ex.id}" tidak punya penggerak utama`)
  const simpul = nodesForExercise(ex)
  assert.ok(simpul.utama.length > 0, `Latihan "${ex.id}" tidak menyalakan satu pun otot utama`)
}

for (const ex of LATIHAN) {
  const label = groupsForExercise(ex)
  for (const peran of ['utama', 'sinergis', 'stabilisator'] as const) {
    const diminta = ex.otot.filter((o) => o.peran === peran).length
    assert.equal(label[peran].length, diminta,
      `"${ex.id}" menyebut ${diminta} kelompok ${peran} tetapi hanya ${label[peran].length} terselesaikan`)
  }
}

for (const ex of LATIHAN) {
  const terlihat = new Map<string, string>()
  for (const o of ex.otot) {
    const ada = terlihat.get(o.grup)
    assert.equal(ada, undefined, `"${ex.id}" menyebut "${o.grup}" sebagai ${ada} dan ${o.peran}`)
    terlihat.set(o.grup, o.peran)
  }
}

{
  const dipakai = new Set(LATIHAN.flatMap((ex) => ex.otot.map((o) => o.grup)))
  const menganggur = [...kunciSah].filter((k) => !dipakai.has(k))
  assert.deepEqual(menganggur, [], `Kelompok otot tanpa satu pun latihan: ${menganggur.join(', ')}`)
}

console.log(
  `Latihan-otot: ${LATIHAN.length} latihan menyelesaikan seluruh kunci kelompoknya, setiap latihan ` +
  'menyalakan penggerak utamanya, label dan pewarnaan sepakat jumlahnya, dan seluruh kelompok otot terjangkau oleh setidaknya satu latihan.',
)
