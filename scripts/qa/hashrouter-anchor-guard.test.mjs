import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

// App router di src/main.tsx adalah HashRouter: fragment #id di URL ditafsirkan
// sebagai route path, bukan scroll-anchor native browser. href="#id" (tanpa
// garis miring) selalu salah di sini -> klik jadi "navigasi" ke route yang
// gak terdaftar -> NotFound/404. href="#/route" (dengan garis miring) itu
// link HashRouter yang sah, bukan pelanggaran.
// Insiden: PR #2667 (landing nav 404 di production).

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SRC = join(ROOT, 'src')
const BROKEN_HREF = /href="#(?!\/)[^"]*"/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

test('tidak ada href="#id" (anchor non-route) di src/ — HashRouter akan 404-kan itu', () => {
  const offenders = []
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      if (BROKEN_HREF.test(line)) offenders.push(`${relative(ROOT, file)}:${i + 1}`)
    })
  }
  assert.deepEqual(offenders, [],
    `href="#id" ditemukan — ganti ke <button onClick={() => document.getElementById(id)?.scrollIntoView(...)}> (lihat scrollToSection di src/pages/landing/sections/LandingHeader.tsx). Lokasi:\n${offenders.join('\n')}`)
})
