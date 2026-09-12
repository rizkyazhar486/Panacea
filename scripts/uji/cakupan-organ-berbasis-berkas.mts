import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'

const BERKAS = ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid']

const semuaNama: string[] = []
for (const f of BERKAS) {
  const buf = await readFile(new URL(`../../public/anatomy/${f}.glb`, import.meta.url))
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `${f}.glb bukan berkas GLB`)
  const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
  for (const n of gltf.nodes) {
    if (n.mesh !== undefined && n.name) semuaNama.push(n.name)
  }
}
assert.ok(semuaNama.length > 1000, `Hanya ${semuaNama.length} mesh terbaca; berkasnya mungkin tidak terbaca benar`)

const POLA: Record<string, RegExp> = {
  'skin': /\bskin\b|epidermis|dermis|integument/i,
  'major-joints': /joint capsule|articular capsule|meniscus|glenoid labrum|acetabular labrum|articular disc/i,
  'lymphatic-vessels': /thoracic duct|lymphatic (vessel|trunk)|cisterna chyli|right lymphatic duct/i,
  'female-reproductive': /\buterus\b|\bovary\b|uterine tube|\bvagina\b/i,
  'major-fascial-planes': /fascia lata|thoracolumbar fascia|clavipectoral fascia|\bfascial? (plane|sheet)\b/i,
}

const HILANG_KARENA_SKALA: Record<string, RegExp> = {
  'nasal-cavity': /nasal cavity|inferior nasal concha/i,
}

const laporan = buildOrganCoverageReport(COMPLETE_WHOLE_BODY_ATLAS)
const hilang = laporan.entries.filter((e) => e.status === 'missing')

{
  const idHilang = new Set(hilang.map((e) => e.id))
  const idPola = new Set([...Object.keys(POLA), ...Object.keys(HILANG_KARENA_SKALA)])
  const tanpaPola = [...idHilang].filter((id) => !idPola.has(id))
  const polaYatim = [...idPola].filter((id) => !idHilang.has(id))
  assert.deepEqual(tanpaPola, [], `Organ hilang tanpa pola pencarian: ${tanpaPola.join(', ')}`)
  assert.deepEqual(polaYatim, [], `Pola untuk organ yang tidak lagi hilang: ${polaYatim.join(', ')}`)
}

{
  const sebenarnyaAda: string[] = []
  for (const e of hilang) {
    if (HILANG_KARENA_SKALA[e.id]) continue
    const cocok = semuaNama.filter((n) => POLA[e.id].test(n))
    if (cocok.length > 0) sebenarnyaAda.push(`${e.label}: ${[...new Set(cocok)].slice(0, 5).join(', ')}`)
  }
  assert.deepEqual(
    sebenarnyaAda,
    [],
    'Organ dinyatakan hilang padahal geometrinya DIKIRIM. Ini pekerjaan yang bisa diselesaikan, bukan kegagalan uji:\n  ' + sebenarnyaAda.join('\n  '),
  )
}

{
  for (const [id, pola] of Object.entries(HILANG_KARENA_SKALA)) {
    const cocok = semuaNama.filter((n) => pola.test(n))
    assert.ok(cocok.length > 0, `"${id}" dikecualikan sebagai masalah skala, tetapi geometrinya tidak ditemukan di berkas mana pun`)
  }
}

{
  const kontrol: Array<[string, RegExp]> = [
    ['liver', /\bliver\b/i],
    ['spleen', /\bspleen\b/i],
    ['vertebra', /^Vertebra T\d/i],
    ['pectoralis', /pectoralis/i],
  ]
  for (const [nama, pola] of kontrol) {
    assert.ok(semuaNama.some((n) => pola.test(n)), `Kontrol positif "${nama}" tidak menemukan apa pun`)
  }
}

console.log(
  `Cakupan organ vs berkas: ${semuaNama.length} nama mesh dibaca dari ${BERKAS.length} berkas atlas; ` +
  `${hilang.length - Object.keys(HILANG_KARENA_SKALA).length} organ yang dinyatakan hilang terbukti memang tidak dikirim, dan ` +
  `${Object.keys(HILANG_KARENA_SKALA).length} dicatat sebagai masalah SKALA dengan geometrinya dibuktikan ada.`,
)
