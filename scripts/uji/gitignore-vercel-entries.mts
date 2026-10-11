import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Regresi: main 81c6fab27 — "Configured release checkout contains uncommitted changes". `vercel link`/`pull` anexa
// `.vercel` dan `.env*.local` ke .gitignore bila barisnya tidak ada secara harfiah, sehingga checkout rilis menjadi kotor
// dan write-frontend-build-info.mjs menolak membangun. Entri harfiah harus ada agar CLI tidak mengubah berkas ini.
export function entriGitignoreVercelHilang(isi: string): string[] {
  const baris = new Set(isi.split(/\r?\n/).map((b) => b.trim()))
  return ['.vercel', '.env*.local'].filter((e) => !baris.has(e))
}

// Positif: berkas nyata memuat kedua entri.
const nyata = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8')
assert.deepEqual(entriGitignoreVercelHilang(nyata), [], 'baris .vercel dan .env*.local harus ada harfiah di .gitignore')
// Negatif berpasangan: tiap entri yang hilang dilaporkan dengan namanya, dan hanya itu.
assert.deepEqual(entriGitignoreVercelHilang(nyata.replace(/^\.vercel$/m, '')), ['.vercel'])
assert.deepEqual(entriGitignoreVercelHilang(nyata.replace(/^\.env\*\.local$/m, '')), ['.env*.local'])
assert.deepEqual(entriGitignoreVercelHilang('/.vercel/\n*.local\n'), ['.vercel', '.env*.local'], 'pola lain (/.vercel/, *.local) tidak menggantikan entri harfiah')
assert.deepEqual(entriGitignoreVercelHilang(''), ['.vercel', '.env*.local'])
// Batas: spasi sekitar baris diabaikan, CRLF diterima.
assert.deepEqual(entriGitignoreVercelHilang('  .vercel  \r\n.env*.local\r\n'), [])
// Entri tidak boleh menghilangkan perlindungan yang ada.
assert.match(nyata, /^\/\.vercel\/$/m); assert.match(nyata, /^\/public\/build-info\.json$/m)
console.log('gitignore-vercel-entries: ok')
