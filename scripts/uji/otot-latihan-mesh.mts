import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { WORKOUT_MUSCLE_GROUPS } from '../../src/lib/workoutMuscles.ts'

// Apakah otot yang "menyala" saat memilih kelompok latihan benar-benar ada?
//
// `workoutMuscles.ts` membawa komentar bahwa namanya "sudah diverifikasi cocok
// dengan berkas". Verifikasi yang dilakukan sekali dengan mata adalah
// verifikasi yang membusuk: atlas diperbarui, satu nama berubah, dan kelompok
// itu berhenti menyala tanpa satu pun galat. Highlight 3D gagal dengan sunyi.
//
// Berkas GLB-nya dibaca langsung, jadi yang diperiksa adalah yang benar-benar
// dikirim ke pengguna.

const BERKAS = 'anatomy/muscular.glb'

const buf = await readFile(new URL(`../../public/${BERKAS}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))

const bermesh = new Set<string>(
  gltf.nodes
    .filter((n: { mesh?: number }) => n.mesh !== undefined)
    .map((n: { name?: string }) => n.name ?? ''),
)

// ── 1. Setiap nama harus ada DAN membawa geometri ─────────────────────────
//
// Keberadaan nama saja tidak cukup: berkas atlas di repo ini juga mengirim
// simpul berlabel tanpa mesh, dan mengikat ke salah satunya akan lolos
// pemeriksaan "nama ada" sambil tidak menggambar apa pun.
{
  const hilang: string[] = []
  for (const g of WORKOUT_MUSCLE_GROUPS) {
    for (const nama of g.nodeNames) {
      if (!bermesh.has(nama)) hilang.push(`${g.key}: ${nama}`)
    }
  }
  assert.deepEqual(hilang, [], `Nama otot tanpa geometri di ${BERKAS}:\n  ${hilang.join('\n  ')}`)
}

// ── 2. Setiap kelompok harus benar-benar menyalakan sesuatu ───────────────
for (const g of WORKOUT_MUSCLE_GROUPS) {
  assert.ok(g.nodeNames.length > 0, `Kelompok "${g.key}" tidak menyalakan otot apa pun`)
}

// ── 3. Otot berpasangan harus menyala di KEDUA sisi ───────────────────────
//
// Menyalakan satu sisi saja terlihat seperti berhasil pada tangkapan layar
// dari depan, dan salah pada tubuh. Setiap nama yang berakhiran ".l" harus
// punya pasangan ".r" di kelompok yang sama.
for (const g of WORKOUT_MUSCLE_GROUPS) {
  const punya = new Set(g.nodeNames)
  for (const nama of g.nodeNames) {
    const m = /^(.*)\.([lr])$/.exec(nama)
    if (!m) continue
    const pasangan = `${m[1]}.${m[2] === 'l' ? 'r' : 'l'}`
    assert.ok(punya.has(pasangan), `"${nama}" menyala tanpa pasangannya "${pasangan}" di kelompok ${g.key}`)
  }
}

// ── 4. Tidak ada otot yang diklaim dua kelompok ───────────────────────────
//
// Klaim ganda membuat memilih "dada" ikut menyalakan otot yang dihitung
// sebagai "bahu", dan pengguna tidak bisa tahu mana yang dimaksud.
{
  const pemilik = new Map<string, string>()
  for (const g of WORKOUT_MUSCLE_GROUPS) {
    for (const nama of g.nodeNames) {
      const ada = pemilik.get(nama)
      assert.equal(ada, undefined, `"${nama}" diklaim "${ada}" dan "${g.key}"`)
      pemilik.set(nama, g.key)
    }
  }
}

// ── 5. Kelompok tidak boleh saling menelan lewat nama dasar ───────────────
//
// Kepala otot yang sama tidak boleh terpecah ke dua kelompok: "Long head of
// biceps brachii" di lengan dan "Long head of biceps femoris" di paha adalah
// otot berbeda, tetapi kepala dari SATU otot yang sama tidak boleh terbelah.
{
  const dasarKe = new Map<string, Set<string>>()
  for (const g of WORKOUT_MUSCLE_GROUPS) {
    for (const nama of g.nodeNames) {
      const dasar = nama.replace(/\.[lr]$/, '')
      const set = dasarKe.get(dasar) ?? new Set<string>()
      set.add(g.key)
      dasarKe.set(dasar, set)
    }
  }
  for (const [dasar, kelompok] of dasarKe) {
    assert.equal(kelompok.size, 1, `"${dasar}" terbagi ke kelompok ${[...kelompok].join(' dan ')}`)
  }
}

const jumlah = WORKOUT_MUSCLE_GROUPS.reduce((n, g) => n + g.nodeNames.length, 0)
console.log(
  `Otot latihan: ${WORKOUT_MUSCLE_GROUPS.length} kelompok mengikat ${jumlah} mesh otot yang benar-benar ` +
  `membawa geometri di ${BERKAS}, setiap otot berpasangan menyala di kedua sisi, dan tidak ada otot yang ` +
  'diklaim dua kelompok.',
)
