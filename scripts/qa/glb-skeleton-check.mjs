// Reproduksi independen D4 (gerbang kasar rangka perempuan VHF/Denver) dari GLB publik, tanpa Blender.
// Pemeriksaan: lateralitas (+X = kiri subjek), urutan kolumna vertebralis C1..L5 dari atas ke bawah, tengkorak di atas C1,
// sakrum di bawah L5, 12 iga tiap sisi, sternum di depan tulang belakang (+Z = anterior di glTF), kaki di lantai.
// Pakai: node scripts/qa/glb-skeleton-check.mjs [berkas.glb] (bukan gerbang CI). Keluar 1 bila ada pemeriksaan gagal.
import fs from 'node:fs'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
import * as THREE from '../../node_modules/three/build/three.module.js'
const file = process.argv[2] || 'public/bodyexposure/vhf_denver_ct_adult_female.skeletal.LOD4.glb'
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder)
const b = fs.readFileSync(file)
const g = await new Promise((res, rej) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej))
g.scene.updateMatrixWorld(true)
const S = new Map()
g.scene.traverse((o) => { const id = o.userData?.panacea_structure_id; if (!id) return; const bx = new THREE.Box3().setFromObject(o); S.set(id.replace(/^.*?SKELETAL\./, ''), { c: bx.getCenter(new THREE.Vector3()), minY: bx.min.y }) })
const res = []; const check = (name, ok, detail) => res.push({ name, ok, detail })
const pairs = [...S.keys()].filter((k) => /\.[LR]$/.test(k))
const bad = pairs.filter((k) => (k.endsWith('.L') ? S.get(k).c.x <= 0 : S.get(k).c.x >= 0))
check('lateralitas', bad.length === 0, { berpasangan: pairs.length, pelanggaran: bad.slice(0, 5) })
const y = (n) => S.get(n)?.c.y
const col = [...Array.from({ length: 7 }, (_, i) => `VERTEBRA_C${i + 1}`), ...Array.from({ length: 12 }, (_, i) => `VERTEBRA_T${i + 1}`), ...Array.from({ length: 5 }, (_, i) => `VERTEBRA_L${i + 1}`)]
const ada = col.filter((n) => y(n) !== undefined)
const urut = ada.every((n, i) => i === 0 || y(ada[i - 1]) > y(n))
check('kolumna_vertebralis_atas_ke_bawah', ada.length === 24 && urut, { ada: ada.length, c1: y('VERTEBRA_C1'), l5: y('VERTEBRA_L5') })
const skull = [...S.keys()].find((k) => /^SKULL/.test(k))
check('tengkorak_di_atas_c1', S.get(skull)?.c.y > y('VERTEBRA_C1'), { skull: S.get(skull)?.c.y, c1: y('VERTEBRA_C1') })
check('sakrum_di_bawah_l5', y('SACRUM') < y('VERTEBRA_L5'), { sacrum: y('SACRUM'), l5: y('VERTEBRA_L5') })
const iga = (s) => Array.from({ length: 12 }, (_, i) => `RIB_${i + 1}.${s}`).filter((n) => !S.has(n))
check('dua_belas_iga_tiap_sisi', iga('L').length === 0 && iga('R').length === 0, { hilangL: iga('L'), hilangR: iga('R') })
check('sternum_di_depan_t6', S.get('STERNUM')?.c.z > S.get('VERTEBRA_T6')?.c.z, { sternum: S.get('STERNUM')?.c.z, t6: S.get('VERTEBRA_T6')?.c.z })
const minY = Math.min(...[...S.values()].map((v) => v.minY))
check('kaki_di_lantai', Math.abs(minY) < 0.01, { minY: +minY.toFixed(4) })
if (process.env.DEBUG_NAMES) console.log([...S.keys()].filter((k) => /RIB|STERN|VERTEBRA_T6|VERTEBRA_C1$/.test(k)).join(' '))
console.log(JSON.stringify({ file, struktur: S.size, hasil: res }, null, 1))
if (res.some((r) => !r.ok)) process.exit(1)
