import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  SURGICAL_SPATIAL_SCENARIOS, RISIKO_CHECKPOINT_TANPA_GEOMETRI,
  alasanRisikoTanpaGeometri, TANDA_RISIKO_TANPA_GEOMETRI,
} from '../../src/lib/surgicalSpatialTeaching.ts'

// Panel bedah yang BENAR-BENAR bisa dibuka pengguna.
//
// SurgicalLab sudah jujur tentang cakupan geometri di bagian "at risk in this
// layer": tiap baris menyebut berapa simpul sumber persis yang ditemukan, atau
// "reference only". Daftar checkpoint di atasnya tidak -- ia mencetak nama
// berisiko sebagai satu teks gabungan, sehingga struktur yang bisa ditunjuk
// pada model tampil sama persis dengan yang tidak dikirim sama sekali.
//
// Diukur terhadap berkas yang dikirim: hanya 4 dari 17 nama resolve.
//
// Yang dijaga di sini bukan hanya "yang kosong ditandai", tetapi juga arah
// sebaliknya: tidak adanya tanda harus berarti "diperiksa dan ada", bukan
// "belum pernah diperiksa". Itulah sebabnya daftarnya dicocokkan dua arah.

const AKAR_GLB = 'public/anatomy'

function namaSimpulGlb(path: string): string[] {
  const buf = readFileSync(path)
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return []
  const panjang = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return []
  const json = JSON.parse(buf.subarray(20, 20 + panjang).toString('utf8')) as { nodes?: Array<{ name?: string }> }
  return (json.nodes ?? []).map((n) => n.name).filter((n): n is string => Boolean(n))
}

const normal = (x: string) => x.replace(/\.[a-z]$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const simpul: string[] = []
for (const f of readdirSync(AKAR_GLB).filter((f) => f.endsWith('.glb')).sort()) {
  const n = namaSimpulGlb(join(AKAR_GLB, f))
  assert.ok(n.length > 0, `${f} must expose named nodes or this gate proves nothing`)
  simpul.push(...n.map(normal))
}
assert.ok(simpul.length > 1000, `only ${simpul.length} nodes read; the reader is probably broken`)

/** Frasa utuh, tanpa "mendekat-dekatkan" nama. */
function resolve(label: string): number {
  const n = normal(label)
  if (!n) return 0
  const pola = new RegExp(`(^| )${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`)
  return simpul.filter((x) => x === n || pola.test(x)).length
}

const risiko = new Set<string>()
for (const sc of SURGICAL_SPATIAL_SCENARIOS) {
  for (const c of sc.checkpoints) for (const r of c.structuresAtRisk) risiko.add(r)
}
assert.ok(risiko.size > 10, `only ${risiko.size} checkpoint risks collected; the reader is probably broken`)

const dinyatakan = new Map(RISIKO_CHECKPOINT_TANPA_GEOMETRI.map((d) => [d.structure, d.reason]))

// ── 1. Yang resolve NOL harus dinyatakan ─────────────────────────────────
{
  const kosong = [...risiko].filter((r) => resolve(r) === 0).sort()
  const lolos = kosong.filter((r) => !dinyatakan.has(r))
  assert.deepEqual(lolos, [], `checkpoint risks resolve to nothing and are not declared: ${lolos.join(', ')}`)
}

// ── 2. Arah sebaliknya: dinyatakan kosong padahal meshnya ada ────────────
//
// Tanpa ini, tidak adanya tanda kehilangan artinya.
{
  const keliru = [...dinyatakan.keys()].filter((r) => resolve(r) > 0).sort()
  assert.deepEqual(keliru, [], `declared without geometry but meshes match: ${keliru.map((r) => `${r} (${resolve(r)})`).join(', ')}`)
}

// ── 3. Deklarasi yatim dan alasan kosong ditolak ────────────────────────
{
  const yatim = [...dinyatakan.keys()].filter((r) => !risiko.has(r)).sort()
  assert.deepEqual(yatim, [], `declarations name checkpoint risks that no longer exist: ${yatim.join(', ')}`)
  for (const [r, alasan] of dinyatakan) {
    assert.ok(alasan.trim().length > 30, `declaration for "${r}" has no real reason: "${alasan}"`)
  }
}

// ── 4. Panel benar-benar menandainya, dan untuk pembaca layar juga ───────
{
  const panel = readFileSync('src/pages/bodyhub/SurgicalLab.tsx', 'utf8')
  assert.ok(
    !/structuresAtRisk\.join\(/.test(panel),
    'the checkpoint risks are still printed as one joined string, so a structure with geometry ' +
    'looks exactly like one without',
  )
  assert.ok(panel.includes('alasanRisikoTanpaGeometri'), 'the panel must ask the data rather than keep its own list')
  assert.ok(panel.includes('sr-only'), 'the distinction must reach screen readers, not only sighted users')
  assert.ok(panel.includes('TANDA_RISIKO_TANPA_GEOMETRI'), 'the mark must be searchable, not colour alone')
}

// ── 5. Kontrol positif dan negatif dengan nama sungguhan ────────────────
{
  assert.ok(alasanRisikoTanpaGeometri('Menisci'), 'a structure known to be absent must be marked')
  assert.equal(alasanRisikoTanpaGeometri('Median nerve'), null, 'a structure known to be shipped must NOT be marked')
  assert.equal(alasanRisikoTanpaGeometri('Bukan apa pun'), null, 'an unknown name must not invent a reason')
  assert.ok(resolve('Median nerve') > 0 && resolve('Menisci') === 0, 'the resolver disagrees with the declarations')
  assert.ok(TANDA_RISIKO_TANPA_GEOMETRI.startsWith('data-'), 'the marker must be a data attribute')
}

{
  const ada = [...risiko].filter((r) => resolve(r) > 0).length
  console.log(
    `OK bedah-lab-risiko-checkpoint: ${ada}/${risiko.size} struktur berisiko checkpoint resolve ke geometri nyata; ` +
    `${dinyatakan.size} sisanya dinyatakan dengan alasan, ditandai di panel yang benar-benar terjangkau, ` +
    'dan tandanya sampai ke pembaca layar.',
  )
}
