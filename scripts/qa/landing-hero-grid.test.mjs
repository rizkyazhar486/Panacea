import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const src = await readFile(new URL('../../src/pages/landing/sections/HeroSection.tsx', import.meta.url), 'utf8')

test('grid_hero_satu_kolom_di_mobile_agar_konten_nowrap_tidak_melebarkan_kolom', () => {
  // tanpa grid-cols-1 kolom implisit bernilai auto dan melebar ke lebar min-content kartu kanan (456 px di layar 390): judul terpotong
  const line = src.split('\n').find((l) => l.includes('lg:grid-cols-12'))
  assert.ok(line, 'hero grid not found')
  assert.match(line, /\bgrid grid-cols-1\b/)
})

test('kartu_kanan_masih_memuat_teks_nowrap_sehingga_aturan_di_atas_diperlukan', () => {
  assert.match(src, /whitespace-nowrap/)   // jika nowrap dihapus kelak, aturan ini boleh dikaji ulang; sampai saat itu grid-cols-1 wajib
})
