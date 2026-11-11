// Penampil 3D bersama (Body3D) setelah diperluas untuk panggung atlas: pilihannya lewat kebijakan murni,
// perpindahan kameranya lewat penjadwal bersama (tanpa RAF kedua), menghormati gerak-dikurangi, dan perintah
// bingkai yang datang lewat event window divalidasi lalu gagal tertutup. Diuji pada sumbernya karena WebGL
// tidak berjalan di sini; logika yang dipanggilnya diuji nilai-demi-nilai di atlas-stage-engine.mts dan
// scripts/qa/camera-views.test.mjs.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hitung = (teks: string, pola: RegExp) => (teks.match(pola) ?? []).length
const body3d = readFileSync('src/components/bodyhub/Body3D.tsx', 'utf8')

gagal('memilih-lewat-kebijakan-murni', () => {
  assert.match(body3d, /const pilih = firstPickableIndex\(hits\.map\(\(hit\) => kandidatPilih\(hit\.object\)\)\)/)
  assert.match(body3d, /if \(pilih < 0\) return/)
  assert.doesNotMatch(body3d, /hits\[0\]\.object/, 'benturan pertama bisa berupa lapisan pudar atau simpul tersembunyi')
})
gagal('kandidat-membaca-visibilitas-leluhur-dan-opasitas-dasar', () => {
  assert.match(body3d, /for \(let p: THREE\.Object3D \| null = obj; p; p = p\.parent\) \{\s*if \(!p\.visible\) \{ visible = false; break \}/)
  assert.match(body3d, /typeof m\.userData\.body3dBaseOpacity === 'number' \? m\.userData\.body3dBaseOpacity as number : m\.opacity/)
})
gagal('pemanggil-diberi-tahu-lapisan-asal', () => assert.match(body3d, /onPickRef\.current\(rawName, humanizeStructureName\(rawName\), sourceLayer\?\.key\)/))
gagal('terbang-lewat-penjadwal-bersama-tanpa-raf-kedua', () => {
  assert.match(body3d, /const langkah = stepTween\(penerbangan\.tween,/); assert.match(body3d, /if \(penerbangan\) renderScheduler\.request\(\)/)
  assert.equal(hitung(body3d, /requestAnimationFrame\(/g), 1, 'satu-satunya RAF adalah milik penjadwal bersama')
  assert.match(body3d, /requestFrame: \(callback\) => requestAnimationFrame\(callback\)/)
})
gagal('tangan-pengguna-membatalkan-penerbangan-dan-pendengarnya-dilepas', () => {
  assert.match(body3d, /controls\.addEventListener\('start', batalkanPenerbangan\)/); assert.match(body3d, /controls\.removeEventListener\('start', batalkanPenerbangan\)/)
})
gagal('menghormati-gerak-dikurangi', () => {
  assert.match(body3d, /classList\.contains\('reduce-motion'\)/); assert.match(body3d, /prefers-reduced-motion: reduce/)
  assert.match(body3d, /if \(sudahDiSana \|\| gerakDikurangi\(\)\) \{/)
})
gagal('bingkai-divalidasi-dan-gagal-tertutup', () => {
  assert.match(body3d, /const pose = bingkaiSah\(bingkai\) \? viewPose\(bingkai\.view, bingkai\.center, bingkai\.size, cam\.fov, cam\.aspect\) : null/)
  assert.match(body3d, /const poseRumah = bingkaiSah\(rumah\) \? viewPose\(/)
  assert.match(body3d, /const tripelSah = \(v: unknown\): v is Vec3 => Array\.isArray\(v\) && v\.length === 3 && v\.every\(\(n\) => typeof n === 'number' && Number\.isFinite\(n\)\)/)
})
gagal('batas-jarak-tujuan-dipasang-saat-tiba', () => {
  assert.match(body3d, /if \(langkah\.done\) \{\s*controls\.minDistance = penerbangan\.minDistance\s*controls\.maxDistance = penerbangan\.maxDistance\s*penerbangan = null/)
})

console.log('atlas-stage viewer: Body3D selects through the pure pick policy and flies through the shared scheduler')
