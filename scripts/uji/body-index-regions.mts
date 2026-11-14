// Wilayah tubuh di indeks atlas (src/lib/bodyIndex.gen.ts, dibangkitkan oleh scripts/atlas/indeksTubuh.mjs).
//   - kesegaran: generator dijalankan ulang dari GLB yang sama ke berkas sementara; hasilnya harus identik byte demi
//     byte dengan yang ter-commit (aturan generator yang berubah tanpa membangkitkan ulang, atau suntingan tangan,
//     gagal di sini);
//   - anatomi: organ perut atas di abdomen (di bawah diafragma), isi toraks di toraks, visceral tidak pernah di
//     ekstremitas, tulang garis tengah bukan "lengan", gelang panggul di pelvis, tulang lengan di ekstremitas.
//     Dulu ginjal, kantung empedu, lambung dan prosesus xifoideus tercatat "bahu-lengan", dan tulang panggul
//     "tangan" — region yang dipakai bersama oleh pencarian, atlas dan lab bedah.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const wilayah = (b: string) => {
  const ada = [...new Set(INDEKS_TUBUH.filter((r) => r.b === b).map((r) => r.w))]
  assert.ok(ada.length > 0, `${b} tidak ada di indeks`)
  return ada
}

gagal('indeks_segar_dari_generator', () => {
  const dir = mkdtempSync(join(tmpdir(), 'indeks-tubuh-'))
  try {
    const keluar = join(dir, 'bodyIndex.gen.ts')
    execFileSync(process.execPath, ['scripts/atlas/indeksTubuh.mjs'], { env: { ...process.env, INDEKS_TUBUH_OUT: keluar }, stdio: 'pipe' })
    assert.ok(readFileSync(keluar, 'utf8') === readFileSync('src/lib/bodyIndex.gen.ts', 'utf8'), 'indeks yang ter-commit harus persis keluaran generator dari GLB yang sama')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

gagal('organ_perut_atas_di_abdomen', () => {
  for (const b of ['Liver', 'Gallbladder', 'Stomach', 'Spleen', 'Pancreas', 'Kidney', 'Suprarenal gland', 'Common hepatic artery', 'Coeliac trunk', 'Hepatic portal vein']) {
    assert.deepEqual(wilayah(b), ['abdomen'], b)
  }
})

gagal('isi_toraks_di_toraks', () => {
  for (const b of ['Inferior lobe of right lung', 'Inferior lobe of left lung', 'Oesophagus', 'Left ventricle', 'Left atrium', 'Thoracic aorta', 'Azygos vein', 'Left lobe of thymus']) {
    assert.deepEqual(wilayah(b), ['toraks'], b)
  }
  assert.deepEqual(wilayah('Abdominal aorta'), ['abdomen'], 'berpasangan: bagian aorta di bawah diafragma adalah perut')
})

gagal('visceral_tidak_pernah_di_ekstremitas', () => {
  const salah = INDEKS_TUBUH.filter((r) => r.l === 'visceral' && (r.w === 'bahu-lengan' || r.w === 'tangan')).map((r) => r.n)
  assert.deepEqual(salah, [])
})

gagal('garis_tengah_bukan_lengan', () => {
  for (const b of ['Body of sternum', 'Manubrium of sternum', 'Xiphoid process']) assert.deepEqual(wilayah(b), ['toraks'], b)
})

gagal('gelang_panggul_di_pelvis_bukan_tangan', () => {
  for (const b of ['Hip bone', 'Sacrum', 'Coccyx', 'Gluteus maximus muscle', 'Gluteus medius muscle']) assert.deepEqual(wilayah(b), ['pelvis'], b)
})

gagal('tulang_lengan_dan_gelang_bahu_di_ekstremitas', () => {
  assert.deepEqual(wilayah('Humerus'), ['bahu-lengan'])
  assert.deepEqual(wilayah('Scapula'), ['bahu-lengan'], 'gelang bahu tetap bahu-lengan')
  for (const b of ['Radius', 'Ulna']) assert.deepEqual(wilayah(b), ['tangan'], b)
})

console.log('body index regions: committed index equals a fresh generation; abdominal organs under the diaphragm, thoracic contents, midline bones, pelvic girdle and arm bones in their regions; no viscera in a limb')
