import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Gerbang lantai ukuran teks Home di ponsel (src/styles/home-compact-responsive.css).
// Terukur di 390x844 sebelum lantai ini ada: 155 teks 8-9,5px dan 219 dari 280 teks di bawah 11px. Lantai 11px ada di blok
// "Lantai ukuran teks Home" di akhir berkas. Gerbang ini memastikan (1) blok itu ada dan memakai 11px, dan (2) setiap kelas yang
// di berkas yang sama dideklarasikan di bawah 11px muncul di selektor lantai, sehingga label kecil BARU tidak lolos diam-diam.
const css = readFileSync(new URL('../../src/styles/home-compact-responsive.css', import.meta.url), 'utf8')
const PENANDA = 'Lantai ukuran teks Home'
const BATAS_PX = 11

export function auditHomeTeksMinimum(sumber: string): { masalah: string[]; kelasKecil: string[]; kelasLantai: string[] } {
  const masalah: string[] = []
  const i = sumber.indexOf(PENANDA)
  if (i < 0) return { masalah: ['blok lantai tidak ditemukan'], kelasKecil: [], kelasLantai: [] }
  const sebelum = sumber.slice(0, i)
  const blok = sumber.slice(i)

  // Selektor yang ada di dalam blok lantai (semua token kelas).
  const kelasLantai = new Set<string>()
  for (const m of blok.matchAll(/([^{}]+)\{[^{}]*font-size:\s*([0-9.]+px|clamp\([^;]*\))\s*!important/g)) {
    for (const k of m[1].matchAll(/\.([A-Za-z0-9_\\\[\]\.\-]+?)(?=[\s,>:.{]|$)/g)) kelasLantai.add(k[1].replace(/\\/g, ''))
  }
  if (!/font-size:\s*11px\s*!important/.test(blok)) masalah.push('blok lantai tidak menetapkan 11px !important')
  if (!/@media\s*\(max-width:\s*760px\)/.test(blok)) masalah.push('blok lantai tidak dibatasi @media (max-width: 760px)')

  // Kelas yang dideklarasikan di bawah 11px SEBELUM blok lantai.
  const kelasKecil = new Set<string>()
  for (const m of sebelum.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const fs = m[2].match(/font-size:\s*([0-9.]+)px/)
    if (!fs || Number(fs[1]) >= BATAS_PX) continue
    for (const bagian of m[1].split(',')) {
      const t = [...bagian.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((x) => x[1])
      if (t.length > 0) kelasKecil.add(t[t.length - 1])
    }
  }
  for (const k of kelasKecil) if (!kelasLantai.has(k)) masalah.push(`kelas di bawah ${BATAS_PX}px tanpa lantai: .${k}`)
  return { masalah, kelasKecil: [...kelasKecil], kelasLantai: [...kelasLantai] }
}

const hasil = auditHomeTeksMinimum(css)
assert.deepEqual(hasil.masalah, [], `lantai teks Home tidak lengkap: ${hasil.masalah.join('; ')}`)
assert.ok(hasil.kelasKecil.length >= 5, `audit tidak menemukan kelas kecil (${hasil.kelasKecil.length}); pola pencarian rusak`)
assert.ok(hasil.kelasLantai.length >= 10, `audit tidak membaca selektor lantai (${hasil.kelasLantai.length})`)

// Negatif (berpasangan): berkas yang sama kecuali satu perubahan harus gagal dengan alasan bernama.
assert.deepEqual(auditHomeTeksMinimum(css.replace(PENANDA, 'Blok lain')).masalah, ['blok lantai tidak ditemukan'])
assert.ok(auditHomeTeksMinimum(css.replace(/font-size:\s*11px\s*!important/g, 'font-size: 10px !important')).masalah.includes('blok lantai tidak menetapkan 11px !important'))
assert.ok(auditHomeTeksMinimum(css.replace('@media (max-width: 760px) {\n  .panacea-liquid-home .text-', '@media (min-width: 761px) {\n  .panacea-liquid-home .text-')).masalah.includes('blok lantai tidak dibatasi @media (max-width: 760px)'))
const barisBaru = `\n.panacea-label-baru-kecil {\n  font-size: 8px;\n}\n`
assert.ok(auditHomeTeksMinimum(css.replace(PENANDA, `${barisBaru}/* ${PENANDA}`).replace(`/* ${barisBaru}`, barisBaru)).masalah.some((m) => m.includes('.panacea-label-baru-kecil')), 'label kecil baru tanpa lantai lolos')
// Sabotase: cabut dari lantai kelas yang JELAS dideklarasikan kecil di berkas (label kartu mini: 8,5px, 7,5px di layar sempit).
assert.ok(hasil.kelasKecil.includes('panacea-instrument-mini-label'), 'kelas sasaran sabotase tidak lagi terdeteksi kecil')
const tanpaKelas = css.replace(/^  \.panacea-liquid-home \.panacea-instrument-mini-label,\n/m, '')
assert.notEqual(tanpaKelas, css, 'sabotase tidak mengubah berkas')
assert.ok(auditHomeTeksMinimum(tanpaKelas).masalah.some((m) => m.includes('.panacea-instrument-mini-label')), 'kelas yang dicabut dari lantai lolos')
const tanpaSmall = css.replace(/^  \.panacea-liquid-home \.pmd-superpage-copy small \{/m, '  .panacea-liquid-home .pmd-superpage-copy-lain {')
assert.notEqual(tanpaSmall, css, 'sabotase kedua tidak mengubah berkas')
assert.ok(auditHomeTeksMinimum(tanpaSmall).masalah.some((m) => m.includes('.pmd-superpage-copy') || m.includes('small')), 'selektor small dicabut tetapi lolos')
// Positif: label di atas batas tidak dituntut lantai.
assert.deepEqual(auditHomeTeksMinimum(css.replace(PENANDA, `\n.panacea-label-besar {\n  font-size: 12px;\n}\n/* ${PENANDA}`)).masalah, [])
console.log(`home-teks-minimum: ${hasil.kelasKecil.length} kelas kecil tertutup oleh ${hasil.kelasLantai.length} selektor lantai; sabotase gagal dengan nama`)
