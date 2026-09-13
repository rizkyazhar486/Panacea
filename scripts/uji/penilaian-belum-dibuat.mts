import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// GARIS YANG MEMISAHKAN "BELUM DIJAWAB" DARI "DIJAWAB NOL".
//
// Tidak setiap nilai awal itu cacat, dan gerbang ini menolak berpura-pura
// bahwa semuanya sama.
//
//   KOSONG ADALAH JAWABAN. Kotak centang yang tidak dicentang berarti
//   "kriteria itu tidak ada pada pasien ini" -- BISAP, Caprini dan TIMI
//   memang bekerja begitu, dan skor nol darinya sah. Killip I tanpa henti
//   jantung juga begitu.
//
//   KOSONG BUKAN JAWABAN. Subskala Braden bernilai 4 berbunyi "No
//   impairment" dan "Excellent" -- temuan positif yang DINYATAKAN tentang
//   seseorang. Enam di antaranya sekaligus menghasilkan 23 dari 23, "no
//   risk": kesimpulan paling menenangkan yang bisa dihasilkan alat yang
//   dibuat untuk menemukan yang berisiko.
//
// Epworth dan Chronotype sudah benar sejak awal -- Array(n).fill(null) --
// dan diuji di sini supaya tetap begitu. Gerbang yang hanya menjaga apa yang
// baru saja diperbaiki membiarkan contoh yang baik ikut lapuk.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (n: string) => readFileSync(new URL(`../../src/pages/${n}`, import.meta.url), 'utf8')
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── Braden: tidak boleh lagi menyatakan enam temuan positif ────────────────
const braden = baca('BradenScale.tsx')
const bradenKode = kodeDari(braden)
assert.ok(!/sensory: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, friction: 3/.test(bradenKode),
  'Braden opens at the best value on every subscale again — 23/23, "no risk", before anyone has assessed anything')
assert.ok(/SUBSCALES\.map\(\(sub\) => \[sub\.key, null\]\)/.test(bradenKode),
  'Braden subscales no longer start unassessed')
assert.ok(/const result = lengkap \? band\(total\) : null/.test(bradenKode),
  'Braden still bands a total made of unassessed subscales')
assert.ok(/<option value="">Not assessed<\/option>/.test(braden),
  'the dropdowns have no way to express "not assessed"')
assert.ok(/Not scored yet\. Still to assess/.test(braden), 'Braden no longer names what is left to assess')

// Rentang skalanya diperiksa, bukan diandaikan: 6 terendah, 23 tertinggi.
const poin = [...bradenKode.matchAll(/pts: (\d)/g)].map((m) => Number(m[1]))
assert.equal(poin.length, 23, 'the Braden option table changed shape; re-read this gate')
assert.equal(Math.max(...poin), 4, 'a subscale maximum is no longer 4')

// ── Yang sudah benar harus tetap benar ─────────────────────────────────────
for (const nama of ['EpworthSleepiness.tsx', 'Chronotype.tsx']) {
  const s = kodeDari(baca(nama))
  assert.ok(/useState<\(number \| null\)\[\]>\(Array\([A-Z_a-z]+\.length\)\.fill\(null\)\)/.test(s),
    `${nama} no longer starts with every answer unanswered; it was an example worth keeping`)
}

// ── Dan kotak centang TIDAK boleh dipaksa ikut berubah ─────────────────────
// Ini penjaga terhadap perbaikan yang kebablasan. Memaksa seseorang
// mencentang "tidak ada kriteria" memindahkan pekerjaan tanpa menambah
// kebenaran, dan skor nol dari ketiganya memang bermakna.
for (const nama of ['BisapScore.tsx', 'CapriniScore.tsx', 'TimiRiskScore.tsx']) {
  const s = kodeDari(baca(nama))
  assert.ok(/useState<Record<string, boolean>>\(\{\}\)/.test(s),
    `${nama} was changed away from an empty tick-box set; nothing ticked is a real answer worth zero`)
}

console.log('penilaian-belum-dibuat: ok')
