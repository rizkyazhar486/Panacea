import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Regresi: main cfe4c6242 ([deploy-vercel], #2424) gagal lagi dengan "Configured release checkout contains uncommitted
// changes" bahkan setelah #2422: log `vercel link` masih mencetak "Created .env.local file and added it to
// .gitignore", artinya CLI menambahkan baris ke berkas ini. Ia menambahkan `.env*.local` (dan `.vercel`) bila baris harfiahnya
// tidak ada; `.env.local`, `.env.*`, dan `*.local` tidak menggantikannya. Dengan baris harfiah CLI tidak mengubah .gitignore.
export function entriGitignoreVercelHilang(isi: string): string[] {
  const baris = new Set(isi.split(/\r?\n/).map((b) => b.trim()))
  return ['.vercel', '.env*.local'].filter((e) => !baris.has(e))
}

// Positif: berkas nyata memuat kedua entri harfiah.
const nyata = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8')
assert.deepEqual(entriGitignoreVercelHilang(nyata), [], 'baris .vercel dan .env*.local harus ada harfiah di .gitignore')
// Negatif berpasangan: tiap entri yang hilang dilaporkan dengan namanya, dan hanya itu.
assert.deepEqual(entriGitignoreVercelHilang(nyata.replace(/^\.vercel$/m, '')), ['.vercel'])
assert.deepEqual(entriGitignoreVercelHilang(nyata.replace(/^\.env\*\.local$/m, '')), ['.env*.local'])
// Pola lain yang sudah ada tidak menggantikan entri harfiah (inilah yang lolos di #2422).
assert.deepEqual(entriGitignoreVercelHilang('.vercel\n.env.local\n.env.*\n*.local\n'), ['.env*.local'])
assert.deepEqual(entriGitignoreVercelHilang('/.vercel/\n*.local\n'), ['.vercel', '.env*.local'])
assert.deepEqual(entriGitignoreVercelHilang(''), ['.vercel', '.env*.local'])
// Batas: spasi sekitar baris diabaikan, CRLF diterima.
assert.deepEqual(entriGitignoreVercelHilang('  .vercel  \r\n.env*.local\r\n'), [])
// Perlindungan yang ada tidak hilang.
assert.match(nyata, /^\/public\/build-info\.json$/m); assert.match(nyata, /^\.env\.local$/m)
console.log('gitignore-vercel-entries: ok')
