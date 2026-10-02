import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Di ponsel, permukaan tubuh 3D (dua kanvas WebGL) dulu tampil di tempat setinggi
// ~2.900 px dan mendorong isi Your Body ke layar keempat (7.268 px total).
// Sekarang ia menjadi satu kartu yang membuka layar penuh; di layar lebar tetap
// di tempat. Satu halaman juga hanya boleh memuat satu salinannya.
const s = readFileSync('src/components/PersonalBodyUnifiedSurface.tsx', 'utf8')
const w = readFileSync('src/pages/UnifiedBodyWorkspace.tsx', 'utf8')

assert.match(s, /LEBAR_PERMUKAAN_DI_TEMPAT = '\(min-width: 1024px\)'/, 'ambang tampilan di tempat hilang')
assert.match(s, /data-personal-body-launcher="v1"/, 'kartu peluncur ponsel hilang — kanvas 3D kembali tampil di tempat')
assert.match(s, /role="dialog" aria-modal="true"/, 'tampilan layar penuh bukan dialog modal')
assert.match(s, /popstate/, 'tombol kembali ponsel tidak lagi menutup layar penuh')
assert.match(s, /if \(sudahAda\) return null/, 'salinan bersarang dirender lagi — dua kanvas untuk orang yang sama')
assert.doesNotMatch(s.slice(s.indexOf('data-personal-body-launcher') - 400, s.indexOf('data-personal-body-launcher')), /<button\s*\n\s*type="button"\s*\n\s*aria-haspopup/, 'kartu peluncur menjadi <button> lagi; lapisan v46 merusak tata letaknya')
assert.match(w, /<PersonalBodySurfaceShown>/, 'Your Body tidak lagi menahan salinan kedua di isi tab')
assert.match(w, /About \{active\.label\}/)
assert.match(w, /SurfaceDepthNavigator/, 'tangga kedalaman harus tetap tersedia di balik ⓘ')
console.log('tubuh-3d-layar-penuh: ponsel mendapat satu kartu 3D layar penuh, satu salinan per halaman')
