// Gerbang aset panggung atlas: angka yang dipakai panggung DIUKUR ULANG dari berkas public/anatomy/*.glb.
// Tidak mendekode geometri: chunk JSON glTF memuat min/max POSITION tiap primitif dan transformasi simpul,
// itu cukup untuk kotak batas dunia yang eksak. Yang dijaga: luas tubuh, jendela wilayah berisi tengara
// yang benar, dan label sisi (.l/.r) terhadap letak mesh.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ATLAS_DEPTH_ORDER } from '../../src/domains/body-exposure/engine/atlas-stage/stageLayers.ts'
import { ATLAS_BODY_EXTENT, ATLAS_REGIONS, regionContains } from '../../src/domains/body-exposure/engine/atlas-stage/regionFraming.ts'
import { ATLAS_MIDLINE_TOLERANCE_M, sideFromCentreX } from '../../src/domains/body-exposure/engine/atlas-stage/sideLabel.ts'
import { ATLAS_SIDE_LABEL_REVIEW } from '../../src/domains/body-exposure/data/atlasSideLabelReview.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

type M4 = number[]
interface Simpul { name?: string; mesh?: number; children?: number[]; matrix?: M4; translation?: number[]; rotation?: number[]; scale?: number[] }
interface Kotak { nama: string; min: number[]; max: number[] }
const SATU: M4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const kali = (a: M4, b: M4): M4 => { const o = new Array<number>(16).fill(0); for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1) { let s = 0; for (let k = 0; k < 4; k += 1) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s } return o }
const lokal = (n: Simpul): M4 => {
  if (n.matrix) return n.matrix
  const t = n.translation ?? [0, 0, 0]; const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1]; const s = n.scale ?? [1, 1, 1]
  const m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]
  for (let c = 0; c < 3; c += 1) for (let r = 0; r < 3; r += 1) m[c * 4 + r] *= s[c]
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2]
  return m
}
const titik = (m: M4, p: number[]) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]
const PEMBAGI: Record<number, number> = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }

/** Kotak batas dunia (meter) setiap simpul ber-mesh dalam satu berkas atlas. */
function kotakBerkas(berkas: string): Kotak[] {
  const b = readFileSync(`public/anatomy/${berkas}`)
  assert.equal(b.readUInt32LE(0), 0x46546c67, `${berkas} bukan GLB`)
  assert.equal(b.readUInt32LE(16), 0x4e4f534a, `${berkas}: chunk pertama bukan JSON`)
  const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')) as {
    scenes: { nodes: number[] }[]; scene?: number; nodes: Simpul[]
    meshes: { primitives: { attributes: { POSITION: number } }[] }[]
    accessors: { min?: number[]; max?: number[]; normalized?: boolean; componentType: number }[]
  }
  const hasil: Kotak[] = []
  const kunjungi = (i: number, induk: M4) => {
    const n = j.nodes[i]; const dunia = kali(induk, lokal(n))
    if (n.mesh !== undefined) {
      const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity]
      for (const p of j.meshes[n.mesh].primitives) {
        const a = j.accessors[p.attributes.POSITION]
        assert.ok(a.min && a.max, `${berkas}/${n.name}: POSITION tanpa min/max`)
        const bagi = a.normalized ? PEMBAGI[a.componentType] : 1
        assert.ok(bagi, `${berkas}/${n.name}: tipe komponen ${a.componentType} tak dikenal`)
        for (const cx of [a.min![0], a.max![0]]) for (const cy of [a.min![1], a.max![1]]) for (const cz of [a.min![2], a.max![2]]) {
          const q = titik(dunia, [cx / bagi, cy / bagi, cz / bagi])
          for (let k = 0; k < 3; k += 1) { min[k] = Math.min(min[k], q[k]); max[k] = Math.max(max[k], q[k]) }
        }
      }
      hasil.push({ nama: n.name ?? '', min, max })
    }
    for (const c of n.children ?? []) kunjungi(c, dunia)
  }
  for (const r of j.scenes[j.scene ?? 0].nodes) kunjungi(r, SATU)
  return hasil
}

const SEMUA = new Map(ATLAS_DEPTH_ORDER.map((id) => [id, kotakBerkas(`${id}.glb`)] as const))
const pusat = (k: Kotak) => k.min.map((v, i) => (v + k.max[i]) / 2)
const cari = (lapisan: string, nama: string): Kotak => {
  const k = SEMUA.get(lapisan as never)?.find((x) => x.nama === nama)
  assert.ok(k, `${nama} tidak ada di ${lapisan}.glb`)
  return k as Kotak
}
/** Simpul bantu sumber, bukan anatomi (teks petunjuk Z-Anatomy). Penampil menyembunyikannya. */
const BANTU = (nama: string) => nama.startsWith('HOW TO')

// ── pembaca memang membaca: jumlah simpul masuk akal ──
gagal('pembaca-tidak-kosong', () => { let n = 0; for (const k of SEMUA.values()) n += k.length; assert.ok(n > 2500, `hanya ${n} simpul ber-mesh terbaca`) })

// ── luas tubuh rujukan (meter), tanpa simpul bantu ──
gagal('luas-tubuh-sama-dengan-berkas', () => {
  const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity]
  for (const daftar of SEMUA.values()) for (const k of daftar) { if (BANTU(k.nama)) continue; for (let i = 0; i < 3; i += 1) { min[i] = Math.min(min[i], k.min[i]); max[i] = Math.max(max[i], k.max[i]) } }
  const dekat = (a: number, b: number, apa: string) => assert.ok(Math.abs(a - b) <= 0.0015, `${apa}: berkas ${a.toFixed(4)} vs konfigurasi ${b}`)
  dekat(max[1], ATLAS_BODY_EXTENT.vertexY, 'puncak kepala')
  dekat(max[0], ATLAS_BODY_EXTENT.halfWidthX, 'setengah lebar kiri'); dekat(-min[0], ATLAS_BODY_EXTENT.halfWidthX, 'setengah lebar kanan')
  assert.ok(min[1] >= ATLAS_BODY_EXTENT.floorY - 0.002 && min[1] <= ATLAS_BODY_EXTENT.floorY + 0.01, `lantai: berkas ${min[1].toFixed(4)}`)
  assert.ok(min[2] >= -0.17 && max[2] <= 0.16, `kedalaman tubuh di luar dugaan: ${min[2].toFixed(3)}..${max[2].toFixed(3)}`)
  const puncakKulit = Math.max(...(SEMUA.get('surface') ?? []).filter((k) => !BANTU(k.nama)).map((k) => k.max[1]))
  dekat(puncakKulit, ATLAS_BODY_EXTENT.vertexY, 'puncak kepala berasal dari lapisan kulit')
})
gagal('simpul-bantu-ada-di-bawah-lantai-di-setiap-berkas', () => {
  for (const [id, daftar] of SEMUA) { const b = daftar.filter((k) => BANTU(k.nama)); assert.equal(b.length, 1, `${id}: ${b.length} simpul bantu`); assert.ok(b[0].max[1] < 0, `${id}: simpul bantu tidak di bawah lantai`) }
})

// ── tengara: setiap jendela wilayah berisi tengaranya, dan TIDAK berisi tengara wilayah tetangga ──
const TENGARA: Record<string, [string, string][]> = {
  'head-neck': [['skeletal', 'Mandible'], ['skeletal', 'Occipital bone'], ['skeletal', 'Atlas (C1)'], ['skeletal', 'Hyoid bone']],
  thorax: [['skeletal', 'Body of sternum'], ['skeletal', 'Manubrium of sternum'], ['skeletal', 'First rib.l'], ['skeletal', 'Clavicle.l'], ['visceral', 'Trachea']],
  abdomen: [['visceral', 'Kidney.l'], ['lymphoid', 'Spleen'], ['visceral', 'Duodenum'], ['skeletal', 'Twelfth rib.l']],
  pelvis: [['skeletal', 'Hip bone.l'], ['skeletal', 'Sacrum'], ['skeletal', 'Coccyx'], ['visceral', 'Prostate']],
  'upper-limb': [['skeletal', 'Humerus.l'], ['skeletal', 'Radius.l'], ['skeletal', 'Ulna.l'], ['skeletal', 'Capitate bone.l'], ['skeletal', 'Distal phalanx of third finger of hand.l']],
  'lower-limb': [['skeletal', 'Femur.l'], ['skeletal', 'Patella.l'], ['skeletal', 'Tibia.l'], ['skeletal', 'Calcaneus.l']],
}
const wilayah = (id: string) => { const r = ATLAS_REGIONS.find((x) => x.id === id); assert.ok(r, id); return r! }
for (const [id, daftar] of Object.entries(TENGARA)) for (const [lapisan, nama] of daftar)
  gagal(`tengara-di-dalam:${id}:${nama}`, () => { const c = pusat(cari(lapisan, nama)); assert.ok(regionContains(wilayah(id), c[0], c[1]), `${nama} pusat (${c[0].toFixed(3)}, ${c[1].toFixed(3)}) di luar jendela ${id}`) })
// negatif berpasangan: tengara yang sama TIDAK boleh masuk jendela yang salah
for (const [id, lapisan, nama] of [
  ['head-neck', 'skeletal', 'Body of sternum'], ['thorax', 'skeletal', 'Mandible'], ['thorax', 'visceral', 'Kidney.l'], ['abdomen', 'skeletal', 'Manubrium of sternum'],
  ['abdomen', 'skeletal', 'Coccyx'], ['pelvis', 'visceral', 'Kidney.l'], ['pelvis', 'skeletal', 'Patella.l'], ['lower-limb', 'skeletal', 'Sacrum'], ['head-neck', 'skeletal', 'Humerus.l'],
] as const) gagal(`tengara-di-luar:${id}:${nama}`, () => { const c = pusat(cari(lapisan, nama)); assert.equal(regionContains(wilayah(id), c[0], c[1]), false, `${nama} tidak semestinya masuk jendela ${id}`) })
gagal('seluruh-tubuh-memuat-setiap-tengara', () => { for (const daftar of Object.values(TENGARA)) for (const [lapisan, nama] of daftar) { const c = pusat(cari(lapisan, nama)); assert.ok(regionContains(wilayah('all'), c[0], c[1]), nama) } })

// ── label sisi: akhiran .l/.r terhadap letak mesh (+X = kiri subjek) ──
const ukurSisi = () => {
  let cocok = 0; let garisTengah = 0; const selisih: string[] = []
  for (const daftar of SEMUA.values()) for (const k of daftar) {
    const m = /\.([lr])$/.exec(k.nama); if (!m) continue
    const sisi = sideFromCentreX(pusat(k)[0])
    if (sisi === 'midline') garisTengah += 1
    else if (sisi === (m[1] === 'l' ? 'left' : 'right')) cocok += 1
    else selisih.push(k.nama)
  }
  return { cocok, garisTengah, selisih: selisih.sort() }
}
gagal('label-sisi-vs-geometri-sama-dengan-daftar-tinjauan', () => {
  const u = ukurSisi()
  assert.ok(u.cocok > 1700, `hanya ${u.cocok} label sisi yang cocok; pembaca mungkin rusak`)
  assert.deepEqual(u.selisih, Object.keys(ATLAS_SIDE_LABEL_REVIEW).sort(), 'daftar tinjauan harus persis sama dengan yang terukur di berkas')
})
gagal('bulu-mata-memang-pasangan-cermin-yang-tertukar', () => {
  const l = pusat(cari('surface', 'Eyelashes.l')); const r = pusat(cari('surface', 'Eyelashes.r'))
  assert.ok(l[0] < -ATLAS_MIDLINE_TOLERANCE_M && r[0] > ATLAS_MIDLINE_TOLERANCE_M, 'bulu mata tidak lagi tertukar: hapus dari daftar tinjauan')
  assert.ok(Math.abs(l[0] + r[0]) < 1e-6 && Math.abs(l[1] - r[1]) < 1e-6, 'bukan pasangan cermin eksak')
  assert.equal(ATLAS_SIDE_LABEL_REVIEW['Eyelashes.l'], 'swapped'); assert.equal(ATLAS_SIDE_LABEL_REVIEW['Eyelashes.r'], 'swapped')
})
gagal('saraf-vagus-kanan-tidak-diputuskan-dari-kotak-saja', () => {
  const r = cari('nervous', 'Vagus nerve (X).r'); const l = cari('nervous', 'Vagus nerve (X).l')
  assert.ok(pusat(r)[0] > 0, 'pusat kotak vagus kanan tidak lagi melewati garis tengah: hapus dari daftar tinjauan')
  assert.ok(r.min[0] < -0.02, 'vagus kanan memang membentang ke sisi kanan; kotaknya saja tidak membuktikan salah label')
  assert.ok(r.max[1] - r.min[1] > (l.max[1] - l.min[1]) * 1.2, 'struktur tidak simetris terhadap pasangannya')
  assert.equal(ATLAS_SIDE_LABEL_REVIEW['Vagus nerve (X).r'], 'inconclusive')
})
gagal('tengara-rangka-berada-di-sisi-yang-dinyatakan', () => { assert.ok(pusat(cari('skeletal', 'Femur.l'))[0] > 0.05); assert.ok(pusat(cari('skeletal', 'Femur.r'))[0] < -0.05); assert.ok(pusat(cari('lymphoid', 'Spleen'))[0] > 0.05, 'limpa di kiri subjek') })

const u = ukurSisi()
console.log(`atlas-stage assets: ${[...SEMUA.values()].reduce((n, d) => n + d.length, 0)} mesh nodes re-measured; side labels ${u.cocok} agree, ${u.garisTengah} midline, ${u.selisih.length} under review (${u.selisih.join(', ')})`)
