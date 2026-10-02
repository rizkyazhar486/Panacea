import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Sebuah gerbang yang tidak pernah dijalankan tidak menjaga apa pun.
//
// Ini bukan kekhawatiran teoretis, dan bukan sekali. Dua gerbang browser yang
// SUDAH LENGKAP di repositori ini tidak terdaftar di alur kerja mana pun:
//
//   * qa:bergerak -- gerbang gerak panel, digabungkan, lalu tidak pernah
//     menjaga main sehari pun;
//   * qa:share-card -- gerbang ekspor kartu share, lengkap dan LULUS ketika
//     akhirnya dijalankan, tetapi tidak pernah dijalankan CI.
//
// Keduanya lulus di mesin siapa pun yang mengetiknya, dan itulah yang membuat
// keadaannya sulit terlihat: tidak ada yang merah, tidak ada yang hilang, dan
// tidak ada yang dijaga. Komentar di organ-3d-acceptance.yml sendiri sudah
// memperingatkan pola ini untuk tujuh gerbang 3D, lalu pola itu terulang.
//
// Aturannya sederhana dan tidak bisa ditawar: setiap skrip `qa:*` di
// package.json harus benar-benar dijalankan oleh sebuah alur kerja.

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const skrip = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('qa:')).sort()
assert.ok(skrip.length >= 8, `hanya ${skrip.length} skrip qa:* terbaca; pembacaannya mungkin rusak`)

const DIR = '.github/workflows'
const alurKerja = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f))
assert.ok(alurKerja.length > 3, `hanya ${alurKerja.length} alur kerja terbaca`)

const isiSemua = alurKerja.map((f) => readFileSync(join(DIR, f), 'utf8')).join('\n')

// Disebut di dalam KOMENTAR tidak cukup: ia harus benar-benar dijalankan.
const tanpaKomentar = isiSemua
  .split('\n')
  .filter((ln) => !/^\s*#/.test(ln))
  .join('\n')

const tidakDijalankan = skrip.filter((s) => !tanpaKomentar.includes(s))

assert.deepEqual(
  tidakDijalankan, [],
  `these QA gates exist and are never run by any workflow, so they guard nothing:\n  ${tidakDijalankan.join('\n  ')}\n` +
  'Add them to an acceptance run, or delete them. A gate that only passes on the machine of ' +
  'whoever typed it is not a gate.',
)

// Kontrol positif: pemindaiannya benar-benar melihat isi alur kerja.
assert.ok(tanpaKomentar.includes('qa:organ-3d'), 'pemindaian alur kerja tidak melihat gerbang yang jelas terdaftar')

console.log(
  `OK gerbang-qa-terdaftar: ${skrip.length} skrip qa:* semuanya benar-benar dijalankan oleh alur kerja ` +
  '(disebut di komentar saja tidak dihitung).',
)
