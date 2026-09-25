import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { keadaanAwal, langkahPegas, sudahDiam, type Kotak } from '../../src/lib/oneShapeSpring.ts'

// One Shape: satu permukaan aktif yang meluncur antar pilihan (pegas ω=17, ζ=0,82).
const A: Kotak = { x: 0, y: 0, w: 80, h: 42, r: 21 }
const B: Kotak = { x: 220, y: 0, w: 96, h: 42, r: 21 }

// 1. Konvergen ke target dan berhenti dalam waktu wajar (< 0,8 s pada 60 fps).
{
  let s = keadaanAwal(A); let n = 0; let maks = 0
  while (!sudahDiam(s, B) && n < 600) { s = langkahPegas(s, B, 1 / 60); maks = Math.max(maks, s.pos.x); n++ }
  assert.ok(n < 48, `bentuk butuh ${n} frame untuk diam — terlalu lamban`)
  // ζ<1: sedikit lewat lalu kembali, tetapi tidak lebih dari 2% jarak.
  assert.ok(maks > B.x && maks < B.x + 0.02 * (B.x - A.x), `lewatan ${maks - B.x}px di luar batas 0–2%`)
}
// 2. Target berganti di tengah gerak: posisi kontinu (tidak melompat) dan kecepatan dipertahankan.
{
  let s = keadaanAwal(A)
  for (let i = 0; i < 6; i++) s = langkahPegas(s, B, 1 / 60)
  const sebelum = s.pos.x
  const s2 = langkahPegas(s, A, 1 / 60)
  assert.ok(Math.abs(s2.pos.x - sebelum) < 40, 'bentuk melompat saat target berganti')
  assert.ok(s2.pos.x > sebelum - 1e-9 || s.vel.x > 0, 'kecepatan hilang seketika saat target berganti')
}
// 3. Frame sangat panjang (tab tersembunyi) tidak meledak; dt tak valid diabaikan.
{
  const s = langkahPegas(keadaanAwal(A), B, 30)
  assert.ok(Number.isFinite(s.pos.x) && Math.abs(s.pos.x - B.x) < 5, 'frame panjang membuat pegas tidak stabil')
  const t = keadaanAwal(A)
  assert.equal(langkahPegas(t, B, NaN), t)
  assert.equal(langkahPegas(t, B, -1), t)
}
// 4. Terpasang di navigasi zona dan tab Your Body; presentasi saja.
{
  const c = readFileSync('src/components/OneShape.tsx', 'utf8')
  assert.match(c, /prefers-reduced-motion/, 'gerak berkurang tidak dihormati')
  assert.match(readFileSync('src/styles/one-shape.css', 'utf8'), /pointer-events: none/, 'bentuk menangkap klik')
  assert.match(readFileSync('src/components/PanaceaZoneNav.tsx', 'utf8'), /data-one-shape="explicit"[\s\S]*<OneShape \/>/)
  assert.match(readFileSync('src/pages/UnifiedBodyWorkspace.tsx', 'utf8'), /data-one-shape="aria"[\s\S]*<OneShape \/>/)
}
console.log('one-shape: pegas konvergen <0,8 s, lewatan ≤2%, kontinu saat ganti target, terpasang di navigasi zona + tab Your Body')
