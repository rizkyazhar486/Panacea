import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const src = await readFile(new URL('../../src/pages/landing/sections/HeroSection.tsx', import.meta.url), 'utf8')

test('grid_hero_satu_kolom_di_mobile_agar_konten_tidak_melebarkan_kolom', () => {
  // tanpa grid-cols-1 kolom implisit bernilai auto dan melebar ke lebar min-content isinya (judul terpotong di 390 px)
  const line = src.split('\n').find((l) => l.includes('lg:grid-cols-2'))
  assert.ok(line, 'hero grid not found')
  assert.match(line, /\bgrid grid-cols-1\b/)
})
